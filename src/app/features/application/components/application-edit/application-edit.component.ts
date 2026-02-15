import { Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl, AbstractControl } from '@angular/forms';
import { first, takeUntil } from 'rxjs/operators';
import { getValidationError, InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '@app/core/services/account.service';
import { Router } from '@angular/router';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Permissions } from '@app/core/services/permissions';
import { ApplicationState } from '@app/features/application/models/application';
import { ApplicationService } from '../../services/application.service';
import { DestroyableComponent } from '@app/shared/components';

@Component({
    selector: 'app-application-edit',
    templateUrl: './application-edit.component.html',
    styleUrls: ['../application-page/application-page.component.scss', './application-edit.component.scss']
})
export class ApplicationEditComponent extends DestroyableComponent {
    getValidationError = getValidationError;
    formGroup: UntypedFormGroup;
    pending: boolean = false;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    referenceOptions = [
        { value: 'Recruiter', viewValue: 'Recruiter' },
        { value: 'Steam', viewValue: 'Steam' },
        { value: 'Reddit', viewValue: 'Reddit' },
        { value: 'YouTube', viewValue: 'YouTube' },
        { value: 'Instagram', viewValue: 'Instagram' },
        { value: 'Google', viewValue: 'Google' },
        { value: 'Friend', viewValue: 'Friend' },
        { value: 'Other', viewValue: 'Other' }
    ];
    rolePreferenceOptions = ['NCO', 'Officer', 'Aviation', 'Medic'];
    original: string;

    validation_messages = {
        armaExperience: [{ type: 'required', message: 'Details about your Arma experience are required' }],
        unitsExperience: [{ type: 'required', message: 'Details about your past Arma unit experience is required' }],
        background: [{ type: 'required', message: 'Some background info about yourself is required' }]
    };

    constructor(
        public formBuilder: UntypedFormBuilder,
        public dialog: MatDialog,
        private applicationService: ApplicationService,
        private accountService: AccountService,
        private permissions: PermissionsService,
        private router: Router
    ) {
        super();
        if (this.permissions.hasPermission(Permissions.RECRUITER)) {
            this.router.navigate(['/recruitment/' + this.accountService.account.id]);
            return;
        }
        this.formGroup = formBuilder.group({
            name: ['', Validators.maxLength(0)],
            armaExperience: ['', Validators.required],
            unitsExperience: ['', Validators.required],
            background: ['', Validators.required],
            militaryExperience: [false],
            officer: [''],
            nco: [''],
            aviation: [''],
            reference: ['', Validators.required]
        });
        const rolePreferenceControls: { [key: string]: AbstractControl } = {};
        this.rolePreferenceOptions.forEach((x) => {
            rolePreferenceControls[x] = new UntypedFormControl(false);
        });
        this.formGroup.addControl('rolePreferences', new UntypedFormGroup(rolePreferenceControls));

        this.updateOriginal();
        this.permissions.accountUpdateEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.updateOriginal();
            }
        });
    }

    get accepted() {
        return this.accountService.account.application.state === ApplicationState.ACCEPTED;
    }

    get rejected() {
        return this.accountService.account.application.state === ApplicationState.REJECTED;
    }

    get applicationState() {
        return this.accountService.account.application.state === ApplicationState.ACCEPTED
            ? 'Application Accepted'
            : this.accountService.account.application.state === ApplicationState.REJECTED
            ? 'Application Rejected'
            : 'Application Submitted';
    }

    get name() {
        return `Cdt.${this.accountService.account.lastname}.${this.accountService.account.firstname[0]}`;
    }

    get applicationCommentThread(): string {
        return this.accountService.account.application.applicationCommentThread;
    }

    update() {
        // Honeypot field must be empty
        if (this.formGroup.value.name !== '') {
            return;
        }

        this.pending = true;
        const formObj = this.convertRolePreferencesFromGroup();
        const formString = JSON.stringify(formObj).replace(/[\n\r]/g, '');
        this.applicationService.updateApplication(this.accountService.account.id, formString)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.pending = false;
                    this.accountService.getAccount()?.pipe(first()).subscribe({
                        next: () => {
                            this.updateOriginal();
                        }
                    });
                    this.dialog.open(MessageModalComponent, {
                        data: { message: 'Your application was successfully updated' }
                    });
                },
                error: () => {
                    this.pending = false;
                    this.dialog.open(MessageModalComponent, {
                        data: { message: 'Failed to update application' }
                    });
                }
            });
    }

    updateOriginal() {
        this.formGroup.patchValue(this.accountService.account);
        this.convertRolePreferencesToGroup();

        const formObj = this.convertRolePreferencesFromGroup();
        this.original = JSON.stringify(formObj);
    }

    get changesMade() {
        const formObj = this.convertRolePreferencesFromGroup();
        return this.original !== JSON.stringify(formObj);
    }

    convertRolePreferencesFromGroup(): Record<string, unknown> {
        const formObj = this.formGroup.getRawValue();
        const rolePreferences = [];
        const rolePreferencesGroup: UntypedFormGroup = this.formGroup.controls['rolePreferences'] as UntypedFormGroup;

        for (const key in rolePreferencesGroup.controls) {
            if (rolePreferencesGroup.controls.hasOwnProperty(key)) {
                const control = rolePreferencesGroup.controls[key];
                if (control.value) {
                    rolePreferences.push(key);
                }
            }
        }
        formObj.rolePreferences = rolePreferences;
        return formObj;
    }

    convertRolePreferencesToGroup() {
        const rolePreferences = this.accountService.account.rolePreferences;
        const rolePreferencesGroup: UntypedFormGroup = this.formGroup.controls['rolePreferences'] as UntypedFormGroup;

        this.rolePreferenceOptions.forEach((rolePreferenceOption) => {
            if (rolePreferences.includes(rolePreferenceOption)) {
                rolePreferencesGroup.controls[rolePreferenceOption].setValue(true);
            }
        });
    }
}
