import { ModpackBuildResult } from './ModpackBuildResult';

export interface ModpackBuildStep {
    index: number;
    startTime: Date;
    endTime: Date;
    name: string;
    logs: string[];
    running: boolean;
    finished: boolean;
    buildResult: ModpackBuildResult;
}
