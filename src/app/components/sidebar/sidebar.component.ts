import { Component,Output,EventEmitter } from '@angular/core';
import {CommonModule} from '@angular/common'
import {MatTooltipModule} from '@angular/material/tooltip'
import {RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatTooltipModule,RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isCollapsed = false;

  @Output()// <-- Declara un Output para emitir eventos
  collapsedStateChange = new EventEmitter<boolean>();// <-- El evento emitirá un booleano
  
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedStateChange.emit(this.isCollapsed); // <-- Emite el nuevo estado
  }

}