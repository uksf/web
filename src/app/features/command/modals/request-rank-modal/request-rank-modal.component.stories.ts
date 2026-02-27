import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { RequestRankModalComponent } from './request-rank-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { MatDialog } from '@angular/material/dialog';
import { MembersService } from '@app/shared/services/members.service';
import { RanksService } from '../../services/ranks.service';
import { CommandRequestsService } from '../../services/command-requests.service';
import { of } from 'rxjs';

const mockAccounts = [
    { id: '1', displayName: 'Tpr. John Smith' },
    { id: '2', displayName: 'Pte. Jane Doe' },
    { id: '3', displayName: 'Cpl. Bob Wilson' }
];

const mockRanks = [
    { name: 'Trooper', abbreviation: 'Tpr' },
    { name: 'Private', abbreviation: 'Pte' },
    { name: 'Corporal', abbreviation: 'Cpl' },
    { name: 'Sergeant', abbreviation: 'Sgt' },
    { name: 'Staff Sergeant', abbreviation: 'SSgt' }
];

const meta: Meta<RequestRankModalComponent> = {
    title: 'Modals/RequestRank',
    component: RequestRankModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                ...modalProviders(null),
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: MembersService, useValue: { getMembers: () => of(mockAccounts) } },
                { provide: RanksService, useValue: { getRanks: () => of(mockRanks) } },
                { provide: CommandRequestsService, useValue: { createRank: () => of({}) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<RequestRankModalComponent>;

export const Default: Story = {};
