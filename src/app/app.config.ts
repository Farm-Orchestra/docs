import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { GardenContentSource, V42_GARDEN_CONFIG } from '@vault42/core';
import { JulzLabContentSource } from './services/content.service';
import { VAULT_CONFIG } from './vault-config';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: GardenContentSource, useClass: JulzLabContentSource },
    { provide: V42_GARDEN_CONFIG, useFactory: () => ({
        brandName: VAULT_CONFIG.brandName, 
        featuredNotesMax: VAULT_CONFIG.featuredNotesMax,
      }),
    },
    provideBrowserGlobalErrorListeners(), 
    provideRouter(routes), 
    provideHttpClient()],
};
