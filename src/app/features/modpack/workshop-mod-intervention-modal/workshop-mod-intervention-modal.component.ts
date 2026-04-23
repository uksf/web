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

export type WorkshopModPboState = 'existing' | 'new' | 'removed';

export interface WorkshopModPboSelection {
    name: string;
    selected: boolean;
    state: WorkshopModPboState;
    disabled: boolean;
    conflict: boolean;
}

export interface WorkshopModInterventionModalData {
    installedPbos: string[] | null | undefined;
    availablePbos: string[] | null | undefined;
    conflictPbos?: string[] | null;
}

@Component({
    selector: 'app-workshop-mod-intervention-modal',
    templateUrl: './workshop-mod-intervention-modal.component.html',
    styleUrls: ['./workshop-mod-intervention-modal.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, FlexFillerComponent, MatProgressSpinner, NgClass, MatTooltip, MatCheckbox, FormsModule, MatDialogActions, MatButton]
})
export class WorkshopModInterventionModalComponent {
    dialogRef = inject<MatDialogRef<WorkshopModInterventionModalComponent>>(MatDialogRef);
    data = inject<WorkshopModInterventionModalData>(MAT_DIALOG_DATA);

    submitting = false;
    pboSelection: WorkshopModPboSelection[] = [];

    constructor() {
        const installed = new Set(this.data.installedPbos ?? []);
        const available = new Set(this.data.availablePbos ?? []);
        const conflicts = new Set(this.data.conflictPbos ?? []);

        const rows: WorkshopModPboSelection[] = [];
        for (const name of available) {
            if (installed.has(name)) {
                rows.push({ name, selected: true, state: 'existing', disabled: false, conflict: conflicts.has(name) });
            } else {
                rows.push({ name, selected: false, state: 'new', disabled: false, conflict: conflicts.has(name) });
            }
        }
        for (const name of installed) {
            if (!available.has(name)) {
                rows.push({ name, selected: false, state: 'removed', disabled: true, conflict: false });
            }
        }

        this.pboSelection = rows.sort((a, b) => a.name.localeCompare(b.name));
    }

    getTooltip(pbo: WorkshopModPboSelection): string {
        return pbo.conflict ? 'PBO is already installed by another mod. Select to overwrite' : '';
    }

    get valid(): boolean {
        return this.pboSelection.some((x) => x.selected);
    }

    selectAll(): void {
        this.pboSelection.forEach((x) => {
            if (!x.disabled) {
                x.selected = true;
            }
        });
    }

    submit(): void {
        const selectedPbos = this.pboSelection.filter((x) => x.selected).map((x) => x.name);
        this.dialogRef.close(selectedPbos);
    }
}
