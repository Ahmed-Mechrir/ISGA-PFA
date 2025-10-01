import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthComponent } from './auth/auth.component';
import { HomeComponent } from './home/home';
import { ReservationsComponent } from './reservations/reservations.component';
import { AuthService } from './auth/auth';
import { map } from 'rxjs/operators';

// Simple auth guard function
const authGuard = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated$.pipe(
    map(isAuthenticated => {
      if (!isAuthenticated) {
        // Redirect to auth if not authenticated
        window.location.href = '/auth';
        return false;
      }
      return true;
    })
  );
};

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'reservations', component: ReservationsComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'auth' },
  { path: '**', redirectTo: 'auth' }
];
