import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Importa el servicio Router
import { CommonModule } from '@angular/common'; // Asegúrate de que esto está importado

@Component({
  selector: 'app-navigation-bar',
  standalone: true,
  imports: [CommonModule, RouterModule], // Asegúrate de que los imports están correctos
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.css']
})
export class NavigationBarComponent {

}
