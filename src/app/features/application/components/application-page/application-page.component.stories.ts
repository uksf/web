import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ApplicationPageComponent } from './application-page.component';
import { SharedModule } from '@shared/shared.module';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '@app/core/services/account.service';
import { ApplicationService } from '../../services/application.service';
import { of } from 'rxjs';
import { ApplicationInfoComponent } from '../application-info/application-info.component';
import { RouterTestingModule } from '@angular/router/testing';

const meta: Meta<ApplicationPageComponent> = {
    title: 'Application/ProgressBar',
    component: ApplicationPageComponent,
    decorators: [
        moduleMetadata({
            imports: [SharedModule, RouterTestingModule],
            declarations: [ApplicationInfoComponent],
            providers: [
                { provide: ApplicationService, useValue: { submitApplication: () => of({}) } },
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: AccountService, useValue: { account: undefined } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<ApplicationPageComponent>;

export const Step1Information: Story = {
    render: (args) => ({
        props: {
            ...args,
            step: 1
        }
    })
};
