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
    pbos: string[];

    updatedDate?: string;
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
