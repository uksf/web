import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, AbstractControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export function passwordMatcher(form: AbstractControl) {
    if (!form.get('password').value || !form.get('confirmPass').value) {
        return null;
    }
    return form.get('password').value === form.get('confirmPass').value ? null : { error: 'Passwords do not match' };
}

@Component({
    selector: 'app-change-password-modal',
    templateUrl: './change-password-modal.component.html',
    styleUrls: ['./change-password-modal.component.scss']
})
export class ChangePasswordModalComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    public form: UntypedFormGroup;

    constructor(public formbuilder: UntypedFormBuilder, private httpClient: HttpClient, private permissionsService: PermissionsService, private urls: UrlService, public dialog: MatDialog) {
        this.form = formbuilder.group(
            {
                password: ['', Validators.required],
                confirmPass: ['', Validators.required]
            },
            { validator: passwordMatcher }
        );
    }

    ngOnInit() {}

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    changePassword() {
        const formObj = this.form.getRawValue();
        delete formObj.confirmPass;
        const formString = JSON.stringify(formObj).replace(/[\n\r]/g, '');
        this.httpClient
            .put(this.urls.apiUrl + '/accounts/password', formString, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.dialog.closeAll();
                    this.permissionsService.revoke();
                }
            });
    }

    get formErrors() {
        return this.form.errors.error;
    }
}
