import { Component, EventEmitter, Output } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from '../../Services/formhelper.service';

@Component({
    selector: 'app-install-workshop-mod-modal',
    templateUrl: './install-workshop-mod-modal.component.html',
    styleUrls: ['./install-workshop-mod-modal.component.scss']
})
export class InstallWorkshopModModalComponent {
    @Output() installEvent: EventEmitter<string> = new EventEmitter<string>();
    form: UntypedFormGroup;
    instantErrorStateMatcher: InstantErrorStateMatcher = new InstantErrorStateMatcher();
    validationMessages: { steamId: { type: string; message: string }[] } = {
        steamId: [{ type: 'required', message: 'Steam ID is required' }]
    };
    submitting: boolean = false;

    constructor(private formBuilder: UntypedFormBuilder, public dialogRef: MatDialogRef<InstallWorkshopModModalComponent>) {
        this.form = this.formBuilder.group({
            steamId: ['', Validators.required]
        });
    }

    install() {
        const formValue: any = this.form.getRawValue();
        const steamId: string = formValue.steamId.replace('https://steamcommunity.com/sharedfiles/filedetails/?id=', '');

        this.dialogRef.close();
        this.installEvent.emit(steamId);
    }
}
