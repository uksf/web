import { Component, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { getValidationError, InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { MatDialog } from '@angular/material/dialog';
import {
    REFERENCE_OPTIONS, ROLE_PREFERENCE_OPTIONS, DETAILS_VALIDATION_MESSAGES,
    buildDetailsFormGroup, extractRolePreferences
} from '../../models/application-form.constants';

@Component({
    selector: 'app-application-details',
    templateUrl: './application-details.component.html',
    styleUrls: ['../application-page/application-page.component.scss', './application-details.component.scss']
})
export class ApplicationDetailsComponent {
    @Output() nextEvent = new EventEmitter();
    getValidationError = getValidationError;
    formGroup: UntypedFormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    referenceOptions = REFERENCE_OPTIONS;
    rolePreferenceOptions = [...ROLE_PREFERENCE_OPTIONS];
    validation_messages = DETAILS_VALIDATION_MESSAGES;

    constructor(public formBuilder: UntypedFormBuilder, public dialog: MatDialog) {
        this.formGroup = buildDetailsFormGroup(formBuilder);
    }

    next() {
        // Honeypot field must be empty
        if (this.formGroup.value.name !== '') {
            return;
        }

        const formObj = extractRolePreferences(this.formGroup);
        const formString = JSON.stringify(formObj).replace(/[\n\r]/g, '');
        this.nextEvent.emit(formString);
    }
}
