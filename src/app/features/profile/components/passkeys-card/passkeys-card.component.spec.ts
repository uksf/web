import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { PasskeysCardComponent } from './passkeys-card.component';
import { PasskeyService } from '@app/core/services/authentication/passkey.service';

describe('PasskeysCardComponent', () => {
    const existing = { id: '1', name: 'iCloud Keychain', created: '2026-09-01T00:00:00Z', lastUsed: null, isBackedUp: true };
    let component: PasskeysCardComponent;
    let mockPasskeyService: any;
    let mockDialog: any;

    beforeEach(() => {
        mockPasskeyService = {
            supported: true,
            list: vi.fn().mockReturnValue(of({ hasPassword: true, passkeys: [existing] })),
            add: vi.fn(),
            remove: vi.fn().mockReturnValue(of(undefined))
        };
        mockDialog = { open: vi.fn().mockReturnValue({ afterClosed: () => of(true) }) };
        TestBed.configureTestingModule({
            providers: [PasskeysCardComponent, { provide: PasskeyService, useValue: mockPasskeyService }, { provide: MatDialog, useValue: mockDialog }]
        });
        component = TestBed.inject(PasskeysCardComponent);
        component.ngOnInit();
    });

    it('lists the passkeys', () => {
        expect(component.passkeys).toEqual([existing]);
    });

    it('adds a passkey', async () => {
        const added = { ...existing, id: '2', name: 'Bitwarden' };
        mockPasskeyService.add.mockResolvedValue(added);

        await component.add();

        expect(component.passkeys).toEqual([existing, added]);
        expect(component.pending).toBe(false);
    });

    it('explains when the password manager already holds a passkey', async () => {
        mockPasskeyService.add.mockRejectedValue(new DOMException('exists', 'InvalidStateError'));

        await component.add();

        expect(mockDialog.open.mock.calls[0][1].data.message).toBe('This device or password manager already has a UKSF passkey');
    });

    it('stays quiet when the prompt is cancelled', async () => {
        mockPasskeyService.add.mockRejectedValue(new DOMException('cancelled', 'NotAllowedError'));

        await component.add();

        expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('removes a passkey after confirmation', () => {
        component.remove(existing);

        expect(mockPasskeyService.remove).toHaveBeenCalledWith('1');
        expect(component.passkeys).toEqual([]);
    });

    it('keeps the passkey when removal is refused', () => {
        mockPasskeyService.remove.mockReturnValue(throwError(() => ({ error: 'Set a password before removing your only passkey' })));

        component.remove(existing);

        expect(component.passkeys).toEqual([existing]);
        expect(mockDialog.open.mock.calls[1][1].data.message).toBe('Set a password before removing your only passkey');
    });
});
