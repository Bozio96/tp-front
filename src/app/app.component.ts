
import { Component, HostListener, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common'
import { Router, RouterOutlet } from '@angular/router';
import {SidebarComponent} from './components/sidebar/sidebar.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,RouterOutlet, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  title(title: any) {
    throw new Error('Method not implemented.');
  }

  // Inicializamos el estado del sidebar
  isSidebarCollapsed: boolean = false; 

  constructor(public router: Router) {
    this.router.events.subscribe(event => {
 
    });
  }

  ngOnInit() {
    // Configura el estado inicial al cargar la página
    this.checkScreenSize();
  }

  // Escucha los cambios de tamaño de la ventana
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  // Lógica para determinar si el sidebar debe estar colapsado
  private checkScreenSize() {
    this.isSidebarCollapsed = window.innerWidth <= 768;
  }

  // Este método actualiza el estado, pero solo si no estamos en móvil
  onSidebarCollapsedChange(isCollapsed: boolean) {
    if (window.innerWidth > 768) {
      this.isSidebarCollapsed = isCollapsed;
    }
  }
}