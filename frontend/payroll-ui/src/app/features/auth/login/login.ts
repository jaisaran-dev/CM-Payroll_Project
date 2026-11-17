import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
})
export class Login {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = signal(false); // signal so the button updates after the API call finishes

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /** True when the field is invalid and the user has touched it or tried to submit. */
  showError(field: 'email' | 'password'): boolean {
    const control = this.loginForm.get(field);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  getError(field: 'email' | 'password'): string {
    const errors = this.loginForm.get(field)?.errors;
    if (!errors) return '';

    if (field === 'email') {
      if (errors['required']) return 'Email is required';
      if (errors['email']) return 'Enter a valid email address';
    }
    if (field === 'password') {
      if (errors['required']) return 'Password is required';
      if (errors['minlength']) return 'Password must be at least 6 characters';
    }
    return 'Invalid value';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Field errors show under the inputs
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.authService
      .login(this.loginForm.value)
      // finalize runs on success AND on error, so the button always returns to normal
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        // The success and error toasts (API message) come from errorInterceptor
        next: (res) => {
          // Admin lands on employees, employee lands on attendance
          this.router.navigate([res.role === 'ADMIN' ? '/employees' : '/attendance']);
        },
        error: () => {},
      });
  }
}
