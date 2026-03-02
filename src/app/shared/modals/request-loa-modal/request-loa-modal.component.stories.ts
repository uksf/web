import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { RequestLoaModalComponent } from './request-loa-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalImports } from '../../../../../.storybook/utils/mock-providers';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommandRequestsService } from '@app/features/command/services/command-requests.service';
import { of } from 'rxjs';

const meta: Meta<RequestLoaModalComponent> = {
    title: 'Modals/RequestLOA',
    component: RequestLoaModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule, MatCheckboxModule],
            providers: [
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }), closeAll: () => {} } },
                { provide: CommandRequestsService, useValue: { createLoa: () => of({}) } },
                provideNativeDateAdapter()
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<RequestLoaModalComponent>;

export const Default: Story = {};

export const Filled: Story = {};

export const LateEmergency: Story = {};
