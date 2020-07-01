import { ModpackBuild } from './ModpackBuild';

export interface ModpackBuildRelease {
    id: string;
    version: string;
    builds: ModpackBuild[];
}
