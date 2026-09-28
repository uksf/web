import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { PasskeyCredential, PasskeyService, isPasskeyCancelled } from '@app/core/services/authentication/passkey.service';
import { Router } from '@angular/router';
import { PermissionsService } from '@app/core/services/permissions.service';
import { RedirectService } from '@app/core/services/authentication/redirect.service';
import { UksfError } from '@app/shared/models/response';
import { first } from 'rxjs/operators';
import { MatDialogTitle } from '@angular/material/dialog';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { ButtonHiddenSubmitComponent } from '../../../../shared/components/elements/button-submit/button-hidden-submit.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss', '../login-page/login-page.component.scss'],
    imports: [MatDialogTitle, FormsModule, TextInputComponent, ButtonHiddenSubmitComponent, MatCheckbox, FlexFillerComponent, ButtonComponent]
})
export class LoginComponent implements OnInit, OnDestroy {
    private auth = inject(AuthenticationService);
    private passkeyService = inject(PasskeyService);
    private router = inject(Router);
    private permissionsService = inject(PermissionsService);
    private redirectService = inject(RedirectService);

    @ViewChild(NgForm) form!: NgForm;
    @Output() onRequestPasswordReset = new EventEmitter();
    pending = false;
    passkeyPending = false;
    passkeysSupported = this.passkeyService.supported;
    stayLogged = true;
    loginError = '';
    model: FormModel = {
        name: null,
        email: null,
        password: null
    };
    validationMessages = {
        email: [
            { type: 'required', message: 'Email address is required' },
            { type: 'email', message: 'Email address is invalid' }
        ],
        password: [{ type: 'required', message: 'Password is required' }]
    };
    private autofillRequest: AbortController | null = null;
    private destroyed = false;

    ngOnInit() {
        this.auth.logout();
        this.offerPasskeyAutofill();
    }

    ngOnDestroy() {
        this.destroyed = true;
        this.autofillRequest?.abort();
    }

    submit() {
        // Honeypot field must be empty
        if (this.model.name || !this.form.valid || this.pending || this.passkeyPending) {
            return;
        }

        this.autofillRequest?.abort();
        this.pending = true;
        this.loginError = '';
        this.auth
            .login(this.model.email, this.model.password, this.stayLogged)
            .pipe(first())
            .subscribe({
                next: () => this.onLoggedIn(),
                error: (error: UksfError) => {
                    this.pending = false;
                    this.loginError = error?.error || 'Login failed';
                    this.offerPasskeyAutofill();
                }
            });
    }

    async loginWithPasskey() {
        if (this.passkeyPending || this.pending) {
            return;
        }

        this.autofillRequest?.abort();
        this.passkeyPending = true;
        this.loginError = '';
        try {
            this.completePasskeyLogin(await this.passkeyService.getAssertion());
        } catch (error) {
            this.onPasskeyError(error);
            this.offerPasskeyAutofill();
        }
    }

    requestPasswordReset() {
        this.onRequestPasswordReset.emit();
    }

    // Lists passkeys in the browser or password manager autofill for the email field
    private async offerPasskeyAutofill() {
        if (!(await this.passkeyService.conditionalMediationAvailable()) || this.destroyed || this.pending || this.passkeyPending) {
            return;
        }

        this.autofillRequest?.abort();
        const request = new AbortController();
        this.autofillRequest = request;
        try {
            const passkey = await this.passkeyService.getAssertion('conditional', request.signal);
            if (this.pending) {
                return;
            }
            this.passkeyPending = true;
            this.completePasskeyLogin(passkey);
        } catch (error) {
            if (!request.signal.aborted) {
                this.onPasskeyError(error);
            }
        }
    }

    private completePasskeyLogin(passkey: PasskeyCredential) {
        this.auth
            .loginWithPasskey(passkey, this.stayLogged)
            .pipe(first())
            .subscribe({
                next: () => this.onLoggedIn(),
                error: (error: UksfError) => {
                    this.onPasskeyError(error);
                    this.offerPasskeyAutofill();
                }
            });
    }

    private onPasskeyError(error: unknown) {
        this.passkeyPending = false;
        if (!isPasskeyCancelled(error)) {
            this.loginError = (error as UksfError)?.error || 'Passkey sign-in failed';
        }
    }

    private onLoggedIn() {
        this.permissionsService
            .refresh()
            .then(() => {
                const redirect = this.redirectService.getAndClearRedirectUrl() ?? '/home';
                this.router.navigateByUrl(redirect);
            })
            .catch(() => {
                this.pending = false;
                this.passkeyPending = false;
                this.loginError = 'Login failed';
            });
    }
}

interface FormModel {
    name: string;
    email: string;
    password: string;
}
