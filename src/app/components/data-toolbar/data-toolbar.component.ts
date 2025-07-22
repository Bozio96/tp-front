import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-data-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-toolbar.component.html',
  styleUrls: ['./data-toolbar.component.css']
})
export class DataToolbarComponent {
  @Input() searchTerm: string = '';
  @Input() showSearch: boolean = true;
  @Input() showAddButton: boolean = true;
  @Input() addLabel: string = 'Agregar';

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() addClicked = new EventEmitter<void>();

  onSearchChange(term: string) {
    this.searchTerm = term;
    this.searchTermChange.emit(term);
  }


  onAdd(): void {
    this.addClicked.emit();
  }
}
