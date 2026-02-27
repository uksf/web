import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CreateFolderModalComponent, FolderModalData } from './create-folder-modal.component';
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

const dialogData: FolderModalData = {
    parent: 'root',
    inheritedPermissions: undefined
};

const meta: Meta<CreateFolderModalComponent> = {
    title: 'Modals/CreateFolder',
    component: CreateFolderModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule, MatExpansionModule],
            declarations: [DocsPermissionsComponent],
            providers: [
                ...modalProviders(dialogData),
                { provide: DocsService, useValue: { createFolder: () => of({}), updateFolder: () => of({}) } },
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
type Story = StoryObj<CreateFolderModalComponent>;

export const Default: Story = {};
