import { Component, OnDestroy, Output, ViewChild, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, NgForm } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-request-password-reset',
    templateUrl: './request-password-reset.component.html',
    styleUrls: ['./request-password-reset.component.scss', '../login-page/login-page.component.scss']
})
export class RequestPasswordResetComponent implements OnDestroy {
    private destroy$ = new Subject<void>();
    @ViewChild(NgForm) form!: NgForm;
    @Output() onReturnToLogin = new EventEmitter();
    instantErrorStateMatcher = new InstantErrorStateMatcher();
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

    constructor(public formbuilder: UntypedFormBuilder, private auth: AuthenticationService) {}

    submit() {
        // Honeypot field must be empty
        if (this.model.name || !this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.auth.requestPasswordReset(this.model.email).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.sent = true;
                this.pending = false;
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    returnToLogin() {
        this.onReturnToLogin.emit();
    }
}

interface FormModel {
    name: string;
    email: string;
}
