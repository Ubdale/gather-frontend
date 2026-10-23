import { Routes } from '@angular/router';
import { LandingComponent, AuthComponent } from './product/public';
import { RecoveryComponent } from './product/recovery';
import { WorkspaceComponent } from './product/workspace';
export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'recover', component: RecoveryComponent },
  { path: 'login', component: AuthComponent },
  { path: 'register', component: AuthComponent },
  { path: 'join', component: AuthComponent },
  ...['feed', 'messages', 'saved', 'profile', 'admin'].map((section) => ({
    path: 'gather/' + section,
    component: WorkspaceComponent,
    data: { section },
  })),
  { path: 'gather', redirectTo: 'gather/feed', pathMatch: 'full' },
  { path: 'admin-hub', redirectTo: 'gather/admin', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
