import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommentDisplayComponent } from './comment-display.component';
import { SharedModule } from '@shared/shared.module';
import { CommentThreadService } from '@app/shared/services/comment-thread.service';
import { AccountService } from '@app/core/services/account.service';
import { SignalRService } from '@app/core/services/signalr.service';
import { of, Subject } from 'rxjs';

const mockComments = [
    { id: '1', displayName: 'Sgt. Smith', content: 'Application looks good. Training records are up to date.', timestamp: new Date(Date.now() - 3600000).toISOString(), author: '1' },
    { id: '2', displayName: 'Cpl. Jones', content: 'I can vouch for this member. Active in operations.', timestamp: new Date(Date.now() - 7200000).toISOString(), author: '2' },
    { id: '3', displayName: 'SSgt. Williams', content: 'Approved. Meets all requirements for promotion.', timestamp: new Date(Date.now() - 86400000).toISOString(), author: '3' }
];

const mockHubConnection = {
    connection: { on: () => {}, off: () => {}, stop: () => {} },
    reconnectEvent: new Subject()
};

const meta: Meta<CommentDisplayComponent> = {
    title: 'Components/CommentDisplay',
    component: CommentDisplayComponent,
    decorators: [
        moduleMetadata({
            imports: [SharedModule],
            providers: [
                { provide: CommentThreadService, useValue: {
                    getComments: () => of({ comments: mockComments }),
                    canPost: () => of(true),
                    postComment: () => of({}),
                    deleteComment: () => of({})
                }},
                { provide: AccountService, useValue: { account: { id: '1' } } },
                { provide: SignalRService, useValue: { connect: () => mockHubConnection } }
            ]
        })
    ],
    args: {
        threadId: 'test-thread'
    }
};
export default meta;
type Story = StoryObj<CommentDisplayComponent>;

export const WithComments: Story = {};

export const Empty: Story = {
    decorators: [
        moduleMetadata({
            providers: [
                { provide: CommentThreadService, useValue: {
                    getComments: () => of({ comments: [] }),
                    canPost: () => of(true),
                    postComment: () => of({}),
                    deleteComment: () => of({})
                }}
            ]
        })
    ]
};
