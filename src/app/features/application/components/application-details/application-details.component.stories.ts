import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ApplicationDetailsComponent } from './application-details.component';
import { SharedModule } from '@shared/shared.module';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

const meta: Meta<ApplicationDetailsComponent> = {
    title: 'Application/Details',
    component: ApplicationDetailsComponent,
    decorators: [
        moduleMetadata({
            imports: [SharedModule],
            providers: [
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<ApplicationDetailsComponent>;

export const Empty: Story = {};
