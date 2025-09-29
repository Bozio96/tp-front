import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService } from '../../../services/client.service';
import { Client } from '../client.model';

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
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.createForm();
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditing = true;
      this.clientService.getClientById(+id).subscribe({
        next: (client) => {
          if (client) {
            this.clientForm.patchValue(client);
          }
        },
        error: (err) => {
          console.error('Error al obtener el cliente:', err);
          this.router.navigate(['/not-found']);
        },
      });
    }
  }

  createForm(): void {
    this.clientForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      telefono: ['', Validators.required],
      domicilio: ['', Validators.required],
      foto: [''],
    });
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
      return;
    }

    const clientData: Client = this.clientForm.getRawValue();
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      clientData.id = +id;
      this.clientService.updateClient(clientData).subscribe({
        next: () => this.router.navigate(['/clients']),
        error: (err) => console.error('Error al actualizar el cliente:', err),
      });
    } else {
      this.clientService.addClient(clientData).subscribe({
        next: () => this.router.navigate(['/clients']),
        error: (err) => console.error('Error al agregar el cliente:', err),
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/clients']);
  }
}
