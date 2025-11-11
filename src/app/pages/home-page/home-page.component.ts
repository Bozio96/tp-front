import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
})
export class HomePageComponent implements OnInit {
  cards: { totalVendido: number; clientes: number; productosVendidos: number } = {
    totalVendido: 0,
    clientes: 0,
    productosVendidos: 0,
  };
  productosTop: any[] = [];

  // === Datos para los gráficos ===
  ventasMensualesLabels: string[] = [];
  ventasMensualesData: number[] = [];

  distribucionLabels: string[] = [];
  distribucionData: number[] = [];

  ventasDiariasLabels: string[] = [];
  ventasDiariasData: number[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // 🔹 Cards
    this.dashboardService.getCards().subscribe((data) => {
      this.cards = {
        totalVendido: data?.totalVendido ?? 0,
        clientes: data?.clientes ?? data?.presupuestos ?? 0,
        productosVendidos: data?.productosVendidos ?? 0,
      };
    });

    // 🔹 Top 5 productos
    this.dashboardService.getProductosTop().subscribe((data) => {
      this.productosTop = data;
    });

    // 🔹 Ventas mensuales
    this.dashboardService.getVentasMensuales().subscribe((data) => {
      this.ventasMensualesLabels = data.map((d: any) => this.nombreMes(d.mes));
      this.ventasMensualesData = data.map((d: any) => d.total_ventas);
      this.updateBarChartData();
    });

    // 🔹 Distribución ventas vs presupuestos
    this.dashboardService.getDistribucion().subscribe((data) => {
      this.distribucionLabels = data.map((d: any) => d.type);
      this.distribucionData = data.map((d: any) => d.cantidad);
      this.updatePieChartData();
    });

    // 🔹 Ventas diarias (últimos 30 días)
    this.dashboardService.getVentasDiarias().subscribe((data) => {
      this.ventasDiariasLabels = data.map((d: any) => this.formatearFecha(d.fecha));
      this.ventasDiariasData = data.map((d: any) => d.total_dia);
      this.updateLineChartData();
    });
  }

  // Convierte número de mes a texto (ej: 1 → "Enero")
  nombreMes(num: number): string {
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return meses[num - 1];
  }

  private formatearFecha(fechaIso: string): string {
    if (typeof fechaIso !== 'string') {
      return fechaIso as unknown as string;
    }

    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) {
      return fechaIso;
    }

    return fecha.toISOString().split('T')[0];
  }

  // === Configuración de gráficos ===
  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.ventasMensualesLabels,
    datasets: [
      { data: this.ventasMensualesData, label: 'Ventas Mensuales', backgroundColor: '#2980b9' },
    ],
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: {
      y: { beginAtZero: true },
    },
  };

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: this.distribucionLabels,
    datasets: [
      {
        data: this.distribucionData,
        backgroundColor: ['#27ae60', '#f1c40f'],
      },
    ],
  };

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: false,
    maintainAspectRatio: false,
  };

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: this.ventasDiariasLabels,
    datasets: [
      {
        data: this.ventasDiariasData,
        label: 'Ventas Últimos 30 Días',
        fill: true,
        tension: 0.4,
        borderColor: '#e67e22',
        backgroundColor: 'rgba(230, 126, 34, 0.3)',
      },
    ],
  };

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      y: { beginAtZero: true },
    },
  };

  private updateBarChartData(): void {
    const [dataset] = this.barChartData.datasets;
    this.barChartData = {
      labels: [...this.ventasMensualesLabels],
      datasets: [
        {
          ...dataset,
          data: [...this.ventasMensualesData],
        },
      ],
    };
  }

  private updatePieChartData(): void {
    const [dataset] = this.pieChartData.datasets;
    this.pieChartData = {
      labels: [...this.distribucionLabels],
      datasets: [
        {
          ...dataset,
          data: [...this.distribucionData],
        },
      ],
    };
  }

  private updateLineChartData(): void {
    const [dataset] = this.lineChartData.datasets;
    this.lineChartData = {
      labels: [...this.ventasDiariasLabels],
      datasets: [
        {
          ...dataset,
          data: [...this.ventasDiariasData],
        },
      ],
    };
  }
}
