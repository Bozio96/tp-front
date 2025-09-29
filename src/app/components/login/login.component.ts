// src/app/components/login/login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service'; // La ruta cambió
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  hidePassword = true;
  loading = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage = null;
      this.loading = true;
      // Pasamos el objeto de credenciales como espera el nuevo servicio
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Login exitoso, redirigiendo...', response);
          // Si el login es exitoso (recibimos token), redirigimos a la página principal
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = 'Usuario o contraseña incorrectos.';
          console.error('Login fallido:', err);
        }
      });
    }
  }
}