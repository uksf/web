import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { NgForm, FormsModule } from '@angular/forms';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { IDropdownElement, mapFromElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { BasicAccount } from '@app/shared/models/account';
import { Unit } from '@app/features/units/models/units';
import { SelectionListComponent } from '@app/shared/components/elements/selection-list/selection-list.component';
import { RequestModalData } from '@app/shared/models/shared';
import { MembersService } from '@app/shared/services/members.service';
import { UnitsService } from '../../services/units.service';
import { CommandRequestsService } from '../../services/command-requests.service';
import { AutofocusStopComponent } from '../../../../shared/components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { DropdownComponent } from '../../../../shared/components/elements/dropdown/dropdown.component';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';

@Component({
    selector: 'app-request-medic-attachment-modal',
    templateUrl: './request-medic-attachment-modal.component.html',
    styleUrls: ['./request-medic-attachment-modal.component.scss', '../../components/command-page/command-page.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, SelectionListComponent, DropdownComponent, TextInputComponent, MatDialogActions, ButtonComponent]
})
export class RequestMedicAttachmentModalComponent implements OnInit {
    private dialog = inject(MatDialog);
    private membersService = inject(MembersService);
    private unitsService = inject(UnitsService);
    private commandRequestsService = inject(CommandRequestsService);
    data = inject<RequestModalData>(MAT_DIALOG_DATA);

    @ViewChild(NgForm) form!: NgForm;
    pending: boolean = false;
    preSelection: string[] = [];
    model: FormModel = {
        accounts: [],
        troop: null,
        reason: null
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    troops: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the medic attachment is required' }]
    };

    constructor() {
        if (this.data) {
            this.preSelection = this.data.ids;
        }
    }

    ngOnInit() {
        this.membersService
            .getMembers()
            .pipe(first())
            .subscribe({
                next: (accounts: BasicAccount[]) => {
                    const elements = accounts.map(BasicAccount.mapToElement);
                    this.accounts.next(elements);
                    this.accounts.complete();

                    if (this.preSelection.length > 0) {
                        this.model.accounts = elements.filter((element: IDropdownElement) => this.preSelection.includes(element.value));
                    }
                }
            });

        this.unitsService
            .getUnits('combat')
            .pipe(first())
            .subscribe({
                next: (units: Unit[]) => {
                    this.troops.next(units.map(Unit.mapToElement));
                }
            });
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        this.model.accounts.forEach((element: IDropdownElement) => {
            this.pending = true;
            this.commandRequestsService
                .createMedicAttachment({
                    recipient: mapFromElement(BasicAccount, element).id,
                    troopId: this.model.troop ? mapFromElement(Unit, this.model.troop).id : '',
                    reason: this.model.reason
                })
                .pipe(first())
                .subscribe({
                    next: () => {
                        this.dialog.closeAll();
                        this.pending = false;
                    },
                    error: (error) => {
                        this.dialog.closeAll();
                        this.pending = false;
                        this.dialog.open(MessageModalComponent, {
                            data: { message: error.error }
                        });
                    }
                });
        });
    }

    getAccountName(element: IDropdownElement): string {
        return mapFromElement(BasicAccount, element).displayName;
    }

    getUnitName(element: IDropdownElement): string {
        return mapFromElement(Unit, element).name;
    }
}

interface FormModel {
    accounts: IDropdownElement[];
    troop: IDropdownElement;
    reason: string;
}
