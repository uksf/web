import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CreateFolderRequest, DocumentPermissions } from '@app/features/docs/models/documents';
import { DocsService } from '../../services/docs.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { NgForm } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { IDropdownElement, mapFromElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { Unit } from '@app/features/units/models/units';
import { Rank } from '@app/shared/models/rank';
import { BasicAccount } from '@app/shared/models/account';
import { BehaviorSubject, Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/core/services/account.service';
import { MembersService } from '@app/shared/services/members.service';

@Component({
    selector: 'app-create-folder-modal',
    templateUrl: './create-folder-modal.component.html',
    styleUrls: ['./create-folder-modal.component.scss']
})
export class CreateFolderModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    model: FormModel = {
        name: '',
        owner: null,
        viewerPermissions: {
            members: [],
            units: [],
            rank: null,
            inherit: false,
            expandToSubUnits: true
        },
        collaboratorPermissions: {
            members: [],
            units: [],
            rank: null,
            inherit: false,
            expandToSubUnits: true
        }
    };
    validationMessages = {
        name: [{ type: 'required', message: 'Folder name is required' }]
    };
    pending: boolean = false;
    parent: string;
    inheritedPermissions: DocumentPermissions;
    initialData: InitialFolderData = null;
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);

    constructor(
        private docsService: DocsService,
        private membersService: MembersService,
        private dialog: MatDialog,
        private accountService: AccountService,
        @Inject(MAT_DIALOG_DATA) public data: FolderModalData
    ) {
        this.parent = data.parent;
        this.inheritedPermissions = data.inheritedPermissions;

        if (data?.initialData) {
            this.initialData = data.initialData;
            this.model.name = this.initialData.name;
        }
    }

    ngOnInit(): void {
        this.membersService.getMembers().pipe(first()).subscribe({
            next: (accounts: BasicAccount[]) => {
                const elements = accounts.map(BasicAccount.mapToElement);
                this.accounts.next(elements);
                this.accounts.complete();

                // Set default owner to current user for new folders, or populate from initialData for editing
                if (this.initialData) {
                    this.model.owner = elements.find((element) => element.value === this.initialData.owner) || null;
                } else {
                    const currentUser = this.accountService.account;
                    this.model.owner = elements.find((element) => element.value === currentUser?.id) || null;
                }
            }
        });
    }

    submit(): void {
        this.pending = true;

        const request: CreateFolderRequest = {
            parent: this.parent,
            name: this.model.name,
            owner: mapFromElement(BasicAccount, this.model.owner).id,
            permissions: {
                viewers: {
                    members: this.model.viewerPermissions.inherit ? [] : this.model.viewerPermissions.members.map((x) => mapFromElement(BasicAccount, x).id),
                    units: this.model.viewerPermissions.inherit ? [] : this.model.viewerPermissions.units.map((x) => mapFromElement(Unit, x).id),
                    rank: this.model.viewerPermissions.inherit ? '' : mapFromElement(Rank, this.model.viewerPermissions.rank)?.name || '',
                    expandToSubUnits: this.model.viewerPermissions.inherit ? true : this.model.viewerPermissions.expandToSubUnits
                },
                collaborators: {
                    members: this.model.collaboratorPermissions.inherit ? [] : this.model.collaboratorPermissions.members.map((x) => mapFromElement(BasicAccount, x).id),
                    units: this.model.collaboratorPermissions.inherit ? [] : this.model.collaboratorPermissions.units.map((x) => mapFromElement(Unit, x).id),
                    rank: this.model.collaboratorPermissions.inherit ? '' : mapFromElement(Rank, this.model.collaboratorPermissions.rank)?.name || '',
                    expandToSubUnits: this.model.collaboratorPermissions.inherit ? true : this.model.collaboratorPermissions.expandToSubUnits
                }
            }
        };

        let request$: Observable<unknown>;

        if (this.initialData) {
            request$ = this.docsService.updateFolder(this.initialData.id, request);
        } else {
            request$ = this.docsService.createFolder(request);
        }

        request$.pipe(first()).subscribe({
            next: (_) => {
                this.pending = false;
                this.dialog.closeAll();
            },
            error: (error) => {
                this.pending = false;
                this.dialog.open(MessageModalComponent, {
                    data: { message: error.error.error }
                });
            }
        });
    }

    getAccountName(element: IDropdownElement): string {
        return mapFromElement(BasicAccount, element).displayName;
    }
}

interface FormModel {
    name: string;
    owner: IDropdownElement;
    viewerPermissions: {
        members: IDropdownElement[];
        units: IDropdownElement[];
        rank: IDropdownElement;
        inherit: boolean;
        expandToSubUnits: boolean;
    };
    collaboratorPermissions: {
        members: IDropdownElement[];
        units: IDropdownElement[];
        rank: IDropdownElement;
        inherit: boolean;
        expandToSubUnits: boolean;
    };
}

export class FolderModalData {
    parent: string;
    initialData?: InitialFolderData;
    inheritedPermissions?: DocumentPermissions;
}

export class InitialFolderData {
    id: string;
    name?: string;
    owner: string;
    permissions?: DocumentPermissions;
}
