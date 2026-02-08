import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { NewBuild } from '../models/new-build';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';

function onlyOne(group: AbstractControl): ValidationErrors | null {
    if (group && group.get('branch').value !== '' && group.get('branch').value !== 'No branch' && group.get('commitId').value !== '') {
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
    form = this.formBuilder.group({
        configuration: ['Development', Validators.required],
        referenceGroup: this.formBuilder.group(
            {
                branch: ['No branch'],
                commitId: ['', Validators.pattern('^[a-fA-F0-9]{40}$')]
            },
            { validators: onlyOne }
        ),
        ace: [false],
        acre: [false],
        air: [false]
    });
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    validationMessages = {
        commitId: [{ type: 'pattern', message: 'Commit ID format is invalid' }]
    };
    configurations: string[] = ['Development', 'Release'];
    branches: string[] = [];
    submitting = false;

    constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<NewModpackBuildModalComponent>, @Inject(MAT_DIALOG_DATA) public data: { branches: string[] }) {
        this.branches = data.branches;
    }

    run() {
        const formValue = this.form.getRawValue();
        const reference = formValue.referenceGroup.branch !== 'No branch' ? formValue.referenceGroup.branch : formValue.referenceGroup.commitId;
        this.dialogRef.close({ reference: reference, ace: formValue.ace, acre: formValue.acre, air: formValue.air, configuration: formValue.configuration.toLowerCase() });
    }
}
