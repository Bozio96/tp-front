import { Component, Input, OnChanges, OnInit, SimpleChanges, OnDestroy } from '@angular/core'; // Añade OnDestroy
import { ProductService } from '../../../services/product.service';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs'; // Importa Subject y Subscription
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators'; // Importa operadores RxJS

// Opcional: Define la interfaz Product si no la tienes globalmente
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.css']
})
export class ProductsListComponent implements OnInit, OnChanges, OnDestroy { // Implementa OnDestroy
  @Input() searchTerm: string = '';

  filteredProducts: Product[] = []; // Asegura el tipo Product[]
  loading: boolean = true;

  private searchTerms = new Subject<string>(); // <-- Subject para manejar el Input searchTerm
  private searchSubscription: Subscription | undefined; // <-- Para manejar la desuscripción

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // Suscribirse a los cambios del searchTerm con debounce
    this.searchSubscription = this.searchTerms.pipe(
      debounceTime(300), // Espera 300ms después de la última entrada
      distinctUntilChanged(), // Solo si el término es diferente al anterior
      switchMap(term => { // Cancela la petición anterior si llega un nuevo término
        this.loading = true; // Muestra el indicador de carga
        return this.productService.searchProducts(term); // Llama al servicio de búsqueda
      })
    ).subscribe({
      next: (products: Product[]) => { // Asegura el tipo Product[]
        this.filteredProducts = products;
        this.loading = false; // Oculta el indicador de carga
      },
      error: (err: any) => {
        console.error('Error al buscar productos', err);
        this.loading = false;
        this.filteredProducts = []; // Vacía los resultados en caso de error
      }
    });

    // Carga inicial de productos (vacío o todos si el searchTerm inicial está vacío)
    this.searchTerms.next(this.searchTerm); // Dispara la búsqueda inicial con el searchTerm actual
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchTerm']) {
      // Cuando el @Input() searchTerm cambia, lo emitimos al Subject
      // Esto disparará el pipeline de debounce, distinctUntilChanged, switchMap
      this.searchTerms.next(this.searchTerm);
    }
  }

  // Es crucial desuscribirse para evitar fugas de memoria
  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  // filterProducts y loadProducts privados ya no son necesarios en esta versión si usas searchTerms
  // private loadProducts() { ... }
  // private filterProducts() { ... }
}