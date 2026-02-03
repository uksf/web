import { ModpackBuildResult } from './ModpackBuildResult';
import { ModpackBuildStepLogItem } from './ModpackBuildStepLogItem';

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
