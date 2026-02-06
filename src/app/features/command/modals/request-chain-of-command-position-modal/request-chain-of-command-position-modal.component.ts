import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement, mapFromElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { BasicAccount } from '@app/shared/models/Account';
import { CommandRequest } from '@app/features/command/models/CommandRequest';
import { Role } from '@app/shared/models/Role';
import { Unit } from '@app/features/units/models/Units';

@Component({
    selector: 'app-request-chain-of-command-position-modal',
    templateUrl: './request-chain-of-command-position-modal.component.html',
    styleUrls: ['./request-chain-of-command-position-modal.component.scss', '../../components/command-page/command-page.component.scss']
})
export class RequestChainOfCommandPositionModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    model: FormModel = {
        account: null,
        unit: null,
        position: null,
        reason: null
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    units: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    positions: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the chain of command position assignment is required' }]
    };

    // Store the actual Unit objects to access chainOfCommand data
    private unitObjects: Unit[] = [];

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urlService: UrlService) {}

    ngOnInit() {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/members`).subscribe({
            next: (accounts: BasicAccount[]) => {
                this.accounts.next(accounts.map(BasicAccount.mapToElement));
                this.accounts.complete();
            }
        });

        this.units.next([]);
        this.positions.next([]);
    }

    onSelectAccount(element: IDropdownElement) {
        if (element === null) {
            this.units.next([]);
            this.positions.next([]);
            this.unitObjects = [];
            return;
        }

        this.httpClient.get(`${this.urlService.apiUrl}/units?accountId=${mapFromElement(BasicAccount, element).id}`).subscribe({
            next: (units: Unit[]) => {
                this.unitObjects = units;
                this.units.next(units.map(Unit.mapToElement));
            }
        });
    }

    onSelectUnit(element: IDropdownElement) {
        if (element === null) {
            this.positions.next([]);
            return;
        }

        const selectedAccountId = mapFromElement(BasicAccount, this.model.account).id;
        const selectedUnit = this.unitObjects.find(unit => unit.id === element.value);
        
        if (!selectedUnit) {
            this.positions.next([]);
            return;
        }

        // Build available positions from chain of command
        const availablePositions: IDropdownElement[] = [];
        
        // Add "None" option to unset position
        availablePositions.push({ value: 'None', displayValue: 'None' });

        // Check which positions are available based on chainOfCommand
        const chainOfCommand = selectedUnit.chainOfCommand;
        
        // Only show positions that are either empty or not occupied by the selected member
        if (!chainOfCommand.first || chainOfCommand.first !== selectedAccountId) {
            availablePositions.push({ value: '1iC', displayValue: '1iC' });
        }
        
        if (!chainOfCommand.second || chainOfCommand.second !== selectedAccountId) {
            availablePositions.push({ value: '2iC', displayValue: '2iC' });
        }
        
        if (!chainOfCommand.third || chainOfCommand.third !== selectedAccountId) {
            availablePositions.push({ value: '3iC', displayValue: '3iC' });
        }
        
        if (!chainOfCommand.nco || chainOfCommand.nco !== selectedAccountId) {
            availablePositions.push({ value: 'NCOiC', displayValue: 'NCOiC' });
        }

        this.positions.next(availablePositions);
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        const commandRequest: CommandRequest = {
            recipient: mapFromElement(BasicAccount, this.model.account).id,
            value: mapFromElement(Role, this.model.unit).name,
            secondaryValue: mapFromElement(Role, this.model.position).name,
            reason: this.model.reason
        };

        this.pending = true;
        this.httpClient.post(this.urlService.apiUrl + '/commandrequests/create/chainofcommandposition', commandRequest).subscribe({
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

    getPositionName(element: IDropdownElement): string {
        return mapFromElement(Role, element).name;
    }
}

interface FormModel {
    account: IDropdownElement;
    unit: IDropdownElement;
    position: IDropdownElement;
    reason: string;
} 
