import { Component, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-install-workshop-mod-modal',
    templateUrl: './install-workshop-mod-modal.component.html',
    styleUrls: ['./install-workshop-mod-modal.component.scss'],
    standalone: false
})
export class InstallWorkshopModModalComponent implements OnDestroy {
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

    constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<InstallWorkshopModModalComponent>) {
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
