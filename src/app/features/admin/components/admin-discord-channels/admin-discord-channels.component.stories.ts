import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AdminDiscordChannelsComponent } from './admin-discord-channels.component';
import { DiscordChannelContentsService } from '../../services/discord-channel-contents.service';
import { DiscordChannelContent } from '../../models/discord-channel-content';

const lobby: DiscordChannelContent = {
    id: '1',
    channelId: '710495901340139652',
    name: 'Lobby',
    content: 'https://uk-sf.co.uk/assets/dist/images/discord/lobby-banner.png\n---\n## Welcome to UKSF\n\nUKSF is an Arma 3 milsim unit.\n---\n## Join us\n**Apply:** <https://uk-sf.co.uk/application>',
    messageIds: ['1', '2', '3'],
    publishedAt: '2026-11-10T20:00:00Z'
};

const meta: Meta<AdminDiscordChannelsComponent> = {
    title: 'Admin/Discord Channels',
    component: AdminDiscordChannelsComponent,
    decorators: [
        moduleMetadata({
            providers: [
                { provide: DiscordChannelContentsService, useValue: { getAll: () => of([lobby]) } },
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<AdminDiscordChannelsComponent>;

export const Default: Story = {};
