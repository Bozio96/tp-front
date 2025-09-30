import { HostListener, OnDestroy } from '@angular/core';

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { ProductDataService } from '../../../services/product-data.service';
import { NotificationService } from '../../../services/notification.service';
import { DataItem } from '../../../services/product-types';
import { Product } from '../../../models/product.model';
import { take } from 'rxjs';

// Validador personalizado que comprueba si un valor existe en una lista de opciones.
function valueExistsValidator(allowedValues: DataItem[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const inputValue = control.value;

    // Si el valor está vacío o no es una cadena, no hay error.
    if (!inputValue || typeof inputValue !== 'string') {
      return null;
    }

    // Convertimos la lista de objetos a una lista de nombres en minúsculas para la comparación.
    const allowedNames = allowedValues.map((item) => item.name.toLowerCase());

    // Comprobamos si el valor introducido (en minúsculas) existe en la lista de nombres.
    const valueExists = allowedNames.includes(inputValue.toLowerCase());

    // Devolvemos un error 'valueNotExists' si no se encuentra.
    return valueExists ? null : { valueNotExists: true };
  };
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css'],
})
export class ProductFormComponent implements OnInit, OnDestroy {
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.productForm && this.productForm.dirty) {
      $event.returnValue = true;
    }
  }

  ngOnDestroy(): void {
    // Limpieza si es necesario en el futuro
  }
  productForm!: FormGroup;
  isEditing = false;

  availableBrands: DataItem[] = [];
  availableDepartments: DataItem[] = [];
  availableCategories: DataItem[] = [];
  availableSuppliers: DataItem[] = [];

  readonly IVA_RATE = 0.21;
  private isCalculating = false;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private productDataService: ProductDataService,
    private notifications: NotificationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.createForm();

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditing = true;
      this.isLoading = true;
      this.productService.getProductById(+id).subscribe({
        next: (product) => {
          if (product) {
            function getNameIfObject(field: any): string {
              if (field && typeof field === 'object' && 'name' in field) {
                return field.name;
              }
              return field ?? '';
            }
            this.productForm.patchValue({
              ...product,
              supplier: getNameIfObject(product.supplier),
              brand: getNameIfObject(product.brand),
              category: getNameIfObject(product.category),
              department: getNameIfObject(product.department),
            });
            this.isLoading = false;
            return;
          }

          this.notifications.showError('No se encontr� el producto solicitado.');
          this.isLoading = false;
          this.router.navigate(['/products']);
        },
        error: (err) => {
          console.error('Error al obtener el producto:', err);
          this.notifications.showError(this.getErrorMessage(err, 'No se pudo cargar el producto.'));
          this.isLoading = false;
          this.router.navigate(['/products']);
        },
      });
    }
    this.productDataService.getSuppliers().subscribe((data) => {
      this.availableSuppliers = data;
      this.productForm
        .get('supplier')
        ?.setValidators(valueExistsValidator(this.availableSuppliers));
      this.productForm.get('supplier')?.updateValueAndValidity();
    });
  }
    // Método requerido por el guard para evitar salir con cambios no guardados
  canDeactivate(): boolean {
    if (this.productForm && this.productForm.dirty) {
      return confirm('Hay cambios sin guardar. ¿Seguro que quieres salir?');
    }
    return true;
  }

  private createForm(): void {
    this.productForm = this.fb.group({
      sku: ['', Validators.required],
      name: ['', Validators.required],
      price: [0],
      stock: [0, Validators.required],
      costBase: [0, Validators.required],
      discounts: [0],
      includeIVA: [false],
      utilityPercentage: [0],
      salePrice: [0, Validators.required],
      minStock: [0],
      supplier: [''],
      brand: [''],
      category: [''],
      department: [''],
      costBaseWithIVA: [{ value: 0, disabled: true }],
      finalCost: [{ value: 0, disabled: true }],
    });

    this.productForm.valueChanges.subscribe(() => {
      if (!this.isLoading && this.productForm.pristine) {
        this.productForm.markAsDirty();
      }
      this.updateComputedFields();
    });

    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
    this.updateComputedFields();

    this.productForm
      .get('costBase')
      ?.valueChanges.subscribe(() => this.onCostRelatedChange());
    this.productForm
      .get('discounts')
      ?.valueChanges.subscribe(() => this.onCostRelatedChange());
    this.productForm
      .get('includeIVA')
      ?.valueChanges.subscribe(() => this.onCostRelatedChange());
    this.productForm
      .get('utilityPercentage')
      ?.valueChanges.subscribe(() => this.onUtilityPercentageChange());
    this.productForm
      .get('salePrice')
      ?.valueChanges.subscribe(() => this.onSalePriceChange());
  }
  private updateComputedFields(): void {
    if (!this.productForm) {
      return;
    }

    const costBase = Number(this.productForm.get('costBase')?.value) || 0;
    const costBaseWithIVA = costBase * (1 + this.IVA_RATE);
    const finalCost = this.finalCost;

    this.productForm
      .get('costBaseWithIVA')
      ?.setValue(this.round(costBaseWithIVA), { emitEvent: false });

    this.productForm
      .get('finalCost')
      ?.setValue(this.round(finalCost), { emitEvent: false });
  }
  get netCost(): number {
    const costBase = Number(this.productForm.get('costBase')?.value) || 0;
    const discounts = Number(this.productForm.get('discounts')?.value) || 0;
    // Si discounts es 0, no hay descuento. Si es > 0, se interpreta como porcentaje.
    return costBase - (costBase * discounts / 100);
  }

  get finalCost(): number {
    let final = this.netCost;
    if (this.productForm.get('includeIVA')?.value) {
      final += final * this.IVA_RATE;
    }
    return final;
  }

  onCostRelatedChange(): void {
    if (this.isCalculating) return;
    this.isCalculating = true;
    const utilityPercentage = this.productForm.get('utilityPercentage')?.value;
    const salePrice = this.productForm.get('salePrice')?.value;
    if (utilityPercentage !== undefined && utilityPercentage !== null) {
      this.calculateSalePriceFromUtilityPercentage();
    } else if (salePrice !== undefined && salePrice !== null) {
      this.calculateUtilityPercentageFromSalePrice();
    }
    this.isCalculating = false;
  }

  onUtilityPercentageChange(): void {
    if (this.isCalculating) return;
    this.isCalculating = true;
    this.calculateSalePriceFromUtilityPercentage();
    this.isCalculating = false;
  }

  onSalePriceChange(): void {
    if (this.isCalculating) return;
    this.isCalculating = true;
    this.calculateUtilityPercentageFromSalePrice();
    this.isCalculating = false;
  }

  private calculateSalePriceFromUtilityPercentage(): void {
    const utilityPercentage =
      Number(this.productForm.get('utilityPercentage')?.value) || 0;
    const finalCost = this.finalCost;
    const calculatedSalePrice =
      finalCost + (finalCost * utilityPercentage) / 100;
    this.productForm
      .get('salePrice')
      ?.setValue(this.round(calculatedSalePrice), { emitEvent: false });
    this.productForm
      .get('price')
      ?.setValue(this.round(calculatedSalePrice), { emitEvent: false });
  }

  private calculateUtilityPercentageFromSalePrice(): void {
    const salePrice = Number(this.productForm.get('salePrice')?.value) || 0;
    const finalCost = this.finalCost;
    let calculatedUtility: number;
    if (finalCost > 0) {
      calculatedUtility = ((salePrice - finalCost) / finalCost) * 100;
    } else if (salePrice > 0) {
      calculatedUtility = 1000000;
    } else {
      calculatedUtility = 0;
    }
    this.productForm
      .get('utilityPercentage')
      ?.setValue(parseFloat(calculatedUtility.toFixed(2)), {
        emitEvent: false,
      });
  }

  private round(num: number, decimalPlaces: number = 2): number {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(num * factor) / factor;
  }

  onSave(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.notifications.showError('Revis� los campos obligatorios antes de guardar.');
      return;
    }

    this.isLoading = true;
    const productToSave = this.prepareProductPayload();

    let request$;
    if (this.isEditing) {
      const idParam = this.route.snapshot.paramMap.get('id');
      const id = idParam ? Number(idParam) : NaN;
      if (!idParam || Number.isNaN(id)) {
        this.notifications.showError('No se pudo determinar el identificador del producto.');
        this.isLoading = false;
        return;
      }
      request$ = this.productService.updateProduct(id, productToSave);
    } else {
      request$ = this.productService.addProduct(productToSave as Product);
    }

    request$.subscribe({
      next: () => {
        const message = this.isEditing
          ? 'Producto actualizado correctamente.'
          : 'Producto agregado correctamente.';
        this.notifications.showSuccess(message);
        this.productForm.markAsPristine();
        this.productForm.markAsUntouched();
        this.isLoading = false;
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Error al guardar el producto:', err);
        const fallback = this.isEditing
          ? 'No se pudo actualizar el producto.'
          : 'No se pudo agregar el producto.';
        this.notifications.showError(this.getErrorMessage(err, fallback));
        this.isLoading = false;
      },
    });
  }
  private prepareProductPayload(): Partial<Product> {
    const raw = this.productForm.getRawValue();
    const product: Record<string, any> = { ...raw };

    const toNumber = (value: unknown): number | undefined => {
      if (value === null || value === undefined || value === '') {
        return undefined;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const toInteger = (value: unknown): number | undefined => {
      const parsed = toNumber(value);
      return parsed !== undefined ? Math.trunc(parsed) : undefined;
    };

    const decimalFields: Array<keyof Product> = [
      'price',
      'costBase',
      'discounts',
      'utilityPercentage',
      'salePrice',
    ];

    decimalFields.forEach((field) => {
      const parsed = toNumber(product[field]);
      if (parsed === undefined) {
        delete product[field];
      } else {
        product[field] = parsed;
      }
    });

    const integerFields: Array<keyof Product> = ['stock', 'minStock'];
    integerFields.forEach((field) => {
      const parsed = toInteger(product[field]);
      if (parsed === undefined) {
        delete product[field];
      } else {
        product[field] = parsed;
      }
    });

    if (!('discounts' in product) || product['discounts'] === undefined) {
      product['discounts'] = 0;
    }

    const assignRelation = (
      key: 'brand' | 'category' | 'supplier' | 'department',
      list: DataItem[],
    ) => {
      const value = product[key];
      const name = typeof value === 'string' ? value : value?.name;
      const match = list.find((item) => item.name === name);
      product[key] = match ? { id: match.id } : undefined;
    };

    assignRelation('brand', this.availableBrands);
    assignRelation('category', this.availableCategories);
    assignRelation('supplier', this.availableSuppliers);
    assignRelation('department', this.availableDepartments);

    delete product['costBaseWithIVA'];
    delete product['finalCost'];

    Object.keys(product).forEach((key) => {
      if (product[key] === undefined) {
        delete product[key];
      }
    });

    delete product['id'];

    return product;
  }
  private getErrorMessage(error: unknown, fallback: string): string {
    const backendMessage = (error as any)?.error?.message;
    if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
      return backendMessage;
    }

    const genericMessage = (error as any)?.message;
    if (typeof genericMessage === 'string' && genericMessage.trim().length > 0) {
      return genericMessage;
    }

    return fallback;
  }
  onCancel(): void {
    this.router.navigate(['/products']);
  }
}















