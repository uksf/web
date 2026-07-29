import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { FlexFillerComponent } from '../../../shared/components/elements/flex-filler/flex-filler.component';
import { NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

export type WorkshopModSelectionState = 'existing' | 'new' | 'removed';

export interface WorkshopModSelectionRow {
    name: string;
    selected: boolean;
    state: WorkshopModSelectionState;
    disabled: boolean;
    conflict: boolean;
}

export interface WorkshopModInterventionModalData {
    installedPbos: string[] | null | undefined;
    availablePbos: string[] | null | undefined;
    installedExtensions: string[] | null | undefined;
    availableExtensions: string[] | null | undefined;
    conflictPbos?: string[] | null;
}

export interface WorkshopModInterventionResult {
    selectedPbos: string[];
    selectedExtensions: string[];
}

@Component({
    selector: 'app-workshop-mod-intervention-modal',
    templateUrl: './workshop-mod-intervention-modal.component.html',
    styleUrls: ['./workshop-mod-intervention-modal.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, FlexFillerComponent, NgClass, MatTooltip, MatCheckbox, FormsModule, MatDialogActions, MatButton]
})
export class WorkshopModInterventionModalComponent {
    dialogRef = inject<MatDialogRef<WorkshopModInterventionModalComponent>>(MatDialogRef);
    data = inject<WorkshopModInterventionModalData>(MAT_DIALOG_DATA);

    pboSelection: WorkshopModSelectionRow[] = [];
    extensionSelection: WorkshopModSelectionRow[] = [];
    onExtensionStep = false;

    constructor() {
        this.pboSelection = buildSelection(this.data.installedPbos, this.data.availablePbos, this.data.conflictPbos);
        this.extensionSelection = buildSelection(this.data.installedExtensions, this.data.availableExtensions, []);
        this.onExtensionStep = this.pboSelection.length === 0;
    }

    get hasExtensionStep(): boolean {
        return this.extensionSelection.length > 0;
    }

    get title(): string {
        return this.onExtensionStep ? 'Select extensions to install' : 'Select PBOs to install';
    }

    get rows(): WorkshopModSelectionRow[] {
        return this.onExtensionStep ? this.extensionSelection : this.pboSelection;
    }

    get isLastStep(): boolean {
        return this.onExtensionStep || !this.hasExtensionStep;
    }

    get valid(): boolean {
        return this.pboSelection.some((x) => x.selected) || this.extensionSelection.some((x) => x.selected);
    }

    getTooltip(row: WorkshopModSelectionRow): string {
        return row.conflict ? 'PBO is already installed by another mod. Select to overwrite' : '';
    }

    selectAll(): void {
        this.rows.filter((x) => !x.disabled).forEach((x) => (x.selected = true));
    }

    next(): void {
        this.onExtensionStep = true;
    }

    back(): void {
        this.onExtensionStep = false;
    }

    submit(): void {
        const result: WorkshopModInterventionResult = {
            selectedPbos: selectedNames(this.pboSelection),
            selectedExtensions: selectedNames(this.extensionSelection)
        };
        this.dialogRef.close(result);
    }
}

function buildSelection(
    installedNames: string[] | null | undefined,
    availableNames: string[] | null | undefined,
    conflictNames: string[] | null | undefined
): WorkshopModSelectionRow[] {
    const installed = new Set(installedNames ?? []);
    const available = new Set(availableNames ?? []);
    const conflicts = new Set(conflictNames ?? []);

    const rows: WorkshopModSelectionRow[] = [];
    for (const name of available) {
        const existing = installed.has(name);
        rows.push({ name, selected: existing, state: existing ? 'existing' : 'new', disabled: false, conflict: conflicts.has(name) });
    }
    for (const name of installed) {
        if (!available.has(name)) {
            rows.push({ name, selected: false, state: 'removed', disabled: true, conflict: false });
        }
    }

    return rows.sort((a, b) => a.name.localeCompare(b.name));
}

function selectedNames(rows: WorkshopModSelectionRow[]): string[] {
    return rows.filter((x) => x.selected).map((x) => x.name);
}
