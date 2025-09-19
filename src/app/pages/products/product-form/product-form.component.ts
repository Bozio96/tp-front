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
import {ProductDataService} from '../../../services/product-data.service';
import { DataItem } from '../../../services/product-types';
import { Product } from '../../../models/product.model';

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
  private isCalculating: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private productDataService: ProductDataService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.createForm();

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditing = true;
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
          }
        },
        error: (err) => {
          console.error('Error al obtener el producto:', err);
          this.router.navigate(['/not-found']);
        },
      });
    }

    // Cargamos los datos para los filtros y aplicamos el validador
    // a cada campo una vez que los datos estén disponibles.
    this.productDataService.getBrands().subscribe((data) => {
      this.availableBrands = data;
      this.productForm
        .get('brand')
        ?.setValidators(valueExistsValidator(this.availableBrands));
      this.productForm.get('brand')?.updateValueAndValidity();
    });
    this.productDataService.getDepartments().subscribe((data) => {
      this.availableDepartments = data;
      this.productForm
        .get('department')
        ?.setValidators(valueExistsValidator(this.availableDepartments));
      this.productForm.get('department')?.updateValueAndValidity();
    });
    this.productDataService.getCategories().subscribe((data) => {
      this.availableCategories = data;
      this.productForm
        .get('category')
        ?.setValidators(valueExistsValidator(this.availableCategories));
      this.productForm.get('category')?.updateValueAndValidity();
    });
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

  createForm(): void {
    this.productForm = this.fb.group({
      // id: [{ value: 0, disabled: true }], // Ocultamos el id
      sku: ['', Validators.required],
      name: ['', Validators.required],
      price: [],
      stock: [Validators.required],
      costBase: [Validators.required],
      discounts: [],
      includeIVA: [false],
      utilityPercentage: [0],
      salePrice: [Validators.required],
      minStock: [0],
      supplier: [''],
      brand: [''],
      category: [''],
      department: [''],
    });

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
      console.warn('Formulario inválido. No se puede guardar.');
      this.productForm.markAllAsTouched();
      return;
    }
    let productToSave: any = this.productForm.getRawValue();
    // Si discounts es null, undefined o vacío, ponerlo en 0
    if (productToSave.discounts === null || productToSave.discounts === undefined || productToSave.discounts === '') {
      productToSave.discounts = 0;
    }
    // Convertir los campos de nombre a objeto con id si corresponde
    function getEntityByName(list: any[], name: string) {
      return list.find(item => item.name === name);
    }
    const brandObj = getEntityByName(this.availableBrands, productToSave.brand);
    const categoryObj = getEntityByName(this.availableCategories, productToSave.category);
    const supplierObj = getEntityByName(this.availableSuppliers, productToSave.supplier);
    const departmentObj = getEntityByName(this.availableDepartments, productToSave.department);

    if (brandObj) productToSave.brand = { id: brandObj.id };
    else productToSave.brand = null;
    if (categoryObj) productToSave.category = { id: categoryObj.id };
    else productToSave.category = null;
    if (supplierObj) productToSave.supplier = { id: supplierObj.id };
    else productToSave.supplier = null;
    if (departmentObj) productToSave.department = { id: departmentObj.id };
    else productToSave.department = null;

    // Si es edición, agregamos el id manualmente (aunque no se muestre en el form)
    if (this.isEditing) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        productToSave.id = +id;
      }
    }

    // Validar SKU repetido antes de enviar (solo en alta)
    if (!this.isEditing) {
      // Buscar si el SKU ya existe en la lista de productos (requiere método en ProductService)
      this.productService.getAllProducts().subscribe((products: any[]) => {
        const exists = products.some((p) => p.sku === productToSave.sku);
        if (exists) {
          alert('El SKU ya existe. Por favor, ingrese uno diferente.');
          return;
        } else {
          this.productService.addProduct(productToSave).subscribe({
            next: () => this.router.navigate(['/products']),
            error: (err) => {
              if (err && err.error && err.error.message && err.error.message.includes('duplicate')) {
                alert('El SKU ya existe en la base de datos.');
              } else {
                alert('Error al agregar el producto.');
                console.error('Error al agregar:', err);
              }
            },
          });
        }
      });
    } else {
      this.productService.updateProduct(productToSave).subscribe({
        next: () => this.router.navigate(['/products']),
        error: (err) => {
          alert('Error al actualizar el producto.');
          console.error('Error al actualizar:', err);
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}
