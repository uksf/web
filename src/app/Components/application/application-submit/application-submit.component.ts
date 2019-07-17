import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { MatDialog, ErrorStateMatcher } from '@angular/material';

export class InstantErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return !!(control && !control.valid && (control.dirty || control.touched));
    }
}

@Component({
    selector: 'app-application-submit',
    templateUrl: './application-submit.component.html',
    styleUrls: ['../../../Pages/new-application-page/new-application-page.component.scss', './application-submit.component.scss']
})
export class ApplicationSubmitComponent {
    @Output() submitEvent = new EventEmitter();
    formGroup: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();

    constructor(
        public formBuilder: FormBuilder,
        public dialog: MatDialog
    ) {
        this.formGroup = formBuilder.group({
            playstyle: ['', Validators.required],
            dedication: ['', Validators.required],
            days: ['', Validators.required],
            loa: ['', Validators.required],
            arma: ['', Validators.required],
            rules: ['', Validators.required]
        });
    }

    submit() {
        this.submitEvent.emit();
    }
}
