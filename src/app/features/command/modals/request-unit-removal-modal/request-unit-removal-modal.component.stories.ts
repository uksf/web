import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { RequestUnitRemovalModalComponent } from './request-unit-removal-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalImports } from '../../../../../../.storybook/utils/mock-providers';
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

const meta: Meta<RequestUnitRemovalModalComponent> = {
    title: 'Modals/RequestUnitRemoval',
    component: RequestUnitRemovalModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: MembersService, useValue: { getMembers: () => of(mockAccounts) } },
                { provide: UnitsService, useValue: { getUnits: () => of([]) } },
                { provide: CommandRequestsService, useValue: { createUnitRemoval: () => of({}) } },
                { provide: LoggingService, useValue: { error: () => {} } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<RequestUnitRemovalModalComponent>;

export const Default: Story = {};
