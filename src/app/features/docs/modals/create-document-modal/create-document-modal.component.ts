import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CreateDocumentRequest, DocumentPermissions, FolderMetadata } from '@app/features/docs/models/documents';
import { DocsService } from '../../services/docs.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { NgForm, FormsModule } from '@angular/forms';
import { IDropdownElement, mapFromElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { Unit } from '@app/features/units/models/units';
import { Rank } from '@app/shared/models/rank';
import { BasicAccount } from '@app/shared/models/account';
import { BehaviorSubject, Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/core/services/account.service';
import { MembersService } from '@app/shared/services/members.service';
import { AutofocusStopComponent } from '../../../../shared/components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { DropdownComponent } from '../../../../shared/components/elements/dropdown/dropdown.component';
import { MatAccordion } from '@angular/material/expansion';
import { DocsPermissionsComponent } from '../../components/docs-permissions/docs-permissions.component';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';

@Component({
    selector: 'app-create-document-modal',
    templateUrl: './create-document-modal.component.html',
    styleUrls: ['./create-document-modal.component.scss'],
    imports: [
        AutofocusStopComponent,
        MatDialogTitle,
        CdkScrollable,
        MatDialogContent,
        FormsModule,
        TextInputComponent,
        DropdownComponent,
        MatAccordion,
        DocsPermissionsComponent,
        MatDialogActions,
        FlexFillerComponent,
        ButtonComponent,
        
    ]
})
export class CreateDocumentModalComponent implements OnInit {
    private docsService = inject(DocsService);
    private membersService = inject(MembersService);
    private dialog = inject(MatDialog);
    private accountService = inject(AccountService);
    data = inject<DocumentModalData>(MAT_DIALOG_DATA);

    @ViewChild(NgForm) form!: NgForm;
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
    inheritedPermissions: DocumentPermissions;
    initialData: InitialDocumentData = null;
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);

    constructor() {
        const data = this.data;

        this.folderMetadata = data.folderMetadata;
        this.inheritedPermissions = data.inheritedPermissions;

        if (data?.initialData) {
            this.initialData = data.initialData;
            this.model.name = this.initialData.name;
        }
    }

    ngOnInit(): void {
        this.membersService
            .getMembers()
            .pipe(first())
            .subscribe({
                next: (accounts: BasicAccount[]) => {
                    const elements = accounts.map(BasicAccount.mapToElement);
                    this.accounts.next(elements);
                    this.accounts.complete();

                    // Set default owner to current user for new documents, or populate from initialData for editing
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

        const request: CreateDocumentRequest = {
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
            request$ = this.docsService.updateDocument(this.folderMetadata.id, this.initialData.id, request);
        } else {
            request$ = this.docsService.createDocument(this.folderMetadata.id, request);
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

export class DocumentModalData {
    folderMetadata: FolderMetadata;
    initialData?: InitialDocumentData;
    inheritedPermissions?: DocumentPermissions;
}

export class InitialDocumentData {
    id: string;
    name?: string;
    owner?: string;
    permissions?: DocumentPermissions;
}
