import { ModpackBuildStep } from './ModpackBuildStep';
import { GithubCommit } from '@app/shared/models/GithubCommit';
import { ModpackBuildResult } from './ModpackBuildResult';
import { GameEnvironment } from '@app/shared/models/GameEnvironment';

export interface ModpackBuild {
    id: string;
    version: string;
    buildNumber: number;
    commit: GithubCommit;
    steps: ModpackBuildStep[];
    running: boolean;
    finished: boolean;
    startTime: Date;
    endTime: Date;
    buildResult: ModpackBuildResult;
    builderId: string;
    isRebuild: boolean;
    environment: GameEnvironment;
}
