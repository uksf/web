import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { RequestLoaModalComponent } from './request-loa-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalImports } from '../../../../../.storybook/utils/mock-providers';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CommandRequestsService } from '@app/features/command/services/command-requests.service';
import { of } from 'rxjs';

const MOMENT_DATE_FORMATS = {
    parse: { dateInput: 'DD/MM/YYYY' },
    display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'DD/MM/YYYY',
        monthYearA11yLabel: 'MMMM YYYY'
    }
};

const meta: Meta<RequestLoaModalComponent> = {
    title: 'Modals/RequestLOA',
    component: RequestLoaModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule, MatDatepickerModule, MatCheckboxModule],
            providers: [
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }), closeAll: () => {} } },
                { provide: CommandRequestsService, useValue: { createLoa: () => of({}) } },
                { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
                { provide: MAT_DATE_FORMATS, useValue: MOMENT_DATE_FORMATS },
                { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
                { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<RequestLoaModalComponent>;

export const Default: Story = {};

export const Filled: Story = {};

export const LateEmergency: Story = {};
