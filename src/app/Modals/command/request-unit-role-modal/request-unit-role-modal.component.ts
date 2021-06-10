import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { InstantErrorStateMatcher } from '../../../Services/formhelper.service';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../../Components/elements/dropdown/dropdown.component';
import { BasicAccount } from '../../../Models/Account';
import { CommandRequest } from '../../../Models/CommandRequest';
import { Role, RolesDataset } from '../../../Models/Role';
import { Unit } from '../../../Models/Units';

@Component({
    selector: 'app-request-unit-role-modal',
    templateUrl: './request-unit-role-modal.component.html',
    styleUrls: ['./request-unit-role-modal.component.scss', '../../../Pages/command-page/command-page.component.scss'],
})
export class RequestUnitRoleModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    model: FormModel = {
        account: null,
        unit: null,
        role: null,
        reason: null,
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    units: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    roles: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the unit role assignment is required' }],
    };

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urlService: UrlService) {}

    ngOnInit() {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/under`).subscribe({
            next: (accounts: BasicAccount[]) => {
                this.accounts.next(accounts.map(BasicAccount.mapToElement));
                this.accounts.complete();
            },
        });

        this.units.next([]);
        this.roles.next([]);
    }

    onSelectAccount(element: IDropdownElement) {
        if (element === null) {
            this.units.next([]);
            this.roles.next([]);
            return;
        }

        this.httpClient.get(`${this.urlService.apiUrl}/units?accountId=${mapFromElement(BasicAccount, element).id}`).subscribe({
            next: (units: Unit[]) => {
                this.units.next(units.map(Unit.mapToElement));
            },
        });
    }

    onSelectUnit(element: IDropdownElement) {
        if (element === null) {
            this.roles.next([]);
            return;
        }

        const accountId = mapFromElement(BasicAccount, this.model.account).id;
        const unitId = mapFromElement(Unit, element).id;
        this.httpClient.get(`${this.urlService.apiUrl}/roles?id=${accountId}&unitId=${unitId}`).subscribe({
            next: (rolesDataset: RolesDataset) => {
                const elements = rolesDataset.unitRoles.map(Role.mapToElement);
                elements.unshift({ value: 'None', displayValue: 'None' });
                this.roles.next(elements);
            },
        });
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        const commandRequest: CommandRequest = {
            recipient: mapFromElement(BasicAccount, this.model.account).id,
            value: mapFromElement(Role, this.model.unit).name,
            secondaryValue: mapFromElement(Role, this.model.role).name,
            reason: this.model.reason,
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
                    data: { message: error.error },
                });
            },
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
