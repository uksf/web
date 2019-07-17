import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { MatDialog, ErrorStateMatcher } from '@angular/material';

export class InstantErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return !!(control && !control.valid && (control.dirty || control.touched));
    }
}

@Component({
    selector: 'app-application-details',
    templateUrl: './application-details.component.html',
    styleUrls: ['../../../Pages/new-application-page/new-application-page.component.scss', './application-details.component.scss']
})
export class ApplicationDetailsComponent {
    @Output() nextEvent = new EventEmitter();
    formGroup: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    referenceOptions = [
        { value: 'Google', viewValue: 'Google' },
        { value: 'Youtube', viewValue: 'Youtube' },
        { value: 'Reddit', viewValue: 'Reddit' },
        { value: 'Steam', viewValue: 'Steam' },
        { value: 'Recruiter', viewValue: 'Recruiter' },
        { value: 'Friend', viewValue: 'Friend' },
        { value: 'Other', viewValue: 'Other' }
    ];

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
            officer: [''],
            nco: [''],
            aviation: [''],
            reference: ['', Validators.required]
        });
    }

    next() {
        // Honeypot field must be empty
        if (this.formGroup.value.name !== '') { return; }
        const formObj = this.formGroup.getRawValue();
        const formString = JSON.stringify(formObj).replace(/\n|\r/g, '');
        this.nextEvent.emit(formString);
    }
}
