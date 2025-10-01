import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../auth/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);

  protected currentUser$ = this.authService.currentUser$;
  protected showDropdown = false;

  protected toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  protected closeDropdown(): void {
    this.showDropdown = false;
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Logout successful:', response);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Force logout even if API call fails
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        window.location.href = '/auth';
      }
    });
    this.closeDropdown();
  }

  protected getInitials(user: User): string {
    return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
  }

  protected getRoleDisplayName(role: string): string {
    switch (role) {
      case 'client':
        return 'Client';
      case 'agence':
        return 'Travel Agency';
      default:
        return role;
    }
  }
}
