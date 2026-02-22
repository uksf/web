import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OperationsServersComponent } from './operations-servers.component';
import { of, Subject } from 'rxjs';

describe('OperationsServersComponent', () => {
    let component: OperationsServersComponent;
    let mockGameServersService: any;
    let mockDialog: any;
    let mockSignalrService: any;
    let mockPermissions: any;
    let dialogAfterClosed$: Subject<any>;

    const makeServer = (overrides: Partial<any> = {}) => ({
        id: 'server1',
        name: 'Test Server',
        status: {
            parsedUptime: '01:30:45',
            stopping: false,
            started: false,
            running: true,
            mission: 'test_mission',
            players: 0
        },
        updating: false,
        request: null,
        ...overrides
    });

    beforeEach(() => {
        (globalThis as any).window = { setInterval: vi.fn().mockReturnValue(1), clearInterval: vi.fn() };
        dialogAfterClosed$ = new Subject();
        mockGameServersService = {
            getServers: vi.fn().mockReturnValue(of({ servers: [], instanceCount: 0, missions: [] })),
            getDisabledState: vi.fn().mockReturnValue(of(false)),
            getServerStatus: vi.fn().mockReturnValue(of({ gameServer: makeServer(), instanceCount: 1 })),
            toggleDisabledState: vi.fn().mockReturnValue(of(undefined)),
            deleteServer: vi.fn().mockReturnValue(of([])),
            updateServerOrder: vi.fn().mockReturnValue(of([])),
            uploadMission: vi.fn().mockReturnValue(of({ missions: [], missionReports: [] })),
            launchServer: vi.fn().mockReturnValue(of(undefined)),
            stopServer: vi.fn().mockReturnValue(of({ gameServer: makeServer(), instanceCount: 1 })),
            killServer: vi.fn().mockReturnValue(of({ gameServer: makeServer(), instanceCount: 1 })),
            killAllServers: vi.fn().mockReturnValue(of(undefined)),
        };
        mockDialog = {
            open: vi.fn().mockReturnValue({ afterClosed: () => dialogAfterClosed$.asObservable() }),
        };
        mockSignalrService = {
            connect: vi.fn().mockReturnValue({
                connection: {
                    connectionId: 'conn-123',
                    on: vi.fn(),
                    off: vi.fn(),
                    stop: vi.fn().mockReturnValue(Promise.resolve()),
                },
                reconnectEvent: of(),
                dispose: vi.fn(),
            }),
        };
        mockPermissions = {
            hasPermission: vi.fn().mockReturnValue(false),
        };

        component = new OperationsServersComponent(
            mockGameServersService,
            mockDialog,
            mockSignalrService,
            mockPermissions
        );
    });

    afterEach(() => {
        delete (globalThis as any).window;
    });

    describe('getServerStatus', () => {
        it('returns "Updating Status" when server is updating', () => {
            const server = makeServer({ updating: true });
            expect(component.getServerStatus(server)).toBe('Updating Status');
        });

        it('returns "Stopping" when server is stopping', () => {
            const server = makeServer({ status: { ...makeServer().status, stopping: true } });
            expect(component.getServerStatus(server)).toBe('Stopping');
        });

        it('returns "Started" when server has started flag', () => {
            const server = makeServer({ status: { ...makeServer().status, started: true } });
            expect(component.getServerStatus(server)).toBe('Started');
        });

        it('returns "Offline" when server is not running', () => {
            const server = makeServer({ status: { ...makeServer().status, running: false } });
            expect(component.getServerStatus(server)).toBe('Offline');
        });

        it('returns "Launching" when running but no mission', () => {
            const server = makeServer({ status: { ...makeServer().status, mission: '' } });
            expect(component.getServerStatus(server)).toBe('Launching');
        });

        it('returns "Waiting" when uptime is 00:00:00', () => {
            const server = makeServer({ status: { ...makeServer().status, parsedUptime: '00:00:00' } });
            expect(component.getServerStatus(server)).toBe('Waiting');
        });

        it('returns "Running" for normal running server', () => {
            const server = makeServer();
            expect(component.getServerStatus(server)).toBe('Running');
        });
    });

    describe('refreshUptimes', () => {
        it('increments seconds by 1', () => {
            component.servers = [makeServer({ status: { ...makeServer().status, parsedUptime: '01:30:45' } })];

            component.refreshUptimes();

            expect(component.servers[0].status.parsedUptime).toBe('01:30:46');
        });

        it('rolls over seconds to minutes', () => {
            component.servers = [makeServer({ status: { ...makeServer().status, parsedUptime: '01:30:59' } })];

            component.refreshUptimes();

            expect(component.servers[0].status.parsedUptime).toBe('01:31:00');
        });

        it('rolls over minutes to hours', () => {
            component.servers = [makeServer({ status: { ...makeServer().status, parsedUptime: '01:59:59' } })];

            component.refreshUptimes();

            expect(component.servers[0].status.parsedUptime).toBe('02:00:00');
        });

        it('does not update when uptime is 00:00:00', () => {
            component.servers = [makeServer({ status: { ...makeServer().status, parsedUptime: '00:00:00' } })];

            component.refreshUptimes();

            expect(component.servers[0].status.parsedUptime).toBe('00:00:00');
        });

        it('does nothing when servers is null', () => {
            component.servers = null;

            expect(() => component.refreshUptimes()).not.toThrow();
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

    describe('mapMission', () => {
        it('maps dropdown element to Mission', () => {
            const element = { value: '/path/to/mission.pbo', displayValue: 'mission', data: 'Altis' };

            const result = component.mapMission(element);

            expect(result).toEqual({ path: '/path/to/mission.pbo', name: 'mission', map: 'Altis' });
        });
    });

    describe('mapMissionElement', () => {
        it('maps Mission to dropdown element', () => {
            const mission = { path: '/path/to/mission.pbo', name: 'mission', map: 'Altis' };

            const result = component.mapMissionElement(mission);

            expect(result).toEqual({ value: '/path/to/mission.pbo', displayValue: 'mission', data: 'Altis' });
        });
    });

    describe('missionFormatter', () => {
        it('formats mission name and map', () => {
            expect(component.missionFormatter('co40_test', 'Altis')).toBe('co40_test.Altis');
        });
    });

    describe('getMissionName', () => {
        it('returns map and name formatted', () => {
            const element = { value: '/path', displayValue: 'co40_test', data: 'Altis' };

            expect(component.getMissionName(element)).toBe('Altis, co40_test');
        });
    });

    describe('getMissionTooltip', () => {
        it('returns mission path', () => {
            const element = { value: '/path/to/mission.pbo', displayValue: 'mission', data: 'Altis' };

            expect(component.getMissionTooltip(element)).toBe('/path/to/mission.pbo');
        });
    });

    describe('displayWithMission', () => {
        it('returns empty string for null element', () => {
            expect(component.displayWithMission(null)).toBe('');
        });

        it('returns formatted mission name', () => {
            const element = { value: '/path', displayValue: 'co40_test', data: 'Altis' };

            expect(component.displayWithMission(element)).toBe('co40_test.Altis');
        });
    });

    describe('missionFilter', () => {
        it('matches by name', () => {
            const element = { value: '/path/co40_test.Altis.pbo', displayValue: 'co40_test', data: 'Altis' };

            expect(component.missionFilter(element, 'co40')).toBe(true);
        });

        it('matches by path', () => {
            const element = { value: '/path/co40_test.Altis.pbo', displayValue: 'co40_test', data: 'Altis' };

            expect(component.missionFilter(element, '/path')).toBe(true);
        });

        it('returns false for no match', () => {
            const element = { value: '/path/co40_test.Altis.pbo', displayValue: 'co40_test', data: 'Altis' };

            expect(component.missionFilter(element, 'xyz')).toBe(false);
        });
    });

    describe('missionMatcher', () => {
        it('matches formatted mission string', () => {
            const element = { value: '/path', displayValue: 'co40_test', data: 'Altis' };

            expect(component.missionMatcher(element, 'co40_test.altis')).toBe(true);
        });

        it('returns false for non-matching string', () => {
            const element = { value: '/path', displayValue: 'co40_test', data: 'Altis' };

            expect(component.missionMatcher(element, 'wrong')).toBe(false);
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

    describe('resetDropZone', () => {
        it('resets file dragging state', () => {
            component.fileDragging = true;
            component.dropZoneHeight = 500;
            component.dropZoneWidth = 800;

            component.resetDropZone();

            expect(component.fileDragging).toBe(false);
            expect(component.dropZoneHeight).toBe(0);
            expect(component.dropZoneWidth).toBe(0);
        });
    });

    describe('fileDropFinished', () => {
        it('does nothing when both arrays are empty', () => {
            component.fileDropFinished([], []);

            expect(mockDialog.open).not.toHaveBeenCalled();
        });

        it('shows error when no pbo files found', () => {
            component.fileDropFinished([], [{ name: 'test.txt' }]);

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                data: { message: 'None of those files are PBOs files' }
            });
        });
    });

    describe('ngOnInit', () => {
        it('connects to servers SignalR hub', () => {
            component.ngOnInit();

            expect(mockSignalrService.connect).toHaveBeenCalledWith('servers');
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
        it('disconnects SignalR and clears interval', () => {
            component.ngOnInit();
            const hubConnection = mockSignalrService.connect.mock.results[0].value;

            component.ngOnDestroy();

            expect(hubConnection.dispose).toHaveBeenCalled();
            expect(hubConnection.connection.off).toHaveBeenCalledTimes(4);
            expect(hubConnection.connection.stop).toHaveBeenCalled();
        });
    });

    describe('getServers', () => {
        it('sets servers and instance count from response', () => {
            const servers = [makeServer()];
            mockGameServersService.getServers.mockReturnValue(of({
                servers,
                instanceCount: 2,
                missions: [{ path: '/p', name: 'test', map: 'Altis' }]
            }));
            // Need to init first to get hubConnection
            component.ngOnInit();
            mockGameServersService.getServers.mockClear();
            mockGameServersService.getServers.mockReturnValue(of({
                servers,
                instanceCount: 2,
                missions: [{ path: '/p', name: 'test', map: 'Altis' }]
            }));

            component.getServers(true);

            expect(component.servers).toBe(servers);
            expect(component.instanceCount).toBe(2);
            expect(component.updating).toBe(false);
        });
    });

    describe('stop', () => {
        it('runs stop directly when no players', () => {
            const server = makeServer({ status: { ...makeServer().status, players: 0 } });
            component.ngOnInit();

            component.stop(server);

            expect(mockGameServersService.stopServer).toHaveBeenCalledWith('server1', 'conn-123');
        });

        it('shows confirmation when players are on server', () => {
            const server = makeServer({ status: { ...makeServer().status, players: 5 } });
            component.ngOnInit();

            component.stop(server);

            expect(mockDialog.open).toHaveBeenCalled();
        });
    });

    describe('kill', () => {
        it('runs kill directly when skip is true (default)', () => {
            const server = makeServer();
            component.ngOnInit();

            component.kill(server);

            expect(mockGameServersService.killServer).toHaveBeenCalledWith('server1', 'conn-123');
        });

        it('shows confirmation when skip is false', () => {
            const server = makeServer();
            component.ngOnInit();

            component.kill(server, false);

            expect(mockDialog.open).toHaveBeenCalled();
        });
    });

    describe('upload', () => {
        it('does nothing when files array is empty', () => {
            component.upload([]);

            expect(mockGameServersService.uploadMission).not.toHaveBeenCalled();
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
                makeServer({ id: 's1', updating: true }),
                makeServer({ id: 's2', status: { ...makeServer().status, running: false } })
            ];

            component.updateServerStatusTexts();

            expect(component.servers[0].statusText).toBe('Updating Status');
            expect(component.servers[1].statusText).toBe('Offline');
        });
    });

    describe('onMove', () => {
        it('does nothing when indices are the same', () => {
            component.onMove({ previousIndex: 1, currentIndex: 1 } as any);

            expect(mockGameServersService.updateServerOrder).not.toHaveBeenCalled();
        });
    });
});
