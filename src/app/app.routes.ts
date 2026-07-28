import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page.component';
import { TagPageComponent } from './pages/tag-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'tag/:tag', component: TagPageComponent },
  { path: '**', redirectTo: '' },
];
