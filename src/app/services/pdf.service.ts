import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NotificationService } from './notification.service';

interface PdfSummary {
  net: number;
  iva: number;
  discount: number;
  total: number;
}

interface PdfConfig {
  titulo: string;
  mensajePie: string;
  prefijoArchivo: string;
}

@Injectable({ providedIn: 'root' })
export class PdfService {
  private readonly marginX = 12;
  private readonly marginY = 12;
  private lastTableEndY = 120;

  constructor(private readonly notifications: NotificationService) {}

  async generarFactura(payload: unknown): Promise<void> {
    await this.generarDocumento(payload, {
      titulo: 'FACTURA',
      mensajePie: '¡Gracias por su compra!',
      prefijoArchivo: 'factura',
    });
  }

  async generarPresupuesto(payload: unknown): Promise<void> {
    await this.generarDocumento(payload, {
      titulo: 'PRESUPUESTO',
      mensajePie: 'Este presupuesto tiene validez de 7 dias.',
      prefijoArchivo: 'presupuesto',
    });
  }

  private async generarDocumento(payload: any, config: PdfConfig): Promise<void> {
    try {
      const doc = new jsPDF();
      const layout = this.computeLayout(doc);

      const headerBottom = await this.renderHeader(doc, config, payload, layout);
      const clientBottom = this.renderClientSection(doc, payload, layout, headerBottom);

      this.lastTableEndY = clientBottom;
      this.agregarTablaProductos(doc, payload, layout);
      this.agregarTotales(doc, payload, layout);
      this.agregarPie(doc, config.mensajePie, layout);

      const timestamp = this.formatFileTimestamp(payload?.createdAt);
      doc.save(`${config.prefijoArchivo}_${timestamp}.pdf`);
    } catch (error) {
      const docName = config?.prefijoArchivo ?? 'pdf';
      this.notifications.showError(`No se pudo generar el documento ${docName}.`);
      throw error;
    }
  }

  private computeLayout(doc: jsPDF) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - this.marginX * 2;
    return { pageWidth, pageHeight, contentWidth };
  }

  private async renderHeader(
    doc: jsPDF,
    config: PdfConfig,
    payload: any,
    layout: { pageWidth: number; pageHeight: number; contentWidth: number }
  ): Promise<number> {
    const top = this.marginY;
    const headerHeight = 38;

    // Recuadro principal del header
    doc.rect(this.marginX, top, layout.contentWidth, headerHeight);

    try {
      const logo = await this.getBase64Image('assets/logo.png');
      doc.addImage(logo, 'PNG', this.marginX + 4, top + 6, 20, 20);

      doc.setFontSize(9);
      const issuerLines = [
        'FERRETERIA ROSARIO',
        'CUIT: 30-12345678-9',
        'Calle Falsa 123 - Rosario, Santa Fe',
        'Tel: +54 341 555-1234',
      ];
      let y = top + 10;
      const issuerX = this.marginX + 28;
      issuerLines.forEach(line => {
        doc.text(line, issuerX, y);
        y += 5;
      });
    } catch {}

    // FACTURA + nro + fecha 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(config.titulo, layout.pageWidth - this.marginX - 4, top + 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Comprobante: ${this.formatPointOfSale(payload)}-${this.formatInvoiceNumber(payload)}`,
      layout.pageWidth - this.marginX - 4,
      top + 20,
      { align: 'right' }
    );
    doc.text(
      `Fecha: ${this.formatDisplayDate(payload?.invoiceDate ?? payload?.createdAt)}`,
      layout.pageWidth - this.marginX - 4,
      top + 26,
      { align: 'right' }
    );

   
doc.rect(layout.pageWidth / 2 - 6, top + 8, 12, 12); 


doc.setFont('helvetica', 'bold');
doc.setFontSize(16); 
doc.text(this.resolveVoucherLetter(payload), layout.pageWidth / 2, top + 16, { align: 'center' });

    return top + headerHeight;
  }

  private renderClientSection(
    doc: jsPDF,
    payload: any,
    layout: { contentWidth: number },
    previousBottom: number
  ): number {
    const top = previousBottom + 6;
    const height = 26;
    const midX = this.marginX + layout.contentWidth / 2;
    const customer = payload?.customer ?? {};
    const payloadType = typeof payload?.type === 'string' ? payload.type.trim().toLowerCase() : '';
    const isQuote = payloadType === 'quote';
    const customerType = typeof customer.type === 'string' ? customer.type.trim().toLowerCase() : '';
    const ivaDisplay = isQuote ? '-' : 'Consumidor final';
    const nameFromPayload = customer?.name;
    const customerNameDisplay =
      customerType === 'ocasional'
        ? this.asText(nameFromPayload, '-')
        : this.asText(nameFromPayload, 'Cliente ocasional');

    doc.rect(this.marginX, top, layout.contentWidth, height);
    doc.line(midX, top, midX, top + height);

    doc.setFontSize(9);

    const paymentDisplay = isQuote ? '-' : this.mapPaymentMethod(payload?.paymentMethod);
    const leftLines: Array<[string, unknown]> = [
      ['Doc.:', customer.document],
      ['IVA:', ivaDisplay],
      ['Cond. Venta:', paymentDisplay],
    ];
    const rightLines: Array<[string, unknown]> = [
      ['Cliente:', customerNameDisplay],
      ['Domicilio:', customer.address],
      ['Telefono:', customer.phone],
    ];

    let yLeft = top + 8;
    leftLines.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, this.marginX + 4, yLeft);
      doc.setFont('helvetica', 'normal');
      doc.text(this.asText(value), this.marginX + 45, yLeft);
      yLeft += 8;
    });

    let yRight = top + 8;
    rightLines.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, midX + 4, yRight);
      doc.setFont('helvetica', 'normal');
      doc.text(this.asText(value), midX + 50, yRight);
      yRight += 8;
    });

    return top + height;
  }

  private agregarTablaProductos(doc: jsPDF, payload: any, layout: { contentWidth: number }): void {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const tableTop = this.lastTableEndY + 6; // mÃ¡s cerca del cliente

    if (!items.length) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.text('Sin productos cargados.', this.marginX, tableTop);
      this.lastTableEndY = tableTop;
      return;
    }

    const rows = items.map((item: any) => {
      const summary = this.ensureSummary(item);
      const subtotalSinIVA = summary.net;
      return [
        item?.internalCode ?? '-',
        item?.description ?? '-',
        this.formatNumber(item?.quantity),
        this.formatCurrency(item?.unitPrice),
        `${this.formatNumber(item?.discountRate)}%`,
        this.formatCurrency(subtotalSinIVA),
      ];
    });

    autoTable(doc, {
      startY: tableTop,
      margin: { left: this.marginX, right: this.marginX },
      tableWidth: layout.contentWidth,
      head: [['Codigo', 'Producto', 'Cant.', 'P.Unit.', '% Desc.', 'Subtotal']],
      body: rows,
      theme: 'grid',
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: 20, 
        fontSize: 9, 
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        fontSize: 9,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        valign: 'middle'
      },
      styles: {
        lineColor: [180, 180, 180],
        lineWidth: 0.1,
        overflow: 'linebreak'
      }
    });

    const table = (doc as any).lastAutoTable;
    this.lastTableEndY = table?.finalY ?? tableTop;
  }

  private agregarTotales(doc: jsPDF, payload: any, layout: { pageHeight: number; contentWidth: number }): void {
    const totals = payload?.totals ?? {};
    let top = this.lastTableEndY + 12;

    if (top > layout.pageHeight - 60) {
      doc.addPage();
      top = this.marginY + 10;
    }

    const boxWidth = 90;
    const boxX = this.marginX + layout.contentWidth - boxWidth;

    const lines: Array<[string, string, boolean?]> = [
      ['Subtotal:', this.formatCurrency(totals.net)],
      ['IVA:', this.formatCurrency(totals.iva)],
      ['Otros Tributos:', this.formatCurrency(payload?.totals?.otherTaxes ?? 0)],
      ['TOTAL:', this.formatCurrency(totals.final), true],
    ];

    lines.forEach(([label, value, highlight]) => {
      if (highlight) {
        doc.setFillColor(50, 50, 50);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.rect(boxX, top - 5, boxWidth, 8, 'F');
      } else {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(label, boxX + 4, top);
      doc.text(value, boxX + boxWidth - 4, top, { align: 'right' });
      top += 8;
    });

    this.lastTableEndY = top;
  }

  private agregarPie(doc: jsPDF, mensaje: string, layout: { pageHeight: number; contentWidth: number }): void {
    const footerY = layout.pageHeight - this.marginY - 20;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(mensaje, this.marginX + layout.contentWidth / 2, footerY, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  // ---------- Helpers ----------
  private asText(value: unknown, fallback = '-'): string {
    if (value === null || value === undefined) {
      return fallback;
    }
    if (typeof value === 'string') {
      const text = value.trim();
      return text.length ? text : fallback;
    }
    if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        return fallback;
      }
      return value.toString();
    }
    const text = String(value).trim();
    return text.length ? text : fallback;
  }

  private ensureSummary(item: any): PdfSummary {
    const quantity = this.safeNumber(item?.quantity);
    const unitPrice = this.safeNumber(item?.unitPrice);
    const discountRate = this.safeNumber(item?.discountRate);
    const ivaRate = this.safeNumber(item?.ivaRate);

    const gross = quantity * unitPrice;
    const discountAmount = gross * (discountRate / 100);
    const discountedGross = Math.max(gross - discountAmount, 0);
    const iva = discountedGross * (ivaRate / 100);
    const net = discountedGross - iva;

    return {
      net: this.round(net),
      iva: this.round(iva),
      discount: this.round(discountAmount),
      total: this.round(discountedGross),
    };
  }

  private formatNumber(value: unknown): string {
    return this.round(this.safeNumber(value)).toFixed(2);
  }

  private formatCurrency(value: unknown): string {
    return `$${this.formatNumber(value)}`;
  }

  private safeNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private formatDisplayDate(value: unknown): string {
    if (!value) return '-';

    if (value instanceof Date) {
      if (!Number.isNaN(value.getTime())) {
        return `${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}/${value.getFullYear()}`;
      }
      return '-';
    }

    if (typeof value === 'string' || typeof value === 'number') {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
          return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
      }

      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      }
      return String(value);
    }

    return '-';
  }

  private capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;
  }

  private formatFileTimestamp(value: unknown): string {
    const source = typeof value === 'string' && value ? value : new Date().toISOString();
    return source.replace(/[:.]/g, '-');
  }

  private async getBase64Image(imgUrl: string): Promise<string> {
    const resolvedUrl = this.resolveAssetUrl(imgUrl);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => reject(err);
      img.src = resolvedUrl;
    });
  }

  private resolveAssetUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/^\/+/, '');
    const baseHref = document.querySelector('base')?.href ?? `${window.location.origin}/`;
    return new URL(normalized, baseHref).toString();
  }

  private resolveVoucherLetter(payloadOrType: unknown): string {
    if (typeof payloadOrType === 'object' && payloadOrType !== null) {
      const payload = payloadOrType as { type?: string; invoiceType?: string };
      if ((payload.type ?? '').toLowerCase() === 'quote') {
        return 'X';
      }
      return this.resolveVoucherLetter(payload.invoiceType);
    }

    const normalized = String(payloadOrType ?? '').trim().toUpperCase();
    return ['A', 'B', 'C', 'X'].includes(normalized) ? normalized : 'C';
  }

private mapPaymentMethod(method: string): string {
  switch ((method || '').toLowerCase()) {
    case 'contado':
      return 'Contado';
    case 'debito':
      return 'Tarjeta de Debito';
    case 'credito':
      return 'Tarjeta de Credito';
    case 'transferencia':
      return 'Transferencia Bancaria';
    default:
      return 'Contado';
  }
}

  private formatPointOfSale(payload: any): string {
    const point = payload?.pointOfSale ?? 1;
    const numeric = Number(point);
    if (Number.isFinite(numeric)) {
      return numeric.toString().padStart(4, '0');
    }
    return String(point).padStart(4, '0');
  }

  private formatInvoiceNumber(payload: any): string {
    const raw = payload?.invoiceNumber ?? payload?.number ?? 0;
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
      return numeric.toString().padStart(8, '0');
    }
    return String(raw);
  }

}














