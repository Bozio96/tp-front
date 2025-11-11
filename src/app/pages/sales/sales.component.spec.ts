import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { SalesComponent } from './sales.component';
import { ProductService } from '../../services/product.service';
import { ClientService } from '../../services/client.service';
import { PdfService } from '../../services/pdf.service';
import { SalesApiService, NextInvoiceIdentifiersResponse, SaleResponse } from '../../services/sales-api.service';
import { NotificationService } from '../../services/notification.service';
import { Product } from '../../models/product.model';
import { Client } from '../../models/client.model';

describe('SalesComponent', () => {
  let component: SalesComponent;
  let fixture: ComponentFixture<SalesComponent>;

  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let clientServiceSpy: jasmine.SpyObj<ClientService>;
  let pdfServiceSpy: jasmine.SpyObj<PdfService>;
  let salesApiSpy: jasmine.SpyObj<SalesApiService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const sampleProducts: Product[] = [
    {
      id: 1,
      name: 'Producto A',
      price: 100,
      salePrice: 120,
      stock: 5,
      costBase: 90,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 10,
      minStock: 1,
      sku: 'SKU-A',
    },
  ];

  const sampleClients: Client[] = [
    {
      id: 10,
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      cuil: '20123456789',
      phone: '5554444',
      domicilio: 'Siempreviva 742',
    } as Client,
  ];

  beforeEach(async () => {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getAllProducts']);
    clientServiceSpy = jasmine.createSpyObj('ClientService', ['getAllClients', 'getClientById']);
    pdfServiceSpy = jasmine.createSpyObj('PdfService', ['generarFactura', 'generarPresupuesto']);
    salesApiSpy = jasmine.createSpyObj('SalesApiService', ['createSale', 'getNextInvoiceIdentifiers']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['showError', 'showSuccess']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    productServiceSpy.getAllProducts.and.returnValue(of(sampleProducts));
    clientServiceSpy.getAllClients.and.returnValue(of(sampleClients));
    clientServiceSpy.getClientById.and.returnValue(of(sampleClients[0]));
    pdfServiceSpy.generarFactura.and.returnValue(Promise.resolve());
    pdfServiceSpy.generarPresupuesto.and.returnValue(Promise.resolve());

    const invoiceIdentifiers: NextInvoiceIdentifiersResponse = {
      pointOfSale: '0003',
      invoiceNumber: '00001234',
      invoiceType: 'B',
    };
    salesApiSpy.getNextInvoiceIdentifiers.and.returnValue(of(invoiceIdentifiers));

    await TestBed.configureTestingModule({
      imports: [SalesComponent, NoopAnimationsModule],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: ClientService, useValue: clientServiceSpy },
        { provide: PdfService, useValue: pdfServiceSpy },
        { provide: SalesApiService, useValue: salesApiSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function addItem(partial?: Partial<{ quantity: number; unitPrice: number; discountRate: number; ivaRate: number }>): void {
    const group = (component as any).createItemGroup({
      id: 1,
      sku: 'SKU-1',
      name: 'Producto Test',
      price: 100,
      salePrice: 100,
      stock: 10,
      discounts: 0,
      costBase: 90,
      includeIVA: true,
      utilityPercentage: 10,
      minStock: 1,
    } as Product);

    group.patchValue({
      productId: 1,
      internalCode: 'SKU-1',
      description: 'Producto Test',
      quantity: 1,
      unitPrice: 100,
      discountRate: 0,
      ivaRate: 21,
      ...partial,
    });

    component.items.push(group);
  }

  it('calcula los totales combinando múltiples ítems', () => {
    addItem({ quantity: 2, unitPrice: 100, discountRate: 10, ivaRate: 21 });
    addItem({ quantity: 1, unitPrice: 50, discountRate: 0, ivaRate: 21 });

    (component as any).updateTotals();

    expect(component.lineSummaries.length).toBe(2);
    expect(component.totals.net).toBeCloseTo(181.7, 1);
    expect(component.totals.iva).toBeCloseTo(48.3, 1);
    expect(component.totals.discounts).toBeCloseTo(20, 1);
    expect(component.totals.final).toBeCloseTo(230, 1);
  });

  it('arma el payload con ítems, totales y datos del cliente', () => {
    addItem({ quantity: 1, unitPrice: 120, discountRate: 0, ivaRate: 21 });
    (component as any).updateTotals();

    component.salesForm.patchValue({
      customerType: 'habitual',
      customerName: 'Cliente Demo',
      customerAddress: 'Av. Siempreviva',
      customerPhone: '123123',
      clientId: '15',
      customerDni: '30111222',
    });

    const payload = (component as any).buildPayload('sale');

    expect(payload.items.length).toBe(1);
    expect(payload.items[0].summary).toEqual(component.lineSummaries[0]);
    expect(payload.customer.type).toBe('habitual');
    expect(payload.clientId).toBe(15);
    expect(payload.totals.final).toBe(component.totals.final);
    expect(payload.pointOfSale).toBe('0003');
  });

  it('lanza error si al construir el payload falta el productId', () => {
    const group = (component as any).createItemGroup();
    group.patchValue({
      productId: null,
      internalCode: 'SIN-ID',
      description: 'Sin producto',
    });
    component.items.push(group);
    component.lineSummaries = [
      { net: 0, iva: 0, discount: 0, total: 0 },
    ];

    expect(() => (component as any).buildPayload('sale')).toThrowError(/Producto no seleccionado/);
  });

  it('bloquea la venta habitual cuando faltan datos obligatorios', () => {
    component.salesForm.patchValue({
      customerType: 'habitual',
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      clientId: '',
      customerCuit: '',
      customerDni: '',
    });
    expect(component.isSubmissionBlocked()).toBeTrue();

    component.salesForm.patchValue({
      customerName: 'Cliente',
      customerAddress: 'Dirección',
      customerPhone: '555555',
      customerDni: '12345678',
    });
    expect(component.isSubmissionBlocked()).toBeFalse();

    component.salesForm.patchValue({ customerType: 'ocasional', customerName: '', customerAddress: '', customerPhone: '' });
    expect(component.isSubmissionBlocked()).toBeFalse();
  });

  it('envía una venta, genera la factura y reinicia el formulario', async () => {
    addItem({ quantity: 2, unitPrice: 200 });
    (component as any).updateTotals();
    component.salesForm.patchValue({
      customerType: 'ocasional',
      customerName: 'Comercio SA',
      customerAddress: 'Calle Falsa 123',
      customerPhone: '5551111',
      customerDni: '20123456',
    });

    const savedSale: SaleResponse = {
      id: 1,
      pointOfSale: '0003',
      invoiceNumber: '00004567',
      invoiceType: 'B',
      paymentMethod: 'contado',
      customerType: 'habitual',
      clientId: 20,
      client: {
        id: 20,
        nombre: 'Cliente Backend',
        apellido: 'Persistido',
      },
      invoiceDate: '2025-01-01',
      totalNet: 100,
      totalIva: 21,
      totalDiscount: 0,
      totalFinal: 121,
      type: 'venta',
      createdAt: '2025-01-01T12:00:00.000Z',
      updatedAt: '2025-01-01T12:00:00.000Z',
      details: [],
    };
    salesApiSpy.createSale.and.returnValue(of(savedSale));

    await component.onSubmit();

    expect(salesApiSpy.createSale).toHaveBeenCalledTimes(1);
    expect(pdfServiceSpy.generarFactura).toHaveBeenCalled();
  });

  it('permite guardar como presupuesto y generar el PDF', async () => {
    addItem({ quantity: 1, unitPrice: 80 });
    (component as any).updateTotals();
    component.salesForm.patchValue({
      customerType: 'ocasional',
      customerName: 'Cliente Presupuesto',
      customerAddress: 'Ruta 1',
      customerPhone: '123123',
      customerDni: '11111111',
    });

    const savedQuote: SaleResponse = {
      id: 2,
      pointOfSale: '0001',
      invoiceNumber: '00000011',
      invoiceType: 'X',
      paymentMethod: 'contado',
      customerType: 'ocasional',
      clientId: null,
      client: null,
      invoiceDate: '2025-01-02',
      totalNet: 80,
      totalIva: 16.8,
      totalDiscount: 0,
      totalFinal: 96.8,
      type: 'presupuesto',
      createdAt: '2025-01-02T12:00:00.000Z',
      updatedAt: '2025-01-02T12:00:00.000Z',
      details: [],
    };
    salesApiSpy.createSale.and.returnValue(of(savedQuote));

    await component.onSaveAsQuote();

    expect(salesApiSpy.createSale).toHaveBeenCalled();
    expect(pdfServiceSpy.generarPresupuesto).toHaveBeenCalled();
  });

  it('agrega y elimina ítems usando los helpers de UI', () => {
    expect(component.items.length).toBe(0);
    component.selectProduct(sampleProducts[0]);
    expect(component.items.length).toBe(1);
    component.removeItem(0);
    expect(component.items.length).toBe(0);
  });

  it('actualiza los identificadores al solicitar el próximo comprobante', () => {
    const initialCalls = salesApiSpy.getNextInvoiceIdentifiers.calls.count();
    (component as any).fetchNextInvoiceIdentifiers('quote');
    expect(salesApiSpy.getNextInvoiceIdentifiers.calls.count()).toBe(initialCalls + 1);
    expect(component['invoicePreview']).toBe('0003-00001234');
  });
});
