import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../services/product.service';
import { ProductsListComponent } from '../products-list/products-list.component'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-article',
  standalone: true,
  imports: [CommonModule, ProductsListComponent, FormsModule],
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.css']
})
export class ArticleComponent implements OnInit {
  productCount: number = 0;
  searchTerm: string = ''; 

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (products: any) => {
        this.productCount = products.length;
      },
      error: (err: any) => {
        console.error('Error al obtener conteo de productos', err);
      }
    });
  }
}