import { Component, OnInit, HostListener } from '@angular/core';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ForgotPasswordModalComponent } from '../../Modals/forgot-password-modal/forgot-password-modal.component';
import { StatesService } from 'app/Services/states.service';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {
    public static staticRedirect;
    public form: FormGroup;
    validationTarget: string;
    private validationURI: string;
    private validateCode: string;
    private redirect = '/home';
    private params;
    loginError = '';
    stayLogged = true;
    submitted;

    constructor(
        public dialog: MatDialog,
        private auth: AuthenticationService,
        private route: ActivatedRoute,
        public formbuilder: FormBuilder
    ) {
        this.form = formbuilder.group({
            name: ['', Validators.maxLength(0)],
            userid: ['', Validators.required],
            password: ['', Validators.required],
            confirmPass: ['', Validators.required]
        }, {})
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
    }

    isValidatingCode(): boolean {
        return this.params.hasOwnProperty('validatecode');
    }

    isPasswordReset(): boolean {
        if (this.params['validatetype']) {
            return this.params['validatetype'].indexOf('reset') !== -1;
        }
        return false;
    }

    submit() {
        // Honeypot field must be empty
        if (this.form.value.name !== '') { return; }
        this.loginError = '';
        this.submitted = true;
        StatesService.stayLogged = this.stayLogged;
        this.auth.tryAuth(
            this.form.value.userid, this.form.value.password,
            this.redirect, this.validateCode, this.validationURI,
            response => {
                this.submitted = false;
                if (response === undefined) { return; }
                if (response.message) {
                    this.loginError = response.message;
                }
            }
        );
    }

    forgotPassword() {
        this.dialog.open(ForgotPasswordModalComponent, {});
    }

    @HostListener('window:keyup', ['$event'])
    keyEvent(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.submit();
        }
    }
}
