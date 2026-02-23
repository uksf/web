import { Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { getValidationError, InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '@app/core/services/account.service';
import { Router } from '@angular/router';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Permissions } from '@app/core/services/permissions';
import { ApplicationState } from '@app/features/application/models/application';
import {
    REFERENCE_ELEMENTS, ROLE_PREFERENCE_OPTIONS, DETAILS_VALIDATION_MESSAGES,
    buildDetailsFormGroup, extractRolePreferences, findReferenceElement
} from '../../models/application-form.constants';
import { ApplicationService } from '../../services/application.service';
import { DestroyableComponent } from '@app/shared/components';

@Component({
    selector: 'app-application-edit',
    templateUrl: './application-edit.component.html',
    styleUrls: ['../application-page/application-page.component.scss', './application-edit.component.scss'],
    standalone: false
})
export class ApplicationEditComponent extends DestroyableComponent {
    formGroup: UntypedFormGroup;
    pending: boolean = false;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    referenceElements = REFERENCE_ELEMENTS;
    referenceElements$ = of(REFERENCE_ELEMENTS);
    rolePreferenceOptions = [...ROLE_PREFERENCE_OPTIONS];
    original: string;
    validation_messages = DETAILS_VALIDATION_MESSAGES;
    cachedErrors = { armaExperience: '', unitsExperience: '', background: '' };

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
        this.formGroup = buildDetailsFormGroup(formBuilder);

        this.updateOriginal();
        this.permissions.accountUpdateEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.updateOriginal();
            }
        });
        this.formGroup.valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.changesMade = this.computeChangesMade();
            }
        });
        this.formGroup.statusChanges.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this.updateCachedErrors()
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
        const formObj = extractRolePreferences(this.formGroup);
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
        this.formGroup.controls['reference'].setValue(findReferenceElement(this.accountService.account.reference));
        this.applyRolePreferencesToGroup();

        const formObj = extractRolePreferences(this.formGroup);
        this.original = JSON.stringify(formObj);
    }

    updateCachedErrors() {
        this.cachedErrors = {
            armaExperience: getValidationError(this.formGroup.get('armaExperience'), this.validation_messages.armaExperience),
            unitsExperience: getValidationError(this.formGroup.get('unitsExperience'), this.validation_messages.unitsExperience),
            background: getValidationError(this.formGroup.get('background'), this.validation_messages.background)
        };
    }

    changesMade = false;

    private computeChangesMade(): boolean {
        const formObj = extractRolePreferences(this.formGroup);
        return this.original !== JSON.stringify(formObj);
    }

    private applyRolePreferencesToGroup() {
        const rolePreferences = this.accountService.account.rolePreferences;
        const rolePreferencesGroup = this.formGroup.controls['rolePreferences'] as UntypedFormGroup;

        ROLE_PREFERENCE_OPTIONS.forEach((option) => {
            if (rolePreferences.includes(option)) {
                rolePreferencesGroup.controls[option].setValue(true);
            }
        });
    }
}
