import { Component, OnDestroy, inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AutofocusStopComponent } from '../../../shared/components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { TextInputComponent } from '../../../shared/components/elements/text-input/text-input.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import { ButtonComponent } from '../../../shared/components/elements/button-pending/button.component';
import { ReactiveFormValueDebugComponent } from '../../../shared/components/elements/form-value-debug/form-value-debug.component';

@Component({
    selector: 'app-install-workshop-mod-modal',
    templateUrl: './install-workshop-mod-modal.component.html',
    styleUrls: ['./install-workshop-mod-modal.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, TextInputComponent, MatCheckbox, MatTooltip, MatDialogActions, ButtonComponent, ReactiveFormValueDebugComponent]
})
export class InstallWorkshopModModalComponent implements OnDestroy {
    private formBuilder = inject(FormBuilder);
    dialogRef = inject<MatDialogRef<InstallWorkshopModModalComponent>>(MatDialogRef);

    private destroy$ = new Subject<void>();
    form = this.formBuilder.group({
        steamId: ['', Validators.required],
        rootMod: [false],
        folderName: [{ value: '', disabled: true }]
    });
    validationMessages: { steamId: { type: string; message: string }[] } = {
        steamId: [{ type: 'required', message: 'Steam ID is required' }]
    };
    submitting: boolean = false;

    constructor() {
        this.form.controls.rootMod.valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
            next: (isRootMod: boolean) => {
                const folderNameControl = this.form.controls.folderName;
                if (isRootMod) {
                    folderNameControl.enable();
                } else {
                    folderNameControl.disable();
                }
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    install() {
        const formValue = this.form.getRawValue();
        const steamId: string = formValue.steamId.replace('https://steamcommunity.com/sharedfiles/filedetails/?id=', '');

        this.dialogRef.close({
            steamId: steamId,
            rootMod: formValue.rootMod,
            folderName: formValue.folderName || undefined
        });
    }
}
