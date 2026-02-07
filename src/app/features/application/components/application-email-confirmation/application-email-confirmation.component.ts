import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { PermissionsService } from '@app/core/services/permissions.service';
import { AccountService } from '@app/core/services/account.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-application-email-confirmation',
    templateUrl: './application-email-confirmation.component.html',
    styleUrls: ['./application-email-confirmation.component.scss', '../application-page/application-page.component.scss']
})
export class ApplicationEmailConfirmationComponent implements OnDestroy {
    private destroy$ = new Subject<void>();
    @Output() confirmedEvent = new EventEmitter();
    formGroup: UntypedFormGroup;
    pending = false;
    resent = false;

    constructor(
        private httpClient: HttpClient,
        public formBuilder: UntypedFormBuilder,
        private urls: UrlService,
        public dialog: MatDialog,
        public accountService: AccountService,
        private permissionsService: PermissionsService
    ) {
        this.formGroup = formBuilder.group({
            code: ['', Validators.required]
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    changed(code: string) {
        if (this.pending) {
            return;
        }

        this.validateCode(code);
    }

    validateCode(code: string) {
        const sanitisedCode = code.trim();
        if (sanitisedCode.length !== 24) {
            return;
        }

        this.pending = true;
        this.formGroup.controls['code'].disable();
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.httpClient
            .post(
                this.urls.apiUrl + '/accounts/code',
                {
                    email: this.accountService.account.email,
                    code: sanitisedCode
                },
                { headers: headers }
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.permissionsService.refresh().then(() => {
                        this.pending = false;
                        this.confirmedEvent.emit();
                    });
                },
                error: (error) => {
                    this.dialog
                        .open(MessageModalComponent, {
                            data: { message: error.message }
                        })
                        .afterClosed()
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.formGroup.controls['code'].enable();
                                this.formGroup.controls['code'].setValue('');
                                this.pending = false;
                            }
                        });
                }
            });
    }

    resend() {
        this.pending = true;
        this.httpClient.post(this.urls.apiUrl + '/accounts/resend-email-code', {}).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: 'Resent email confirmation code' }
                });
                this.pending = false;
                this.resent = true;
            },
            error: () => {
                this.pending = false;
            }
        });
    }
}
