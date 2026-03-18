import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { ValidationReport } from '@app/shared/models/response';

export interface GameServerStatus {
    map: string;
    maxPlayers: string;
    parsedUptime: string;
    launching: boolean;
    stopping: boolean;
    running: boolean;
    mission: string;
    players: string[];
    startedAt: string | null;
}

export interface GameServer {
    id: string;
    name: string;
    launchedBy: string;
    status: GameServerStatus;
    logSources?: RptLogSource[];
    missionSelection?: IDropdownElement;
    statusText?: string;
}

export interface GameServersUpdate {
    servers: GameServer[];
    instanceCount: number;
    missions: Mission[];
}

export interface GameServerUpdate {
    server: GameServer;
    instanceCount: number;
}

export interface MissionUploadResponse {
    missions: Mission[];
    missionReports: MissionReport[];
}

export interface Mission {
    map: string;
    name: string;
    path: string;
    size: number;
    lastModified: string;
}

export interface MissionReport {
    mission: string;
    reports: ValidationReport[];
}

export interface ServerMod {
    name: string;
    path: string;
    selected?: boolean;
    serverMod?: boolean;
}

export interface ServerModsResetResponse {
    availableMods: ServerMod[];
    mods: ServerMod[];
    serverMods: ServerMod[];
}

export interface RptLogSource {
    name: string;
    isServer: boolean;
}

export interface RptLogSearchResult {
    lineIndex: number;
    text: string;
}
