import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

const exampleData: any[] = [
  {firstName: "Rodrigo", lastName: "Bozio", dni: "12345678", tel: "12345678", email: "hola@hola.com"},
  {firstName: "Federico", lastName: "Banqueri", dni: "87654321", tel: "87654321", email: "chau@chau.com"},
]

@Component({
  selector: 'app-clients-list',
  standalone: true, //Esta propiedad permite que hagamos importaciones en este mismo archivo, sin esto deberiamos tener al mismo nivel un archivo clients-list.module.ts
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css'
})

export class ClientsListComponent {
  columns: string[] = ["firstName", "lastName", "dni", "tel", "email" ]
  data = exampleData
}
