import { ModpackBuild } from './ModpackBuild';

export interface ModpackRc {
    version: string;
    builds: ModpackBuild[];
}
