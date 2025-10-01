import { Component, Input, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ClientService } from '../../../services/client.service';
import { Client } from '../client.model';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { DataToolbarComponent } from '../../../components/data-toolbar/data-toolbar.component';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    RouterModule,
    CommonModule,
    DataToolbarComponent
  ],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css'
})
export class ClientsListComponent implements OnInit {
  @Input() searchTerm: string = '';

  filteredClients: Client[] = []; 
  allClients: Client[] = [];
  loading: boolean = true;
  menuClientId: number | null = null;

  private searchTerms = new Subject<string>();

  
  /* Código mio debajo */
  columns: string[] = ["nombre", "apellido", "cuit", "dni", "telefono", "domicilio", "actions"];
  data: Client[] = [];
  //BORRAR ESTO
  
  constructor(
    private clientService: ClientService,
    private router: Router,
    private fb: FormBuilder,
    //private clientDataService: Falta el "ClientDataService"
    public authService: AuthService 
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  

  loadClients(): void {
    this.clientService.getAllClients().subscribe(clients => {
      this.data = clients;
    });
  }

  deleteClient(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
      this.clientService.deleteClient(id).subscribe(() => {
        this.loadClients();
      });
    }
  }

  search(value: string): void {
    this.clientService.searchClients(value).subscribe(clients => {
      this.data = clients;
    });
  }
}
