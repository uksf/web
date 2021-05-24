import { Component, Output, ViewChild, EventEmitter } from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { InstantErrorStateMatcher } from '../../../Services/formhelper.service';
import { AuthenticationService } from '../../../Services/Authentication/authentication.service';

@Component({
    selector: 'app-request-password-reset',
    templateUrl: './request-password-reset.component.html',
    styleUrls: ['./request-password-reset.component.scss', '../../../Pages/login-page/login-page.component.scss'],
})
export class RequestPasswordResetComponent {
    @ViewChild(NgForm) form!: NgForm;
    @Output() onReturnToLogin = new EventEmitter();
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    sent = false;
    model: FormModel = {
        name: null,
        email: null,
    };
    validationMessages = {
        email: [
            { type: 'required', message: 'Email address is required' },
            { type: 'email', message: 'Email address is invalid' },
        ],
    };

    constructor(public formbuilder: FormBuilder, private auth: AuthenticationService) {}

    submit() {
        // Honeypot field must be empty
        if (this.model.name || !this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.auth.requestPasswordReset(this.model.email, () => {
            this.sent = true;
            this.pending = false;
        });
    }

    returnToLogin() {
        this.onReturnToLogin.emit();
    }
}

interface FormModel {
    name: string;
    email: string;
}
