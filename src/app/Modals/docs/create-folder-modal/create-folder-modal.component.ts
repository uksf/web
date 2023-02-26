import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CreateFolderRequest, DocumentPermissions } from '../../../Models/Documents';
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
    selector: 'app-create-folder-modal',
    templateUrl: './create-folder-modal.component.html',
    styleUrls: ['./create-folder-modal.component.scss']
})
export class CreateFolderModalComponent implements OnInit {
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
        name: [{ type: 'required', message: 'Folder name is required' }]
    };
    pending: boolean = false;
    parent: string = '000000000000000000000000';
    initialData: InitialFolderData = null;

    constructor(private httpClient: HttpClient, private urlService: UrlService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: FolderModalData) {
        if (data?.parent) {
            this.parent = data.parent;
        }

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

        const createFolderRequest: CreateFolderRequest = {
            parent: this.parent,
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
        const request = this.initialData ? this.edit(createFolderRequest) : this.create(createFolderRequest);
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

    create(createFolderRequest: CreateFolderRequest): Observable<any> {
        return this.httpClient.post(`${this.urlService.apiUrl}/docs/folders`, createFolderRequest, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        });
    }

    edit(createFolderRequest: CreateFolderRequest): Observable<any> {
        return this.httpClient.put(`${this.urlService.apiUrl}/docs/folders/${this.initialData.id}`, createFolderRequest, {
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

export class FolderModalData {
    parent: string;
    initialData?: InitialFolderData;
}

export class InitialFolderData {
    id: string;
    parent?: string;
    name?: string;
    readPermissions?: DocumentPermissions;
    writePermissions?: DocumentPermissions;
}
