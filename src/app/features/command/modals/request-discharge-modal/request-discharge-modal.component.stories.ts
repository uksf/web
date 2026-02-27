import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { RequestDischargeModalComponent } from './request-discharge-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { MatDialog } from '@angular/material/dialog';
import { MembersService } from '@app/shared/services/members.service';
import { CommandRequestsService } from '../../services/command-requests.service';
import { of } from 'rxjs';

const mockAccounts = [
    { id: '1', displayName: 'Tpr. John Smith' },
    { id: '2', displayName: 'Pte. Jane Doe' },
    { id: '3', displayName: 'Cpl. Bob Wilson' }
];

const meta: Meta<RequestDischargeModalComponent> = {
    title: 'Modals/RequestDischarge',
    component: RequestDischargeModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: MembersService, useValue: { getMembers: () => of(mockAccounts) } },
                { provide: CommandRequestsService, useValue: { createDischarge: () => of({}) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<RequestDischargeModalComponent>;

export const Default: Story = {};
