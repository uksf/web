import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { UrlService } from 'app/Services/url.service';
import { InstantErrorStateMatcher } from 'app/Services/formhelper.service';

function onlyOne(form: FormGroup): ValidationErrors | null {
    if (form && form.controls['branch'].value !== '' && form.controls['branch'].value !== 'No branch' && form.controls['commitId'].value !== '') {
        return { both: true };
    }

    return null;
}

@Component({
    selector: 'app-new-modpack-build-modal',
    templateUrl: './new-modpack-build-modal.component.html',
    styleUrls: ['./new-modpack-build-modal.component.scss']
})
export class NewModpackBuildModalComponent {
    @Output() runEvent = new EventEmitter<string>();
    form: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    validationMessages = {
        'commitId': [
            { type: 'pattern', message: 'Commit ID format is invalid' }
        ]
    };
    branches: string[] = [];
    submitting = false;

    constructor(
        private formbuilder: FormBuilder,
        public dialogRef: MatDialogRef<NewModpackBuildModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.branches = data.branches;
        this.form = this.formbuilder.group({
            branch: [''],
            commitId: ['', Validators.pattern('^[a-fA-F0-9]{40}$')]
        }, { validator: onlyOne });
    }

    run() {
        const formValue = this.form.getRawValue();
        const reference = formValue.branch !== 'No branch' ? formValue.branch : formValue.commitId;
        this.dialogRef.close();
        this.runEvent.emit(reference);
    }
}
