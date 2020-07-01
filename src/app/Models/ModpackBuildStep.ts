export interface ModpackBuildStep {
    index: number;
    startTime: Date;
    endTime: Date;
    name: string;
    logs: string[];
    running: boolean;
    success: boolean;
    fail: boolean;
}
