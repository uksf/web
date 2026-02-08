import { ModpackBuild } from './modpack-build';

export interface ModpackRc {
    version: string;
    builds: ModpackBuild[];
}
