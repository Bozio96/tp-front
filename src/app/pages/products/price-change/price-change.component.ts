// price-change.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductDataService} from '../../../services/product-data.service';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataItem } from '../../../services/product-types';

@Component({
  selector: 'app-price-change',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTooltipModule,
  ],
  templateUrl: './price-change.component.html',
  styleUrls: ['./price-change.component.css']
})
export class PriceChangeComponent implements OnInit {
  // Formularios reactivos
  priceForm!: FormGroup;
  filterForm!: FormGroup;

  // Listas para filtros
  suppliers: DataItem[] = [];
  brands: DataItem[] = [];
  departments: DataItem[] = [];
  categories: DataItem[] = [];

  // Productos
  originalProducts: Product[] = [];
  filteredProducts: Product[] = [];

  // Estado
  isLoading = false;
  isCalculating = false;

  readonly IVA_RATE = 0.21;

  constructor(
    private fb: FormBuilder,
    private productDataService: ProductDataService,
    private productService: ProductService
  ) {
    this.createForms();
  }

  ngOnInit(): void {
    this.loadFilterData();
    this.loadProducts();
  }

  private createForms(): void {
    // Formulario principal: porcentaje, utilidad, aplicar a
    this.priceForm = this.fb.group({
      applyTo: ['salePrice', [Validators.required]],
      percentage: [null, [Validators.min(0), Validators.max(1000)]],
      utility: [null, [Validators.min(0), Validators.max(1000)]]
    });

    // Formulario de filtros
    this.filterForm = this.fb.group({
      supplier: [''],
      brand: [''],
      department: [''],
      category: ['']
    });

    // Escuchar cambios en percentage
    this.priceForm.get('percentage')?.valueChanges.subscribe(value => {
      if (value !== null && value > 0) {
        this.priceForm.get('utility')?.setValue(null, { emitEvent: false });
      }
      this.calculateNewPrices();
    });

    // Escuchar cambios en utility
    this.priceForm.get('utility')?.valueChanges.subscribe(value => {
      if (value !== null && value >= 0) {
        this.priceForm.get('percentage')?.setValue(null, { emitEvent: false });
      }
      this.calculateNewPrices();
    });

    // Escuchar cambios en applyTo
    this.priceForm.get('applyTo')?.valueChanges.subscribe(() => {
      this.calculateNewPrices();
    });
  }

  loadFilterData(): void {
    this.productDataService.getSuppliers().subscribe(data => this.suppliers = data);
    this.productDataService.getBrands().subscribe(data => this.brands = data);
    this.productDataService.getDepartments().subscribe(data => this.departments = data);
    this.productDataService.getCategories().subscribe(data => this.categories = data);
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllProducts().subscribe((products: Product[]) => {
      this.originalProducts = products;
      this.applyFilter();
      this.isLoading = false;
    });
  }

  // Habilita el botón "Filtrar" si hay porcentaje o utilidad válida
  get canFilter(): boolean {
    const percentage = this.priceForm.get('percentage')?.value;
    const utility = this.priceForm.get('utility')?.value;
    return (percentage !== null && percentage > 0) || (utility !== null && utility >= 0);
  }

  showFilter = false;

  toggleFilter(): void {
    if (this.canFilter) {
      this.showFilter = !this.showFilter;
    }
  }

  applyFilter(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.originalProducts];

    function getNameIfObject(field: any): string {
      if (field && typeof field === 'object' && 'name' in field) {
        return field.name;
      }
      return field ?? '';
    }
    if (filters.supplier) {
      filtered = filtered.filter(p => getNameIfObject(p.supplier) === filters.supplier);
    }
    if (filters.brand) {
      filtered = filtered.filter(p => getNameIfObject(p.brand) === filters.brand);
    }
    if (filters.department) {
      filtered = filtered.filter(p => getNameIfObject(p.department) === filters.department);
    }
    if (filters.category) {
      filtered = filtered.filter(p => getNameIfObject(p.category) === filters.category);
    }

    this.filteredProducts = filtered;
    this.calculateNewPrices();
  }

  clearFilter(): void {
    this.filterForm.reset();
    this.applyFilter();
  }

  calculateNewPrices(): void {
    if (this.isCalculating) return;
    this.isCalculating = true;

    const percentage = this.priceForm.get('percentage')?.value;
    const utility = this.priceForm.get('utility')?.value;
    const applyTo = this.priceForm.get('applyTo')?.value as 'cost' | 'salePrice';

    const hasPercentage = percentage !== null && percentage > 0;
    const hasUtility = utility !== null && utility >= 0;

    this.filteredProducts.forEach(product => {
      if (hasPercentage) {
        if (applyTo === 'cost') {
          const newCostBase = product.costBase * (1 + percentage / 100);
          const discounts = product.discounts;
          const netCost = newCostBase - discounts;
          const finalCost = product.includeIVA ? netCost * (1 + this.IVA_RATE) : netCost;
          const newSalePrice = finalCost * (1 + product.utilityPercentage / 100);

          product.costoNuevo = newCostBase;
          product.salePriceNuevo = newSalePrice;
          product.utilityNuevo = product.utilityPercentage;
        } else {
          const newSalePrice = product.salePrice * (1 + percentage / 100);
          product.salePriceNuevo = newSalePrice;
          const finalCost = product.includeIVA
            ? (product.costBase - product.discounts) * (1 + this.IVA_RATE)
            : (product.costBase - product.discounts);
          const utilityNuevo = finalCost > 0 ? ((newSalePrice - finalCost) / finalCost) * 100 : 0;
          product.utilityNuevo = utilityNuevo;
        }
      } else if (hasUtility) {
        const finalCost = product.includeIVA
          ? (product.costBase - product.discounts) * (1 + this.IVA_RATE)
          : (product.costBase - product.discounts);
        const newSalePrice = finalCost * (1 + utility / 100);

        product.salePriceNuevo = newSalePrice;
        product.utilityNuevo = utility;

        if (applyTo === 'cost') {
          const newCostBase = product.costBase * (1 + percentage / 100);
          product.costoNuevo = newCostBase;
        }
      } else {
        // No hay cambios: limpiar valores nuevos
        product.costoNuevo = undefined;
        product.salePriceNuevo = undefined;
        product.utilityNuevo = undefined;
      }
    });

    this.isCalculating = false;
  }

  onAccept(): void {
    const count = this.filteredProducts.length;
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas actualizar ${count} producto(s) con los nuevos precios?`
    );
    if (!confirmed) return;

    const updatedProducts = this.filteredProducts.map(p => ({
      ...p,
      costBase: p.costoNuevo ?? p.costBase,
      salePrice: p.salePriceNuevo ?? p.salePrice,
      utilityPercentage: p.utilityNuevo ?? p.utilityPercentage,
      price: p.salePriceNuevo ?? p.salePrice
    }));

    this.productService.bulkUpdateProducts(updatedProducts).subscribe(success => {
      if (success) {
        alert('Precios actualizados con éxito.');
        this.resetForm();
      } else {
        alert('Hubo un error al actualizar los precios.');
      }
    });
  }

  onCancel(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.priceForm.reset({ applyTo: 'salePrice' });
    this.filterForm.reset();
    this.showFilter = false;
    this.filteredProducts = [];
    this.loadProducts(); // Recargar productos limpios
  }
}