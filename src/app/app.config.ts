import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { GardenContentSource, V42_GARDEN_CONFIG } from '@vault42/core';
import { FarmOrchestraContentSource } from './services/content.service';
import { BRAND_NAME, FEATURED_NOTES_MAX } from './utils/branding.constants';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: GardenContentSource, useClass: FarmOrchestraContentSource },
    { provide: V42_GARDEN_CONFIG, useFactory: () => ({
        brandName: BRAND_NAME, // TODO: improve config file
        featuredNotesMax: FEATURED_NOTES_MAX,
      }),
    },
    provideBrowserGlobalErrorListeners(), 
    provideRouter(routes), 
    provideHttpClient()],
};
