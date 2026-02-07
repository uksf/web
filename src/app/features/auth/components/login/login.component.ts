import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionsService } from '@app/core/services/permissions.service';
import { LoginPageComponent } from '../login-page/login-page.component';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { UksfError } from '@app/shared/models/response';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss', '../login-page/login-page.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    @ViewChild(NgForm) form!: NgForm;
    @Output() onRequestPasswordReset = new EventEmitter();
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    private redirect = '/home';
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

    constructor(private auth: AuthenticationService, private route: ActivatedRoute, private router: Router, private permissionsService: PermissionsService) {}

    ngOnInit() {
        const params = this.route.snapshot.queryParams;

        if (params['redirect']) {
            this.redirect = '/' + params['redirect'];
        } else if (LoginPageComponent.staticRedirect) {
            this.redirect = '/' + LoginPageComponent.staticRedirect;
            LoginPageComponent.staticRedirect = null;
        }
    }

    submit() {
        // Honeypot field must be empty
        if (this.model.name || !this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.loginError = '';
        this.auth.login(this.model.email, this.model.password, this.stayLogged).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.permissionsService.refresh().then(() => {
                    this.router.navigate([this.redirect]).then();
                });
            },
            error: (error: UksfError) => {
                this.pending = false;
                this.loginError = error?.error || 'Login failed';
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
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
