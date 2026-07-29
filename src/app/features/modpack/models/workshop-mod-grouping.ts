import { WorkshopMod, WorkshopModSection, WorkshopModSectionKey, WORKSHOP_SECTION_DEFINITIONS } from './workshop-mod';

const UNSET_DATE = '0001-01-01T00:00:00.0000000Z';

export function interventionRequired(mod: WorkshopMod): boolean {
    return mod.status === 'InterventionRequired';
}

export function interventionLabel(mod: WorkshopMod): string {
    return mod.availablePbos?.length || mod.availableExtensions?.length ? 'Select files to install' : 'Resolve intervention';
}

export function updateAvailable(mod: WorkshopMod): boolean {
    // A mod that needs attention (errored or awaiting intervention) is recovered via Retry/Resolve, not Update —
    // its lastUpdatedLocally was never bumped so the dates would otherwise falsely flag an update as available.
    if (mod.status === 'Error' || mod.status === 'InterventionRequired') {
        return false;
    }
    return !!mod.updatedDate && isValidDate(mod.updatedDate) && isValidDate(mod.lastUpdatedLocally) && new Date(mod.updatedDate) > new Date(mod.lastUpdatedLocally);
}

export function canUninstall(mod: WorkshopMod): boolean {
    return mod.status === 'InstalledPendingRelease' || mod.status === 'Installed' || mod.status === 'UpdatedPendingRelease' || mod.status === 'InterventionRequired' || mod.status === 'Error';
}

export function canDelete(mod: WorkshopMod): boolean {
    return mod.status === 'Uninstalled';
}

export function neverReleased(mod: WorkshopMod): boolean {
    return !mod.modpackVersionFirstAdded;
}

export function hasError(mod: WorkshopMod): boolean {
    return mod.status === 'Error';
}

export function applyComputedProperties(mod: WorkshopMod): void {
    mod._hasError = hasError(mod);
    mod._canUninstall = canUninstall(mod);
    mod._canDelete = canDelete(mod);
    mod._updateAvailable = updateAvailable(mod);
    mod._interventionRequired = interventionRequired(mod);
    mod._interventionLabel = interventionLabel(mod);
    mod._neverReleased = neverReleased(mod);
}

export function groupModsIntoSections(mods: WorkshopMod[], searchTerm: string): WorkshopModSection[] {
    const sectionMap = new Map<WorkshopModSectionKey, WorkshopMod[]>();
    for (const definition of WORKSHOP_SECTION_DEFINITIONS) {
        sectionMap.set(definition.key, []);
    }

    const filteredMods = searchTerm ? mods.filter((mod) => mod.name.toLowerCase().includes(searchTerm)) : mods;
    for (const mod of filteredMods) {
        sectionMap.get(sectionKey(mod)).push(mod);
    }

    return WORKSHOP_SECTION_DEFINITIONS.map((definition) => ({
        ...definition,
        mods: sectionMap.get(definition.key).sort((a, b) => a.name.localeCompare(b.name))
    }));
}

function sectionKey(mod: WorkshopMod): WorkshopModSectionKey {
    if (mod.status === 'Error' || mod.status === 'InterventionRequired') {
        return 'needsAttention';
    }
    if (mod.status === 'Installing' || mod.status === 'Updating' || mod.status === 'Uninstalling') {
        return 'inProgress';
    }
    if (mod._updateAvailable) {
        return 'updatesAvailable';
    }
    if (mod.status === 'InstalledPendingRelease' || mod.status === 'UpdatedPendingRelease' || mod.status === 'UninstalledPendingRelease') {
        return 'pendingRelease';
    }
    if (mod.status === 'Uninstalled') {
        return 'uninstalled';
    }
    return 'installed';
}

function isValidDate(date: string): boolean {
    return date !== UNSET_DATE;
}
