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
}