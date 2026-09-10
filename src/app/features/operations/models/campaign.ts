export enum CampaignStatus {
    Current = 0,
    Past = 1,
    Upcoming = 2
}

export enum OperationStatus {
    Upcoming = 0,
    Current = 1,
    Past = 2
}

export enum CampaignMissionStatus {
    Scheduled = 0,
    Complete = 1
}

export enum IntelScope {
    Campaign = 0,
    Operation = 1,
    Mission = 2
}

export enum MissionFileState {
    Missing = 0,
    Present = 1
}

export interface Campaign {
    id: string;
    name: string;
    summary: string;
    status: CampaignStatus;
    start?: string;
    end?: string;
}

export interface Operation {
    id: string;
    campaignId: string;
    title: string;
    brief: string;
    status: OperationStatus;
}

export interface CampaignMission {
    id: string;
    operationId: string;
    title: string;
    scheduledTime: string;
    serverId: string;
    missionName: string;
    warno: string;
    status: CampaignMissionStatus;
    autoLaunch: boolean;
    sessionId?: string;
    launchedServerId?: string;
    launchedMission?: string;
    launchedAt?: string;
}

export interface CampaignMissionDto {
    mission: CampaignMission;
    missionFileState: MissionFileState;
}

export interface IntelPage {
    id: string;
    scope: IntelScope;
    ownerId: string;
    title: string;
    body: string;
}
