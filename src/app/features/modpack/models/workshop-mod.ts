export interface WorkshopMod {
    id: string;
    steamId: string;
    name: string;
    status: WorkshopModStatus;
    statusMessage: string;
    errorMessage: string;
    lastUpdatedLocally: string;
    modpackVersionFirstAdded: string;
    modpackVersionLastUpdated: string;
    rootMod: boolean;
    folderName: string;
    pbos: string[];

    updatedDate?: string;

    // Computed properties for template binding (avoid per-CD method calls)
    _hasError?: boolean;
    _canUninstall?: boolean;
    _canDelete?: boolean;
    _updateAvailable?: boolean;
    _interventionRequired?: boolean;
}

export interface InstallWorkshopModData {
    steamId: string;
    rootMod: boolean;
    folderName?: string;
}

export interface WorkshopModUpdatedDate {
    updatedDate: string;
}

export type WorkshopModStatus =
    | 'Installing'
    | 'InstalledPendingRelease'
    | 'Installed'
    | 'Updating'
    | 'UpdatedPendingRelease'
    | 'Uninstalling'
    | 'Uninstalled'
    | 'UninstalledPendingRelease'
    | 'Error'
    | 'InterventionRequired';

export type WorkshopModSectionKey = 'needsAttention' | 'inProgress' | 'updatesAvailable' | 'pendingRelease' | 'installed' | 'uninstalled';

export interface WorkshopModSection {
    key: WorkshopModSectionKey;
    label: string;
    accentColor: string;
    mods: WorkshopMod[];
}

export const WORKSHOP_SECTION_DEFINITIONS: { key: WorkshopModSectionKey; label: string; accentColor: string }[] = [
    { key: 'needsAttention', label: 'Needs Attention', accentColor: '#f44336' },
    { key: 'inProgress', label: 'In Progress', accentColor: '#ff9800' },
    { key: 'updatesAvailable', label: 'Updates Available', accentColor: '#2196f3' },
    { key: 'pendingRelease', label: 'Pending Release', accentColor: '#7b1fa2' },
    { key: 'installed', label: 'Installed', accentColor: '#4caf50' },
    { key: 'uninstalled', label: 'Uninstalled', accentColor: '#616161' },
];
