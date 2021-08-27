import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../../Components/elements/dropdown-base/dropdown-base.component';
import { Account, BasicAccount } from '../../../Models/Account';
import { Role, RolesDataset } from '../../../Models/Role';
import { SelectionListComponent } from '../../../Components/elements/selection-list/selection-list.component';
import { RequestModalData } from '../../../Models/Shared';
import { CommandRequest } from '../../../Models/CommandRequest';
import { MessageModalComponent } from '../../message-modal/message-modal.component';

@Component({
    selector: 'app-request-role-modal',
    templateUrl: './request-role-modal.component.html',
    styleUrls: ['./request-role-modal.component.scss', '../../../Pages/command-page/command-page.component.scss']
})
export class RequestRoleModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    @ViewChild('accountList', { read: SelectionListComponent }) accountList: SelectionListComponent;
    pending: boolean = false;
    preSelection: string[] = [];
    model: FormModel = {
        accounts: [],
        role: null,
        reason: null
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    roles: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the role assignment is required' }]
    };

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urlService: UrlService, @Inject(MAT_DIALOG_DATA) public data: RequestModalData) {
        if (data) {
            this.preSelection = data.ids;
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

        this.httpClient.get(`${this.urlService.apiUrl}/roles`).subscribe({
            next: (rolesDataset: RolesDataset) => {
                const elements = rolesDataset.individualRoles.map(Role.mapToElement);
                elements.unshift({ value: 'None', displayValue: 'None' });
                this.roles.next(elements);
            }
        });
    }

    onSelectAccount() {
        this.checkAccountRoles();
    }

    onSelectRole() {
        this.checkAccountRoles();
    }

    checkAccountRoles() {
        this.model.accounts.forEach((element: IDropdownElement) => {
            if (this.model.role === null) {
                element.disabled = false;
                return;
            }

            this.httpClient.get(`${this.urlService.apiUrl}/accounts/${element.value}`).subscribe({
                next: (account: Account) => {
                    element.disabled = account.roleAssignment === this.model.role.value;
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
                value: mapFromElement(Role, this.model.role).name,
                reason: this.model.reason
            };

            this.pending = true;
            this.httpClient.put(this.urlService.apiUrl + '/commandrequests/create/role', commandRequest).subscribe({
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

    getRoleName(element: IDropdownElement): string {
        return mapFromElement(Role, element).name;
    }

    getAccountTooltip = (element: IDropdownElement): string => {
        if (this.model.role === null) {
            return '';
        }

        return `${this.getAccountName(element)} is already a ${this.getRoleName(this.model.role)}`;
    };
}

interface FormModel {
    accounts: IDropdownElement[];
    role: IDropdownElement;
    reason: string;
}
