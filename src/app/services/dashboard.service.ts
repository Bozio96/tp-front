import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
providedIn: 'root',
})
export class DashboardService {
private apiUrl = `${API_BASE_URL}/dashboard`;

constructor(private http: HttpClient) {}

    getCards(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cards`);
    }

    getVentasMensuales(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ventas-mensuales`);
    }

    getDistribucion(): Observable<any> {
    return this.http.get(`${this.apiUrl}/distribucion`);
    }

    getProductosTop(): Observable<any> {
    return this.http.get(`${this.apiUrl}/productos-top`);
    }

    getVentasDiarias(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ventas-diarias`);
    }
}
