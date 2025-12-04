# TP Front - Panel de Gestion Comercial

Aplicacion Angular 19 que centraliza la operacion diaria de ventas, inventario y clientes. Ofrece un tablero con metricas en tiempo real, formularios inteligentes para altas/ediciones y herramientas administrativas para usuarios y precios, todo integrado con el backend NestJS del directorio `tp-back`.

## Tabla de contenido
- [Descripcion general](#descripcion-general)
- [Caracteristicas principales](#caracteristicas-principales)
- [Tecnologias](#tecnologias-y-dependencias-destacadas)
- [Prerrequisitos](#prerrequisitos)
- [Instalacion rapida](#instalacion-rapida)
- [Configuracion del entorno](#configuracion-del-entorno)
- [Uso de la aplicacion](#uso-de-la-aplicacion)
- [Tests y calidad](#tests-y-calidad)
- [Problemas frecuentes](#problemas-frecuentes)
- [Video demostrativo](#video-demostrativo-proximamente)
- [Recursos utiles](#recursos-utiles)

## Descripcion general
Esta aplicacion es un panel interno pensado para equipos comerciales que necesitan visibilidad inmediata de ventas y control sobre sus catalogos. La app consume los endpoints expuestos por `tp-back` (NestJS + TypeORM + JWT) y aplica guards (`authGuard`, `roleGuard`, `PendingChangesGuard`) para proteger cada ruta segun el rol del usuario y el estado de los formularios.

## Caracteristicas principales
- Dashboard ejecutivo con tarjetas de KPIs (ventas totales, clientes, unidades) y graficos de Chart.js sobre ventas mensuales, diarias y comparativas.
- Gestion integral de productos: listado, altas/ediciones, actualizacion masiva de precios y mantenimiento de catalogos auxiliares (marcas, categorias, proveedores, departamentos) mediante formularios standalone.
- Modulo de clientes con busquedas reactivas, acciones en linea y flujo CRUD con validaciones.
- Ventas y presupuestos: armado de comprobantes con calculo automatico de IVA, descuentos, numeracion correlativa, selector de clientes/productos y generacion de PDFs via `PdfService`.
- Administracion de usuarios con roles `admin`/`user`, proteccion de rutas y JWT almacenado en `localStorage`.
- Notificaciones y manejo de errores centralizados mediante `NotificationService` y los interceptores HTTP (`auth-token.interceptor`, `http-error.interceptor`).

## Tecnologias y dependencias destacadas
- Framework: Angular 19 (standalone components, Router).
- UI: Angular Material, CSS modular y componentes reutilizables (`DataToolbarComponent`, etc.).
- Charts: Chart.js 4 + ng2-charts 8.
- Autenticacion: JWT con `AuthService` + interceptores para adjuntar token.
- Generacion de documentos: `jspdf` + `jspdf-autotable` para comprobantes.
- Estado y reactividad: RxJS (`Subject`, `BehaviorSubject`, `switchMap`, `debounceTime`).
- Backend esperado: API REST en `http://localhost:3000` (NestJS 11, ver carpeta `tp-back`).

## Prerrequisitos
- [Node.js 20.11 LTS](https://nodejs.org/) o superior (Angular 19 lo exige). Verifica con `node -v`.
- npm 10+ (incluido con Node). Si usas `nvm`, selecciona la version antes de instalar.
- [Angular CLI 19](https://angular.dev/tools/cli) instalado globalmente: `npm install -g @angular/cli`.
- Backend `tp-back` configurado y corriendo en `http://localhost:3000` (por defecto `npm run start:dev`). Revisa `tp-back/.env.example` para las credenciales de base de datos.

## Instalacion rapida
1. Clona el repositorio (o sincroniza tu fork) y entra al proyecto del front:
   ```bash
   git clone <tu-repo>.git
   cd Tp_DSW/tp-front
   ```
2. Instala las dependencias:
   ```bash
   npm i
   ```
3. Levanta el backend desde `tp-back` (en otra terminal) para contar con los endpoints reales.
4. Arranca el front en modo desarrollo:
   ```bash
   npm start
   # Abre http://localhost:4200/ (el flag --open del script ya lo abre automaticamente)
   ```

## Configuracion del entorno
Actualmente los servicios apuntan al backend mediante URLs directas (`http://localhost:3000`). Hasta migrar a archivos de entorno, puedes centralizar la configuracion siguiendo alguno de estos enfoques:

1. Archivo de constantes (recomendado a corto plazo): crea `src/app/config/api.config.ts` exportando `API_BASE_URL` y `AUTH_BASE_URL`. Importa la constante en `auth.service.ts`, `client-api.service.ts`, `product-api.service.ts`, `sales-api.service.ts`, `dashboard.service.ts` y `user.service.ts`.
2. Variables de entorno Angular: si prefieres el enfoque tradicional, crea `src/environments/environment.ts` / `environment.development.ts` y reemplaza las cadenas fijas por `environment.apiBaseUrl`.
3. CORS: el backend Nest expone `http://localhost:3000`. Asegurate de permitir `http://localhost:4200` (o el puerto que uses) en la configuracion de CORS de `tp-back` (`main.ts`).

Siempre que cambies la URL base recuerda reiniciar `ng serve` para que Angular recomponga los servicios.

## Uso de la aplicacion
1. Autenticacion
   - Ingresa a `http://localhost:4200/login` y utiliza un usuario existente del backend (`tp-back` expone `/auth/login`). El token queda guardado en `localStorage` y se adjunta automaticamente via `AuthTokenInterceptor`.
2. Dashboard (Home)
   - Revisa los totales (ventas, clientes, unidades), el top 5 de productos y tres visualizaciones: ventas mensuales (barras), distribucion ventas vs presupuestos (torta) y ventas diarias (linea). Los datos provienen de `/dashboard/*`.
3. Productos
   - Ruta: `/products`. Lista paginada con buscador y acciones contextuales. Los formularios (`/products/add`, `/products/edit/:id`) estan protegidos por `roleGuard` (solo admin) y `PendingChangesGuard` para evitar perder datos.
   - La seccion `/products/price-change` permite ajustar porcentajes en lote.
   - El submodulo `/products/:entityType` reutiliza `DataFormComponent` para catalogos auxiliares.
4. Clientes
   - Ruta: `/clients`. Busqueda con consultas debounced (`ClientService.searchClients`). Cada fila habilita editar o eliminar con confirmacion y mensajes del `NotificationService`.
5. Ventas
   - Ruta: `/sales`. Construye comprobantes detallados: selecciona cliente, agrega items, define metodos de pago, controla foliado (`0003-XXXXXXXX`) y genera PDFs al confirmar (`PdfService`). El servicio `SalesApiService` envia el payload a `/api/sales`.
6. Usuarios y roles
   - Ruta: `/users`. Solo administradores pueden listar, crear o editar. Las rutas anidadas cargan componentes standalone usando `loadComponent`.
7. Manejo de errores
   - `http-error.interceptor.ts` centraliza respuestas 401/403/500, muestra toasts y redirige a login o not-found segun corresponda.

## Tests y calidad
- Unit tests: `npm test`. Abre el runner de Karma con Chrome Headless y recarga al guardar.
- Cobertura: `ng test --code-coverage` genera `/coverage` con el reporte HTML.

## Problemas frecuentes
- Angular CLI version mismatch: si ves `This version of CLI is only compatible...`, ejecuta `npm install` nuevamente o instala la version sugerida con `npm install -g @angular/cli@19.2.11`.
- CORS o 401 en llamadas HTTP: confirma que `tp-back` exponga `http://localhost:3000`, que tu usuario exista y que el token no haya expirado (borra `localStorage` y vuelve a iniciar sesion).
- Errores de TypeScript al compilar: revisa que estes usando Node 20+ y que no haya quedado un `npm install` a medias. Borra `node_modules` y repite la instalacion si es necesario.
- Fallo al generar PDFs: asegurate de que el navegador permita ventanas emergentes/descargas automaticas y que los datos obligatorios del formulario de venta esten completos (se valida antes de llamar a `PdfService`).

## Video demostrativo
[![Ver demo](https://res.cloudinary.com/die3c5c18/image/upload/v1764876084/miniatura_owg6ep.png)](https://drive.google.com/file/d/140KoxT6BpSDJWF9XEPUWy1dd2ZCyS7On/view?usp=sharing)



## Recursos utiles
- [Documentacion Angular](https://angular.dev/)
- [Angular Material](https://material.angular.io/)
- [Chart.js](https://www.chartjs.org/docs/latest/)
- [NestJS (backend complementario)](https://docs.nestjs.com/)
- [Guia oficial ng2-charts](https://valor-software.com/ng2-charts/)


