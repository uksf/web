import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { PermissionsService } from '@app/core/services/permissions.service';
import { ProfileService } from '../../services/profile.service';
import { first } from 'rxjs/operators';
import { AutofocusStopComponent } from '../../../../shared/components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { MatError } from '@angular/material/form-field';
import { MatButton } from '@angular/material/button';

export function passwordMatcher(form: AbstractControl) {
    if (!form.get('password').value || !form.get('confirmPass').value) {
        return null;
    }
    return form.get('password').value === form.get('confirmPass').value ? null : { error: 'Passwords do not match' };
}

@Component({
    selector: 'app-change-password-modal',
    templateUrl: './change-password-modal.component.html',
    styleUrls: ['./change-password-modal.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, TextInputComponent, MatError, MatDialogActions, MatButton]
})
export class ChangePasswordModalComponent {
    form = this.formBuilder.group(
        {
            password: ['', Validators.required],
            confirmPass: ['', Validators.required]
        },
        { validators: passwordMatcher }
    );

    constructor(private formBuilder: FormBuilder, private profileService: ProfileService, private permissionsService: PermissionsService, public dialog: MatDialog) {}

    changePassword() {
        const formObj = this.form.getRawValue();
        delete formObj.confirmPass;
        const formString = JSON.stringify(formObj).replace(/[\n\r]/g, '');
        this.profileService
            .changePassword(formString)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.dialog.closeAll();
                    this.permissionsService.revoke();
                }
            });
    }

    get formErrors() {
        return this.form.errors?.error;
    }
}
