import { ModpackBuildStep } from './ModpackBuildStep';
import { GithubCommit } from './GithubCommit';
import { ModpackBuildResult } from './ModpackBuildResult';

export interface ModpackBuild {
    timestamp: Date;
    buildNumber: number;
    commit: GithubCommit;
    isRelease: boolean;
    isReleaseCandidate: boolean;
    isNewVersion: boolean;
    steps: ModpackBuildStep[];
    running: boolean;
    finished: boolean;
    buildResult: ModpackBuildResult;
}
