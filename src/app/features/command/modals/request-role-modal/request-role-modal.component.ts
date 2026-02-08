import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { NgForm } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { IDropdownElement, mapFromElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { BasicAccount } from '@app/shared/models/account';
import { Role, RolesDataset } from '@app/shared/models/role';
import { SelectionListComponent } from '@app/shared/components/elements/selection-list/selection-list.component';
import { RequestModalData } from '@app/shared/models/shared';
import { CommandRequest } from '@app/features/command/models/command-request';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { MembersService } from '@app/shared/services/members.service';
import { RolesService } from '../../services/roles.service';
import { CommandRequestsService } from '../../services/command-requests.service';

@Component({
    selector: 'app-request-role-modal',
    templateUrl: './request-role-modal.component.html',
    styleUrls: ['./request-role-modal.component.scss', '../../components/command-page/command-page.component.scss']
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

    constructor(
        private dialog: MatDialog,
        private membersService: MembersService,
        private rolesService: RolesService,
        private commandRequestsService: CommandRequestsService,
        @Inject(MAT_DIALOG_DATA) public data: RequestModalData
    ) {
        if (data) {
            this.preSelection = data.ids;
        }
    }

    ngOnInit() {
        this.membersService.getMembers().pipe(first()).subscribe({
            next: (accounts: BasicAccount[]) => {
                const elements = accounts.map(BasicAccount.mapToElement);
                this.accounts.next(elements);
                this.accounts.complete();

                if (this.preSelection.length > 0) {
                    this.model.accounts = elements.filter((element: IDropdownElement) => this.preSelection.includes(element.value));
                }
            }
        });

        this.rolesService.getRoles().pipe(first()).subscribe({
            next: (rolesDataset: RolesDataset) => {
                const elements = rolesDataset.roles.map(Role.mapToElement);
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

            this.membersService.getAccount(element.value).pipe(first()).subscribe({
                next: (account) => {
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
            this.commandRequestsService.createRole(commandRequest).pipe(first()).subscribe({
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
