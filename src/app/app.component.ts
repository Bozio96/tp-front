import { Component } from '@angular/core';
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

export class AppComponent {
  isSidebarCollapsed: boolean = false; 

  constructor(public router: Router) {
    this.router.events.subscribe(event => {
  
    });
  }

  
  onSidebarCollapsedChange(isCollapsed: boolean) {
    this.isSidebarCollapsed = isCollapsed;
  }
}
