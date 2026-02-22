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
