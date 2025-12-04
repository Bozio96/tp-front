import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { EMPTY } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { ClientService } from '../../../services/client.service';
import { NotificationService } from '../../../services/notification.service';
import { Client } from '../../../models/client.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css'],
})
export class ClientFormComponent implements OnInit {
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.clientForm && this.clientForm.dirty) {
      $event.returnValue = true;
    }
  }

  clientForm!: FormGroup;
  isEditing = false;
  private clientId: number | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private fb: FormBuilder,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.createForm();
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditing = true;
      this.clientId = +id;
      this.clientService.getClientById(this.clientId).subscribe({
        next: (client: Client) => {
          if (client) {
            this.clientForm.patchValue({
              ...client,
              dni: client.dni ?? '',
              cuil: client.cuil ?? '',
            });
            this.clientForm.markAsPristine();
            this.clientForm.updateValueAndValidity();
          }
        },
        error: () => {
          this.notifications.showError('No se pudo cargar el cliente.');
          this.router.navigate(['/not-found']);
        },
      });
    }
  }

  createForm(): void {
    this.clientForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.pattern('^[0-9]{8}$'), Validators.maxLength(8)]],
      cuil: ['', [Validators.pattern('^[0-9]{11}$'), Validators.maxLength(11)]],
      phone: ['', Validators.required],
      domicilio: ['', Validators.required]
    });

    this.clientForm.setValidators(this.requireDniOrCuil());
    this.clientForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });
  }

  canDeactivate(): boolean {
    if (this.clientForm && this.clientForm.dirty) {
      return confirm('Hay cambios sin guardar. ¿Seguro que quieres salir?');
    }
    return true;
  }

  onSave(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      const missingFields = this.getMissingFields();
      if (missingFields.length) {
        this.notifications.showError(
          `Completa los siguientes campos: ${missingFields.join(', ')}.`
        );
      }
      return;
    }

    const formValue = this.clientForm.getRawValue() as Record<string, unknown>;
    const normalizedDni = this.normalizeIdentification(formValue['dni']);
    const normalizedCuil = this.normalizeIdentification(formValue['cuil']);

    const clientPayload: Omit<Client, 'id'> = {
      nombre: this.normalizeText(formValue['nombre']),
      apellido: this.normalizeText(formValue['apellido']),
      phone: this.normalizeText(formValue['phone']),
      domicilio: this.normalizeText(formValue['domicilio']),
      dni: normalizedDni,
      cuil: normalizedCuil,
    };

    const clientId = this.clientId;
    const isUpdate = this.isEditing && clientId !== null;
    const successMessage = isUpdate
      ? 'Cliente actualizado con exito.'
      : 'Cliente creado con exito.';
    const errorMessage = isUpdate
      ? 'No se pudo actualizar el cliente.'
      : 'No se pudo agregar el cliente.';

    this.clientService
      .getAllClients()
      .pipe(
        take(1),
        switchMap((clients) => {
          const duplicateMessage = this.getDuplicateIdentifierMessage(
            clients,
            normalizedDni,
            normalizedCuil
          );

          if (duplicateMessage) {
            this.notifications.showError(duplicateMessage);
            return EMPTY;
          }

          if (isUpdate && clientId !== null) {
            return this.clientService.updateClient(clientId, clientPayload);
          }

          return this.clientService.addClient(clientPayload);
        })
      )
      .subscribe({
        next: () => this.handleSaveSuccess(successMessage),
        error: () => {
          this.notifications.showError(errorMessage);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/clients']);
  }

  private getMissingFields(): string[] {
    const missing: string[] = [];
    const controls = this.clientForm.controls;

    if (!this.hasContent(controls['nombre']?.value)) {
      missing.push('Nombre');
    }
    if (!this.hasContent(controls['apellido']?.value)) {
      missing.push('Apellido');
    }
    if (!this.hasContent(controls['phone']?.value)) {
      missing.push('Telefono');
    }
    if (!this.hasContent(controls['domicilio']?.value)) {
      missing.push('Domicilio');
    }

    const dni = this.normalizeText(controls['dni']?.value);
    const cuil = this.normalizeText(controls['cuil']?.value);
    if (!dni && !cuil) {
      missing.push('DNI o CUIL');
    }

    return missing;
  }

  private hasContent(value: unknown): boolean {
    return this.normalizeText(value).length > 0;
  }

  private requireDniOrCuil(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const dniControl = group.get('dni');
      const cuilControl = group.get('cuil');

      if (!dniControl || !cuilControl) {
        return null;
      }

      const dniValue = this.normalizeText(dniControl.value);
      const cuilValue = this.normalizeText(cuilControl.value);

      const hasDni = dniValue.length > 0;
      const hasCuil = cuilValue.length > 0;

      return hasDni || hasCuil ? null : { dniOrCuil: true };
    };
  }

  private normalizeIdentification(value: unknown): string | null {
    const normalized = this.normalizeText(value);
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeText(value: unknown): string {
    return (value ?? '').toString().trim();
  }

  private getDuplicateIdentifierMessage(
    clients: Client[],
    dni: string | null,
    cuil: string | null
  ): string | null {
    const comparableClients =
      this.isEditing && this.clientId !== null
        ? clients.filter((client) => client.id !== this.clientId)
        : clients;

    const dniConflict =
      !!dni &&
      comparableClients.some(
        (client) => this.normalizeIdentification(client.dni) === dni
      );
    const cuilConflict =
      !!cuil &&
      comparableClients.some(
        (client) => this.normalizeIdentification(client.cuil) === cuil
      );

    if (dniConflict && cuilConflict) {
      return 'Ya existe un cliente con ese DNI y CUIL.';
    }

    if (dniConflict) {
      return 'Ya existe un cliente con ese DNI.';
    }

    if (cuilConflict) {
      return 'Ya existe un cliente con ese CUIL.';
    }

    return null;
  }

  private handleSaveSuccess(message: string): void {
    this.clientForm.markAsPristine();
    this.clientForm.markAsUntouched();
    this.clientForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    this.notifications.showSuccess(message);
    this.router.navigate(['/clients']);
  }
}
