import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../../services/product.service';
import { Product } from '../product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  product: Product | undefined; // Objeto de producto que se va a editar o agregar

  readonly IVA_RATE = 0.21; // Tasa de IVA fija
  isEditing = false;        // Indica si el formulario está en modo edición o creación

  constructor(
    private route: ActivatedRoute,      // Permite acceder a los parámetros de la URL
    private router: Router,             // Para la navegación programática
    private productService: ProductService // Servicio para interactuar con los datos de productos
  ) {}

  ngOnInit(): void {
    // Obtiene el parámetro 'id' de la URL
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      // Si existe un ID, estamos en modo edición
      this.isEditing = true;
      // Busca el producto por su ID usando el servicio
      this.productService.getProductById(+id).subscribe({ // El '+' convierte el string 'id' a número
        next: (product) => {
          // Asigna el producto obtenido a la propiedad 'product'
          this.product = product;
        },
        error: (err) => {
          // Si hay un error (ej. producto no encontrado), navega a la página de error
          console.error('Error al obtener el producto:', err);
          this.router.navigate(['/not-found']);
        }
      });
    } else {
      // Si no hay ID, estamos creando un nuevo producto
      this.isEditing = false;
      // Inicializa un nuevo objeto de producto con valores predeterminados
      this.product = {
        id: 0, // Considera generar un ID único al guardar en el backend
        name: '',
        price: 0, // Podría ser calculado o asignado desde salePrice
        stock: 0,
        costBase: 0,
        discounts: 0,
        includeIVA: false,
        utilityPercentage: 0,
        salePrice: 0, // Será calculado
        minStock: 0,
        supplier: '',
        brand: '',
        category: '',
        department: ''
      };
    }
  }

  // --- Getters para valores calculados ---

  /**
   * Calcula el costo neto del producto (costo base - descuentos).
   * Retorna 0 si el producto es indefinido.
   */
  get netCost(): number {
    if (!this.product) {
      return 0;
    }
    // Asegura que 'discounts' sea 0 si es nulo/indefinido para evitar NaN
    return this.product.costBase - (this.product.discounts || 0);
  }

  /**
   * Calcula el costo final, incluyendo IVA si 'includeIVA' es verdadero.
   * Retorna 0 si el producto es indefinido.
   */
  get finalCost(): number {
    if (!this.product) {
      return 0;
    }

    let final = this.product.costBase - (this.product.discounts || 0);
    if (this.product.includeIVA) {
      final += final * this.IVA_RATE;
    }
    return final;
  }

  /**
   * Calcula el precio de venta basado en el costo final y el porcentaje de utilidad.
   * Retorna 0 si el producto es indefinido.
   */
  get salePrice(): number {
    if (!this.product) {
      return 0;
    }
    // Asegura que 'utilityPercentage' sea 0 si es nulo/indefinido para evitar NaN
    return this.finalCost + (this.finalCost * (this.product.utilityPercentage || 0) / 100);
  }

  // --- Manejadores de eventos ---

  /**
   * Maneja el envío del formulario para guardar o actualizar el producto.
   */
  onSave(): void {
    if (!this.product) {
      console.warn('Se intentó guardar sin datos de producto.');
      return;
    }

    // Asegura que 'salePrice' y 'price' se actualicen antes de guardar
    this.product.salePrice = this.salePrice;
    this.product.price = this.salePrice; // Asume que 'price' en el modelo guarda el precio de venta

    if (this.isEditing) {
      // Actualiza un producto existente
      this.productService.updateProduct(this.product).subscribe({
        next: () => {
          this.router.navigate(['/products']); // Navega después de la actualización exitosa
        },
        error: (err) => {
          console.error('Error al actualizar el producto:', err);
          // Aquí podrías mostrar un mensaje de error al usuario
        }
      });
    } else {
      // Agrega un nuevo producto
      this.productService.addProduct(this.product).subscribe({
        next: () => {
          this.router.navigate(['/products']); // Navega después de agregar con éxito
        },
        error: (err) => {
          console.error('Error al agregar el producto:', err);
          // Aquí podrías manejar el error
        }
      });
    }
  }

  /**
   * Maneja la acción de cancelar, volviendo a la lista de productos.
   */
  onCancel(): void {
    this.router.navigate(['/products']);
  }
}