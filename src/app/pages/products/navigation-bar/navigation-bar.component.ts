import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Importa el servicio Router
import { CommonModule } from '@angular/common'; // Asegúrate de que esto está importado

@Component({
  selector: 'app-navigation-bar',
  standalone: true,
  imports: [CommonModule], // Asegúrate de que los imports están correctos
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.css']
})
export class NavigationBarComponent {

  // Inyecta el servicio Router en el constructor
  constructor(private router: Router) { }

  // Crea un método genérico para manejar la navegación
  onNavigate(path: string): void {
    this.router.navigate([path]);
  }
}