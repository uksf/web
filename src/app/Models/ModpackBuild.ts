import { ModpackBuildStep } from './ModpackBuildStep';
import { GithubCommit } from './GithubCommit';

export interface ModpackBuild {
    timestamp: Date;
    buildNumber: number;
    commit: GithubCommit;
    changes: string;
    isReleaseCandidate: boolean;
    isNewVersion: boolean;
    steps: ModpackBuildStep[];
}
