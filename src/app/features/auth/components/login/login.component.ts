import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { Router } from '@angular/router';
import { PermissionsService } from '@app/core/services/permissions.service';
import { RedirectService } from '@app/core/services/authentication/redirect.service';
import { UksfError } from '@app/shared/models/response';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss', '../login-page/login-page.component.scss'],
})
export class LoginComponent {
    @ViewChild(NgForm) form!: NgForm;
    @Output() onRequestPasswordReset = new EventEmitter();
    pending = false;
    stayLogged = true;
    loginError = '';
    model: FormModel = {
        name: null,
        email: null,
        password: null,
    };
    validationMessages = {
        email: [
            { type: 'required', message: 'Email address is required' },
            { type: 'email', message: 'Email address is invalid' },
        ],
        password: [{ type: 'required', message: 'Password is required' }],
    };

    constructor(
        private auth: AuthenticationService,
        private router: Router,
        private permissionsService: PermissionsService,
        private redirectService: RedirectService
    ) {}

    submit() {
        // Honeypot field must be empty
        if (this.model.name || !this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.loginError = '';
        this.auth.login(this.model.email, this.model.password, this.stayLogged).pipe(first()).subscribe({
            next: () => {
                this.permissionsService.refresh().then(() => {
                    const redirect = this.redirectService.getAndClearRedirectUrl() ?? '/home';
                    this.router.navigateByUrl(redirect);
                }).catch(() => {
                    this.pending = false;
                    this.loginError = 'Login failed';
                });
            },
            error: (error: UksfError) => {
                this.pending = false;
                this.loginError = error?.error || 'Login failed';
            }
        });
    }

    requestPasswordReset() {
        this.onRequestPasswordReset.emit();
    }
}

interface FormModel {
    name: string;
    email: string;
    password: string;
}
