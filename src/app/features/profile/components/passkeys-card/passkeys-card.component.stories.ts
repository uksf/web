import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { of } from 'rxjs';
import { MatCard } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { PasskeysCardComponent } from './passkeys-card.component';
import { Passkey, PasskeyService } from '@app/core/services/authentication/passkey.service';

const passkeys: Passkey[] = [
    { id: '1', name: 'iCloud Keychain', created: '2026-09-01T10:00:00Z', lastUsed: '2026-09-28T19:30:00Z' },
    { id: '2', name: 'Bitwarden', created: '2026-09-20T10:00:00Z' }
] as Passkey[];

const withPasskeys = (list: Passkey[]) =>
    moduleMetadata({
        providers: [
            { provide: PasskeyService, useValue: { supported: true, list: () => of({ passkeys: list, hasPassword: true }) } },
            { provide: MatDialog, useValue: {} }
        ]
    });

const meta: Meta<PasskeysCardComponent> = {
    title: 'Profile/PasskeysCard',
    component: PasskeysCardComponent,
    decorators: [
        moduleMetadata({ imports: [MatCard] }),
        (story) => ({
            ...story(),
            template: `<div style="width: 320px"><mat-card><h3 style="margin: 0">Settings</h3></mat-card><app-passkeys-card></app-passkeys-card></div>`
        })
    ]
};
export default meta;
type Story = StoryObj<PasskeysCardComponent>;

export const WithPasskeys: Story = { decorators: [withPasskeys(passkeys)] };

export const Empty: Story = { decorators: [withPasskeys([])] };
