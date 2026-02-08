import { ModpackBuildResult } from './modpack-build-result';
import { ModpackBuildStepLogItem } from './modpack-build-step-log-item';

export interface ModpackBuildStep {
    index: number;
    startTime: Date;
    endTime: Date;
    name: string;
    logs: ModpackBuildStepLogItem[];
    running: boolean;
    finished: boolean;
    buildResult: ModpackBuildResult;
}
