import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject } from 'rxjs';
import { OperationsServersComponent } from './operations-servers.component';
import { GameServer, StopPhase } from '../../models/game-server';
import { makeServer, setupOperationsServersSpec, teardownOperationsServersSpec } from './operations-servers.spec-setup';

describe('OperationsServersComponent', () => {
    let component: OperationsServersComponent;
    let mockGameServersService: any;
    let mockDialog: any;
    let mockServersHub: any;
    let mockPermissions: any;
    let dialogAfterClosed$: Subject<any>;

    beforeEach(() => {
        ({ component, mockGameServersService, mockDialog, mockServersHub, mockPermissions, dialogAfterClosed$ } = setupOperationsServersSpec());
    });

    afterEach(() => {
        teardownOperationsServersSpec();
    });

    describe('uptime from startedAt', () => {
        it('computes uptime from startedAt for running server', () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
            component.servers = [makeServer({ status: { ...makeServer().status, running: true, startedAt: twoHoursAgo } })];

            (component as any).tickUptimes();

            expect(component.servers[0].status.parsedUptime).toMatch(/^02:00:0\d$/);
        });

        it('does not update when startedAt is null', () => {
            component.servers = [makeServer({ status: { ...makeServer().status, running: true, startedAt: null, parsedUptime: '00:00:00' } })];

            (component as any).tickUptimes();

            expect(component.servers[0].status.parsedUptime).toBe('00:00:00');
        });

        it('does not update when server is not running', () => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            component.servers = [makeServer({ status: { ...makeServer().status, running: false, startedAt: oneHourAgo, parsedUptime: '00:05:00' } })];

            (component as any).tickUptimes();

            expect(component.servers[0].status.parsedUptime).toBe('00:05:00');
        });

        it('does nothing when servers is null', () => {
            component.servers = null;

            expect(() => (component as any).tickUptimes()).not.toThrow();
        });
    });

    describe('isDisabled', () => {
        it('returns true when disabled and not admin', () => {
            component.disabled = true;
            component.admin = false;
            expect(component.isDisabled).toBe(true);
        });

        it('returns false when disabled but admin', () => {
            component.disabled = true;
            component.admin = true;
            expect(component.isDisabled).toBe(false);
        });

        it('returns false when not disabled', () => {
            component.disabled = false;
            component.admin = false;
            expect(component.isDisabled).toBe(false);
        });
    });

    describe('showError', () => {
        it('shows error.error when it is a string', () => {
            component.showError({ error: 'Something went wrong' });

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                data: { message: 'Something went wrong' }
            });
        });

        it('shows error.message when error.error is not a string', () => {
            component.showError({ error: {}, message: 'Fallback message' });

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                data: { message: 'Fallback message' }
            });
        });

        it('shows fallback message when no error details', () => {
            component.showError({}, 'Custom fallback');

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                data: { message: 'Custom fallback' }
            });
        });

        it('shows generic message when nothing available', () => {
            component.showError({});

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                data: { message: 'An error occurred' }
            });
        });
    });

    describe('ngOnInit', () => {
        it('connects to servers hub', () => {
            component.ngOnInit();

            expect(mockServersHub.connect).toHaveBeenCalled();
        });

        it('fetches servers and disabled state', () => {
            component.ngOnInit();

            expect(mockGameServersService.getServers).toHaveBeenCalled();
            expect(mockGameServersService.getDisabledState).toHaveBeenCalled();
        });

        it('sets admin based on permissions', () => {
            mockPermissions.hasPermission.mockReturnValue(true);

            component.ngOnInit();

            expect(component.admin).toBe(true);
        });
    });

    describe('ngOnDestroy', () => {
        it('disconnects hub and unregisters handlers', () => {
            component.ngOnInit();

            component.ngOnDestroy();

            expect(mockServersHub.off).toHaveBeenCalledTimes(5);
            expect(mockServersHub.disconnect).toHaveBeenCalled();
        });
    });

    describe('onReceiveInstanceCount', () => {
        it('updates instanceCount when ReceiveInstanceCount fires', () => {
            component.ngOnInit();
            component.instanceCount = 5;

            const handler = mockServersHub.on.mock.calls.find((c: any) => c[0] === 'ReceiveInstanceCount')[1];
            handler(0);

            expect(component.instanceCount).toBe(0);
        });
    });

    describe('getServers', () => {
        it('sets servers and instance count from response', () => {
            const servers = [makeServer()];
            mockGameServersService.getServers.mockReturnValue(
                of({
                    servers,
                    instanceCount: 2,
                    missions: [{ path: '/p', name: 'test', map: 'Altis' }]
                })
            );
            // Need to init first to get hubConnection
            component.ngOnInit();
            mockGameServersService.getServers.mockClear();
            mockGameServersService.getServers.mockReturnValue(
                of({
                    servers,
                    instanceCount: 2,
                    missions: [{ path: '/p', name: 'test', map: 'Altis' }]
                })
            );

            component.getServers();

            expect(component.servers).toBe(servers);
            expect(component.instanceCount).toBe(2);
        });
    });

    describe('stop', () => {
        it('runs stop directly when no players', () => {
            const server = makeServer({ status: { ...makeServer().status, players: [] } });
            component.ngOnInit();

            component.stop(server);

            expect(mockGameServersService.stopServer).toHaveBeenCalledWith('server1');
        });

        it('shows confirmation when players are on server', () => {
            const server = makeServer({ status: { ...makeServer().status, players: ['uid1', 'uid2', 'uid3', 'uid4', 'uid5'] } });
            component.ngOnInit();

            component.stop(server);

            expect(mockDialog.open).toHaveBeenCalled();
        });
    });

    describe('kill', () => {
        it('always shows confirmation dialog', () => {
            const server = makeServer();
            component.ngOnInit();

            component.kill(server);

            expect(mockDialog.open).toHaveBeenCalled();
        });

        it('calls killServer when confirmation is accepted', () => {
            const server = makeServer();
            component.ngOnInit();

            component.kill(server);
            dialogAfterClosed$.next(true);

            expect(mockGameServersService.killServer).toHaveBeenCalledWith('server1');
        });

        it('does not call killServer when confirmation is rejected', () => {
            const server = makeServer();
            component.ngOnInit();

            component.kill(server);
            dialogAfterClosed$.next(false);

            expect(mockGameServersService.killServer).not.toHaveBeenCalled();
        });
    });

    describe('trackByServerId', () => {
        it('returns server id', () => {
            const server = makeServer({ id: 'abc-123' });

            expect(component.trackByServerId(0, server)).toBe('abc-123');
        });
    });

    describe('updateServerStatusTexts', () => {
        it('should set statusText on each server', () => {
            component.servers = [
                makeServer({ id: 's1', status: { ...makeServer().status, launching: true, running: false } }),
                makeServer({ id: 's2', status: { ...makeServer().status, running: false } })
            ];

            component.updateServerStatusTexts();

            expect(component.servers[0].statusText).toBe('Launching');
            expect(component.servers[1].statusText).toBe('Offline');
        });
    });

    describe('onMove', () => {
        it('does nothing when indices are the same', () => {
            component.onMove({ previousIndex: 1, currentIndex: 1 } as any);

            expect(mockGameServersService.updateServerOrder).not.toHaveBeenCalled();
        });
    });

    describe('isSchedulerLaunch', () => {
        it('isSchedulerLaunch is true only for the Scheduler sentinel', () => {
            expect(component.isSchedulerLaunch(makeServer({ launchedBy: 'Scheduler' }))).toBe(true);
            expect(component.isSchedulerLaunch(makeServer({ launchedBy: 'account-abc123' }))).toBe(false);
        });
    });
});
