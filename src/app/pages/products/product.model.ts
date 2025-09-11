// product.model.ts

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  supplier?: string;
  brand?: string;
  category?: string;
  department?: string;
  costBase: number;
  discounts: number;
  includeIVA: boolean;
  utilityPercentage: number;
  salePrice: number;
  minStock: number;
  sku: string;

  // Propiedades opcionales para el cambio de precios
  costoNuevo?: number | null;
  salePriceNuevo?: number | null;
  utilityNuevo?: number | null;
}