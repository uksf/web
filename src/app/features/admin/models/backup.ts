export enum BackupEntryType {
    Folder = 0,
    File = 1
}

export enum BackupRunState {
    Running = 0,
    Success = 1,
    Failed = 2
}

export interface BackupEntry {
    id?: string;
    path: string;
    entryType: BackupEntryType;
    recursive: boolean;
    includePatterns: string[];
    excludes: string[];
    enabled: boolean;
}

export interface BackupTreeNode {
    name: string;
    path: string;
    isDirectory: boolean;
    hasChildren: boolean;
}

export interface BackupSkip {
    path: string;
    reason: string;
}

export interface BackupRun {
    id: string;
    started: string;
    finished?: string;
    state: BackupRunState;
    fileCount: number;
    rawBytes: number;
    archiveBytes: number;
    archiveName: string;
    localPath: string;
    driveFileId?: string;
    error?: string;
    skips: BackupSkip[];
    databases: string[];
}
