export type GameDataFile = 'config' | 'cba-settings' | 'cba-settings-reference';

export type GameDataExportStatus =
    | 'Pending'
    | 'Running'
    | 'Success'
    | 'PartialSuccess'
    | 'FailedTimeout'
    | 'FailedNoOutput'
    | 'FailedTruncated'
    | 'FailedLaunch';

export interface GameDataExport {
    id: string;
    modpackVersion: string;
    gameVersion: string;
    status: GameDataExportStatus;
    hasConfig: boolean;
    hasCbaSettings: boolean;
    hasCbaSettingsReference: boolean;
    completedAt: string;
}
