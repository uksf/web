import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { AddTrainingModalComponent } from './add-training-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { MatDialog } from '@angular/material/dialog';
import { TrainingsService } from '../../services/trainings.service';
import { of } from 'rxjs';

const meta: Meta<AddTrainingModalComponent> = {
    title: 'Modals/AddTraining',
    component: AddTrainingModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: TrainingsService, useValue: { addTraining: () => of({}), checkUnique: () => of(true) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<AddTrainingModalComponent>;

export const Default: Story = {};
