export interface ModpackBuildStepLogItem {
    text: string;
    colour: string;
}

export interface ModpackBuildStepLogItemUpdate {
    index: number;
    logs: ModpackBuildStepLogItem[];
}
