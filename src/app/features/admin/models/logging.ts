export enum LogLevel {
    DEBUG,
    INFO,
    ERROR,
    WARNING,
}

export enum DiscordUserEventType {
    JOINED,
    LEFT,
    BANNED,
    UNBANNED,
    MESSAGE_DELETED,
}

export interface BasicLog {
    id: string;
    partitionKey: string;
    timestamp: Date;
    message: string;
    level: LogLevel;
}

export interface AuditLog extends BasicLog {
    who: string;
}

export interface ErrorLog extends BasicLog {
    exception: string;
    statusCode: number;
    method: string;
    url: string;
    endpointName: string;
    userId: string;
    name: string;
}

export interface LauncherLog extends BasicLog {
    version: string;
    userId: string;
    name: string;
}

export interface DiscordLog extends BasicLog {
    discordUserEventType: DiscordUserEventType;
    instigatorId: string;
    instigatorName: string;
    channelName: string;
    name: string;
}
