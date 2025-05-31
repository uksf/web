import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { InstantErrorStateMatcher } from '../../../Services/formhelper.service';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../../Components/elements/dropdown-base/dropdown-base.component';
import { BasicAccount } from '../../../Models/Account';
import { CommandRequest } from '../../../Models/CommandRequest';
import { Role, RolesDataset } from '../../../Models/Role';
import { Unit } from '../../../Models/Units';

@Component({
    selector: 'app-request-unit-role-modal',
    templateUrl: './request-unit-role-modal.component.html',
    styleUrls: ['./request-unit-role-modal.component.scss', '../../../Pages/command-page/command-page.component.scss']
})
export class RequestUnitRoleModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    model: FormModel = {
        account: null,
        unit: null,
        role: null,
        reason: null
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    units: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    roles: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the unit role assignment is required' }]
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
        this.roles.next([]);
    }

    onSelectAccount(element: IDropdownElement) {
        if (element === null) {
            this.units.next([]);
            this.roles.next([]);
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
            this.roles.next([]);
            return;
        }

        const selectedAccountId = mapFromElement(BasicAccount, this.model.account).id;
        const selectedUnit = this.unitObjects.find(unit => unit.id === element.value);
        
        if (!selectedUnit) {
            this.roles.next([]);
            return;
        }

        // Build available roles from chain of command
        const availableRoles: IDropdownElement[] = [];
        
        // Add "None" option to unset role
        availableRoles.push({ value: 'None', displayValue: 'None' });

        // Check which positions are available based on chainOfCommand
        const chainOfCommand = selectedUnit.chainOfCommand;
        
        // Only show positions that are either empty or not occupied by the selected member
        if (!chainOfCommand.first || chainOfCommand.first !== selectedAccountId) {
            availableRoles.push({ value: '1iC', displayValue: '1iC' });
        }
        
        if (!chainOfCommand.second || chainOfCommand.second !== selectedAccountId) {
            availableRoles.push({ value: '2iC', displayValue: '2iC' });
        }
        
        if (!chainOfCommand.third || chainOfCommand.third !== selectedAccountId) {
            availableRoles.push({ value: '3iC', displayValue: '3iC' });
        }
        
        if (!chainOfCommand.nco || chainOfCommand.nco !== selectedAccountId) {
            availableRoles.push({ value: 'NCOiC', displayValue: 'NCOiC' });
        }

        this.roles.next(availableRoles);
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        const commandRequest: CommandRequest = {
            recipient: mapFromElement(BasicAccount, this.model.account).id,
            value: mapFromElement(Role, this.model.unit).name,
            secondaryValue: mapFromElement(Role, this.model.role).name,
            reason: this.model.reason
        };

        this.pending = true;
        this.httpClient.put(this.urlService.apiUrl + '/commandrequests/create/unitrole', commandRequest).subscribe({
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

    getRoleName(element: IDropdownElement): string {
        return mapFromElement(Role, element).name;
    }
}

interface FormModel {
    account: IDropdownElement;
    unit: IDropdownElement;
    role: IDropdownElement;
    reason: string;
}
