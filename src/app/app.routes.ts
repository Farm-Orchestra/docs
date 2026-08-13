import { Routes } from '@angular/router';

import { V42HomeLayoutComponent, V42TagLayoutComponent } from '@vault42/ui';

export const routes: Routes = [
  { path: '', component: V42HomeLayoutComponent },
  { path: 'tag/:tag', component: V42TagLayoutComponent },
  { path: '**', redirectTo: '' },
];
