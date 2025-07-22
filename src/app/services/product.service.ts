import { Injectable } from '@angular/core';
import { of, delay, Observable } from 'rxjs'; // Añade Observable
import { Product } from '../pages/products/product.model';


@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // Los datos del array de productos ahora incluyen los nuevos campos
  private products: Product[] = [
    {
      id: 1,
      name: 'Clavos de 2"',
      price: 250,
      stock: 150,
      supplier: 'Ferretera del Centro',
      brand: 'Acero Fuerte',
      category: 'Fijaciones',
      department: 'Construcción',
      costBase: 100,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 150,
      salePrice: 250,
      minStock: 50
    },
    {
      id: 2,
      name: 'Tornillos T1 Phillips',
      price: 350,
      stock: 200,
      supplier: 'Bulonería Global',
      brand: 'FixIt',
      category: 'Fijaciones',
      department: 'Construcción',
      costBase: 180,
      discounts: 10,
      includeIVA: true,
      utilityPercentage: 94.44,
      salePrice: 350,
      minStock: 70
    },
    {
      id: 3,
      name: 'Amoladora Angular 750W',
      price: 15000,
      stock: 15,
      supplier: 'Herramientas Pro',
      brand: 'PowerTools',
      category: 'Herramientas Eléctricas',
      department: 'Maquinaria',
      costBase: 8000,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 87.5,
      salePrice: 15000,
      minStock: 5
    },
    {
      id: 4,
      name: 'Taladro Percutor 500W',
      price: 9000,
      stock: 20,
      supplier: 'Herramientas Pro',
      brand: 'MegaDrill',
      category: 'Herramientas Eléctricas',
      department: 'Maquinaria',
      costBase: 5000,
      discounts: 5,
      includeIVA: true,
      utilityPercentage: 80,
      salePrice: 9000,
      minStock: 7
    },
    {
      id: 5,
      name: 'Sierra Circular 1200W',
      price: 22000,
      stock: 10,
      supplier: 'Herramientas Expertas',
      brand: 'CutterPro',
      category: 'Herramientas Eléctricas',
      department: 'Maquinaria',
      costBase: 12000,
      discounts: 0,
      includeIVA: false,
      utilityPercentage: 83.33,
      salePrice: 22000,
      minStock: 3
    },
    {
      id: 6,
      name: 'Juego de Destornilladores (6 piezas)',
      price: 1200,
      stock: 40,
      supplier: 'Herramientas Manuales SAS',
      brand: 'HandyTool',
      category: 'Herramientas Manuales',
      department: 'Taller',
      costBase: 600,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 100,
      salePrice: 1200,
      minStock: 15
    },
    {
      id: 7,
      name: 'Llave Francesa 10"',
      price: 800,
      stock: 30,
      supplier: 'Herramientas Manuales SAS',
      brand: 'AdjustablePro',
      category: 'Herramientas Manuales',
      department: 'Taller',
      costBase: 400,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 100,
      salePrice: 800,
      minStock: 10
    },
    {
      id: 8,
      name: 'Cinta Métrica 5m',
      price: 450,
      stock: 80,
      supplier: 'Medición Exacta',
      brand: 'MeasureAll',
      category: 'Instrumentos de Medición',
      department: 'Accesorios',
      costBase: 200,
      discounts: 5,
      includeIVA: true,
      utilityPercentage: 125,
      salePrice: 450,
      minStock: 25
    },
    {
      id: 9,
      name: 'Nivel Burbuja 60cm',
      price: 1800,
      stock: 25,
      supplier: 'Medición Exacta',
      brand: 'LevelPro',
      category: 'Instrumentos de Medición',
      department: 'Accesorios',
      costBase: 900,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 100,
      salePrice: 1800,
      minStock: 8
    },
    {
      id: 10,
      name: 'Broca para Hormigón 8mm',
      price: 300,
      stock: 100,
      supplier: 'Accesorios Perforación',
      brand: 'HardDrill',
      category: 'Accesorios para Herramientas',
      department: 'Ferretería General',
      costBase: 120,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 150,
      salePrice: 300,
      minStock: 30
    },
    {
      id: 11,
      name: 'Disco de Corte para Metal 4.5"',
      price: 200,
      stock: 120,
      supplier: 'Accesorios Perforación',
      brand: 'CutFast',
      category: 'Accesorios para Herramientas',
      department: 'Ferretería General',
      costBase: 80,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 150,
      salePrice: 200,
      minStock: 40
    },
    {
      id: 12,
      name: 'Guantes de Trabajo Reforzados',
      price: 500,
      stock: 70,
      supplier: 'Seguridad Laboral',
      brand: 'SafeHand',
      category: 'Elementos de Seguridad',
      department: 'Indumentaria',
      costBase: 250,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 100,
      salePrice: 500,
      minStock: 20
    },
    {
      id: 13,
      name: 'Lentes de Seguridad Transparentes',
      price: 400,
      stock: 90,
      supplier: 'Seguridad Laboral',
      brand: 'ClearView',
      category: 'Elementos de Seguridad',
      department: 'Indumentaria',
      costBase: 180,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 122.22,
      salePrice: 400,
      minStock: 25
    },
    {
      id: 14,
      name: 'Silicona Neutra 300ml',
      price: 950,
      stock: 60,
      supplier: 'Adhesivos Químicos',
      brand: 'FixAll',
      category: 'Químicos y Adhesivos',
      department: 'Materiales',
      costBase: 450,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 111.11,
      salePrice: 950,
      minStock: 15
    },
    {
      id: 15,
      name: 'Pistola de Silicona Profesional',
      price: 1600,
      stock: 20,
      supplier: 'Adhesivos Químicos',
      brand: 'ProGun',
      category: 'Herramientas Manuales',
      department: 'Taller',
      costBase: 800,
      discounts: 0,
      includeIVA: true,
      utilityPercentage: 100,
      salePrice: 1600,
      minStock: 5
    }
  ];

  searchProducts(term: string): Observable<Product[]> {
    if (!term) {
      return of(this.products).pipe(delay(500));
    }
    const lowerCaseTerm = term.toLowerCase().trim();
    const results = this.products.filter(product =>
      product.name.toLowerCase().includes(lowerCaseTerm) );
    return of(results).pipe(delay(500));
  }

  getProducts(): Observable<Product[]> {
    return of(this.products).pipe(delay(800));
  }

  getProductCount() {
    return this.products.length;
  }

  getProductById(id: number): Observable<Product | undefined> {
    const product = this.products.find(p => p.id === id);
    return of(product).pipe(delay(500));
  }

  // Nuevo método para actualizar un producto
    updateProduct(updatedProduct: Product): Observable<Product> {
    const index = this.products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      // Actualiza el producto en el array
      this.products[index] = updatedProduct;
      // ¡Añade esta línea para actualizar el precio del producto!
      this.products[index].price = updatedProduct.salePrice; 
      console.log('Producto actualizado en el servicio:', updatedProduct);
    }
    // Simula una respuesta exitosa del servidor
    return of(updatedProduct).pipe(delay(300)); 
  }
deleteProduct(id: number): Observable<boolean> {
    const initialLength = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    const success = this.products.length < initialLength;
    console.log(`Producto con ID ${id} eliminado.`);
    return of(success).pipe(delay(300));
  }

addProduct(newProduct: Product): Observable<Product> {
    const newId = this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1;
    newProduct.id = newId;
    this.products.push(newProduct);
    console.log('Nuevo producto agregado:', newProduct);
    return of(newProduct).pipe(delay(300));
  }

}
