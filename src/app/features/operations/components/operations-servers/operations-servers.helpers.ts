import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { GameServer, Mission, StopPhase } from '../../models/game-server';

export function serverStatusLabel(server: GameServer): string {
    if (server.status.stopPhase === StopPhase.Ending) return 'Ending';
    if (server.status.stopPhase === StopPhase.Saving) return 'Saving';
    if (server.status.stopPhase === StopPhase.Stopping) return 'Stopping';
    if (server.status.launching) return 'Launching';
    if (!server.status.running) return 'Offline';
    if (!server.status.startedAt) return 'Waiting';
    return 'Running';
}

export function isServerStopping(server: GameServer): boolean {
    return server.status.stopPhase !== StopPhase.None;
}

/**
 * A stop in progress hides the kill until the API says the shutdown has passed the time
 * that phase normally takes, so a healthy shutdown is not cut short by hand.
 */
export function isServerKillAllowed(server: GameServer): boolean {
    if (!isServerStopping(server)) {
        return true;
    }

    return !!server.status.killAllowedAt && Date.now() >= Date.parse(server.status.killAllowedAt);
}

/** Recomputes each running server's uptime text. Returns true when any label changed. */
export function applyUptimes(servers: GameServer[], nowMs: number): boolean {
    let changed = false;

    servers.forEach((server) => {
        if (!server.status.startedAt || !server.status.running) return;
        const elapsed = Math.floor((nowMs - new Date(server.status.startedAt).getTime()) / 1000);
        if (elapsed < 0) return;
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        const uptime = `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        if (server.status.parsedUptime !== uptime) {
            server.status.parsedUptime = uptime;
            changed = true;
        }
    });

    return changed;
}

export function mapMission(dropdownElement: IDropdownElement): Mission {
    return {
        path: dropdownElement.value,
        name: dropdownElement.displayValue,
        map: dropdownElement.data as string,
        size: 0,
        lastModified: ''
    };
}

export function mapMissionElement(mission: Mission): IDropdownElement {
    return {
        value: mission.path,
        displayValue: mission.name,
        data: mission.map
    };
}

export function missionName(element: IDropdownElement): string {
    const mission = mapMission(element);
    return `${mission.map}, ${mission.name}`;
}
