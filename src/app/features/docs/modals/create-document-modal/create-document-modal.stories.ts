import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CreateDocumentModalComponent, DocumentModalData } from './create-document-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { DocsService } from '../../services/docs.service';
import { MembersService } from '@app/shared/services/members.service';
import { AccountService } from '@app/core/services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { DocsPermissionsComponent } from '../../components/docs-permissions/docs-permissions.component';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { of } from 'rxjs';

const dialogData: DocumentModalData = {
    folderMetadata: { id: 'folder-1', name: 'Test Folder', documents: [], folders: [] } as any,
    inheritedPermissions: undefined
};

const meta: Meta<CreateDocumentModalComponent> = {
    title: 'Modals/CreateDocument',
    component: CreateDocumentModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule, MatExpansionModule],
            declarations: [DocsPermissionsComponent],
            providers: [
                ...modalProviders(dialogData),
                { provide: DocsService, useValue: { createDocument: () => of({}), updateDocument: () => of({}) } },
                { provide: MembersService, useValue: { getMembers: () => of([]) } },
                { provide: AccountService, useValue: { account: { id: 'user-1' } } },
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: HttpClient, useValue: {} },
                { provide: UrlService, useValue: { apiUrl: '' } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<CreateDocumentModalComponent>;

export const Default: Story = {};
