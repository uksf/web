import { ModpackBuildStep } from './modpack-build-step';
import { GithubCommit } from '@app/shared/models/github-commit';
import { ModpackBuildResult } from './modpack-build-result';
import { GameEnvironment } from '@app/shared/models/game-environment';

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
