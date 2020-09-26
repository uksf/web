import { Component, OnInit, HostListener } from '@angular/core';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ForgotPasswordModalComponent } from '../../Modals/forgot-password-modal/forgot-password-modal.component';
import { StatesService } from 'app/Services/states.service';
import { PermissionsService } from '../../Services/permissions.service';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent implements OnInit {
    public static staticRedirect;
    public form: FormGroup;
    private validationURI: string;
    private validateCode: string;
    private redirect = '/home';
    private params;
    validationTarget: string;
    loginError = '';
    stayLogged = true;
    submitted;
    reset = false;

    constructor(
        public dialog: MatDialog,
        private auth: AuthenticationService,
        private route: ActivatedRoute,
        private router: Router,
        public formbuilder: FormBuilder,
        private permissionsService: PermissionsService
    ) {
        this.form = formbuilder.group(
            {
                name: ['', Validators.maxLength(0)],
                userid: [undefined, Validators.required],
                password: [undefined, Validators.required],
                confirmPass: [undefined, [Validators.required, this.matchValues('password')]],
            },
            {}
        );
    }

    ngOnInit() {
        this.params = this.route.snapshot.queryParams;
        try {
            this.validationTarget = this.params['validatetype'].replace(new RegExp('\\+', 'g'), ' ');
            this.validationURI = this.params['validateurl'];
            this.validateCode = this.params['validatecode'];
        } catch (err) {
            // ignored
        }

        if (this.params['redirect']) {
            this.redirect = '/' + this.params['redirect'];
        } else if (LoginPageComponent.staticRedirect) {
            this.redirect = '/' + LoginPageComponent.staticRedirect;
            LoginPageComponent.staticRedirect = null;
        }

        if (this.params['validatetype']) {
            this.reset = this.params['validatetype'].indexOf('reset') !== -1;
        }
    }

    isValidatingCode(): boolean {
        return this.params.hasOwnProperty('validatecode');
    }

    formValid() {
        return (
            this.form.value.name === '' &&
            this.form.value.userid != null &&
            this.form.value.userid !== '' &&
            this.form.value.password != null &&
            this.form.value.password !== '' &&
            (this.reset ? this.form.value.confirmPass != null && this.form.value.confirmPass !== '' && this.form.value.password === this.form.value.confirmPass : true)
        );
    }

    submit() {
        if (!this.formValid()) {
            return;
        }
        this.loginError = '';
        this.submitted = true;
        StatesService.stayLogged = this.stayLogged;
        this.auth.tryAuth(this.form.value.userid, this.form.value.password, this.validateCode, this.validationURI, (error?: any) => {
            this.submitted = false;

            if (!error) {
                this.permissionsService.refresh().then(() => {
                    this.router.navigate([this.redirect]).then();
                });
            } else if (error.message) {
                this.loginError = error.message;
            } else {
                this.loginError = 'Login failed';
            }
        });
    }

    forgotPassword() {
        this.dialog.open(ForgotPasswordModalComponent, {});
    }

    matchValues(matchTo: string): (AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            return !!control.parent && !!control.parent.value && control.value === control.parent.controls[matchTo].value ? null : { isMatching: false };
        };
    }
}
