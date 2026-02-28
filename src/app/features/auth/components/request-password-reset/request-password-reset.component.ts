import { Component, Output, ViewChild, EventEmitter } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { first } from 'rxjs/operators';
import { MatDialogTitle } from '@angular/material/dialog';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { ButtonHiddenSubmitComponent } from '../../../../shared/components/elements/button-submit/button-hidden-submit.component';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';

@Component({
    selector: 'app-request-password-reset',
    templateUrl: './request-password-reset.component.html',
    styleUrls: ['./request-password-reset.component.scss', '../login-page/login-page.component.scss'],
    imports: [MatDialogTitle, FormsModule, TextInputComponent, ButtonHiddenSubmitComponent, FlexFillerComponent, ButtonComponent]
})
export class RequestPasswordResetComponent {
    @ViewChild(NgForm) form!: NgForm;
    @Output() onReturnToLogin = new EventEmitter();
    pending = false;
    sent = false;
    model: FormModel = {
        name: null,
        email: null
    };
    validationMessages = {
        email: [
            { type: 'required', message: 'Email address is required' },
            { type: 'email', message: 'Email address is invalid' }
        ]
    };

    constructor(private auth: AuthenticationService) {}

    submit() {
        // Honeypot field must be empty
        if (this.model.name || !this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.auth
            .requestPasswordReset(this.model.email)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.sent = true;
                    this.pending = false;
                }
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
