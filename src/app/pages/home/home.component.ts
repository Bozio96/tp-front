import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- ¡Añade esta importación!


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule], // <-- ¡Añade CommonModule aquí!
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'] // Debería ser styleUrls si es un array, o styleUrl si es uno solo.
})
export class HomeComponent {

}