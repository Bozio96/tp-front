import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

import { Router } from '@angular/router';
import { Subscription, firstValueFrom, take } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { PdfService } from '../../services/pdf.service';
import { SalesApiService, SalePayload, SaleResponse, SaleCustomerPayload } from '../../services/sales-api.service';
import { NotificationService } from '../../services/notification.service';



interface LineSummary {
  net: number;
  iva: number;
  discount: number;
  total: number;
}

interface SalesTotals {
  net: number;
  iva: number;
  discounts: number;
  final: number;
}

interface SaleItemFormValue {
  productId: number | null;
  internalCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  ivaRate: number;
}

interface SalesFormValue {
  invoiceDate: string;
  invoiceNumber: string;
  invoiceType: 'B' | 'X'; 
  paymentMethod: 'contado' | 'debito' | 'transferencia' | 'credito';
  customerType: 'habitual' | 'ocasional' | string;
  clientId: string;
  customerName: string;
  customerCuit: string;
  customerDni: string;
  customerAddress: string;
  customerPhone: string;
  items: SaleItemFormValue[];
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatRadioModule, MatButtonModule, MatTableModule, MatIconModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css',
})
export class SalesComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly pdfService = inject(PdfService); // Inyeccion del servicio
  private readonly salesApi = inject(SalesApiService);
  private readonly notifications = inject(NotificationService);

  private readonly subscriptions = new Subscription();
  private readonly defaultIvaRate = 21;
  private currentPointOfSale = '0003';

  salesForm: FormGroup;
  lineSummaries: LineSummary[] = [];
  totals: SalesTotals = { net: 0, iva: 0, discounts: 0, final: 0 };
  products: Product[] = [];
  filteredProducts: Product[] = [];
  @ViewChild(MatTable) table?: MatTable<FormGroup>;
  isSelectorOpen = false;
  searchTerm = '';
  invoicePreview = '';

  constructor() {
    this.salesForm = this.fb.group({
      invoiceDate: [this.buildTodayValue(), Validators.required],
      invoiceNumber: ['', [Validators.pattern(/^\d*$/)]],
      invoiceType: ['B', Validators.required],
      paymentMethod: ['contado', Validators.required],
      customerType: ['habitual', Validators.required],
      clientId: ['', [Validators.pattern(/^\d*$/)]],
      customerName: [''],
      customerCuit: ['', [Validators.pattern(/^$|^\d{11}$/)]],
      customerDni: ['', [Validators.pattern(/^$|^\d{8}$/)]],
      customerAddress: [''],
      customerPhone: ['', [Validators.pattern(/^\d*$/)]],
      items: this.fb.array([]),
    });

    this.currentPointOfSale = this.resolvePointOfSale(
      'sale',
      this.salesForm.get('invoiceType')?.value ?? 'B',
    );
    this.refreshInvoicePreview();
  }

  displayedColumns: string[] = [
  'sku',
  'producto',
  'cantidad',
  'precio',
  'descuento',
  'subtotal',
  'iva',
  'total',
  'accion'
];

  ngOnInit(): void {
    this.handleCustomerTypeChange(this.salesForm.get('customerType')?.value);
    this.updateTotals();
    this.refreshInvoicePreview();

    this.subscriptions.add(
      this.salesForm.valueChanges.subscribe(() => this.updateTotals())
    );

    const customerTypeControl = this.salesForm.get('customerType');
    if (customerTypeControl) {
      this.subscriptions.add(
        customerTypeControl.valueChanges.subscribe((value) =>
          this.handleCustomerTypeChange(value)
        )
      );
    }

    const invoiceTypeControl = this.salesForm.get('invoiceType');
    if (invoiceTypeControl) {
      this.subscriptions.add(
        invoiceTypeControl.valueChanges.subscribe(() => {
          this.fetchNextInvoiceIdentifiers('sale');
        })
      );
    }

    this.productService
      .getAllProducts()
      .pipe(take(1))
      .subscribe({
        next: (products) => {
          this.products = products ?? [];
          this.filteredProducts = [...this.products];
        },
        error: () => {
          this.notifications.showError('No se pudieron cargar los productos.');
          this.products = [];
          this.filteredProducts = [];
        },
      });

    this.fetchNextInvoiceIdentifiers('sale');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get items(): FormArray<FormGroup> {
    return this.salesForm.get('items') as FormArray<FormGroup>;
  }

  openProductSelector(): void {
    this.isSelectorOpen = true;
    this.searchTerm = '';
    this.filteredProducts = [...this.products];
  }

  closeProductSelector(): void {
    this.isSelectorOpen = false;
    this.searchTerm = '';
    this.filteredProducts = [...this.products];
  }

  onSearchProducts(term: string): void {
    this.searchTerm = term;
    const cleaned = term.trim().toLowerCase();
    if (!cleaned) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter((product) => {
      const name = product.name?.toLowerCase() ?? '';
      const sku = product.sku?.toLowerCase() ?? '';
      return name.includes(cleaned) || sku.includes(cleaned);
    });
  }

  selectProduct(product: Product): void {
    const group = this.createItemGroup(product);
    this.items.push(group);
    this.updateTotals();
    this.table?.renderRows();
    this.closeProductSelector();
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.updateTotals();
    this.table?.renderRows();
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmissionBlocked() || this.salesForm.invalid || this.items.length === 0) {
      this.salesForm.markAllAsTouched();
      return;
    }
    this.updateTotals();
    let payload: SalePayload;
    try {
      payload = this.buildPayload('sale');
    } catch (error) {
      this.notifications.showError('Los datos de la venta no son válidos.');
      return;
    }
    const savedSale = await this.persistSale(payload);
    if (!savedSale) {
      return;
    }
    try {
      this.applyBackendDataToPayload(payload, savedSale);
      await this.pdfService.generarFactura(payload);
      this.resetFormState();
      } catch (error) {
        this.notifications.showError('No se pudo generar la factura.');
      }
  }

  async onSaveAsQuote(): Promise<void> {
    if (this.isSubmissionBlocked() || this.salesForm.invalid || this.items.length === 0) {
      this.salesForm.markAllAsTouched();
      return;
    }
    this.updateTotals();
    let payload: SalePayload;
    try {
      payload = this.buildPayload('quote');
    } catch (error) {
      this.notifications.showError('Los datos del presupuesto no son válidos.');
      return;
    }
    const savedQuote = await this.persistSale(payload);
    if (!savedQuote) {
      return;
    }
    try {
      this.applyBackendDataToPayload(payload, savedQuote);
      await this.pdfService.generarPresupuesto(payload);
      this.resetFormState();
      } catch (error) {
        this.notifications.showError('No se pudo generar el presupuesto.');
      }
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  private async persistSale(payload: SalePayload): Promise<SaleResponse | null> {
    try {
      return await firstValueFrom(this.salesApi.createSale(payload));
    } catch (error) {
      this.notifications.showError('No se pudo registrar la venta.');
      return null;
    }
  }

  private applyBackendDataToPayload(payload: SalePayload, savedSale: SaleResponse): void {
    if (savedSale.pointOfSale) {
      payload.pointOfSale = savedSale.pointOfSale;
      this.currentPointOfSale = savedSale.pointOfSale;
    }
    if (savedSale.invoiceNumber) {
      payload.invoiceNumber = savedSale.invoiceNumber;
      this.salesForm.patchValue(
        { invoiceNumber: savedSale.invoiceNumber },
        { emitEvent: false },
      );
    }
    if (savedSale.createdAt) {
      payload.createdAt = savedSale.createdAt;
    }

    payload.totals = {
      net: this.sanitizeNumber(savedSale.totalNet),
      iva: this.sanitizeNumber(savedSale.totalIva),
      discounts: this.sanitizeNumber(savedSale.totalDiscount),
      final: this.sanitizeNumber(savedSale.totalFinal),
    };

    if (savedSale.customerId) {
      payload.customer.id = savedSale.customerId;
    }
    if (savedSale.customerName) {
      payload.customer.name = savedSale.customerName;
    }
    if (savedSale.customerDocument) {
      payload.customer.document = savedSale.customerDocument;
    }
    if (savedSale.customerCuit) {
      payload.customer.cuit = savedSale.customerCuit;
    }
    if (savedSale.customerDni) {
      payload.customer.dni = savedSale.customerDni;
    }
    if (savedSale.customerAddress) {
      payload.customer.address = savedSale.customerAddress;
    }
    if (savedSale.customerPhone) {
      payload.customer.phone = savedSale.customerPhone;
    }

    if (savedSale.details?.length) {
      payload.items = savedSale.details.map((detail) => ({
        line: detail.lineNumber,
        productId: detail.productId,
        internalCode: detail.internalCode,
        description: detail.description,
        quantity: this.sanitizeNumber(detail.quantity),
        unitPrice: this.sanitizeNumber(detail.unitPrice),
        discountRate: this.sanitizeNumber(detail.discountRate),
        ivaRate: this.sanitizeNumber(detail.ivaRate),
        summary: {
          net: this.sanitizeNumber(detail.netAmount),
          iva: this.sanitizeNumber(detail.ivaAmount),
          discount: this.sanitizeNumber(detail.discountAmount),
          total: this.sanitizeNumber(detail.totalAmount),
        },
      }));
    }

    this.refreshInvoicePreview();
  }

  getProductDisplayPrice(product: Product): number {
    return product.salePrice ?? product.price;
  }

  getProductStock(product: Product): number {
    return product.stock ?? 0;
  }

  private createItemGroup(product?: Product): FormGroup {
    return this.fb.group({
      productId: [product?.id ?? null, Validators.required],
      internalCode: [product?.sku ?? '', Validators.required],
      description: [product?.name ?? '', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [product?.salePrice ?? product?.price ?? 0, [Validators.required, Validators.min(0)]],
      discountRate: [0, [Validators.min(0), Validators.max(100)]],
      ivaRate: [this.defaultIvaRate, [Validators.min(0), Validators.max(100)]],
    });
  }

  private handleCustomerTypeChange(type: unknown): void {
    const isOccasional = type === 'ocasional';
    const customerNameControl = this.salesForm.get('customerName');

    if (isOccasional && !customerNameControl?.value) {
      customerNameControl?.setValue('', { emitEvent: false });
    }
  }

  private updateTotals(): void {
    this.lineSummaries = this.items.controls.map((group) =>
      this.calculateLineSummary(group as FormGroup)
    );

    const net = this.lineSummaries.reduce((acc, line) => acc + line.net, 0);
    const iva = this.lineSummaries.reduce((acc, line) => acc + line.iva, 0);
    const lineDiscounts = this.lineSummaries.reduce(
      (acc, line) => acc + line.discount,
      0
    );
    const grossTotal = this.lineSummaries.reduce(
      (acc, line) => acc + line.total,
      0
    );

    const totalDiscounts = lineDiscounts;
    const finalAmount = Math.max(grossTotal, 0);

    this.totals = {
      net: this.roundToTwo(net),
      iva: this.roundToTwo(iva),
      discounts: this.roundToTwo(totalDiscounts),
      final: this.roundToTwo(finalAmount),
    };
  }

  private calculateLineSummary(group: FormGroup): LineSummary {
    // Interpretamos unitPrice como precio final (incluye IVA) para evitar duplicar el impuesto.
    const quantity = Math.max(this.sanitizeNumber(group.get('quantity')?.value), 0);
    const unitPrice = Math.max(this.sanitizeNumber(group.get('unitPrice')?.value), 0);
    const gross = quantity * unitPrice;

    const discountRate = Math.min(
      Math.max(this.sanitizeNumber(group.get('discountRate')?.value), 0),
      100
    );
    const ivaRate = Math.max(this.sanitizeNumber(group.get('ivaRate')?.value), 0);

    const discountAmount = gross * (discountRate / 100);
    const discountedGross = Math.max(gross - discountAmount, 0);
    const iva = discountedGross * (ivaRate / 100);
    const net = discountedGross - iva;

    return {
      net: this.roundToTwo(net),
      iva: this.roundToTwo(iva),
      discount: this.roundToTwo(discountAmount),
      total: this.roundToTwo(discountedGross),
    };
  }

  private buildPayload(type: 'sale' | 'quote'): SalePayload {
    const rawValue = this.salesForm.getRawValue() as SalesFormValue;
    const rawItems = this.items.getRawValue() as SaleItemFormValue[];
    const items = rawItems.map((item, index) => {
      if (item.productId === null || item.productId === undefined) {
        throw new Error(`Producto no seleccionado en la linea ${index + 1}`);
      }

      return {
        line: index + 1,
        productId: Number(item.productId),
        internalCode: item.internalCode,
        description: item.description,
        quantity: this.sanitizeNumber(item.quantity),
        unitPrice: this.sanitizeNumber(item.unitPrice),
        discountRate: this.sanitizeNumber(item.discountRate),
        ivaRate: this.sanitizeNumber(item.ivaRate, this.defaultIvaRate),
        summary: this.lineSummaries[index],
      };
    });

    const payload: SalePayload = {
      type,
      invoiceDate: rawValue.invoiceDate,
      invoiceType: rawValue.invoiceType,
      paymentMethod: rawValue.paymentMethod,
      customer: this.buildCustomerPayload(rawValue),
      totals: {
        net: this.totals.net,
        iva: this.totals.iva,
        discounts: this.totals.discounts,
        final: this.totals.final,
      },
      items,
      createdAt: new Date().toISOString(),
    };

    const invoiceNumber = this.normalizeToString(rawValue.invoiceNumber);
    if (type === 'sale' && invoiceNumber) {
      payload.invoiceNumber = invoiceNumber;
    }

    payload.pointOfSale = this.resolvePointOfSale(type, rawValue.invoiceType);

    return payload;
  }

  isSubmissionBlocked(): boolean {
    const rawValue = this.salesForm.getRawValue() as SalesFormValue;
    if (rawValue.customerType !== 'habitual') {
      return false;
    }

    const mandatoryFields: Array<'customerName' | 'customerAddress' | 'customerPhone'> = [
      'customerName',
      'customerAddress',
      'customerPhone',
    ];

    const someMissing = mandatoryFields.some((field) => !this.hasContent(rawValue[field]));
    if (someMissing) {
      return true;
    }

    const hasClientId = this.hasContent(rawValue.clientId);
    const hasCuit = this.hasContent(rawValue.customerCuit);
    const hasDni = this.hasContent(rawValue.customerDni);

    return !(hasClientId || hasCuit || hasDni);
  }

  private buildCustomerPayload(rawValue: SalesFormValue): SaleCustomerPayload {
    const isOccasional = rawValue.customerType === 'ocasional';

    const baseDetails = [
      rawValue.customerName,
      rawValue.customerAddress,
      rawValue.customerPhone,
    ];

    const hasBaseDetails = baseDetails.every((value) => this.hasContent(value));
    const cuit = this.normalizeToString(rawValue.customerCuit);
    const dni = this.normalizeToString(rawValue.customerDni);
    const document = cuit || dni;
    const clientId = this.normalizeToString(rawValue.clientId) || document;

    if (isOccasional && (!hasBaseDetails || !document)) {
      return {
        type: rawValue.customerType,
        name: 'Cliente ocasional',
        withoutClient: true,
      };
    }

    const customer: SaleCustomerPayload = {
      type: rawValue.customerType,
      withoutClient: false,
    };

    if (clientId) {
      customer.id = clientId;
    }

    const name = this.normalizeToString(rawValue.customerName);
    if (name) {
      customer.name = name;
    }

    if (document) {
      customer.document = document;
    }
    if (cuit) {
      customer.cuit = cuit;
    }
    if (dni) {
      customer.dni = dni;
    }

    const address = this.normalizeToString(rawValue.customerAddress);
    if (address) {
      customer.address = address;
    }

    const phone = this.normalizeToString(rawValue.customerPhone);
    if (phone) {
      customer.phone = phone;
    }

    return customer;
  }

  private fetchNextInvoiceIdentifiers(type: 'sale' | 'quote'): void {
    const invoiceTypeControl = this.salesForm.get('invoiceType');
    const invoiceNumberControl = this.salesForm.get('invoiceNumber');
    const normalizedInvoiceType =
      this.normalizeToString(invoiceTypeControl?.value ?? '').toUpperCase() ||
      'X';

    this.currentPointOfSale = this.resolvePointOfSale(
      type,
      normalizedInvoiceType,
    );

    invoiceNumberControl?.setValue('', { emitEvent: false });
    invoiceNumberControl?.markAsPristine();
    invoiceNumberControl?.markAsUntouched();
    this.refreshInvoicePreview();

    const subscription = this.salesApi
      .getNextInvoiceIdentifiers(type, normalizedInvoiceType)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.currentPointOfSale = response.pointOfSale;
          invoiceNumberControl?.setValue(response.invoiceNumber, {
            emitEvent: false,
          });
          invoiceNumberControl?.markAsPristine();
          invoiceNumberControl?.markAsUntouched();
          this.refreshInvoicePreview();
        },
        error: () => {
          this.notifications.showError(
            `No se pudo obtener el próximo comprobante (${type}).`,
          );
          this.refreshInvoicePreview();
        },
      });

    this.subscriptions.add(subscription);
  }

  private normalizeToString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    const text = typeof value === 'string' ? value : String(value);
    return text.trim();
  }

  private hasContent(value: unknown): boolean {
    return this.normalizeToString(value).length > 0;
  }

  private sanitizeNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private refreshInvoicePreview(): void {
    const invoiceNumberControl = this.salesForm?.get('invoiceNumber');
    const rawValue = this.normalizeToString(invoiceNumberControl?.value ?? '');
    const digits = rawValue ? rawValue.padStart(8, '0') : '00000000';
    this.invoicePreview = `${this.currentPointOfSale}-${digits}`;
  }

  private resetFormState(): void {
    this.closeProductSelector();
    this.items.clear();
    this.lineSummaries = [];
    this.totals = { net: 0, iva: 0, discounts: 0, final: 0 };

    this.salesForm.reset({
      invoiceDate: this.buildTodayValue(),
      invoiceNumber: '',
      invoiceType: 'B',
      paymentMethod: 'contado',
      customerType: 'habitual',
      clientId: '',
      customerName: '',
      customerCuit: '',
      customerDni: '',
      customerAddress: '',
      customerPhone: '',
    });

    this.updateTotals();
    this.table?.renderRows();
    this.fetchNextInvoiceIdentifiers('sale');
    this.salesForm.markAsPristine();
    this.salesForm.markAsUntouched();
  }

  private resolvePointOfSale(
    type: 'sale' | 'quote',
    invoiceType: 'B' | 'X' | string,
  ): string {
    if (type === 'quote') {
      return '0001';
    }
    return (invoiceType ?? '').toUpperCase() === 'B' ? '0003' : '0001';
  }

  private roundToTwo(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private buildTodayValue(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }
}















































