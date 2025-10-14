import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {
  userForm: FormGroup;
  roles: string[] = [];
  isEditMode = false;
  userId: number | null = null;

  constructor(
    private fb: FormBuilder, //Inyecciones de dependencias
    private userService: UserService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.roles = this.authService.getRoles();
    this.route.params.subscribe(params => {
      if (params['id']) { //Solo si detecta modo edición
        this.isEditMode = true;
        this.userId = +params['id'];

        // En modo edición, la contraseña no es requerida, pero si está presente, debe tener una longitud mínima.
        const passwordControl = this.userForm.get('password');
        passwordControl?.setValidators([Validators.minLength(8)]);
        passwordControl?.updateValueAndValidity();

        this.userService.getUser(this.userId).subscribe(user => {
          // No poblamos el campo de la contraseña para no mostrar el hash
          const { password, ...userData } = user as any;
          this.userForm.patchValue(userData);
        });
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      if (this.isEditMode && this.userId) {
        const formValue = this.userForm.value;
        
        // Si la contraseña está vacía, la eliminamos del objeto para no enviarla
        if (!formValue.password) {
          delete formValue.password;
        }

        this.userService.updateUser(this.userId, formValue).subscribe(user => {
          console.log('El usuario ha sido actualizado con éxito', user);
          this.router.navigate(['/users']);
        });
      } else {
        this.userService.addUser(this.userForm.value).subscribe(user => {
          console.log('El usuario ha sido añadido con éxito', user);
          this.router.navigate(['/users']);
        });
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}