import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';

const meta: Meta = {
    title: 'Modals/Message',
    decorators: [moduleMetadata({ imports: [MatDialogModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.message-container { min-width: 300px; max-height: 600px; font-size: 18px; } .message-container p { white-space: pre-wrap; }`];

export const Default: Story = {
    render: () => ({
        styles,
        template: `
            <h2 mat-dialog-title>Message</h2>
            <mat-dialog-content>
                <div class="message-container">
                    <p>Your application has been submitted successfully.</p>
                </div>
            </mat-dialog-content>
            <mat-dialog-actions>
                <button mat-raised-button color="primary">Close</button>
            </mat-dialog-actions>
        `
    })
};

export const CustomTitle: Story = {
    render: () => ({
        styles,
        template: `
            <h2 mat-dialog-title>Server Status</h2>
            <mat-dialog-content>
                <div class="message-container">
                    <p>The game server is currently undergoing maintenance. Expected downtime: 30 minutes.</p>
                </div>
            </mat-dialog-content>
            <mat-dialog-actions>
                <button mat-raised-button color="primary">Understood</button>
            </mat-dialog-actions>
        `
    })
};

export const LongMessage: Story = {
    render: () => ({
        styles,
        template: `
            <h2 mat-dialog-title>Release Notes</h2>
            <mat-dialog-content>
                <div class="message-container">
                    <p>Version 2.5.0 includes the following changes:

- Updated modpack configuration
- Fixed server connection timeout issues
- Improved mission file handling
- Added new training scenarios
- Updated TeamSpeak integration
- Fixed Discord webhook notifications
- Performance improvements for large unit rosters</p>
                </div>
            </mat-dialog-content>
            <mat-dialog-actions>
                <button mat-raised-button color="primary">Close</button>
            </mat-dialog-actions>
        `
    })
};
