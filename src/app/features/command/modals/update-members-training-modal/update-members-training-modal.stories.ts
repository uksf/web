import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { SharedModule } from '@shared/shared.module';
import { modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { MembersService } from '@app/shared/services/members.service';
import { TrainingsService } from '../../services/trainings.service';
import { UpdateMembersTrainingModalComponent } from './update-members-training-modal.component';

const mockAccounts = [
    { id: '1', displayName: 'Tpr. John Smith' },
    { id: '2', displayName: 'Pte. Jane Doe' },
    { id: '3', displayName: 'Cpl. Bob Wilson' }
];

const mockTrainings = [
    { id: 't1', name: 'Combat Medic', shortName: 'CMT', teamspeakGroup: '1' },
    { id: 't2', name: 'Rotary Pilot', shortName: 'RW', teamspeakGroup: '2' },
    { id: 't3', name: 'JTAC', shortName: 'JTAC', teamspeakGroup: '3' }
];

const meta: Meta<UpdateMembersTrainingModalComponent> = {
    title: 'Modals/UpdateMembersTraining',
    component: UpdateMembersTrainingModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: MembersService, useValue: { getMembers: () => of(mockAccounts) } },
                { provide: TrainingsService, useValue: { getTrainings: () => of(mockTrainings), bulkUpdateAccountTrainings: () => of({}) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<UpdateMembersTrainingModalComponent>;

export const Default: Story = {};
