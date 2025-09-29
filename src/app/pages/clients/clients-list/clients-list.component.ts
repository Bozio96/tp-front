import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ClientService } from '../../../services/client.service';
import { Client } from '../client.model';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

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
    CommonModule
  ],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css'
})
export class ClientsListComponent implements OnInit {
  columns: string[] = ["nombre", "apellido", "dni", "telefono", "domicilio", "actions"];
  data: Client[] = [];
  
  constructor(private clientService: ClientService) {}

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
