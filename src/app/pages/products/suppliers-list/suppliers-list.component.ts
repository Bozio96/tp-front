import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductDataService} from '../../../services/product-data.service';
import { Router } from '@angular/router';
import { DataToolbarComponent } from '../../../components/data-toolbar/data-toolbar.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataItem } from '../../../services/product-types';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [CommonModule, DataToolbarComponent,MatTooltipModule],
  templateUrl: './suppliers-list.component.html',
  styleUrls: ['./suppliers-list.component.css']
})
export class SuppliersListComponent implements OnInit, OnDestroy {
  allSuppliers: DataItem[] = [];
  filteredSuppliers: DataItem[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  menuItemId: number | null = null;

  constructor(
    private productDataService: ProductDataService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSuppliers();
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  loadSuppliers(): void {
    this.loading = true;
    this.productDataService.getSuppliers().subscribe(
      (data: DataItem[]) => {
        this.allSuppliers = data;
        this.filterSuppliers();
        this.loading = false;
      },
      (error) => {
        console.error('Error al obtener los proveedores:', error);
        this.loading = false;
      }
    );
  }

  onSearchTermChanged(term: string): void {
    this.searchTerm = term;
    this.filterSuppliers();
  }

  filterSuppliers(): void {
    if (!this.searchTerm) {
      this.filteredSuppliers = [...this.allSuppliers];
    } else {
      this.filteredSuppliers = this.allSuppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  onAddClick(): void {
    this.router.navigate(['/products/suppliers/add']);
  }

  onEditClick(id: number): void {
    this.router.navigate(['/products/suppliers/edit', id]);
    this.menuItemId = null;
  }

  onDeleteClick(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      this.productDataService.deleteItem('suppliers', id).subscribe(
        success => {
          if (success) {
            console.log('Proveedor eliminado con éxito.');
            this.loadSuppliers();
          } else {
            console.warn('No se pudo eliminar el proveedor.');
          }
          this.menuItemId = null;
        },
        error => {
          console.error('Error al eliminar el proveedor:', error);
          this.menuItemId = null;
        }
      );
    }
  }

  toggleMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.menuItemId = this.menuItemId === id ? null : id;
  }

  onDocumentClick(): void {
    this.menuItemId = null;
  }
}