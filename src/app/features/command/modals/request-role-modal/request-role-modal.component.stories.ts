import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { RequestRoleModalComponent } from './request-role-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { MatDialog } from '@angular/material/dialog';
import { MembersService } from '@app/shared/services/members.service';
import { RolesService } from '../../services/roles.service';
import { CommandRequestsService } from '../../services/command-requests.service';
import { of } from 'rxjs';

const mockAccounts = [
    { id: '1', displayName: 'Tpr. John Smith' },
    { id: '2', displayName: 'Pte. Jane Doe' },
    { id: '3', displayName: 'Cpl. Bob Wilson' }
];

const mockRolesDataset = {
    roles: [
        { name: 'Medic' },
        { name: 'Signaller' },
        { name: 'Engineer' },
        { name: 'JTAC' }
    ]
};

const meta: Meta<RequestRoleModalComponent> = {
    title: 'Modals/RequestRole',
    component: RequestRoleModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                ...modalProviders(null),
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: MembersService, useValue: { getMembers: () => of(mockAccounts), getAccount: () => of({ roleAssignment: '' }) } },
                { provide: RolesService, useValue: { getRoles: () => of(mockRolesDataset) } },
                { provide: CommandRequestsService, useValue: { createRole: () => of({}) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<RequestRoleModalComponent>;

export const Default: Story = {};
