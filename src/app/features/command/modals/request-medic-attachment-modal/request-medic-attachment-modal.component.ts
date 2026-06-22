import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { first } from 'rxjs/operators';
import { CommandRequestsService } from '@app/features/command/services/command-requests.service';
import { UnitsService } from '@app/features/command/services/units.service';
import { ResponseUnit, UnitBranch } from '@app/features/units/models/units';
import { RequestModalData } from '@app/shared/models/shared';
import { DropdownComponent } from '@app/shared/components/elements/dropdown/dropdown.component';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-request-medic-attachment-modal',
    templateUrl: './request-medic-attachment-modal.component.html',
    styleUrls: ['./request-medic-attachment-modal.component.scss'],
    imports: [MatDialogModule, FormsModule, MatButtonModule, DropdownComponent, TextInputComponent, ButtonComponent]
})
export class RequestMedicAttachmentModalComponent {
    private dialogRef = inject(MatDialogRef<RequestMedicAttachmentModalComponent>);
    private commandRequests = inject(CommandRequestsService);
    private unitsService = inject(UnitsService);
    data: RequestModalData = inject(MAT_DIALOG_DATA);

    troops: ResponseUnit[] = [];
    troopElements: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    selectedTroopId = '';
    selectedTroopElement: IDropdownElement | null = null;
    reason = '';
    pending = false;

    constructor() {
        this.unitsService
            .getAllUnits()
            .pipe(first())
            .subscribe({
                next: (units) => {
                    this.troops = units.filter((u) => u.branch === UnitBranch.COMBAT);
                    this.troopElements.next(this.troops.map((u) => ({ value: u.id, displayValue: u.name })));
                }
            });
    }

    onSelectTroop() {
        this.selectedTroopId = this.selectedTroopElement ? this.selectedTroopElement.value : '';
    }

    submit() {
        this.pending = true;
        this.commandRequests
            .createMedicAttachment({ recipient: this.data.ids[0], troopId: this.selectedTroopId, reason: this.reason })
            .pipe(first())
            .subscribe({ next: () => this.dialogRef.close(true), error: () => (this.pending = false) });
    }
}
