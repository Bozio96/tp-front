import { Component, Input, OnChanges, OnInit, SimpleChanges, OnDestroy, HostListener, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { ProductService } from '../../../services/product.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';   
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Product } from '../product.model';
import { DataToolbarComponent } from '../../../components/data-toolbar/data-toolbar.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    DataToolbarComponent 
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.css']
})
export class ProductsListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchTerm: string = '';

  filteredProducts: Product[] = [];
  loading: boolean = true;
  menuProductId: number | null = null;

  @ViewChildren('actionContainer') actionContainers!: QueryList<ElementRef>;

  private searchTerms = new Subject<string>()
  private searchSubscription: Subscription | undefined;

  constructor(private productService: ProductService, private router: Router) {}

  

  ngOnInit(): void {
    this.searchSubscription = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.loading = true;
        return this.productService.searchProducts(term);
      })
    ).subscribe({
      next: (products) => {
        this.filteredProducts = products;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.filteredProducts = [];
      }
    });

    this.searchTerms.next(this.searchTerm);
  }

onSearchTermChanged(term: string): void {
    this.searchTerm = term; // Opcional: actualiza el Input si lo necesitas para algo más.
    this.searchTerms.next(term); // Emite el nuevo término al Subject
  }

ngOnChanges(changes: SimpleChanges): void {
  if (changes['searchTerm']) {
    this.searchTerms.next(this.searchTerm);
  }
}
  

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  toggleMenu(productId: number) {
    this.menuProductId = this.menuProductId === productId ? null : productId;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuProductId !== null && this.actionContainers) {
      const clickedInside = this.actionContainers.some(container =>
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

    const confirmation = window.confirm('¿Estás seguro de que quieres eliminar este producto?');

    if (confirmation) {
      this.productService.deleteProduct(productId).subscribe(success => {
        if (success) {
          console.log('Producto eliminado con éxito.');
          this.searchTerms.next(this.searchTerm);
        } else {
          console.error('No se pudo eliminar el producto.');
        }
      });
    }
  }
  onAddClick(): void {
  this.router.navigate(['/products/add']);
}
}