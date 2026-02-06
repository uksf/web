import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { InstallWorkshopModData } from '../models/WorkshopMod';

@Component({
    selector: 'app-install-workshop-mod-modal',
    templateUrl: './install-workshop-mod-modal.component.html',
    styleUrls: ['./install-workshop-mod-modal.component.scss']
})
export class InstallWorkshopModModalComponent {
    form: UntypedFormGroup;
    instantErrorStateMatcher: InstantErrorStateMatcher = new InstantErrorStateMatcher();
    validationMessages: { steamId: { type: string; message: string }[] } = {
        steamId: [{ type: 'required', message: 'Steam ID is required' }]
    };
    submitting: boolean = false;

    constructor(private formBuilder: UntypedFormBuilder, public dialogRef: MatDialogRef<InstallWorkshopModModalComponent>) {
        this.form = this.formBuilder.group({
            steamId: ['', Validators.required],
            rootMod: [false],
            folderName: [{ value: '', disabled: true }]
        });

        this.form.get('rootMod').valueChanges.subscribe({
            next: (isRootMod: boolean) => {
                const folderNameControl = this.form.get('folderName');
                if (isRootMod) {
                    folderNameControl.enable();
                } else {
                    folderNameControl.disable();
                }
            }
        });
    }

    get isRootMod(): boolean {
        return this.form.get('rootMod').value;
    }

    install() {
        const formValue: any = this.form.getRawValue();
        const steamId: string = formValue.steamId.replace('https://steamcommunity.com/sharedfiles/filedetails/?id=', '');

        this.dialogRef.close({
            steamId: steamId,
            rootMod: formValue.rootMod,
            folderName: formValue.folderName || undefined
        });
    }
}
