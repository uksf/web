import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const meta: Meta = {
    title: 'Application/Communications',
    decorators: [
        moduleMetadata({
            imports: [MatCardModule, MatProgressSpinnerModule]
        })
    ]
};
export default meta;
type Story = StoryObj;

const styles = [
    `.mat-mdc-card { h2 { margin-top: 0; } }
    .flex-container.row { display: flex; flex-direction: row; }
    h4 { color: #fec400; }`
];

export const Pending: Story = {
    render: () => ({
        styles,
        template: `
            <mat-card>
                <h2>Communications</h2>
                <p>We require a few different communications platforms to be connected before completing the application. Please follow the instructions for each platform below.</p>
                <br />
                <div class="flex-container row">
                    <app-flex-filler></app-flex-filler>
                    <mat-spinner></mat-spinner>
                    <app-flex-filler></app-flex-filler>
                </div>
            </mat-card>
        `
    })
};

export const SteamConnect: Story = {
    render: () => ({
        styles,
        template: `
            <mat-card>
                <h2>Communications</h2>
                <p>We require a few different communications platforms to be connected before completing the application. Please follow the instructions for each platform below.</p>
                <br />
                <div>
                    <p>You must connect this account to your Steam account. We only store your steam64 ID in our database to allow our recruitment staff to contact you easily.</p>
                    <p>You will be redirected to login through Steam and then returned to this page automatically.</p>
                    <app-button>Connect Steam</app-button>
                </div>
            </mat-card>
        `
    })
};

export const DiscordConnect: Story = {
    render: () => ({
        styles,
        template: `
            <mat-card>
                <h2>Communications</h2>
                <p>We require a few different communications platforms to be connected before completing the application. Please follow the instructions for each platform below.</p>
                <br />
                <div>
                    <p>You must connect this account to your Discord account. We only store your Discord ID in our database.</p>
                    <p>You will be redirected to login through Discord and then returned to this page automatically.</p>
                    <app-button>Connect Discord</app-button>
                </div>
            </mat-card>
        `
    })
};
