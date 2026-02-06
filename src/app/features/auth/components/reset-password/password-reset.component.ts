import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionsService } from '@app/core/services/permissions.service';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';

@Component({
    selector: 'app-password-reset',
    templateUrl: './password-reset.component.html',
    styleUrls: ['./password-reset.component.scss', '../login-page/login-page.component.scss'],
})
export class PasswordResetComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    @Input() resetPasswordCode: string;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    stayLogged = true;
    loginError = '';
    model: FormModel = {
        name: null,
        email: null,
        password: null,
        confirmPassword: null,
    };
    validationMessages = {
        email: [
            { type: 'required', message: 'Email address is required' },
            { type: 'email', message: 'Email address is invalid' },
        ],
        password: [{ type: 'required', message: 'New password is required' }],
        confirmPassword: [
            { type: 'required', message: 'New password confirmation is required' },
            { type: 'mustMatch', message: 'Passwords are not the same' },
        ],
    };

    constructor(private auth: AuthenticationService, private route: ActivatedRoute, private router: Router, private permissionsService: PermissionsService) {}

    ngOnInit() {
        if (!this.resetPasswordCode) {
            this.router.navigate(['/login']).then();
        }
    }

    submit() {
        // Honeypot field must be empty
        if (this.model.name || !this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.auth.passwordReset(this.model.email, this.model.password, this.resetPasswordCode, this.stayLogged).subscribe({
            next: () => {
                this.permissionsService.refresh().then(() => {
                    this.router.navigate(['/home']).then();
                });
            },
            error: (error: any) => {
                this.pending = false;
                this.loginError = error?.message || 'Login failed';
            }
        });
    }
}

interface FormModel {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}
