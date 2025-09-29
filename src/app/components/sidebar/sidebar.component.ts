// src/app/components/sidebar/sidebar.component.ts
import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common'; // Importa AsyncPipe

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, RouterModule, AsyncPipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  isCollapsed: boolean = false;
  
  // Observables para el estado del usuario
  isLoggedIn$: Observable<boolean>;
  currentUser$: Observable<User | null>;
  
  showProfileMenu: boolean = false;

  @Output()
  collapsedStateChange = new EventEmitter<boolean>();

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.currentUser$ = this.authService.currentUser$;
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedStateChange.emit(this.isCollapsed);
  }
  
  toggleProfileMenu(): void {
    if (this.authService.isLoggedIn()) {
      this.showProfileMenu = !this.showProfileMenu;
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.showProfileMenu = false;
  }
}
