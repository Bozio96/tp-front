import { Component, OnInit, OnDestroy } from '@angular/core'; // Agregamos OnDestroy
import { CommonModule } from '@angular/common';
import {
  ProductDataService} from '../../../services/product-data.service';
import { Router } from '@angular/router';
import { DataToolbarComponent } from '../../../components/data-toolbar/data-toolbar.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataItem } from '../../../services/product-types';

@Component({
  selector: 'app-brands-list',
  standalone: true,
  imports: [CommonModule, DataToolbarComponent,MatTooltipModule],
  templateUrl: './brands-list.component.html',
  styleUrls: ['./brands-list.component.css'],
})
export class BrandsListComponent implements OnInit, OnDestroy {
  // Implementamos OnDestroy
  allBrands: DataItem[] = [];
  filteredBrands: DataItem[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  menuItemId: number | null = null; // Para el menú desplegable de acciones

  constructor(
    private productDataService: ProductDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBrands();
    // Listener para cerrar el menú si se hace clic fuera del menú
    // El 'bind(this)' es crucial para mantener el contexto de 'this'
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  // Se ejecuta cuando el componente se destruye para limpiar el listener
  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  loadBrands(): void {
    this.loading = true; // Muestra el spinner
    this.productDataService.getBrands().subscribe(
      (data: DataItem[]) => {
        this.allBrands = data;
        this.filterBrands(); // Filtra después de cargar los datos
        this.loading = false; // Oculta el spinner
      },
      (error) => {
        console.error('Error al obtener las marcas:', error);
        this.loading = false; // Oculta el spinner incluso si hay error
      }
    );
  }

  onSearchTermChanged(term: string): void {
    this.searchTerm = term; // El ngModelChange ya nos da el valor directamente
    this.filterBrands();
  }

  filterBrands(): void {
    if (!this.searchTerm) {
      this.filteredBrands = [...this.allBrands]; // Copia el array completo si no hay búsqueda
    } else {
      this.filteredBrands = this.allBrands.filter((brand) =>
        brand.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  onAddClick(): void {
    this.router.navigate(['/products/brands/add']);
  }

  onEditClick(id: number): void {
    this.router.navigate(['/products/brands/edit', id]);
    this.menuItemId = null; // Cierra el menú después de la acción
  }

  onDeleteClick(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta marca?')) {
      this.productDataService.deleteItem('brands', id).subscribe(
        (success) => {
          if (success) {
            console.log('Marca eliminada con éxito.');
            this.loadBrands(); // Recarga la lista después de eliminar
          } else {
            console.warn('No se pudo eliminar la marca.');
          }
          this.menuItemId = null; // Cierra el menú
        },
        (error) => {
          console.error('Error al eliminar la marca:', error);
          this.menuItemId = null; // Cierra el menú
        }
      );
    }
  }

  toggleMenu(id: number, event: MouseEvent): void {
    event.stopPropagation(); // Evita que el clic se propague al documento y cierre el menú inmediatamente
    this.menuItemId = this.menuItemId === id ? null : id; // Abre/cierra el menú
  }

  // Cierra el menú desplegable si se hace clic en cualquier parte del documento
  onDocumentClick(): void {
    this.menuItemId = null;
  }
}
