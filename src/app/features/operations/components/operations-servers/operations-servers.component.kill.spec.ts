import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';
import { OperationsServersComponent } from './operations-servers.component';
import { GameServer, StopPhase } from '../../models/game-server';
import { makeServer, setupOperationsServersSpec, teardownOperationsServersSpec } from './operations-servers.spec-setup';

describe('OperationsServersComponent kill data-loss confirmation', () => {
    let component: OperationsServersComponent;
    let mockGameServersService: any;
    let mockDialog: any;
    let dialogAfterClosed$: Subject<any>;

    const inPhase = (stopPhase: StopPhase, name = 'Main', id = 'server1'): GameServer => makeServer({ id, name, status: { ...makeServer().status, stopPhase } }) as GameServer;

    beforeEach(() => {
        ({ component, mockGameServersService, mockDialog, dialogAfterClosed$ } = setupOperationsServersSpec());
    });

    afterEach(() => {
        teardownOperationsServersSpec();
    });

    it('kill of a running server sends no data-loss confirmation', () => {
        component.kill(inPhase(StopPhase.None));
        dialogAfterClosed$.next(true);

        expect(mockGameServersService.killServer).toHaveBeenCalledWith('server1', false);
    });

    it('kill of a saving server sends the confirmation only after the loss warning is accepted', () => {
        component.kill(inPhase(StopPhase.Saving));

        expect(mockDialog.open.mock.calls[0][1].data.message).toContain('is still saving');
        dialogAfterClosed$.next(true);
        expect(mockGameServersService.killServer).toHaveBeenCalledWith('server1', true);
    });

    it('kill all sends no confirmation when a server starts saving after the general warning opened', () => {
        const server = inPhase(StopPhase.None);
        component.servers = [server];
        component.instanceCount = 1;

        component.killAll();
        server.status.stopPhase = StopPhase.Saving;
        dialogAfterClosed$.next(true);

        expect(mockDialog.open.mock.calls[0][1].data.message).toContain('There could be players still on');
        expect(mockGameServersService.killAllServers).toHaveBeenCalledWith(false);
    });

    it('kill all names every saving server and sends the confirmation', () => {
        component.servers = [inPhase(StopPhase.Ending, 'Main', 'a'), inPhase(StopPhase.Delivering, 'Training', 'b'), inPhase(StopPhase.None, 'Event', 'c')];
        component.instanceCount = 3;

        component.killAll();
        dialogAfterClosed$.next(true);

        expect(mockDialog.open.mock.calls[0][1].data.message).toContain('Main and Training are still saving');
        expect(mockGameServersService.killAllServers).toHaveBeenCalledWith(true);
    });

    it('kill all does nothing when the warning is rejected', () => {
        component.servers = [inPhase(StopPhase.Saving)];

        component.killAll();
        dialogAfterClosed$.next(false);

        expect(mockGameServersService.killAllServers).not.toHaveBeenCalled();
    });
});
