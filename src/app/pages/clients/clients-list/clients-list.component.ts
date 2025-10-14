import { Component, Input, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, HostListener } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClientService } from '../../../services/client.service';
import { Client } from '../../../models/client.model';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { DataToolbarComponent } from '../../../components/data-toolbar/data-toolbar.component';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    RouterModule,
    CommonModule,
    DataToolbarComponent,
    MatTooltipModule
  ],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css'
})
export class ClientsListComponent implements OnInit, OnDestroy {
  @Input() searchTerm: string = '';

  filteredClients: Client[] = [];
  allClients: Client[] = [];
  loading: boolean = true;
  menuClientId: number | null = null;

  @ViewChildren('actionContainer') actionContainers!: QueryList<ElementRef>;

  private searchTerms = new Subject<string>();
  private clientsSubscription: Subscription | undefined;

  constructor(
    private clientService: ClientService,
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.clientsSubscription = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.loading = true;
        return this.clientService.searchClients(term);
      })
    ).subscribe({
      next: clients => {
        this.allClients = clients;
        this.filteredClients = clients; // En clientes, la búsqueda ya viene filtrada por el servicio
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar clientes:', err);
        this.loading = false;
        this.allClients = [];
        this.filteredClients = [];
      }
    });

    // Carga inicial de todos los clientes
    this.searchTerms.next('');
  }

  ngOnDestroy(): void {
    if (this.clientsSubscription) {
      this.clientsSubscription.unsubscribe();
    }
    this.searchTerms.complete();
  }

  onSearchTermChanged(term: string): void {
    this.searchTerm = term;
    this.searchTerms.next(term);
  }

  toggleMenu(clientId: number): void {
    this.menuClientId = this.menuClientId === clientId ? null : clientId;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuClientId !== null && this.actionContainers) {
      const clickedInside = this.actionContainers.some(container =>
        container.nativeElement.contains(event.target)
      );
      if (!clickedInside) {
        this.menuClientId = null;
      }
    }
  }

  onAddClick(): void {
    this.router.navigate(['/clients/add']);
  }

  onEditClick(clientId: number): void {
    this.menuClientId = null;
    this.router.navigate(['/clients/edit', clientId]);
  }

  onDeleteClick(clientId: number): void {
    this.menuClientId = null;
    const confirmation = window.confirm(
      '¿Estás seguro de que quieres eliminar este cliente?'
    );
    if (confirmation) {
      this.clientService.deleteClient(clientId).subscribe({
        next: () => {
          console.log('Cliente eliminado con éxito.');
          // Volver a buscar para refrescar la lista
          this.searchTerms.next(this.searchTerm);
        },
        error: (error) => {
          // El interceptor de errores ya debería mostrar una notificación
          console.error('Error al eliminar cliente:', error);
        }
      });
    }
  }
}
