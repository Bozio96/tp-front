import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import { ProductDataService } from '../../../services/product-data.service';
import { NotificationService } from '../../../services/notification.service'; // Ruta corregida
import { DataItem, EntityType } from '../../../services/product-types'; // Ruta corregida
import { DataToolbarComponent } from '../../../components/data-toolbar/data-toolbar.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-data-list',
  standalone: true,
  imports: [CommonModule, DataToolbarComponent, MatTooltipModule],
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.css'],
})
export class DataListComponent implements OnInit, OnDestroy {
  entityType: EntityType = 'brands';
  pageTitle: string = '';
  addLabel: string = '';
  singularLabel: string = '';

  allItems: DataItem[] = [];
  filteredItems: DataItem[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  menuItemId: number | null = null;

  private routeSub!: Subscription;
  private docClickListener!: () => void;

  constructor(
    private productDataService: ProductDataService,
    private router: Router,
    private route: ActivatedRoute,
    private notifications: NotificationService,
    public authService: AuthService // <-- Agregado: Inyección de AuthService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const type = params.get('entityType') as EntityType | null;

      if (
        type &&
        ['brands', 'departments', 'categories', 'suppliers'].includes(type)
      ) {
        this.entityType = type;
        this.setDynamicText(this.entityType);
        this.loadItems();
      } else {
        this.router.navigate(['/not-found']);
      }
    });

    this.docClickListener = this.onDocumentClick.bind(this);
    document.addEventListener('click', this.docClickListener);
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    document.removeEventListener('click', this.docClickListener);
  }

  private setDynamicText(type: EntityType): void {
    switch (type) {
      case 'brands':
        this.pageTitle = 'Marcas';
        this.addLabel = 'Agregar Marca';
        this.singularLabel = 'Marca';
        break;
      case 'departments':
        this.pageTitle = 'Departamentos';
        this.addLabel = 'Agregar Departamento';
        this.singularLabel = 'Departamento';
        break;
      case 'categories':
        this.pageTitle = 'Categorías';
        this.addLabel = 'Agregar Categoría';
        this.singularLabel = 'Categoría';
        break;
      case 'suppliers':
        this.pageTitle = 'Proveedores';
        this.addLabel = 'Agregar Proveedor';
        this.singularLabel = 'Proveedor';
        break;
    }
  }

  loadItems(): void {
    this.loading = true;
    this.productDataService.getItems(this.entityType).subscribe(
      (data: DataItem[]) => {
        this.allItems = this.sortById(data);
        this.filterItems();
        this.loading = false;
      },
      () => {
        this.notifications.showError(`No se pudieron obtener los ${this.pageTitle}.`);
        this.loading = false;
      }
    );
  }

  onSearchTermChanged(term: string): void {
    this.searchTerm = term;
    this.filterItems();
  }

  filterItems(): void {
    if (!this.searchTerm) {
      this.filteredItems = [...this.allItems];
    } else {
      this.filteredItems = this.allItems.filter((item) =>
        item.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  onAddClick(): void {
    this.router.navigate([`/products/${this.entityType}/add`]);
  }

  onEditClick(id: number): void {
    this.router.navigate([`/products/${this.entityType}/edit`, id]);
    this.menuItemId = null;
  }

  onDeleteClick(id: number): void {
    if (confirm(`¿Estás seguro de que quieres eliminar este ${this.singularLabel}?`)) {
      this.productDataService.deleteItem(this.entityType, id).subscribe({
        next: (success: boolean) => {
          if (success) {
            this.notifications.showSuccess(`${this.singularLabel} eliminado con éxito.`);
            this.loadItems();
          } else {
            this.notifications.showError(`No se pudo eliminar el ${this.singularLabel}.`);
          }
          this.menuItemId = null;
        },
        error: (error) => {
          const backendMessage = error?.error?.message;
          if (backendMessage) {
            this.notifications.showError(backendMessage);
          } else {
            this.notifications.showError(`No se pudo eliminar el ${this.singularLabel}.`);
          }
          this.menuItemId = null;
        },
      });
    }
  }

  toggleMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.menuItemId = this.menuItemId === id ? null : id;
  }

  onDocumentClick(): void {
    this.menuItemId = null;
  }

  private sortById(items: DataItem[]): DataItem[] {
    return [...items].sort((a, b) => a.id - b.id);
  }
}
