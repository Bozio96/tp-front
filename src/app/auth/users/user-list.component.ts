import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { DataToolbarComponent } from '../../components/data-toolbar/data-toolbar.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, DataToolbarComponent, MatTooltipModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  pageTitle: string = 'Usuarios';
  addLabel: string = 'Agregar Usuario';

  allItems: User[] = [];
  filteredItems: User[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  menuItemId: number | null = null;

  constructor(
    private userService: UserService,
    private router: Router,
    public authService: AuthService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadItems();
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  loadItems(): void {
    this.loading = true;
    this.userService.getUsers().subscribe(
      (data: User[]) => {
        this.allItems = data;
        this.filterItems();
        this.loading = false;
      },
      (error: any) => {
        this.notifications.showError('Ocurrió un error al cargar los usuarios.');
        this.loading = false;
      }
    );
  }

  onSearchTermChanged(term: string): void {
    this.searchTerm = term;
    this.filterItems();
  }

  filterItems(): void {
    if (!this.searchTerm) {
      this.filteredItems = [...this.allItems];
    } else {
      this.filteredItems = this.allItems.filter((item) =>
        item.username.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  onAddClick(): void {
    this.router.navigate(['/users/add']);
  }

  onEditClick(id: number): void {
    this.router.navigate(['/users/edit', id]);
    this.menuItemId = null;
  }

  onDeleteClick(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          console.log('Usuario eliminado con éxito.');
          this.loadItems();
          this.menuItemId = null;
        },
        error: (error: any) => {
          this.notifications.showError('No se pudo eliminar el usuario.');
          this.menuItemId = null;
        },
      });
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
