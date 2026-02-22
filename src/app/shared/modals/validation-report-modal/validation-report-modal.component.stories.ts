import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

const meta: Meta = {
    title: 'Modals/ValidationReport',
    decorators: [moduleMetadata({ imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatTooltipModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [
    `.flex-container { display: flex; flex-direction: column; width: 100%; min-width: 600px; min-height: 200px; font-size: 18px; }
     .title-container { display: flex; flex-direction: row; width: 100%; }
     .error { font-weight: bolder; }
     span { line-height: 40px; }
     .message-container { max-height: 500px; margin: 10px; margin-top: 30px; overflow: auto; }
     p { white-space: pre-wrap; }
     a { text-decoration: none; }`
];

export const SingleMessage: Story = {
    render: () => ({
        props: {
            title: 'Validation Report',
            message: {
                title: 'Missing Required Fields',
                detail: 'The following fields are required but were not provided:\n\n- First Name\n- Last Name\n- Date of Birth',
                error: false
            }
        },
        styles,
        template: `
            <h2 mat-dialog-title>{{ title }}</h2>
            <mat-dialog-content>
                <div class="flex-container">
                    <div class="title-container" [ngClass]="{'error': message.error}">
                        <app-flex-filler></app-flex-filler>
                        <span [innerHtml]="message.title"></span>
                        <app-flex-filler></app-flex-filler>
                    </div>
                    <div class="message-container">
                        <p [innerHtml]="message.detail"></p>
                    </div>
                </div>
            </mat-dialog-content>
            <mat-dialog-actions>
                <button mat-raised-button color="primary">Close</button>
            </mat-dialog-actions>
        `
    })
};

export const ErrorMessage: Story = {
    render: () => ({
        props: {
            title: 'Build Validation Failed',
            message: {
                title: '<strong>Critical Error</strong>',
                detail: 'Failed to compile mission file:\n\nError on line 42: Undefined variable "player_count"\nExpected: integer\nGot: undefined\n\nPlease fix this error and try again.',
                error: true
            }
        },
        styles,
        template: `
            <h2 mat-dialog-title>{{ title }}</h2>
            <mat-dialog-content>
                <div class="flex-container">
                    <div class="title-container" [ngClass]="{'error': message.error}">
                        <app-flex-filler></app-flex-filler>
                        <span [innerHtml]="message.title"></span>
                        <app-flex-filler></app-flex-filler>
                    </div>
                    <div class="message-container">
                        <p [innerHtml]="message.detail"></p>
                    </div>
                </div>
            </mat-dialog-content>
            <mat-dialog-actions>
                <button mat-raised-button color="primary">Close</button>
            </mat-dialog-actions>
        `
    })
};

export const MultipleMessages: Story = {
    render: () => ({
        props: {
            title: 'Modpack Validation',
            messages: [
                {
                    title: 'Warning 1 of 3',
                    detail: 'Mod "@ace" has an outdated version. Current: 3.14.0, Latest: 3.15.1\n\nThis may cause compatibility issues with the latest mission files.',
                    error: false
                },
                {
                    title: 'Warning 2 of 3',
                    detail: 'Mod "@tfar" configuration file is missing optional parameter "terrain_interception_coefficient".\n\nDefault value will be used.',
                    error: false
                },
                {
                    title: '<strong>Error 3 of 3</strong>',
                    detail: 'Mod "@cba_a3" failed integrity check.\n\nExpected hash: 4a8f2b...\nActual hash: 9c3d1e...\n\nPlease redownload this mod.',
                    error: true
                }
            ],
            index: 0,
            get message() { return this.messages[this.index]; },
            next() { this.index = (this.index + 1) % this.messages.length; },
            previous() { this.index = (this.index - 1 + this.messages.length) % this.messages.length; }
        },
        styles,
        template: `
            <h2 mat-dialog-title>{{ title }}</h2>
            <mat-dialog-content>
                <div class="flex-container">
                    <div class="title-container" [ngClass]="{'error': messages[index].error}">
                        <button mat-mini-fab color="accent" (click)="previous()" matTooltip="Previous">
                            <mat-icon>navigate_before</mat-icon>
                        </button>
                        <app-flex-filler></app-flex-filler>
                        <span [innerHtml]="messages[index].title"></span>
                        <app-flex-filler></app-flex-filler>
                        <button mat-mini-fab color="accent" (click)="next()" matTooltip="Next">
                            <mat-icon>navigate_next</mat-icon>
                        </button>
                    </div>
                    <div class="message-container">
                        <p [innerHtml]="messages[index].detail"></p>
                    </div>
                </div>
            </mat-dialog-content>
            <mat-dialog-actions>
                <button mat-raised-button color="primary">Close</button>
            </mat-dialog-actions>
        `
    })
};
