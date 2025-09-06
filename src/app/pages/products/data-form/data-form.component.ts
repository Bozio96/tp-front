import { HostListener, OnDestroy } from '@angular/core';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms'; // Importaciones para formularios reactivos
import { ActivatedRoute, Router } from '@angular/router'; // Para obtener parámetros de ruta y navegar
import {
  ProductDataService} from '../../../services/product-data.service'; // Nuestro servicio de datos
import { DataItem, EntityType } from '../../../services/product-types';

@Component({
  selector: 'app-data-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Importa ReactiveFormsModule para usar FormGroup
  templateUrl: './data-form.component.html',
  styleUrls: ['./data-form.component.css'],
})
export class DataFormComponent implements OnInit, OnDestroy {
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.dataForm && this.dataForm.dirty) {
      $event.returnValue = true;
    }
  }

  ngOnDestroy(): void {
    // Limpieza si es necesario en el futuro
  }
  dataForm!: FormGroup; // El grupo de controles de nuestro formulario
  entityType!: EntityType; // Para almacenar el tipo de entidad (brands, departments, etc.)
  isEditMode: boolean = false; // Bandera para saber si estamos editando o creando
  itemId: number | null = null; // ID del elemento si estamos editando
  formTitle: string = ''; // Título dinámico del formulario
  isLoading: boolean = true; // Para mostrar un spinner mientras se cargan los datos

  constructor(
    private fb: FormBuilder, // Inyectamos FormBuilder para construir el formulario
    private route: ActivatedRoute, // Inyectamos ActivatedRoute para acceder a los parámetros de la URL
    private router: Router, // Inyectamos Router para la navegación programática
    private productDataService: ProductDataService // Inyectamos nuestro servicio de datos
  ) {}

  ngOnInit(): void {
    // Inicializamos el formulario con los controles 'id' y 'name'
    // 'id' es solo lectura en el formulario (o puede ser oculto)
    this.dataForm = this.fb.group({
      id: [{ value: '', disabled: true }], // El ID será deshabilitado para que el usuario no lo edite
  name: ['', [Validators.required, Validators.minLength(1)]], // El nombre es requerido y mínimo 1 carácter
    });

    // Suscribirse a los parámetros de la URL para determinar el tipo de entidad y el modo
    this.route.paramMap.subscribe((params) => {
      // El primer segmento de la URL después de 'products/' es el tipo de entidad (e.g., 'brands')
      // Los parámetros de la ruta padre son accesibles a través de 'parent'
      const typeParam = this.route.snapshot.parent?.url[0].path;

      if (
        typeParam &&
        ['brands', 'departments', 'categories', 'suppliers'].includes(typeParam)
      ) {
        this.entityType = typeParam as EntityType;
        this.setFormTitle(); // Establece el título basado en el tipo de entidad

        const idParam = params.get('id'); // Intenta obtener el parámetro 'id'
        if (idParam) {
          this.itemId = +idParam; // Convierte el string a número
          this.isEditMode = true;
          this.loadItemData(this.itemId); // Carga los datos del ítem para editar
        } else {
          this.isEditMode = false;
          this.dataForm.reset(); // Asegura que el formulario esté limpio para crear
          this.isLoading = false; // No hay carga si estamos creando
        }
      } else {
        // Redirige o maneja el error si el tipo de entidad no es válido
        console.error('Tipo de entidad no válido en la URL:', typeParam);
        this.router.navigate(['/not-found']);
      }
    });
  }

  // Método requerido por el guard para evitar salir con cambios no guardados
  canDeactivate(): boolean {
    if (this.dataForm && this.dataForm.dirty) {
      return confirm('Hay cambios sin guardar. ¿Seguro que quieres salir?');
    }
    return true;
  }

  // Método para cargar los datos del ítem a editar
  loadItemData(id: number): void {
    this.isLoading = true;
    this.productDataService.getItemById(this.entityType, id).subscribe(
      (item: DataItem | null) => {
        if (item) {
          this.dataForm.patchValue(item); // Rellena el formulario con los datos del ítem
        } else {
          console.error(
            'Ítem no encontrado:',
            id,
            'para tipo:',
            this.entityType
          );
          this.router.navigate(['/products', this.entityType]); // Redirige a la lista si no se encuentra
        }
        this.isLoading = false;
      },
      (error) => {
        console.error('Error al cargar ítem:', error);
        this.isLoading = false;
        this.router.navigate(['/products', this.entityType]); // Redirige en caso de error
      }
    );
  }

  // Establece el título del formulario dinámicamente
  setFormTitle(): void {
    const entityNameMap: { [key in EntityType]: string } = {
      brands: 'Marca',
      departments: 'Departamento',
      categories: 'Categoría',
      suppliers: 'Proveedor',
    };
    const entityDisplayName = entityNameMap[this.entityType] || 'Elemento';
    this.formTitle = this.isEditMode
      ? `Editar ${entityDisplayName}`
      : `Crear ${entityDisplayName}`;
  }

  // Getter para un acceso fácil a los controles del formulario en el HTML
  get f() {
    return this.dataForm.controls;
  }

  // Método que se ejecuta al enviar el formulario
  onSubmit(): void {
    if (this.dataForm.invalid) {
      this.dataForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar validaciones
      return;
    }

    this.isLoading = true; // Inicia carga para la operación de guardado

    // Crea el objeto DataItem con los valores del formulario
    const itemToSave: DataItem = {
      id: this.isEditMode && this.itemId ? this.itemId : 0, // Si es edición, usa el ID actual; si no, 0 o undefined
      name: this.dataForm.value.name,
    };

    // Llama al servicio para guardar el ítem
    this.productDataService.saveItem(this.entityType, itemToSave).subscribe(
      (savedItem: DataItem) => {
        console.log('Ítem guardado con éxito:', savedItem);
        this.isLoading = false;
        // Navega de vuelta a la lista correspondiente después de guardar
        this.router.navigate(['/products', this.entityType]);
      },
      (error) => {
        console.error('Error al guardar el ítem:', error);
        this.isLoading = false;
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    );
  }

  // Método para cancelar y volver a la lista
  onCancel(): void {
    this.router.navigate(['/products', this.entityType]);
  }
}
