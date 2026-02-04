import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-workshop-mod-intervention-modal',
    templateUrl: './workshop-mod-intervention-modal.component.html',
    styleUrls: ['./workshop-mod-intervention-modal.component.scss']
})
export class WorkshopModInterventionModalComponent {
    submitting: boolean = false;
    availablePbos: string[] = [];
    pboSelection: WorkshopModPboSelection[] = [];

    constructor(public dialogRef: MatDialogRef<WorkshopModInterventionModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
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
