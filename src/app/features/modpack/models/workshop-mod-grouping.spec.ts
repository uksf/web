import { describe, it, expect } from 'vitest';
import { WorkshopMod, WorkshopModStatus } from './workshop-mod';
import {
    applyComputedProperties,
    canDelete,
    canUninstall,
    groupModsIntoSections,
    hasError,
    interventionLabel,
    interventionRequired,
    neverReleased,
    updateAvailable
} from './workshop-mod-grouping';

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
    rootMod: true,
    folderName: '@testmod',
    pbos: [],
    extensions: [],
    availablePbos: [],
    availableExtensions: [],
    ...overrides
});

const sectionOf = (mods: WorkshopMod[], key: string) => {
    mods.forEach(applyComputedProperties);
    return groupModsIntoSections(mods, '').find((section) => section.key === key);
};

describe('interventionRequired', () => {
    it('returns true for InterventionRequired status', () => {
        expect(interventionRequired(makeMod({ status: 'InterventionRequired' }))).toBe(true);
    });

    it('returns false for other statuses', () => {
        expect(interventionRequired(makeMod({ status: 'Installed' }))).toBe(false);
    });
});

describe('interventionLabel', () => {
    it('describes file selection when files are awaiting selection', () => {
        expect(interventionLabel(makeMod({ status: 'InterventionRequired', availablePbos: ['mod.pbo'] }))).toBe('Select files to install');
    });

    it('describes file selection when only non-PBO files are awaiting selection', () => {
        expect(interventionLabel(makeMod({ status: 'InterventionRequired', availablePbos: [], availableExtensions: ['ctab_connect.dll'] }))).toBe(
            'Select files to install'
        );
    });

    it('falls back to a generic label when there is nothing to select', () => {
        expect(interventionLabel(makeMod({ status: 'InterventionRequired', availablePbos: [], availableExtensions: [] }))).toBe('Resolve intervention');
    });
});

describe('updateAvailable', () => {
    it('returns true when remote is newer than local', () => {
        expect(updateAvailable(makeMod({ updatedDate: '2026-02-01T00:00:00Z', lastUpdatedLocally: '2026-01-01T00:00:00Z' }))).toBe(true);
    });

    it('returns false when dates are equal', () => {
        expect(updateAvailable(makeMod({ updatedDate: '2026-01-01T00:00:00Z', lastUpdatedLocally: '2026-01-01T00:00:00Z' }))).toBe(false);
    });

    it('returns false when updatedDate is unknown', () => {
        expect(updateAvailable(makeMod({ updatedDate: null }))).toBe(false);
    });

    it('returns false when date is zero value', () => {
        expect(updateAvailable(makeMod({ updatedDate: '0001-01-01T00:00:00.0000000Z', lastUpdatedLocally: '2026-01-01T00:00:00Z' }))).toBe(false);
    });

    it.each(['Error', 'InterventionRequired'] as WorkshopModStatus[])('returns false for %s even when remote is newer', (status) => {
        expect(updateAvailable(makeMod({ status, updatedDate: '2026-02-01T00:00:00Z', lastUpdatedLocally: '2026-01-01T00:00:00Z' }))).toBe(false);
    });
});

describe('canUninstall', () => {
    it.each(['InstalledPendingRelease', 'Installed', 'UpdatedPendingRelease', 'InterventionRequired', 'Error'] as WorkshopModStatus[])(
        'returns true for %s',
        (status) => {
            expect(canUninstall(makeMod({ status }))).toBe(true);
        }
    );

    it.each(['Uninstalled', 'Installing', 'Updating', 'Uninstalling'] as WorkshopModStatus[])('returns false for %s', (status) => {
        expect(canUninstall(makeMod({ status }))).toBe(false);
    });
});

describe('canDelete', () => {
    it('returns true for Uninstalled', () => {
        expect(canDelete(makeMod({ status: 'Uninstalled' }))).toBe(true);
    });

    it('returns false for Installed', () => {
        expect(canDelete(makeMod({ status: 'Installed' }))).toBe(false);
    });
});

describe('neverReleased', () => {
    it.each([null, ''])('returns true when modpackVersionFirstAdded is %s', (version) => {
        expect(neverReleased(makeMod({ modpackVersionFirstAdded: version }))).toBe(true);
    });

    it('returns false when modpackVersionFirstAdded is set', () => {
        expect(neverReleased(makeMod({ modpackVersionFirstAdded: '5.23.7' }))).toBe(false);
    });
});

describe('hasError', () => {
    it('returns true for Error status', () => {
        expect(hasError(makeMod({ status: 'Error' }))).toBe(true);
    });

    it('returns false for non-error status', () => {
        expect(hasError(makeMod({ status: 'Installed' }))).toBe(false);
    });
});

describe('applyComputedProperties', () => {
    it('sets every computed property', () => {
        const mod = makeMod({
            status: 'InterventionRequired',
            availablePbos: ['mod.pbo'],
            updatedDate: '2026-02-01T00:00:00Z',
            modpackVersionFirstAdded: null
        });

        applyComputedProperties(mod);

        expect(mod._hasError).toBe(false);
        expect(mod._canUninstall).toBe(true);
        expect(mod._canDelete).toBe(false);
        expect(mod._updateAvailable).toBe(false);
        expect(mod._interventionRequired).toBe(true);
        expect(mod._interventionLabel).toBe('Select files to install');
        expect(mod._neverReleased).toBe(true);
    });
});

describe('groupModsIntoSections', () => {
    it.each(['Error', 'InterventionRequired'] as WorkshopModStatus[])('places %s mods in needsAttention', (status) => {
        expect(sectionOf([makeMod({ status, name: 'BrokenMod' })], 'needsAttention').mods).toHaveLength(1);
    });

    it('places Installing/Updating/Uninstalling mods in inProgress', () => {
        const mods = [
            makeMod({ id: '1', status: 'Installing', name: 'Mod A' }),
            makeMod({ id: '2', status: 'Updating', name: 'Mod B' }),
            makeMod({ id: '3', status: 'Uninstalling', name: 'Mod C' })
        ];

        expect(sectionOf(mods, 'inProgress').mods).toHaveLength(3);
    });

    it('places mods with a newer remote date in updatesAvailable', () => {
        const mods = [makeMod({ status: 'Installed', name: 'UpdateMe', updatedDate: '2026-02-01T00:00:00Z', lastUpdatedLocally: '2026-01-01T00:00:00Z' })];

        expect(sectionOf(mods, 'updatesAvailable').mods).toHaveLength(1);
        expect(sectionOf(mods, 'installed').mods).toHaveLength(0);
    });

    it('places pending release mods in pendingRelease', () => {
        const mods = [
            makeMod({ id: '1', status: 'InstalledPendingRelease', name: 'Pending A' }),
            makeMod({ id: '2', status: 'UpdatedPendingRelease', name: 'Pending B' }),
            makeMod({ id: '3', status: 'UninstalledPendingRelease', name: 'Pending C' })
        ];

        expect(sectionOf(mods, 'pendingRelease').mods).toHaveLength(3);
    });

    it('places installed mods without updates in installed', () => {
        expect(sectionOf([makeMod({ status: 'Installed', name: 'StableMod' })], 'installed').mods).toHaveLength(1);
    });

    it('places uninstalled mods in uninstalled', () => {
        expect(sectionOf([makeMod({ status: 'Uninstalled', name: 'OldMod' })], 'uninstalled').mods).toHaveLength(1);
    });

    it('sorts mods alphabetically within each section', () => {
        const mods = [
            makeMod({ id: '1', status: 'Installed', name: 'Zebra' }),
            makeMod({ id: '2', status: 'Installed', name: 'Alpha' }),
            makeMod({ id: '3', status: 'Installed', name: 'Middle' })
        ];

        expect(sectionOf(mods, 'installed').mods.map((mod) => mod.name)).toEqual(['Alpha', 'Middle', 'Zebra']);
    });

    it('assigns each mod to exactly one section based on priority', () => {
        const mods = [makeMod({ status: 'Error', name: 'ErrorWithUpdate', updatedDate: '2026-02-01T00:00:00Z', lastUpdatedLocally: '2026-01-01T00:00:00Z' })];
        mods.forEach(applyComputedProperties);

        const sections = groupModsIntoSections(mods, '');

        expect(sections.flatMap((section) => section.mods)).toHaveLength(1);
        expect(sections.find((section) => section.key === 'needsAttention').mods).toHaveLength(1);
    });

    it('filters by mod name, case-insensitively', () => {
        const mods = [
            makeMod({ id: '1', status: 'Installed', name: 'ACE' }),
            makeMod({ id: '2', status: 'Installed', name: 'CBA_A3' }),
            makeMod({ id: '3', status: 'Error', name: 'ACE_Compat' })
        ];
        mods.forEach(applyComputedProperties);

        const sections = groupModsIntoSections(mods, 'ace');

        expect(sections.find((section) => section.key === 'installed').mods.map((mod) => mod.name)).toEqual(['ACE']);
        expect(sections.find((section) => section.key === 'needsAttention').mods.map((mod) => mod.name)).toEqual(['ACE_Compat']);
    });

    it('shows all mods when the search term is empty', () => {
        const mods = [makeMod({ id: '1', status: 'Installed', name: 'ACE' }), makeMod({ id: '2', status: 'Installed', name: 'CBA_A3' })];

        expect(sectionOf(mods, 'installed').mods).toHaveLength(2);
    });
});
