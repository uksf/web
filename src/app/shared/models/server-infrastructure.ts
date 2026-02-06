export interface ServerInfrastructureLatest {
    latestBuild: string;
    latestUpdate: Date;
}

export interface ServerInfrastructureCurrent {
    currentBuild: string;
    currentUpdated: Date;
}

export interface ServerInfrastructureInstalled {
    installedVersion: string;
    installedLastModified: Date;
}

export interface ServerInfrastructureUpdate {
    newVersion: string;
    updateOutput: string;
}
