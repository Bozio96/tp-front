import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { HomePageComponent } from './home-page.component';
import { DashboardService } from '../../services/dashboard.service';

Chart.register(...registerables);

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;
  let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;

  const mockCards = {
    totalVendido: 12345,
    clientes: 40,
    productosVendidos: 270,
  };
  const mockProductosTop = [
    { nombre: 'Producto 1', ventas: 120 },
    { nombre: 'Producto 2', ventas: 90 },
  ];
  const mockVentasMensuales = [
    { mes: 1, total_ventas: 4500 },
    { mes: 2, total_ventas: 3200 },
  ];
  const mockDistribucion = [
    { type: 'Ventas', cantidad: 70 },
    { type: 'Presupuestos', cantidad: 30 },
  ];
  const mockVentasDiarias = [
    { fecha: '2025-05-01', total_dia: 500 },
    { fecha: '2025-05-02', total_dia: 650 },
  ];

  beforeEach(async () => {
    dashboardServiceSpy = jasmine.createSpyObj<DashboardService>('DashboardService', [
      'getCards',
      'getProductosTop',
      'getVentasMensuales',
      'getDistribucion',
      'getVentasDiarias',
    ]);

    dashboardServiceSpy.getCards.and.returnValue(of(mockCards));
    dashboardServiceSpy.getProductosTop.and.returnValue(of(mockProductosTop));
    dashboardServiceSpy.getVentasMensuales.and.returnValue(of(mockVentasMensuales));
    dashboardServiceSpy.getDistribucion.and.returnValue(of(mockDistribucion));
    dashboardServiceSpy.getVentasDiarias.and.returnValue(of(mockVentasDiarias));

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [{ provide: DashboardService, useValue: dashboardServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
  });

  it('deberá cargar los datos del dashboard al inicializarse', fakeAsync(() => {
    component.ngOnInit();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(dashboardServiceSpy.getCards).toHaveBeenCalled();
    expect(dashboardServiceSpy.getProductosTop).toHaveBeenCalled();
    expect(dashboardServiceSpy.getVentasMensuales).toHaveBeenCalled();
    expect(dashboardServiceSpy.getDistribucion).toHaveBeenCalled();
    expect(dashboardServiceSpy.getVentasDiarias).toHaveBeenCalled();

    expect(component.cards).toEqual(mockCards);
    expect(component.productosTop).toEqual(mockProductosTop);
    expect(component.ventasMensualesLabels).toEqual(['Ene', 'Feb']);
    expect(component.ventasMensualesData).toEqual([4500, 3200]);
    expect(component.distribucionLabels).toEqual(['Ventas', 'Presupuestos']);
    expect(component.distribucionData).toEqual([70, 30]);
    expect(component.ventasDiariasLabels).toEqual(['2025-05-01', '2025-05-02']);
    expect(component.ventasDiariasData).toEqual([500, 650]);

    expect(component.barChartData.datasets[0].data).toEqual([4500, 3200]);
    expect(component.pieChartData.labels).toEqual(['Ventas', 'Presupuestos']);
    expect(component.lineChartData.labels).toEqual(['2025-05-01', '2025-05-02']);
  }));

  it('deberá convertir un número de mes en texto legible', () => {
    expect(component.nombreMes(1)).toBe('Ene');
    expect(component.nombreMes(12)).toBe('Dic');
  });

  it('deberá formatear una fecha ISO en formato argentino', () => {
    expect((component as any).formatearFecha('2025-10-05')).toBe('2025-10-05');
  });

  it('deberá retornar la cadena original si la fecha no es válida', () => {
    expect((component as any).formatearFecha('fecha inválida')).toBe('fecha inválida');
  });
});

