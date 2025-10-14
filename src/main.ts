import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
}).catch(err => {
  const message = 'No se pudo iniciar la aplicación. Inténtalo nuevamente más tarde.';
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.right = '0';
  container.style.padding = '16px';
  container.style.backgroundColor = '#b00020';
  container.style.color = '#ffffff';
  container.style.fontFamily = 'Roboto, Arial, sans-serif';
  container.style.fontSize = '16px';
  container.style.textAlign = 'center';
  container.textContent = message;
  document.body.appendChild(container);
  throw err;
});
