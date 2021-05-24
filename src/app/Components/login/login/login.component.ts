import { Component, Output, ViewChild, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';
import { AuthenticationService } from '../../../Services/Authentication/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionsService } from '../../../Services/permissions.service';
import { LoginPageComponent } from '../../../Pages/login-page/login-page.component';
import { InstantErrorStateMatcher } from '../../../Services/formhelper.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss', '../../../Pages/login-page/login-page.component.scss'],
})
export class LoginComponent implements OnInit {
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

    constructor(public formbuilder: FormBuilder, private auth: AuthenticationService, private route: ActivatedRoute, private router: Router, private permissionsService: PermissionsService) {}

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
        this.auth.login(this.model.email, this.model.password, this.stayLogged, (error?: any) => {
            if (!error) {
                this.permissionsService.refresh().then(() => {
                    this.router.navigate([this.redirect]).then();
                });
            } else if (error.message) {
                this.pending = false;
                this.loginError = error.message;
            } else {
                this.pending = false;
                this.loginError = 'Login failed';
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
