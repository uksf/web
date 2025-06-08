import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CreateDocumentRequest, RoleBasedDocumentPermissions, FolderMetadata, PermissionRole } from '../../../Models/Documents';
import { HttpClient } from '@angular/common/http';
import { MessageModalComponent } from '../../message-modal/message-modal.component';
import { NgForm } from '@angular/forms';
import { UrlService } from '../../../Services/url.service';
import { InstantErrorStateMatcher } from '../../../Services/formhelper.service';
import { IDropdownElement, mapFromElement } from '../../../Components/elements/dropdown-base/dropdown-base.component';
import { Unit } from '../../../Models/Units';
import { Rank } from '../../../Models/Rank';
import { BasicAccount } from '../../../Models/Account';
import { BehaviorSubject, Observable } from 'rxjs';
import { defaultHeaders } from '../../../Services/constants';
import { AccountService } from '../../../Services/account.service';

@Component({
    selector: 'app-create-document-modal',
    templateUrl: './create-document-modal.component.html',
    styleUrls: ['./create-document-modal.component.scss']
})
export class CreateDocumentModalComponent implements OnInit {
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
        name: [{ type: 'required', message: 'Document name is required' }]
    };
    pending: boolean = false;
    folderMetadata: FolderMetadata;
    inheritedPermissions: RoleBasedDocumentPermissions;
    initialData: InitialDocumentData = null;
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);

    constructor(private httpClient: HttpClient, private urlService: UrlService, private dialog: MatDialog, private accountService: AccountService, @Inject(MAT_DIALOG_DATA) public data: DocumentModalData) {
        this.folderMetadata = data.folderMetadata;
        this.inheritedPermissions = data.inheritedPermissions;

        if (data?.initialData) {
            this.initialData = data.initialData;
            this.model.name = this.initialData.name;
        }
    }

    ngOnInit(): void {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/members`).subscribe({
            next: (accounts: BasicAccount[]) => {
                const elements = accounts.map(BasicAccount.mapToElement);
                this.accounts.next(elements);
                this.accounts.complete();

                // Set default owner to current user for new documents, or populate from initialData for editing
                if (this.initialData) {
                    this.model.owner = elements.find(element => element.value === this.initialData.owner) || null;
                } else {
                    const currentUser = this.accountService.account;
                    this.model.owner = elements.find(element => element.value === currentUser?.id) || null;
                }
            }
        });
    }

    submit(): void {
        this.pending = true;

        const request: CreateDocumentRequest = {
            name: this.model.name,
            owner: mapFromElement(BasicAccount, this.model.owner).id,
            roleBasedPermissions: {
                viewers: {
                    members: this.model.viewerPermissions.inherit ? [] : this.model.viewerPermissions.members.map((x) => mapFromElement(BasicAccount, x).id),
                    units: this.model.viewerPermissions.inherit ? [] : this.model.viewerPermissions.units.map((x) => mapFromElement(Unit, x).id),
                    rank: this.model.viewerPermissions.inherit ? '' : (mapFromElement(Rank, this.model.viewerPermissions.rank)?.name || ''),
                    expandToSubUnits: this.model.viewerPermissions.inherit ? true : this.model.viewerPermissions.expandToSubUnits
                },
                collaborators: {
                    members: this.model.collaboratorPermissions.inherit ? [] : this.model.collaboratorPermissions.members.map((x) => mapFromElement(BasicAccount, x).id),
                    units: this.model.collaboratorPermissions.inherit ? [] : this.model.collaboratorPermissions.units.map((x) => mapFromElement(Unit, x).id),
                    rank: this.model.collaboratorPermissions.inherit ? '' : (mapFromElement(Rank, this.model.collaboratorPermissions.rank)?.name || ''),
                    expandToSubUnits: this.model.collaboratorPermissions.inherit ? true : this.model.collaboratorPermissions.expandToSubUnits
                }
            }
        };

        let request$: Observable<any>;

        if (this.initialData) {
            request$ = this.httpClient.put(`${this.urlService.apiUrl}/docs/folders/${this.folderMetadata.id}/documents/${this.initialData.id}`, request, {
                headers: defaultHeaders
            });
        } else {
            request$ = this.httpClient.post(`${this.urlService.apiUrl}/docs/folders/${this.folderMetadata.id}/documents`, request, {
                headers: defaultHeaders
            });
        }

        request$.subscribe({
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

export class DocumentModalData {
    folderMetadata: FolderMetadata;
    initialData?: InitialDocumentData;
    inheritedPermissions?: RoleBasedDocumentPermissions;
}

export class InitialDocumentData {
    id: string;
    name?: string;
    owner?: string;
    roleBasedPermissions?: RoleBasedDocumentPermissions;
}
