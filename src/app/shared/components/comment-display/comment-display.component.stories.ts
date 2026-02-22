import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

const meta: Meta = {
    title: 'Components/CommentDisplay',
    decorators: [moduleMetadata({ imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [
    `.comment-form { display: flex; flex-direction: column; }
     .comment-form form { flex: 1; }
     .comment-form app-text-input { width: 100%; }
     .comment-form button { align-self: flex-end; width: fit-content; margin-top: 8px; }
     .comments-container { display: flex; flex-direction: column; gap: 4px; }
     .comment-wrapper { padding: 8px 0; }
     .author { display: flex; align-items: center; gap: 8px; }
     .author-string { font-weight: 500; font-size: 14px; }
     .date-string { font-size: 12px; opacity: 0.7; }
     .delete-button { min-width: 0; padding: 0 8px; }
     .comment { margin-top: 4px; }
     .comment-string { font-size: 14px; white-space: pre-wrap; }`
];

const makeComments = () => [
    { id: '1', displayName: 'Sgt. Smith', content: 'Application looks good. Training records are up to date.', timestamp: new Date(Date.now() - 3600000).toISOString(), author: '1' },
    { id: '2', displayName: 'Cpl. Jones', content: 'I can vouch for this member. Active in operations.', timestamp: new Date(Date.now() - 7200000).toISOString(), author: '2' },
    { id: '3', displayName: 'SSgt. Williams', content: 'Approved. Meets all requirements for promotion.', timestamp: new Date(Date.now() - 86400000).toISOString(), author: '3' }
];

const commentTemplate = (canPost: boolean, comments: string) => `
    <div style="max-width: 600px;">
        ${canPost ? `
        <div class="comment-form">
            <form>
                <app-text-input label="Enter comment" [multiline]="true" [maxRows]="10" [maxlength]="1000" [reserveErrorSpace]="false">
                </app-text-input>
            </form>
            <button mat-button type="submit">Submit</button>
        </div>` : ''}
        <div class="comments-container">
            <div class="comment-wrapper" *ngFor="let comment of ${comments}">
                <div class="author">
                    <span class="author-string">{{ comment.displayName }}</span>
                    <span class="date-string">{{ comment.timestamp }}</span>
                    <button class="delete-button" mat-button>
                        <mat-icon>delete</mat-icon>
                    </button>
                </div>
                <div class="comment">
                    <span class="comment-string">{{ comment.content }}</span>
                </div>
            </div>
        </div>
    </div>
`;

export const WithComments: Story = {
    render: () => ({
        props: { comments: makeComments() },
        styles,
        template: commentTemplate(true, 'comments')
    })
};

export const ReadOnly: Story = {
    render: () => ({
        props: { comments: makeComments() },
        styles,
        template: commentTemplate(false, 'comments')
    })
};

export const Empty: Story = {
    render: () => ({
        props: { comments: [] },
        styles,
        template: commentTemplate(true, 'comments')
    })
};
