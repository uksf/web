import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { AddRankModalComponent } from './add-rank-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { MatDialog } from '@angular/material/dialog';
import { RanksService } from '../../services/ranks.service';
import { of } from 'rxjs';

const meta: Meta<AddRankModalComponent> = {
    title: 'Modals/AddRank',
    component: AddRankModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: RanksService, useValue: { addRank: () => of({}), checkRankName: () => of(false) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<AddRankModalComponent>;

export const Default: Story = {};
