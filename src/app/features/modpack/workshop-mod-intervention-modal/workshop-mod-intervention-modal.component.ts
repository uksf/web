import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { FlexFillerComponent } from '../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-workshop-mod-intervention-modal',
    templateUrl: './workshop-mod-intervention-modal.component.html',
    styleUrls: ['./workshop-mod-intervention-modal.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, FlexFillerComponent, MatProgressSpinner, NgClass, MatTooltip, MatCheckbox, FormsModule, MatDialogActions, MatButton]
})
export class WorkshopModInterventionModalComponent {
    dialogRef = inject<MatDialogRef<WorkshopModInterventionModalComponent>>(MatDialogRef);
    data = inject<{
        availablePbos: string[];
    }>(MAT_DIALOG_DATA);

    submitting: boolean = false;
    availablePbos: string[] = [];
    pboSelection: WorkshopModPboSelection[] = [];

    constructor() {
        const data = this.data;

        this.availablePbos = data.availablePbos;
        this.pboSelection = this.availablePbos.map((x: string) => {
            return { name: x, selected: false, conflict: false };
        });
    }

    getTooltip(pbo: WorkshopModPboSelection): string {
        return pbo.conflict ? 'PBO is already installed by another mod. Select to overwrite' : '';
    }

    get valid() {
        return this.pboSelection.some((x: WorkshopModPboSelection) => x.selected);
    }

    selectAll() {
        this.pboSelection.forEach((x: WorkshopModPboSelection) => {
            x.selected = true;
        });
    }

    submit() {
        const selectedPbos: string[] = this.pboSelection.filter((x: WorkshopModPboSelection) => x.selected).map((x: WorkshopModPboSelection) => x.name);

        this.dialogRef.close(selectedPbos);
    }
}

export interface WorkshopModPboSelection {
    name: string;
    selected: boolean;
    conflict: boolean;
}
