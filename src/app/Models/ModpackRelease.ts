export interface ModpackRelease {
    id: string;
    timestamp: Date;
    version: string;
    description: string;
    changelog: string;
    isDraft: boolean;
    creatorId: string;
}
