import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormGroupDirective, NgForm, AbstractControl } from '@angular/forms';
import { MatDialog, ErrorStateMatcher } from '@angular/material';

export class InstantErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return !!(control && !control.valid && (control.dirty || control.touched));
    }
}

@Component({
    selector: 'app-application-details',
    templateUrl: './application-details.component.html',
    styleUrls: ['../../../Pages/application-page/application-page.component.scss', './application-details.component.scss']
})
export class ApplicationDetailsComponent {
    @Output() nextEvent = new EventEmitter();
    formGroup: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    referenceOptions = [
        { value: 'Recruiter', viewValue: 'Recruiter' },
        { value: 'Steam', viewValue: 'Steam' },
        { value: 'Reddit', viewValue: 'Reddit' },
        { value: 'YouTube', viewValue: 'YouTube' },
        { value: 'Instagram', viewValue: 'Instagram' },
        { value: 'Google', viewValue: 'Google' },
        { value: 'Arma 3 Discord', viewValue: 'Arma 3 Discord' },
        { value: 'Friend', viewValue: 'Friend' },
        { value: 'Other', viewValue: 'Other' }
    ];
    rolePreferenceOptions = ['NCO', 'Officer', 'Aviation', 'Medic'];

    validation_messages = {
        'armaExperience': [
            { type: 'required', message: 'Details about your Arma experience are required' }
        ], 'unitsExperience': [
            { type: 'required', message: 'Details about your past Arma unit experience is required' }
        ], 'background': [
            { type: 'required', message: 'Some background info about yourself is required' }
        ]
    }

    constructor(
        public formBuilder: FormBuilder,
        public dialog: MatDialog
    ) {
        this.formGroup = formBuilder.group({
            name: ['', Validators.maxLength(0)],
            armaExperience: ['', Validators.required],
            unitsExperience: ['', Validators.required],
            background: ['', Validators.required],
            militaryExperience: [''],
            reference: ['', Validators.required]
        });
        const rolePreferenceControls: { [key: string]: AbstractControl } = {};
        this.rolePreferenceOptions.forEach(x => {
            rolePreferenceControls[x] = new FormControl(false);
        });
        this.formGroup.addControl('rolePreferences', new FormGroup(rolePreferenceControls));

    }

    next() {
        // Honeypot field must be empty
        if (this.formGroup.value.name !== '') { return; }
        const formObj = this.convertRolePreferencesGroup();
        const formString = JSON.stringify(formObj).replace(/\n|\r/g, '');
        this.nextEvent.emit(formString);
    }

    convertRolePreferencesGroup(): any {
        const formObj = this.formGroup.getRawValue();
        const rolePreferences = [];
        const rolePreferencesGroup: FormGroup = this.formGroup.controls['rolePreferences'] as FormGroup;
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
}
