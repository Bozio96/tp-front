import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { Client } from '../models/client.model';
import { API_URL } from '../config/api.config';

export interface SaleItemSummaryPayload {
  net: number;
  iva: number;
  discount: number;
  total: number;
}

export interface SaleItemPayload {
  line: number;
  productId: number;
  internalCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  ivaRate: number;
  summary: SaleItemSummaryPayload;
}

export interface SaleCustomerPayload {
  type: string;
  id?: string | null;
  name?: string | null;
  document?: string | null;
  cuit?: string | null;
  dni?: string | null;
  address?: string | null;
  phone?: string | null;
  withoutClient?: boolean;
}

export interface SaleTotalsPayload {
  net: number;
  iva: number;
  discounts: number;
  final: number;
}

export interface SalePayload {
  type: 'sale' | 'quote';
  invoiceDate: string;
  invoiceNumber?: string;
  invoiceType: string;
  paymentMethod: string;
  clientId?: number | null;
  customer: SaleCustomerPayload;
  totals: SaleTotalsPayload;
  items: SaleItemPayload[];
  createdAt: string;
  pointOfSale?: string;
}

type SaleCreateRequest = Omit<SalePayload, 'createdAt' | 'pointOfSale'>;

export interface SaleDetailResponse {
  id: number;
  lineNumber: number;
  internalCode: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discountRate: number | string;
  ivaRate: number | string;
  netAmount: number | string;
  ivaAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  productId: number;
  product?: Product;
}

export interface SaleResponse {
  id: number;
  pointOfSale: string;
  invoiceNumber: string | null;
  invoiceType: string;
  paymentMethod: string | null;
  customerType: string;
  clientId?: number | null;
  client?: Partial<Client> | null;
  invoiceDate: string;
  totalNet: number | string;
  totalIva: number | string;
  totalDiscount: number | string;
  totalFinal: number | string;
  type: 'venta' | 'presupuesto';
  createdAt: string;
  updatedAt: string;
  details: SaleDetailResponse[];
}

export interface NextInvoiceIdentifiersResponse {
  pointOfSale: string;
  invoiceNumber: string;
  invoiceType: string;
}

@Injectable({ providedIn: 'root' })
export class SalesApiService {
  private readonly baseUrl = `${API_URL}/sales`;

  constructor(private readonly http: HttpClient) {}

  createSale(payload: SalePayload): Observable<SaleResponse> {
    const { createdAt, pointOfSale, ...body } = payload;
    return this.http.post<SaleResponse>(this.baseUrl, body as SaleCreateRequest);
  }

  getSales(): Observable<SaleResponse[]> {
    return this.http.get<SaleResponse[]>(this.baseUrl);
  }

  getSaleById(id: number): Observable<SaleResponse> {
    return this.http.get<SaleResponse>(`${this.baseUrl}/${id}`);
  }

  getNextInvoiceIdentifiers(
    type: 'sale' | 'quote',
    invoiceType: string,
  ): Observable<NextInvoiceIdentifiersResponse> {
    let params = new HttpParams().set('type', type);
    if (invoiceType) {
      params = params.set('invoiceType', invoiceType);
    }

    return this.http
      .get<NextInvoiceIdentifiersResponse>(`${this.baseUrl}/next-number`, {
        params,
      });
  }
}
