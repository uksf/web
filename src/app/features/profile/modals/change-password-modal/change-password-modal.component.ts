import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PermissionsService } from '@app/core/services/permissions.service';
import { ProfileService } from '../../services/profile.service';
import { first } from 'rxjs/operators';

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
    standalone: false
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
        this.profileService.changePassword(formString)
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
