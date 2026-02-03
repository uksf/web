import { Component, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';

export class InstantErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return !!(control && !control.valid && (control.dirty || control.touched));
    }
}

@Component({
    selector: 'app-application-submit',
    templateUrl: './application-submit.component.html',
    styleUrls: ['../application-page/application-page.component.scss', './application-submit.component.scss']
})
export class ApplicationSubmitComponent {
    @Output() submitEvent = new EventEmitter();
    formGroup: UntypedFormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();

    constructor(public formBuilder: UntypedFormBuilder, public dialog: MatDialog) {
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
