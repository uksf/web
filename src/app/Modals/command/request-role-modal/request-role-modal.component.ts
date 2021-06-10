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
import { Role, RolesDataset } from '../../../Models/Role';
import { CommandRequest } from '../../../Models/CommandRequest';

@Component({
    selector: 'app-request-role-modal',
    templateUrl: './request-role-modal.component.html',
    styleUrls: ['./request-role-modal.component.scss', '../../../Pages/command-page/command-page.component.scss'],
})
export class RequestRoleModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    model: FormModel = {
        account: null,
        role: null,
        reason: null,
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    roles: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the role assignment is required' }],
    };

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urlService: UrlService) {}

    ngOnInit() {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/under`).subscribe({
            next: (accounts: BasicAccount[]) => {
                this.accounts.next(accounts.map(BasicAccount.mapToElement));
                this.accounts.complete();
            },
        });

        this.roles.next([]);
    }

    onSelectAccount(element: IDropdownElement) {
        if (element === null) {
            this.roles.next([]);
            return;
        }

        this.httpClient.get(`${this.urlService.apiUrl}/roles?id=${mapFromElement(BasicAccount, element).id}`).subscribe({
            next: (rolesDataset: RolesDataset) => {
                const elements = rolesDataset.individualRoles.map(Role.mapToElement);
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
            value: mapFromElement(Role, this.model.role).name,
            reason: this.model.reason,
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
                    data: { message: error.error },
                });
            },
        });
    }

    getAccountName(element: IDropdownElement): string {
        return mapFromElement(BasicAccount, element).displayName;
    }

    getRoleName(element: IDropdownElement): string {
        return mapFromElement(Role, element).name;
    }
}

interface FormModel {
    account: IDropdownElement;
    role: IDropdownElement;
    reason: string;
}
