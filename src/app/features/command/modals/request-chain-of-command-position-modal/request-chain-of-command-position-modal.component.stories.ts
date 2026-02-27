import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { RequestChainOfCommandPositionModalComponent } from './request-chain-of-command-position-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { MatDialog } from '@angular/material/dialog';
import { MembersService } from '@app/shared/services/members.service';
import { UnitsService } from '../../services/units.service';
import { CommandRequestsService } from '../../services/command-requests.service';
import { of } from 'rxjs';

const mockAccounts = [
    { id: '1', displayName: 'Sgt. John Smith' },
    { id: '2', displayName: 'SSgt. Jane Doe' },
    { id: '3', displayName: 'Cpl. Bob Wilson' }
];

const meta: Meta<RequestChainOfCommandPositionModalComponent> = {
    title: 'Modals/RequestChainOfCommandPosition',
    component: RequestChainOfCommandPositionModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: MembersService, useValue: { getMembers: () => of(mockAccounts) } },
                { provide: UnitsService, useValue: { getUnits: () => of([]) } },
                { provide: CommandRequestsService, useValue: { createChainOfCommandPosition: () => of({}) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<RequestChainOfCommandPositionModalComponent>;

export const Default: Story = {};
