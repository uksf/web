import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

const meta: Meta = {
    title: 'Layout/HeaderBar',
    decorators: [
        moduleMetadata({
            imports: [MatIconModule, MatButtonModule, MatMenuModule]
        })
    ]
};
export default meta;
type Story = StoryObj;

const styles = [
    `.header-wrapper {
        display: flex; flex-direction: row; align-items: center;
        height: 70px; background-color: #1e1e1e; padding: 0 10px;
    }
    .header-wrapper.development { border-bottom: 2px solid #f44336; }
    .logo-wrapper {
        font-size: 28px; padding: 0; height: 100%;
        align-items: center; display: flex; flex-direction: row; cursor: pointer;
    }
    .logo { width: 65px; margin-left: 10px; margin-top: 6px; margin-bottom: 4px; }
    .name-wrapper { height: 70px; line-height: 70px; text-align: center; }
    .name-wrapper span { display: inline-block; vertical-align: middle; line-height: normal; margin-right: 20px; cursor: pointer; }
    .button-wrapper { display: flex; flex-direction: row; align-items: center; height: 100%; }
    .button { flex: 1; padding: 0 10px 0 5px; margin-right: 10px; min-width: fit-content; }
    .button div { display: flex; flex-direction: row; align-items: center; }
    .button div span { text-align: center; width: 100%; }
    .button div > .mat-icon { height: 30px; margin: 0 5px 0 0; }
    .button.profile { padding: 5px; min-width: 25px; border-radius: 20px; height: 40px; }
    .button.profile .mat-icon { width: 30px; height: 30px; margin: 0; font-size: 30px; line-height: 30px; }
    a { text-decoration: none; }`
];

export const LoggedIn: Story = {
    render: () => ({
        props: { name: 'Sgt.Miller.B' },
        styles,
        template: `
            <div class="header-wrapper">
                <div class="logo-wrapper">
                    <span>United Kingdom Special Forces</span>
                </div>
                <app-flex-filler></app-flex-filler>
                <div class="name-wrapper">
                    <span>{{ name }}</span>
                </div>
                <div class="button-wrapper">
                    <button mat-raised-button color="primary" class="button profile">
                        <mat-icon>account_circle</mat-icon>
                    </button>
                </div>
            </div>
        `
    })
};

export const Development: Story = {
    render: () => ({
        props: { name: 'Sgt.Miller.B' },
        styles,
        template: `
            <div class="header-wrapper development">
                <div class="logo-wrapper">
                    <span>United Kingdom Special Forces</span>
                </div>
                <app-flex-filler></app-flex-filler>
                <div class="name-wrapper">
                    <span>{{ name }}</span>
                </div>
                <div class="button-wrapper">
                    <button mat-raised-button color="primary" class="button profile">
                        <mat-icon>account_circle</mat-icon>
                    </button>
                </div>
            </div>
        `
    })
};

export const NotLoggedIn: Story = {
    render: () => ({
        styles,
        template: `
            <div class="header-wrapper">
                <div class="logo-wrapper">
                    <span>United Kingdom Special Forces</span>
                </div>
                <app-flex-filler></app-flex-filler>
                <div class="button-wrapper">
                    <button mat-raised-button color="primary" class="button">
                        <div><mat-icon>person</mat-icon> Login</div>
                    </button>
                </div>
            </div>
        `
    })
};
