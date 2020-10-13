import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ValidationErrors } from '@angular/forms';
import { InstantErrorStateMatcher } from 'app/Services/formhelper.service';
import { NewBuild } from '../../Models/NewBuild';

function onlyOne(form: FormGroup): ValidationErrors | null {
    if (form && form.controls['branch'].value !== '' && form.controls['branch'].value !== 'No branch' && form.controls['commitId'].value !== '') {
        return { both: true };
    }

    return null;
}

@Component({
    selector: 'app-new-modpack-build-modal',
    templateUrl: './new-modpack-build-modal.component.html',
    styleUrls: ['./new-modpack-build-modal.component.scss'],
})
export class NewModpackBuildModalComponent {
    @Output() runEvent = new EventEmitter<NewBuild>();
    form: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    validationMessages = {
        commitId: [{ type: 'pattern', message: 'Commit ID format is invalid' }],
    };
    branches: string[] = [];
    submitting = false;

    constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<NewModpackBuildModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.branches = data.branches;
        this.form = this.formBuilder.group({
            referenceGroup: this.formBuilder.group(
                {
                    branch: ['No branch'],
                    commitId: ['', Validators.pattern('^[a-fA-F0-9]{40}$')],
                },
                { validator: onlyOne }
            ),
            ace: [false],
            acre: [false],
            f35: [false],
        });
    }

    run() {
        const formValue = this.form.getRawValue();
        const reference = formValue.referenceGroup.branch !== 'No branch' ? formValue.referenceGroup.branch : formValue.referenceGroup.commitId;
        this.dialogRef.close();
        this.runEvent.emit({ reference: reference, ace: formValue.ace, acre: formValue.acre, f35: formValue.f35 });
    }
}
