import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CreateDocumentRequest, DocumentPermissions, FolderMetadata } from '../../../Models/Documents';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MessageModalComponent } from '../../message-modal/message-modal.component';
import { NgForm } from '@angular/forms';
import { UrlService } from '../../../Services/url.service';
import { InstantErrorStateMatcher } from '../../../Services/formhelper.service';
import { IDropdownElement, mapFromElement } from '../../../Components/elements/dropdown-base/dropdown-base.component';
import { Unit } from '../../../Models/Units';
import { Rank } from '../../../Models/Rank';
import { Observable } from 'rxjs';

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
        readPermissions: {
            units: [],
            rank: null,
            selectedUnitsOnly: false
        },
        writePermissions: {
            units: [],
            rank: null,
            selectedUnitsOnly: false
        }
    };
    validationMessages = {
        name: [{ type: 'required', message: 'Document name is required' }]
    };
    pending: boolean = false;
    folderMetadata: FolderMetadata;
    initialData: InitialDocumentData = null;

    constructor(private httpClient: HttpClient, private urlService: UrlService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: DocumentModalData) {
        this.folderMetadata = data.folderMetadata;

        if (data?.initialData) {
            this.initialData = data.initialData;
            this.model.name = this.initialData.name;
        }
    }

    ngOnInit(): void {}

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        const createDocumentRequest: CreateDocumentRequest = {
            name: this.model.name,
            readPermissions: {
                units: this.model.readPermissions.units.map((x) => mapFromElement(Unit, x).id),
                rank: mapFromElement(Rank, this.model.readPermissions.rank)?.name,
                selectedUnitsOnly: this.model.readPermissions.selectedUnitsOnly
            },
            writePermissions: {
                units: this.model.writePermissions.units.map((x) => mapFromElement(Unit, x).id),
                rank: mapFromElement(Rank, this.model.writePermissions.rank)?.name,
                selectedUnitsOnly: this.model.writePermissions.selectedUnitsOnly
            }
        };

        this.pending = true;
        const request = this.initialData ? this.edit(createDocumentRequest) : this.create(createDocumentRequest);
        request.subscribe({
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

    create(createDocumentRequest: CreateDocumentRequest): Observable<any> {
        return this.httpClient.post(`${this.urlService.apiUrl}/docs/folders/${this.folderMetadata.id}/documents`, createDocumentRequest, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        });
    }

    edit(createDocumentRequest: CreateDocumentRequest): Observable<any> {
        return this.httpClient.put(`${this.urlService.apiUrl}/docs/folders/${this.folderMetadata.id}/documents/${this.initialData.id}`, createDocumentRequest, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        });
    }
}

interface FormModel {
    name: string;
    readPermissions: {
        units: IDropdownElement[];
        rank: IDropdownElement;
        selectedUnitsOnly: boolean;
    };
    writePermissions: {
        units: IDropdownElement[];
        rank: IDropdownElement;
        selectedUnitsOnly: boolean;
    };
}

export class DocumentModalData {
    folderMetadata: FolderMetadata;
    initialData?: InitialDocumentData;
}

export class InitialDocumentData {
    id: string;
    name?: string;
    readPermissions?: DocumentPermissions;
    writePermissions?: DocumentPermissions;
}
