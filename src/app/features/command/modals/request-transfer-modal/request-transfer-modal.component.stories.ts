import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { RequestTransferModalComponent } from './request-transfer-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { MatDialog } from '@angular/material/dialog';
import { MembersService } from '@app/shared/services/members.service';
import { UnitsService } from '../../services/units.service';
import { CommandRequestsService } from '../../services/command-requests.service';
import { LoggingService } from '@app/core/services/logging.service';
import { of } from 'rxjs';

const mockAccounts = [
    { id: '1', displayName: 'Tpr. John Smith' },
    { id: '2', displayName: 'Pte. Jane Doe' },
    { id: '3', displayName: 'Cpl. Bob Wilson' }
];

const mockUnits = [
    { id: '1', name: '1 Troop' },
    { id: '2', name: '2 Troop' },
    { id: '3', name: 'HQ' },
    { id: '4', name: 'Air Troop' }
];

const meta: Meta<RequestTransferModalComponent> = {
    title: 'Modals/RequestTransfer',
    component: RequestTransferModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                ...modalProviders(null),
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: MembersService, useValue: { getMembers: () => of(mockAccounts), getAccount: () => of({ unitAssignment: '' }) } },
                { provide: UnitsService, useValue: { getUnits: () => of(mockUnits) } },
                { provide: CommandRequestsService, useValue: { createTransfer: () => of({}) } },
                { provide: LoggingService, useValue: { error: () => {} } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<RequestTransferModalComponent>;

export const Default: Story = {};
