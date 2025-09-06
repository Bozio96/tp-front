import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProductDataService} from '../../../services/product-data.service';
import { Router } from '@angular/router';
import { DataToolbarComponent } from '../../../components/data-toolbar/data-toolbar.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataItem } from '../../../services/product-types';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, DataToolbarComponent,MatTooltipModule],
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.css'],
})
export class CategoriesListComponent implements OnInit, OnDestroy {
  allCategories: DataItem[] = [];
  filteredCategories: DataItem[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  menuItemId: number | null = null;

  constructor(
    private productDataService: ProductDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  loadCategories(): void {
    this.loading = true;
    this.productDataService.getCategories().subscribe(
      (data: DataItem[]) => {
        this.allCategories = data;
        this.filterCategories();
        this.loading = false;
      },
      (error) => {
        console.error('Error al obtener las categorías:', error);
        this.loading = false;
      }
    );
  }

  onSearchTermChanged(term: string): void {
    this.searchTerm = term;
    this.filterCategories();
  }

  filterCategories(): void {
    if (!this.searchTerm) {
      this.filteredCategories = [...this.allCategories];
    } else {
      this.filteredCategories = this.allCategories.filter((category) =>
        category.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  onAddClick(): void {
    this.router.navigate(['/products/categories/add']);
  }

  onEditClick(id: number): void {
    this.router.navigate(['/products/categories/edit', id]);
    this.menuItemId = null;
  }

  onDeleteClick(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      this.productDataService.deleteItem('categories', id).subscribe(
        (success) => {
          if (success) {
            console.log('Categoría eliminada con éxito.');
            this.loadCategories();
          } else {
            console.warn('No se pudo eliminar la categoría.');
          }
          this.menuItemId = null;
        },
        (error) => {
          console.error('Error al eliminar la categoría:', error);
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
