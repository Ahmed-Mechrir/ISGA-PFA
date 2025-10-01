import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from './auth';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  protected activeTab = signal<'signin' | 'signup'>('signin');
  protected errorMessage = signal<string>('');
  protected successMessage = signal<string>('');

  protected signInForm: FormGroup;
  protected signUpForm: FormGroup;

  protected readonly isLoading$ = this.authService.isLoading$;

  constructor() {
    this.signInForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.signUpForm = this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('mot_de_passe');
    const confirmPassword = control.get('password_confirmation');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  protected switchTab(tab: 'signin' | 'signup'): void {
    this.activeTab.set(tab);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  protected submitSignIn(): void {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    const credentials = this.signInForm.value;
    this.authService.login(credentials).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set('Login successful! Redirecting...');
          this.errorMessage.set('');
        } else {
          this.errorMessage.set(response.message || 'Login failed');
          this.successMessage.set('');
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else if (error.error?.errors) {
          const firstError = Object.values(error.error.errors)[0] as string[];
          this.errorMessage.set(firstError[0] || 'Login failed');
        } else {
          this.errorMessage.set('Login failed. Please try again.');
        }
        this.successMessage.set('');
      }
    });
  }

  protected submitSignUp(): void {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    const userData = this.signUpForm.value;
    this.authService.register(userData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set('Registration successful! Redirecting...');
          this.errorMessage.set('');
        } else {
          this.errorMessage.set(response.message || 'Registration failed');
          this.successMessage.set('');
        }
      },
      error: (error) => {
        console.error('Registration error:', error);
        if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else if (error.error?.errors) {
          const errors = Object.entries(error.error.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${messages[0]}`)
            .join(', ');
          this.errorMessage.set(errors);
        } else {
          this.errorMessage.set('Registration failed. Please try again.');
        }
        this.successMessage.set('');
      }
    });
  }
}

