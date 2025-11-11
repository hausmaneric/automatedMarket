import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import 'zone.js';

bootstrapApplication(App, {
  providers: [
    importProvidersFrom(BrowserAnimationsModule, HttpClientModule),
    provideRouter(routes),
    provideHttpClient(withFetch()),
  ]
});
