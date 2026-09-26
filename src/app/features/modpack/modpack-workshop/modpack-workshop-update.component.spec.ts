import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ModpackWorkshopComponent } from './modpack-workshop.component';
import { of, Subject, throwError } from 'rxjs';
import { WorkshopMod, WorkshopModStatus } from '../models/workshop-mod';
import { WorkshopService } from '../services/workshop.service';
import { ModpackHubService } from '../services/modpack-hub.service';
import { MatDialog } from '@angular/material/dialog';

describe('ModpackWorkshopComponent update', () => {
    let component: ModpackWorkshopComponent;
    let mockWorkshopService: any;
    let mockDialog: any;

    const makeMod = (overrides: Partial<WorkshopMod> = {}): WorkshopMod => ({
        id: 'mod1',
        steamId: '12345',
        name: 'Test Mod',
        status: 'Installed' as WorkshopModStatus,
        statusMessage: '',
        errorMessage: '',
        lastUpdatedLocally: '2026-01-01T00:00:00Z',
        modpackVersionFirstAdded: '1.0',
        modpackVersionLastUpdated: '1.0',
        rootMod: false,
        folderName: null,
        pbos: [],
        extensions: [],
        availablePbos: [],
        availableExtensions: [],
        ...overrides
    });

    beforeEach(() => {
        mockWorkshopService = {
            getMod: vi.fn().mockReturnValue(of(makeMod())),
            updateMod: vi.fn().mockReturnValue(of(undefined))
        };
        mockDialog = { open: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                ModpackWorkshopComponent,
                { provide: WorkshopService, useValue: mockWorkshopService },
                { provide: ModpackHubService, useValue: { connect: vi.fn(), disconnect: vi.fn(), on: vi.fn(), off: vi.fn(), reconnected$: new Subject<void>() } },
                { provide: MatDialog, useValue: mockDialog }
            ]
        });
        component = TestBed.inject(ModpackWorkshopComponent);
    });

    it('marks the mod as updating straight away so the update button is hidden', () => {
        const mod = makeMod({ updatedDate: '2026-02-01T00:00:00Z' });
        component.mods = [mod];
        component.updateModComputedProperties();
        expect(mod._updateAvailable).toBe(true);

        component.update(mod);

        expect(mod.status).toBe('Updating');
        expect(mod._updateAvailable).toBe(false);
        expect(component.sections.find((section) => section.key === 'inProgress').mods).toContain(mod);
    });

    it('reloads the mod and opens message dialog on error', () => {
        mockWorkshopService.updateMod.mockReturnValue(throwError(() => ({ error: 'Update failed' })));
        const mod = makeMod();
        component.mods = [mod];

        component.update(mod);

        expect(mockWorkshopService.getMod).toHaveBeenCalledWith('mod1');
        expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), { data: { message: 'Update failed' } });
    });
});
