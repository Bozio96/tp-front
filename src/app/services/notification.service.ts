import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  constructor(private snackBar: MatSnackBar) {}

  showError(message: string): void {
    this.open(message, ['snackbar-error']);
  }

  showSuccess(message: string): void {
    this.open(message, ['snackbar-success']);
  }

  showInfo(message: string): void {
    this.open(message, ['snackbar-info']);
  }

  private open(message: string, panelClass: string[]): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      panelClass,
    });
  }
}
