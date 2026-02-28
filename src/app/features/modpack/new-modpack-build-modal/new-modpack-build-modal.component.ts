import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { AutofocusStopComponent } from '../../../shared/components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { DropdownComponent } from '../../../shared/components/elements/dropdown/dropdown.component';
import { TextInputComponent } from '../../../shared/components/elements/text-input/text-input.component';
import { MatError } from '@angular/material/form-field';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButton } from '@angular/material/button';

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
    styleUrls: ['./new-modpack-build-modal.component.scss'],
    imports: [
        AutofocusStopComponent,
        MatDialogTitle,
        CdkScrollable,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        DropdownComponent,
        TextInputComponent,
        MatError,
        MatCheckbox,
        MatDialogActions,
        MatButton
    ]
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
        this.branchElements = data.branches.map((b) => ({ value: b, displayValue: b }));
        this.branchElements$ = of(this.branchElements);

        this.form.controls.configuration.setValue(this.configurationElements[0]);

        const noBranch = this.branchElements.find((e) => e.value === 'No branch');
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
