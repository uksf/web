import { ModpackBuildStep } from './ModpackBuildStep';
import { GithubCommit } from '../../Models/GithubCommit';
import { ModpackBuildResult } from './ModpackBuildResult';
import { GameEnvironment } from '../../Models/GameEnvironment';

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
