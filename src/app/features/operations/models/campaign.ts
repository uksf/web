export enum CampaignStatus {
    Active = 0,
    Archived = 1
}

export enum OpStatus {
    Scheduled = 0,
    Complete = 1
}

export enum IntelScope {
    Campaign = 0,
    Op = 1
}

export enum MissionFileState {
    Missing = 0,
    Present = 1
}

export interface Campaign {
    id: string;
    name: string;
    brief: string;
    status: CampaignStatus;
    theatre?: string;
    start?: string;
    end?: string;
}

export interface Op {
    id: string;
    campaignId: string;
    title: string;
    scheduledTime: string;
    serverId: string;
    missionName: string;
    warno: string;
    status: OpStatus;
    sessionId?: string;
    launchedServerId?: string;
    launchedMission?: string;
    launchedAt?: string;
}

export interface OpDto {
    op: Op;
    missionFileState: MissionFileState;
}

export interface IntelPage {
    id: string;
    scope: IntelScope;
    ownerId: string;
    title: string;
    body: string;
}
