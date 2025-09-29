import {Component,Input,OnChanges,OnInit,SimpleChanges,OnDestroy,HostListener,QueryList,ViewChildren,ElementRef,} from '@angular/core';
import { ProductService } from '../../../services/product.service';
import { CommonModule } from '@angular/common';
import {FormsModule,ReactiveFormsModule,FormBuilder,FormGroup,} from '@angular/forms'; // <-- Importaciones clave
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Product } from '../../../models/product.model';
import { DataToolbarComponent } from '../../../components/data-toolbar/data-toolbar.component';
import {ProductDataService} from '../../../services/product-data.service'; // <-- Nuevo: para obtener los filtros
import { DataItem } from '../../../services/product-types';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule,FormsModule,MatTooltipModule,DataToolbarComponent,ReactiveFormsModule,],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.css'],
})
export class ProductsListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchTerm: string = '';

  filteredProducts: Product[] = [];
  allProducts: Product[] = []; // <-- Nuevo: Almacena la lista completa
  loading: boolean = true;
  menuProductId: number | null = null;
  showAdvancedSearch: boolean = false; // <-- Nuevo: Controla el formulario

  advancedSearchForm!: FormGroup; // <-- Nuevo: El formulario reactivo

  // Listas de opciones para los filtros
  availableBrands: DataItem[] = [];
  availableDepartments: DataItem[] = [];
  availableCategories: DataItem[] = [];
  availableSuppliers: DataItem[] = [];

  @ViewChildren('actionContainer') actionContainers!: QueryList<ElementRef>;

  private searchTerms = new Subject<string>();
  private productsSubscription: Subscription | undefined;

  constructor(
    private productService: ProductService,
    private router: Router,
    private fb: FormBuilder, // <-- Nuevo: FormBuilder para crear el formulario
    private productDataService: ProductDataService,
    public authService: AuthService // <-- Nuevo: para obtener los datos de filtro
  ) {}

  ngOnInit(): void {
    // Inicializa el formulario de búsqueda avanzada
    this.createAdvancedSearchForm();

    // Carga los datos para los filtros
    this.loadFilterData();

    // Suscribe al stream de búsqueda
    this.productsSubscription = this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.loading = true;
          return this.productService.searchProducts(term);
        })
      )
      .subscribe({
        next: (products) => {
          this.allProducts = products; // Siempre guardamos la lista completa
          this.applyFilters(); // Aplicamos filtros después de cada búsqueda
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar productos:', err);
          this.loading = false;
          this.allProducts = [];
          this.filteredProducts = [];
        },
      });

    // Carga inicial de todos los productos
    this.searchTerms.next('');
  }

  createAdvancedSearchForm(): void {
    this.advancedSearchForm = this.fb.group({
      brand: [''],
      department: [''],
      category: [''],
      supplier: [''],
    });
  }

  loadFilterData(): void {
    this.productDataService
      .getBrands()
      .subscribe((data) => (this.availableBrands = data));
    this.productDataService
      .getDepartments()
      .subscribe((data) => (this.availableDepartments = data));
    this.productDataService
      .getCategories()
      .subscribe((data) => (this.availableCategories = data));
    this.productDataService
      .getSuppliers()
      .subscribe((data) => (this.availableSuppliers = data));
  }

  // Nuevo: Muestra/oculta el formulario de búsqueda avanzada
  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  // Nuevo: Aplica los filtros del formulario a la lista de productos
  applyFilters(): void {
    const formValues = this.advancedSearchForm.value;
    let filteredList = [...this.allProducts]; // Empezamos con la lista completa
    const searchTermLower = this.searchTerm.toLowerCase();

    // 1. Aplicar el filtro de búsqueda de la barra principal
    if (searchTermLower) {
      filteredList = filteredList.filter((p) =>
        p.name.toLowerCase().includes(searchTermLower)
      );
    }

    // 2. Aplicar los filtros de búsqueda avanzada
    function getNameIfObject(field: any): string {
      if (field && typeof field === 'object' && 'name' in field) {
        return field.name;
      }
      return field ?? '';
    }
    if (formValues.brand) {
      filteredList = filteredList.filter((p) => getNameIfObject(p.brand) === formValues.brand);
    }
    if (formValues.department) {
      filteredList = filteredList.filter((p) => getNameIfObject(p.department) === formValues.department);
    }
    if (formValues.category) {
      filteredList = filteredList.filter((p) => getNameIfObject(p.category) === formValues.category);
    }
    if (formValues.supplier) {
      filteredList = filteredList.filter((p) => getNameIfObject(p.supplier) === formValues.supplier);
    }

    this.filteredProducts = filteredList;
  }

  // Nuevo: Limpia el formulario y los filtros
  clearFilters(): void {
    this.advancedSearchForm.reset({
      brand: '',
      department: '',
      category: '',
      supplier: '',
    });
    this.applyFilters(); // Vuelve a aplicar los filtros (sin valores, mostrará todo)
  }

  onSearchTermChanged(term: string): void {
    this.searchTerm = term;
    // Ya no usamos el Subject directamente, sino que aplicamos los filtros
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchTerm']) {
      this.applyFilters();
    }
  }

  ngOnDestroy(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    this.searchTerms.complete();
  }

  toggleMenu(productId: number) {
    this.menuProductId = this.menuProductId === productId ? null : productId;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuProductId !== null && this.actionContainers) {
      const clickedInside = this.actionContainers.some((container) =>
        container.nativeElement.contains(event.target)
      );
      if (!clickedInside) {
        this.menuProductId = null;
      }
    }
  }

  onEditClick(productId: number) {
    this.menuProductId = null;
    this.router.navigate(['/products/edit', productId]);
  }

  onDeleteClick(productId: number) {
    this.menuProductId = null;
    const confirmation = window.confirm(
      '¿Estás seguro de que quieres eliminar este producto?'
    );
    if (confirmation) {
      this.productService.deleteProduct(productId).subscribe(
        (success) => {
          if (success) {
            console.log('Producto eliminado con éxito.');
            // Eliminar el producto de la lista local y aplicar filtros
            this.allProducts = this.allProducts.filter(p => p.id !== productId);
            this.applyFilters();
          } else {
            console.error('No se pudo eliminar el producto.');
          }
        },
        (error) => {
          console.error('Error al eliminar producto:', error);
        }
      );
    }
  }

  onAddClick(): void {
    this.router.navigate(['/products/add']);
  }
}
