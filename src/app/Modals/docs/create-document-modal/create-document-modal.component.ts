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
import { Observable } from 'rxjs';
import { defaultHeaders } from '../../../Services/constants';

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
        viewerPermissions: {
            units: [],
            rank: null,
            inherit: false,
            expandToSubUnits: true
        },
        collaboratorPermissions: {
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

    constructor(private httpClient: HttpClient, private urlService: UrlService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: DocumentModalData) {
        this.folderMetadata = data.folderMetadata;
        this.inheritedPermissions = data.inheritedPermissions;

        if (data?.initialData) {
            this.initialData = data.initialData;
            this.model.name = this.initialData.name;
        }
    }

    ngOnInit(): void {}

    submit(): void {
        this.pending = true;

        const request: CreateDocumentRequest = {
            name: this.model.name,
            roleBasedPermissions: {
                viewers: {
                    units: this.model.viewerPermissions.inherit ? [] : this.model.viewerPermissions.units.map((x) => mapFromElement(Unit, x).id),
                    rank: this.model.viewerPermissions.inherit ? '' : (mapFromElement(Rank, this.model.viewerPermissions.rank)?.name || ''),
                    expandToSubUnits: this.model.viewerPermissions.inherit ? true : this.model.viewerPermissions.expandToSubUnits
                },
                collaborators: {
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
}

interface FormModel {
    name: string;
    viewerPermissions: {
        units: IDropdownElement[];
        rank: IDropdownElement;
        inherit: boolean;
        expandToSubUnits: boolean;
    };
    collaboratorPermissions: {
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
    roleBasedPermissions?: RoleBasedDocumentPermissions;
}
