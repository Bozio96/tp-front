import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ProductDataService} from '../../../services/product-data.service';
import { Router } from '@angular/router';
import { DataToolbarComponent } from '../../../components/data-toolbar/data-toolbar.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataItem } from '../../../services/product-types';

@Component({
  selector: 'app-departments-list',
  standalone: true,
  imports: [CommonModule, DataToolbarComponent,MatTooltipModule],
  templateUrl: './departments-list.component.html',
  styleUrls: ['./departments-list.component.css'],
})
export class DepartmentsListComponent implements OnInit, OnDestroy {
  allDepartments: DataItem[] = [];
  filteredDepartments: DataItem[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  menuItemId: number | null = null;

  constructor(
    private productDataService: ProductDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  loadDepartments(): void {
    this.loading = true;
    this.productDataService.getDepartments().subscribe(
      (data: DataItem[]) => {
        this.allDepartments = data;
        this.filterDepartments();
        this.loading = false;
      },
      (error) => {
        console.error('Error al obtener los departamentos:', error);
        this.loading = false;
      }
    );
  }

  onSearchTermChanged(term: string): void {
    this.searchTerm = term;
    this.filterDepartments();
  }

  filterDepartments(): void {
    if (!this.searchTerm) {
      this.filteredDepartments = [...this.allDepartments];
    } else {
      this.filteredDepartments = this.allDepartments.filter((department) =>
        department.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  onAddClick(): void {
    this.router.navigate(['/products/departments/add']);
  }

  onEditClick(id: number): void {
    this.router.navigate(['/products/departments/edit', id]);
    this.menuItemId = null;
  }

  onDeleteClick(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este departamento?')) {
      this.productDataService.deleteItem('departments', id).subscribe(
        (success) => {
          if (success) {
            console.log('Departamento eliminado con éxito.');
            this.loadDepartments();
          } else {
            console.warn('No se pudo eliminar el departamento.');
          }
          this.menuItemId = null;
        },
        (error) => {
          console.error('Error al eliminar el departamento:', error);
          this.menuItemId = null;
        }
      );
    }
  }

  toggleMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.menuItemId = this.menuItemId === id ? null : id;
  }

  onDocumentClick(): void {
    this.menuItemId = null;
  }
}
