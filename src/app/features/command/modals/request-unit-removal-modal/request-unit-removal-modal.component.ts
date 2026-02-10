import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { getValidationError, InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { IDropdownElement, mapFromElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { BasicAccount } from '@app/shared/models/account';
import { LoggingService } from '@app/core/services/logging.service';
import { Unit } from '@app/features/units/models/units';
import { CommandRequest } from '@app/features/command/models/command-request';
import { MembersService } from '@app/shared/services/members.service';
import { UnitsService } from '../../services/units.service';
import { CommandRequestsService } from '../../services/command-requests.service';

@Component({
    selector: 'app-request-unit-removal-modal',
    templateUrl: './request-unit-removal-modal.component.html',
    styleUrls: ['./request-unit-removal-modal.component.scss', '../../components/command-page/command-page.component.scss']
})
export class RequestUnitRemovalModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    getValidationError = getValidationError;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    model: FormModel = {
        account: null,
        unit: null,
        reason: null
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    units: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the unit removal is required' }]
    };

    constructor(
        private dialog: MatDialog,
        private membersService: MembersService,
        private unitsService: UnitsService,
        private commandRequestsService: CommandRequestsService,
        private logger: LoggingService
    ) {}

    ngOnInit() {
        this.membersService.getMembers().pipe(first()).subscribe({
            next: (accounts: BasicAccount[]) => {
                this.accounts.next(accounts.map(BasicAccount.mapToElement));
                this.accounts.complete();
            }
        });

        this.units.next([]);
    }

    onSelectAccount(element: IDropdownElement) {
        if (element === null) {
            this.units.next([]);
            return;
        }

        const accountId = mapFromElement(BasicAccount, element).id;

        // Make separate API calls for auxiliary and secondary units since the API only supports one filter at a time
        const auxiliaryRequest = this.unitsService.getUnits('auxiliary', accountId);
        const secondaryRequest = this.unitsService.getUnits('secondary', accountId);

        forkJoin([auxiliaryRequest, secondaryRequest]).pipe(first()).subscribe({
            next: ([auxiliaryUnits, secondaryUnits]) => {
                // Combine the results from both calls
                const allUnits = [...auxiliaryUnits, ...secondaryUnits];
                this.units.next(allUnits.map(Unit.mapToElement));
            },
            error: (error) => {
                this.logger.error('RequestUnitRemovalModal', 'Error fetching units', error);
                this.units.next([]);
            }
        });
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        const commandRequest: CommandRequest = {
            recipient: mapFromElement(BasicAccount, this.model.account).id,
            value: mapFromElement(Unit, this.model.unit).id,
            reason: this.model.reason
        };

        this.pending = true;
        this.commandRequestsService.createUnitRemoval(commandRequest).pipe(first()).subscribe({
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
    }

    getAccountName(element: IDropdownElement): string {
        return mapFromElement(BasicAccount, element).displayName;
    }

    getUnitName(element: IDropdownElement): string {
        return mapFromElement(Unit, element).name;
    }
}

interface FormModel {
    account: IDropdownElement;
    unit: IDropdownElement;
    reason: string;
}
