import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

export interface GameServerStatus {
    parsedUptime: string;
    stopping: boolean;
    started: boolean;
    running: boolean;
    mission: string;
    players: number;
}

export interface GameServer {
    id: string;
    name: string;
    status: GameServerStatus;
    missionSelection?: IDropdownElement;
    // Frontend-only properties set during runtime
    updating?: boolean;
    request?: { unsubscribe: () => void };
}

export interface GameServersResponse {
    servers: GameServer[];
    instanceCount: number;
    missions: Mission[];
}

export interface ServerStatusResponse {
    gameServer: GameServer;
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
}

export interface MissionReport {
    mission: string;
    reports: string[];
}
