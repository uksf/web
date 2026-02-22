import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

function onlyOne(group: AbstractControl): ValidationErrors | null {
    const branchValue = (group.get('branch').value as IDropdownElement)?.value ?? '';
    if (branchValue !== '' && branchValue !== 'No branch' && group.get('commitId').value !== '') {
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
    configurationElements: IDropdownElement[] = [
        { value: 'Development', displayValue: 'Development' },
        { value: 'Release', displayValue: 'Release' }
    ];
    configurationElements$ = of(this.configurationElements);
    branchElements: IDropdownElement[];
    branchElements$: Observable<IDropdownElement[]>;

    form = this.formBuilder.group({
        configuration: new FormControl<IDropdownElement | null>(null, Validators.required),
        referenceGroup: this.formBuilder.group(
            {
                branch: new FormControl<IDropdownElement | null>(null),
                commitId: ['', Validators.pattern('^[a-fA-F0-9]{40}$')]
            },
            { validators: onlyOne }
        ),
        ace: [false],
        acre: [false],
        air: [false]
    });
    validationMessages = {
        commitId: [{ type: 'pattern', message: 'Commit ID format is invalid' }]
    };
    submitting = false;

    constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<NewModpackBuildModalComponent>, @Inject(MAT_DIALOG_DATA) public data: { branches: string[] }) {
        this.branchElements = data.branches.map(b => ({ value: b, displayValue: b }));
        this.branchElements$ = of(this.branchElements);

        this.form.controls.configuration.setValue(this.configurationElements[0]);

        const noBranch = this.branchElements.find(e => e.value === 'No branch');
        if (noBranch) {
            this.form.controls.referenceGroup.controls.branch.setValue(noBranch);
        }
    }

    get selectedBranchValue(): string {
        return this.form.controls.referenceGroup.controls.branch.value?.value ?? '';
    }

    run() {
        const formValue = this.form.getRawValue();
        const branchValue = formValue.referenceGroup.branch?.value ?? '';
        const configValue = formValue.configuration?.value ?? '';
        const reference = branchValue !== 'No branch' ? branchValue : formValue.referenceGroup.commitId;
        this.dialogRef.close({ reference: reference, ace: formValue.ace, acre: formValue.acre, air: formValue.air, configuration: configValue.toLowerCase() });
    }
}
