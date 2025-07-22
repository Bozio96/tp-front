import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngIf, etc.
import { RouterModule } from '@angular/router'; // Para <router-outlet>
import { NavigationBarComponent } from '../navigation-bar/navigation-bar.component';

@Component({
  selector: 'app-product-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavigationBarComponent
  ],
  templateUrl: './product-container.component.html',
  styleUrls: ['./product-container.component.css']
})
export class ProductContainerComponent {}