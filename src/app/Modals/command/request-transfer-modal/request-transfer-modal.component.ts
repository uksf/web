import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../../Components/elements/dropdown-base/dropdown-base.component';
import { Account, BasicAccount } from '../../../Models/Account';
import { CommandRequest } from '../../../Models/CommandRequest';
import { Unit } from '../../../Models/Units';
import { SelectionListComponent } from '../../../Components/elements/selection-list/selection-list.component';
import { RequestModalData } from '../../../Models/Shared';

@Component({
    selector: 'app-request-transfer-modal',
    templateUrl: './request-transfer-modal.component.html',
    styleUrls: ['./request-transfer-modal.component.scss', '../../../Pages/command-page/command-page.component.scss']
})
export class RequestTransferModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    @ViewChild('accountList', { read: SelectionListComponent }) accountList: SelectionListComponent;
    pending: boolean = false;
    allowAuxiliaryUnits: boolean = false;
    preSelection: string[] = [];
    model: FormModel = {
        accounts: [],
        unit: null,
        reason: null
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    units: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the unit transfer is required' }]
    };

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urlService: UrlService, @Inject(MAT_DIALOG_DATA) public data: RequestModalData) {
        if (data) {
            this.preSelection = data.ids;
            this.allowAuxiliaryUnits = data.allowAuxiliaryUnits;
        }
    }

    ngOnInit() {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/under`).subscribe({
            next: (accounts: BasicAccount[]) => {
                const elements = accounts.map(BasicAccount.mapToElement);
                this.accounts.next(elements);
                this.accounts.complete();

                if (this.preSelection.length > 0) {
                    this.model.accounts = elements.filter((element: IDropdownElement) => this.preSelection.includes(element.value));
                }
            }
        });

        let unitsUrl = this.allowAuxiliaryUnits ? 'units' : 'units?filter=combat';
        this.httpClient.get(`${this.urlService.apiUrl}/${unitsUrl}`).subscribe({
            next: (units: Unit[]) => {
                this.units.next(units.map(Unit.mapToElement));
            }
        });
    }

    onSelectAccount() {
        this.checkAccountUnits();
    }

    onSelectUnit() {
        this.checkAccountUnits();
    }

    checkAccountUnits() {
        this.model.accounts.forEach((element: IDropdownElement) => {
            if (this.model.unit === null) {
                element.disabled = false;
                return;
            }

            this.httpClient.get(`${this.urlService.apiUrl}/accounts/${element.value}`).subscribe({
                next: (account: Account) => {
                    element.disabled = account.unitAssignment === this.model.unit.displayValue;
                    this.revalidate();
                }
            });
        });
    }

    revalidate() {
        this.accountList.revalidate();
        this.form.form.get('formAccountList').updateValueAndValidity();
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        this.model.accounts.forEach((element: IDropdownElement) => {
            const commandRequest: CommandRequest = {
                recipient: mapFromElement(BasicAccount, element).id,
                value: mapFromElement(Unit, this.model.unit).id,
                reason: this.model.reason
            };

            this.pending = true;
            this.httpClient.put(`${this.urlService.apiUrl}/commandrequests/create/transfer`, commandRequest).subscribe({
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

    getAccountTooltip = (element: IDropdownElement): string => {
        if (this.model.unit === null) {
            return '';
        }

        return `${this.getAccountName(element)} is already a member of ${this.getUnitName(this.model.unit)}`;
    };
}

interface FormModel {
    accounts: IDropdownElement[];
    unit: IDropdownElement;
    reason: string;
}
