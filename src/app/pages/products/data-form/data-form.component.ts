import { HostListener, OnDestroy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductDataService } from '../../../services/product-data.service';
import { NotificationService } from '../../../services/notification.service';
import { DataItem, EntityType } from '../../../services/product-types';

@Component({
  selector: 'app-data-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './data-form.component.html',
  styleUrls: ['./data-form.component.css'],
})
export class DataFormComponent implements OnInit, OnDestroy {
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.dataForm && this.dataForm.dirty) {
      $event.returnValue = true;
    }
  }

  ngOnDestroy(): void {
    // Limpieza si es necesario en el futuro
  }

  dataForm!: FormGroup;
  entityType!: EntityType;
  isEditMode = false;
  itemId: number | null = null;
  formTitle = '';
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productDataService: ProductDataService,
    private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.dataForm = this.fb.group({
      id: [{ value: '', disabled: true }],
      name: ['', [Validators.required, Validators.minLength(1)]],
    });

    this.route.paramMap.subscribe((params) => {
      const typeParam = this.route.parent?.snapshot.paramMap.get('entityType');

      if (
        typeParam &&
        ['brands', 'departments', 'categories', 'suppliers'].includes(typeParam)
      ) {
        this.entityType = typeParam as EntityType;
        this.setFormTitle();

        const idParam = params.get('id');
        if (idParam) {
          this.itemId = +idParam;
          this.isEditMode = true;
          this.loadItemData(this.itemId);
        } else {
          this.isEditMode = false;
          this.dataForm.reset();
          this.isLoading = false;
        }
      } else {
        this.notifications.showError('Tipo de entidad no válido en la URL.');
        this.router.navigate(['/not-found']);
      }
    });
  }

  canDeactivate(): boolean {
    if (this.dataForm && this.dataForm.dirty) {
      return confirm('Hay cambios sin guardar. ¿Seguro que quieres salir?');
    }
    return true;
  }

  loadItemData(id: number): void {
    this.isLoading = true;
    this.productDataService.getItemById(this.entityType, id).subscribe(
      (item: DataItem | null) => {
        if (item) {
          this.dataForm.patchValue(item);
          this.dataForm.markAsPristine();
          this.dataForm.markAsUntouched();
        } else {this.notifications.showError('No se encontró el registro solicitado.');
          this.router.navigate(['/products', this.entityType]);
        }
        this.isLoading = false;
      },
      (error) => {this.notifications.showError(this.getErrorMessage(error, 'No se pudo cargar el registro.'));
        this.isLoading = false;
        this.router.navigate(['/products', this.entityType]);
      },
    );
  }

  setFormTitle(): void {
    const entityNameMap: { [key in EntityType]: string } = {
      brands: 'Marca',
      departments: 'Departamento',
      categories: 'Categoría',
      suppliers: 'Proveedor',
    };
    const entityDisplayName = entityNameMap[this.entityType] || 'Elemento';
    this.formTitle = this.isEditMode
      ? `Editar ${entityDisplayName}`
      : `Crear ${entityDisplayName}`;
  }

  get f() {
    return this.dataForm.controls;
  }

  onSubmit(): void {
    if (this.dataForm.invalid) {
      this.dataForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const itemToSave: DataItem = {
      id: this.isEditMode && this.itemId ? this.itemId : 0,
      name: this.dataForm.value.name,
    };

    this.productDataService.saveItem(this.entityType, itemToSave).subscribe({
      next: (savedItem: DataItem) => {
        console.log('Ítem guardado con éxito:', savedItem);
        this.notifications.showSuccess(`${this.getEntityDisplayName()} guardado correctamente.`);
        this.dataForm.markAsPristine();
        this.dataForm.markAsUntouched();
        this.isLoading = false;
        this.router.navigate(['/products', this.entityType]);
      },
      error: (error) => {        this.notifications.showError(this.getErrorMessage(error, 'No se pudo guardar el registro.'));
        this.isLoading = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/products', this.entityType]);
  }

  private getEntityDisplayName(): string {
    const entityNameMap: { [key in EntityType]: string } = {
      brands: 'Marca',
      departments: 'Departamento',
      categories: 'Categoría',
      suppliers: 'Proveedor',
    };
    return entityNameMap[this.entityType] || 'Elemento';
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    const backendMessage = (error as any)?.error?.message;
    if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
      return backendMessage;
    }

    const genericMessage = (error as any)?.message;
    if (typeof genericMessage === 'string' && genericMessage.trim().length > 0) {
      return genericMessage;
    }

    return fallback;
  }
}



