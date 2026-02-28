import { Component, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { getValidationError, InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { REFERENCE_ELEMENTS, ROLE_PREFERENCE_OPTIONS, DETAILS_VALIDATION_MESSAGES, buildDetailsFormGroup, extractRolePreferences } from '../../models/application-form.constants';
import { DestroyableComponent } from '@app/shared/components';
import { MatCard } from '@angular/material/card';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { DropdownComponent } from '../../../../shared/components/elements/dropdown/dropdown.component';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';

@Component({
    selector: 'app-application-details',
    templateUrl: './application-details.component.html',
    styleUrls: ['../application-page/application-page.component.scss', './application-details.component.scss'],
    imports: [MatCard, FormsModule, ReactiveFormsModule, TextInputComponent, MatCheckbox, DropdownComponent, ButtonComponent]
})
export class ApplicationDetailsComponent extends DestroyableComponent {
    @Output() submitEvent = new EventEmitter<string>();
    formGroup: UntypedFormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    referenceElements$ = of(REFERENCE_ELEMENTS);
    rolePreferenceOptions = [...ROLE_PREFERENCE_OPTIONS];
    validation_messages = DETAILS_VALIDATION_MESSAGES;
    cachedErrors = { armaExperience: '', unitsExperience: '', background: '' };

    constructor(public formBuilder: UntypedFormBuilder, public dialog: MatDialog) {
        super();
        this.formGroup = buildDetailsFormGroup(formBuilder);
        this.formGroup.statusChanges.pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.updateCachedErrors() });
    }

    updateCachedErrors() {
        this.cachedErrors = {
            armaExperience: getValidationError(this.formGroup.get('armaExperience'), this.validation_messages.armaExperience),
            unitsExperience: getValidationError(this.formGroup.get('unitsExperience'), this.validation_messages.unitsExperience),
            background: getValidationError(this.formGroup.get('background'), this.validation_messages.background)
        };
    }

    submit() {
        // Honeypot field must be empty
        if (this.formGroup.value.name !== '') {
            return;
        }

        const formObj = extractRolePreferences(this.formGroup);
        const formString = JSON.stringify(formObj).replace(/[\n\r]/g, '');
        this.submitEvent.emit(formString);
    }
}
