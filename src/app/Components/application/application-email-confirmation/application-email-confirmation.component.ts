import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { PermissionsService } from 'app/Services/permissions.service';

@Component({
    selector: 'app-application-email-confirmation',
    templateUrl: './application-email-confirmation.component.html',
    styleUrls: ['./application-email-confirmation.component.scss', '../../../Pages/application-page/application-page.component.scss'],
})
export class ApplicationEmailConfirmationComponent {
    @Input() email: string;
    @Output() confirmedEvent = new EventEmitter();
    formGroup: FormGroup;
    pending = false;
    resent = false;

    constructor(private httpClient: HttpClient, public formBuilder: FormBuilder, private urls: UrlService, public dialog: MatDialog, private permissionsService: PermissionsService) {
        this.formGroup = formBuilder.group({
            code: ['', Validators.required],
        });
    }

    changed(code: string) {
        if (this.pending) {
            return;
        }
        this.validateCode(code);
    }

    validateCode(code: string) {
        if (code.length !== 24) {
            return;
        }

        this.pending = true;
        this.formGroup.controls['code'].disable();
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.httpClient
            .post(
                this.urls.apiUrl + '/accounts',
                {
                    email: this.email,
                    code: code,
                },
                { headers: headers }
            )
            .subscribe(
                () => {
                    this.permissionsService.refresh().then(() => {
                        this.pending = false;
                        this.confirmedEvent.emit();
                    });
                },
                (error) => {
                    this.dialog
                        .open(MessageModalComponent, {
                            data: { message: error.message },
                        })
                        .afterClosed()
                        .subscribe(() => {
                            this.formGroup.controls['code'].enable();
                            this.formGroup.controls['code'].setValue('');
                            this.pending = false;
                        });
                }
            );
    }

    resend() {
        this.pending = true;
        this.httpClient.post(this.urls.apiUrl + '/accounts/resend-email-code', {}).subscribe(
            () => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: 'Resent email confirmation code' },
                });
                this.pending = false;
                this.resent = true;
            },
            () => {
                this.pending = false;
            }
        );
    }
}
