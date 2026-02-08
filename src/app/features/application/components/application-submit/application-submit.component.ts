import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';

@Component({
    selector: 'app-application-submit',
    templateUrl: './application-submit.component.html',
    styleUrls: ['../application-page/application-page.component.scss', './application-submit.component.scss']
})
export class ApplicationSubmitComponent {
    @Output() submitEvent = new EventEmitter();
    formGroup = this.formBuilder.group({
        playstyle: ['', Validators.required],
        dedication: ['', Validators.required],
        days: ['', Validators.required],
        loa: ['', Validators.required],
        arma: ['', Validators.required],
        rules: ['', Validators.required]
    });
    instantErrorStateMatcher = new InstantErrorStateMatcher();

    constructor(private formBuilder: FormBuilder, public dialog: MatDialog) {}

    submit() {
        this.submitEvent.emit();
    }
}
