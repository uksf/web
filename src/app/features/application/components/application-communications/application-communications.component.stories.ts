import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ApplicationCommunicationsComponent } from './application-communications.component';
import { SharedModule } from '@shared/shared.module';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '@app/core/services/account.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { of } from 'rxjs';

const mockAccount = {
    teamspeakIdentities: [],
    steamname: '',
    discordId: ''
};

const meta: Meta<ApplicationCommunicationsComponent> = {
    title: 'Application/Communications',
    component: ApplicationCommunicationsComponent,
    decorators: [
        moduleMetadata({
            imports: [SharedModule],
            providers: [
                { provide: ProfileService, useValue: {} },
                { provide: UrlService, useValue: { apiUrl: '' } },
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: AccountService, useValue: { account: { ...mockAccount }, getAccount: () => of({}) } },
                { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<ApplicationCommunicationsComponent>;

export const Pending: Story = {};

export const Steam: Story = {
    render: (args) => ({
        props: {
            ...args,
            mode: 'steam'
        }
    })
};

export const Discord: Story = {
    render: (args) => ({
        props: {
            ...args,
            mode: 'discord'
        }
    })
};
