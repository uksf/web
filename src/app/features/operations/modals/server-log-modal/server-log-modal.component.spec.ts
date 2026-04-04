import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';

import { ServersHubService } from '../../services/servers-hub.service';
import { GameServersService } from '../../services/game-servers.service';
import { ServerLogModalComponent } from './server-log-modal.component';
import { RptLogSource } from '../../models/game-server';

describe('ServerLogModalComponent', () => {
    let component: ServerLogModalComponent;
    let mockDialogRef: any;
    let mockGameServersService: any;
    let mockServersHub: any;
    let mockSanitizer: any;
    let signalRCallbacks: Record<string, Function>;
    let reconnectedSubject: Subject<void>;

    const testSources: RptLogSource[] = [
        { name: 'Server', isServer: true },
        { name: 'HC1', isServer: false }
    ];

    const testServer = {
        id: 'server1',
        name: 'Test Server',
        logSources: testSources,
        status: {
            parsedUptime: '00:00:00',
            stopping: false,
            launching: false,
            running: true,
            mission: 'test_mission',
            players: ['uid1', 'uid2', 'uid3', 'uid4', 'uid5']
        }
    };

    beforeEach(() => {
        signalRCallbacks = {};
        reconnectedSubject = new Subject<void>();

        mockDialogRef = { close: vi.fn() };

        mockGameServersService = {
            downloadLog: vi.fn().mockReturnValue(of(new Blob(['test log content'])))
        };

        mockServersHub = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            on: vi.fn((event: string, callback: Function) => {
                signalRCallbacks[event] = callback;
            }),
            off: vi.fn(),
            invoke: vi.fn().mockResolvedValue(undefined),
            connected: Promise.resolve(),
            reconnected$: reconnectedSubject.asObservable()
        };

        mockSanitizer = {
            bypassSecurityTrustHtml: vi.fn((html: string) => html)
        };

        TestBed.configureTestingModule({
            providers: [
                ServerLogModalComponent,
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { server: testServer } },
                { provide: GameServersService, useValue: mockGameServersService },
                { provide: ServersHubService, useValue: mockServersHub },
                { provide: DomSanitizer, useValue: mockSanitizer }
            ]
        });

        component = TestBed.inject(ServerLogModalComponent);
    });

    describe('creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should set server from dialog data', () => {
            expect(component.server).toEqual(testServer);
        });

        it('should have default state', () => {
            expect(component.activeSource).toBe('Server');
            expect(component.logLines).toEqual([]);
            expect(component.highlightedLines).toEqual([]);
            expect(component.isLoading).toBe(true);
            expect(component.tailEnabled).toBe(true);
            expect(component.searchQuery).toBe('');
            expect(component.searchResults).toEqual([]);
            expect(component.currentSearchIndex).toBe(-1);
            expect(component.isDownloading).toBe(false);
        });

        it('should enable tail when server is running', () => {
            expect(component.tailEnabled).toBe(true);
        });
    });

    describe('tail auto-detection', () => {
        it('should enable tail when server is running', () => {
            expect(component.tailEnabled).toBe(true);
        });

        it('should disable tail for offline server', () => {
            component.server = { ...testServer, status: { ...testServer.status, running: false, launching: false, stopping: false } };
            component.tailEnabled = (component as any).isServerActive();
            expect(component.tailEnabled).toBe(false);
        });

        it('should enable tail when server is launching but not yet running', () => {
            component.server = { ...testServer, status: { ...testServer.status, running: false, launching: true, stopping: false } };
            component.tailEnabled = (component as any).isServerActive();
            expect(component.tailEnabled).toBe(true);
        });

        it('should enable tail when server is stopping', () => {
            component.server = { ...testServer, status: { ...testServer.status, running: false, launching: false, stopping: true } };
            component.tailEnabled = (component as any).isServerActive();
            expect(component.tailEnabled).toBe(true);
        });

        it('should disable tail when server has no status', () => {
            component.server = { ...testServer, status: undefined as any };
            component.tailEnabled = (component as any).isServerActive();
            expect(component.tailEnabled).toBe(false);
        });
    });

    describe('ngOnInit', () => {
        it('should set sources from server data', () => {
            component.ngOnInit();

            expect(component.sources).toEqual(testSources);
        });

        it('should fallback to Server source when logSources is undefined', () => {
            TestBed.resetTestingModule();
            const serverWithoutSources = { ...testServer, logSources: undefined };
            TestBed.configureTestingModule({
                providers: [
                    ServerLogModalComponent,
                    { provide: MatDialogRef, useValue: mockDialogRef },
                    { provide: MAT_DIALOG_DATA, useValue: { server: serverWithoutSources } },
                    { provide: GameServersService, useValue: mockGameServersService },
                    { provide: ServersHubService, useValue: mockServersHub },
                    { provide: DomSanitizer, useValue: mockSanitizer }
                ]
            });

            const comp = TestBed.inject(ServerLogModalComponent);
            comp.ngOnInit();

            expect(comp.sources).toEqual([{ name: 'Server', isServer: true }]);
        });

        it('should connect to servers hub', () => {
            component.ngOnInit();

            expect(mockServersHub.connect).toHaveBeenCalled();
        });

        it('should register ReceiveLogContent handler', () => {
            component.ngOnInit();

            expect(mockServersHub.on).toHaveBeenCalledWith('ReceiveLogContent', expect.any(Function));
        });

        it('should register ReceiveLogAppend handler', () => {
            component.ngOnInit();

            expect(mockServersHub.on).toHaveBeenCalledWith('ReceiveLogAppend', expect.any(Function));
        });

        it('should subscribe to Server log on init', async () => {
            component.ngOnInit();
            await mockServersHub.connected;

            expect(mockServersHub.invoke).toHaveBeenCalledWith('SubscribeToLog', 'server1', 'Server');
        });
    });

    describe('ReceiveLogContent handler', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should splice lines at the given start index', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['line1', 'line2'], 0, false);

            expect(component.logLines).toEqual(['line1', 'line2']);
            expect(component.highlightedLines.length).toBe(2);
        });

        it('should set isLoading to false when isComplete is true', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['line1'], 0, true);

            expect(component.isLoading).toBe(false);
        });

        it('should keep isLoading true when isComplete is false', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['line1'], 0, false);

            expect(component.isLoading).toBe(true);
        });

        it('should ignore messages from a different server', () => {
            signalRCallbacks['ReceiveLogContent']('other-server', 'Server', ['line1'], 0, true);

            expect(component.logLines).toEqual([]);
            expect(component.isLoading).toBe(true);
        });

        it('should ignore messages from a different source', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'HC1', ['line1'], 0, true);

            expect(component.logLines).toEqual([]);
            expect(component.isLoading).toBe(true);
        });

        it('should call sanitizer.bypassSecurityTrustHtml for each line', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['line1', 'line2'], 0, false);

            expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledTimes(2);
        });

        it('should splice at correct index when appending after existing lines', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['line1', 'line2'], 0, false);
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['line3'], 2, true);

            expect(component.logLines).toEqual(['line1', 'line2', 'line3']);
        });

        it('should trigger search when isComplete and searchQuery is set', () => {
            const searchSpy = vi.spyOn(component, 'search');
            component.searchQuery = 'error';

            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['error line'], 0, true);

            expect(searchSpy).toHaveBeenCalled();
        });

        it('should not trigger search when isComplete but searchQuery is empty', () => {
            const searchSpy = vi.spyOn(component, 'search');
            component.searchQuery = '';

            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['line'], 0, true);

            expect(searchSpy).not.toHaveBeenCalled();
        });
    });

    describe('ReceiveLogAppend handler', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should push new lines', () => {
            signalRCallbacks['ReceiveLogAppend']('server1', 'Server', ['appended line']);

            expect(component.logLines).toEqual(['appended line']);
            expect(component.highlightedLines.length).toBe(1);
        });

        it('should append to existing lines', () => {
            component.logLines = ['existing'];
            component.highlightedLines = ['existing' as any];

            signalRCallbacks['ReceiveLogAppend']('server1', 'Server', ['new line']);

            expect(component.logLines).toEqual(['existing', 'new line']);
        });

        it('should ignore messages from a different server', () => {
            signalRCallbacks['ReceiveLogAppend']('other-server', 'Server', ['line']);

            expect(component.logLines).toEqual([]);
        });

        it('should ignore messages from a different source', () => {
            signalRCallbacks['ReceiveLogAppend']('server1', 'HC1', ['line']);

            expect(component.logLines).toEqual([]);
        });
    });

    describe('switchSource', () => {
        beforeEach(async () => {
            component.ngOnInit();
            await mockServersHub.connected;
            mockServersHub.invoke.mockClear();
        });

        it('should not switch when source is the same', async () => {
            await component.switchSource('Server');

            expect(mockServersHub.invoke).not.toHaveBeenCalled();
        });

        it('should not switch when source is empty', async () => {
            await component.switchSource('');

            expect(mockServersHub.invoke).not.toHaveBeenCalled();
        });

        it('should unsubscribe from old source', async () => {
            await component.switchSource('HC1');

            expect(mockServersHub.invoke).toHaveBeenCalledWith('UnsubscribeFromLog', 'server1', 'Server');
        });

        it('should subscribe to new source', async () => {
            await component.switchSource('HC1');

            expect(mockServersHub.invoke).toHaveBeenCalledWith('SubscribeToLog', 'server1', 'HC1');
        });

        it('should reset log state', async () => {
            component.logLines = ['old'];
            component.highlightedLines = ['old' as any];
            component.isLoading = false;
            component.searchResults = [{ lineIndex: 0, text: 'match' }];
            component.searchMatchLines = new Set([0]);
            component.currentSearchIndex = 0;
            component.linkedLineIndex = 5;

            await component.switchSource('HC1');

            expect(component.logLines).toEqual([]);
            expect(component.highlightedLines).toEqual([]);
            expect(component.isLoading).toBe(true);
            expect(component.searchResults).toEqual([]);
            expect(component.searchMatchLines.size).toBe(0);
            expect(component.currentSearchIndex).toBe(-1);
            expect(component.linkedLineIndex).toBe(-1);
        });

        it('should update activeSource', async () => {
            await component.switchSource('HC1');

            expect(component.activeSource).toBe('HC1');
        });
    });

    describe('toggleTail', () => {
        it('should toggle tailEnabled from true to false', () => {
            component.tailEnabled = true;

            component.toggleTail();

            expect(component.tailEnabled).toBe(false);
        });

        it('should toggle tailEnabled from false to true', () => {
            component.tailEnabled = false;

            component.toggleTail();

            expect(component.tailEnabled).toBe(true);
        });
    });

    describe('search', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should clear results when query is empty', () => {
            component.searchResults = [{ lineIndex: 0, text: 'old' }];
            component.searchMatchLines = new Set([0]);
            component.currentSearchIndex = 0;
            component.searchQuery = '';

            component.search();

            expect(component.searchResults).toEqual([]);
            expect(component.searchMatchLines.size).toBe(0);
            expect(component.currentSearchIndex).toBe(-1);
        });

        it('should clear results when query is whitespace', () => {
            component.searchQuery = '   ';

            component.search();

            expect(component.currentSearchIndex).toBe(-1);
        });

        it('should reset to base highlights when clearing search', () => {
            // Populate base data via content handler
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['line1', 'line2'], 0, true);
            const baseLines = [...component.highlightedLines];

            // Simulate having search results
            component.searchResults = [{ lineIndex: 0, text: 'line1' }];
            component.highlightedLines = ['modified' as any, 'modified' as any];
            component.searchQuery = '';

            component.search();

            expect(component.highlightedLines).toEqual(baseLines);
        });

        it('should find matching lines from loaded log data', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', [
                'no match here',
                'error at line 1',
                'another line',
                'error at line 3',
                'final line'
            ], 0, true);
            component.searchQuery = 'error';

            component.search();

            expect(component.searchResults).toHaveLength(2);
            expect(component.searchResults[0]).toEqual({ lineIndex: 1, text: 'error at line 1' });
            expect(component.searchResults[1]).toEqual({ lineIndex: 3, text: 'error at line 3' });
            expect(component.searchMatchLines.has(1)).toBe(true);
            expect(component.searchMatchLines.has(3)).toBe(true);
            expect(component.totalMatches).toBe(2);
            expect(component.currentSearchIndex).toBe(0);
        });

        it('should search case-insensitively', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', [
                'ERROR uppercase',
                'error lowercase',
                'no match'
            ], 0, true);
            component.searchQuery = 'Error';

            component.search();

            expect(component.searchResults).toHaveLength(2);
        });

        it('should set currentSearchIndex to -1 when no results', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['some line'], 0, true);
            component.searchQuery = 'nonexistent';

            component.search();

            expect(component.currentSearchIndex).toBe(-1);
        });

        it('should rehighlight only matched lines after search', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['error here', 'no match'], 0, true);
            component.searchQuery = 'error';
            mockSanitizer.bypassSecurityTrustHtml.mockClear();

            component.search();

            // Only the matched line (index 0) should be re-highlighted with search marks
            expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
        });

        it('should not scroll to search result when tail is enabled', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', [
                'no match here',
                'error at line 1',
                'another line'
            ], 0, true);
            component.tailEnabled = true;
            component.searchQuery = 'error';

            component.search();

            expect(component.searchResults).toHaveLength(1);
            expect(component.currentSearchIndex).toBe(0);
            // Tail should remain enabled — search doesn't interrupt it
            expect(component.tailEnabled).toBe(true);
        });
    });

    describe('onSearchChange', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            component.ngOnInit();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should debounce and call search after 50ms', () => {
            component.searchQuery = 'test';
            const searchSpy = vi.spyOn(component, 'search');

            component.onSearchChange();

            expect(searchSpy).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);

            expect(searchSpy).toHaveBeenCalledOnce();
        });

        it('should cancel previous debounce when called again', () => {
            component.searchQuery = 'test';
            const searchSpy = vi.spyOn(component, 'search');

            component.onSearchChange();
            vi.advanceTimersByTime(30);
            component.onSearchChange();
            vi.advanceTimersByTime(30);

            expect(searchSpy).not.toHaveBeenCalled();

            vi.advanceTimersByTime(20);

            expect(searchSpy).toHaveBeenCalledOnce();
        });
    });

    describe('searchNext', () => {
        it('should do nothing when no search results', () => {
            component.searchResults = [];
            component.currentSearchIndex = -1;

            component.searchNext();

            expect(component.currentSearchIndex).toBe(-1);
        });

        it('should advance to next result', () => {
            component.searchResults = [
                { lineIndex: 5, text: 'a' },
                { lineIndex: 10, text: 'b' },
                { lineIndex: 15, text: 'c' }
            ];
            component.currentSearchIndex = 0;

            component.searchNext();

            expect(component.currentSearchIndex).toBe(1);
        });

        it('should wrap around to first result', () => {
            component.searchResults = [
                { lineIndex: 5, text: 'a' },
                { lineIndex: 10, text: 'b' }
            ];
            component.currentSearchIndex = 1;

            component.searchNext();

            expect(component.currentSearchIndex).toBe(0);
        });

        it('should disable tail when navigating to next result', () => {
            component.searchResults = [
                { lineIndex: 5, text: 'a' },
                { lineIndex: 10, text: 'b' }
            ];
            component.currentSearchIndex = 0;
            component.tailEnabled = true;

            component.searchNext();

            expect(component.tailEnabled).toBe(false);
            expect(component.currentSearchIndex).toBe(1);
        });
    });

    describe('searchPrev', () => {
        it('should do nothing when no search results', () => {
            component.searchResults = [];
            component.currentSearchIndex = -1;

            component.searchPrev();

            expect(component.currentSearchIndex).toBe(-1);
        });

        it('should go to previous result', () => {
            component.searchResults = [
                { lineIndex: 5, text: 'a' },
                { lineIndex: 10, text: 'b' },
                { lineIndex: 15, text: 'c' }
            ];
            component.currentSearchIndex = 2;

            component.searchPrev();

            expect(component.currentSearchIndex).toBe(1);
        });

        it('should wrap around to last result', () => {
            component.searchResults = [
                { lineIndex: 5, text: 'a' },
                { lineIndex: 10, text: 'b' },
                { lineIndex: 15, text: 'c' }
            ];
            component.currentSearchIndex = 0;

            component.searchPrev();

            expect(component.currentSearchIndex).toBe(2);
        });

        it('should disable tail when navigating to previous result', () => {
            component.searchResults = [
                { lineIndex: 5, text: 'a' },
                { lineIndex: 10, text: 'b' }
            ];
            component.currentSearchIndex = 1;
            component.tailEnabled = true;

            component.searchPrev();

            expect(component.tailEnabled).toBe(false);
            expect(component.currentSearchIndex).toBe(0);
        });
    });

    describe('findNearestSearchResult', () => {
        it('should return -1 when no search results', () => {
            component.searchResults = [];

            expect(component.findNearestSearchResult(50)).toBe(-1);
        });

        it('should return nearest result index', () => {
            component.searchResults = [
                { lineIndex: 10, text: 'a' },
                { lineIndex: 50, text: 'b' },
                { lineIndex: 100, text: 'c' }
            ];

            expect(component.findNearestSearchResult(45)).toBe(1);
        });

        it('should return exact match index', () => {
            component.searchResults = [
                { lineIndex: 10, text: 'a' },
                { lineIndex: 50, text: 'b' },
                { lineIndex: 100, text: 'c' }
            ];

            expect(component.findNearestSearchResult(100)).toBe(2);
        });

        it('should pick first result when equidistant', () => {
            component.searchResults = [
                { lineIndex: 10, text: 'a' },
                { lineIndex: 30, text: 'b' }
            ];

            expect(component.findNearestSearchResult(20)).toBe(0);
        });

        it('should handle line beyond last result', () => {
            component.searchResults = [
                { lineIndex: 10, text: 'a' },
                { lineIndex: 50, text: 'b' }
            ];

            expect(component.findNearestSearchResult(200)).toBe(1);
        });
    });

    describe('onLineClick', () => {
        it('should do nothing when no search results', () => {
            component.searchResults = [];
            component.currentSearchIndex = -1;

            component.onLineClick(50);

            expect(component.currentSearchIndex).toBe(-1);
        });

        it('should jump to the nearest search result', () => {
            component.searchResults = [
                { lineIndex: 10, text: 'a' },
                { lineIndex: 50, text: 'b' },
                { lineIndex: 100, text: 'c' }
            ];
            component.currentSearchIndex = 0;

            component.onLineClick(45);

            expect(component.currentSearchIndex).toBe(1);
        });

        it('should jump to exact match', () => {
            component.searchResults = [
                { lineIndex: 10, text: 'a' },
                { lineIndex: 50, text: 'b' },
                { lineIndex: 100, text: 'c' }
            ];

            component.onLineClick(100);

            expect(component.currentSearchIndex).toBe(2);
        });
    });

    describe('ReceiveLogAppend batching', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should batch multiple rapid appends into a single flush', () => {
            // In test env (no requestAnimationFrame), each append flushes immediately
            // But the lines are buffered first, then flushed
            signalRCallbacks['ReceiveLogAppend']('server1', 'Server', ['line1']);
            signalRCallbacks['ReceiveLogAppend']('server1', 'Server', ['line2']);

            expect(component.logLines).toEqual(['line1', 'line2']);
        });

        it('should clear pending buffer on switchSource', async () => {
            // Simulate some pending data
            (component as any).pendingAppendLines = ['buffered'];

            await component.switchSource('HC1');

            expect((component as any).pendingAppendLines).toEqual([]);
        });
    });

    describe('tail wheel detection', () => {
        it('should disable tail when user scrolls up via wheel', () => {
            const mockNativeElement = {
                scrollTop: 0, clientHeight: 500, scrollHeight: 2000,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            };
            const mockVp = {
                scrollTo: vi.fn(),
                scrollToOffset: vi.fn(),
                getViewportSize: vi.fn().mockReturnValue(500),
                elementRef: { nativeElement: mockNativeElement },
                elementScrolled: () => new Subject<void>().asObservable()
            } as any;

            component.viewport = mockVp;
            component.tailEnabled = true;

            // Get the wheel handler that was registered
            const wheelCall = mockNativeElement.addEventListener.mock.calls.find(
                (c: any[]) => c[0] === 'wheel'
            );
            expect(wheelCall).toBeTruthy();
            const wheelHandler = wheelCall[1];

            // Simulate wheel up (negative deltaY)
            wheelHandler({ deltaY: -100 } as WheelEvent);

            expect(component.tailEnabled).toBe(false);
        });

        it('should not disable tail when user scrolls down via wheel', () => {
            const mockNativeElement = {
                scrollTop: 0, clientHeight: 500, scrollHeight: 2000,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            };
            const mockVp = {
                scrollTo: vi.fn(),
                scrollToOffset: vi.fn(),
                getViewportSize: vi.fn().mockReturnValue(500),
                elementRef: { nativeElement: mockNativeElement },
                elementScrolled: () => new Subject<void>().asObservable()
            } as any;

            component.viewport = mockVp;
            component.tailEnabled = true;

            const wheelCall = mockNativeElement.addEventListener.mock.calls.find(
                (c: any[]) => c[0] === 'wheel'
            );
            const wheelHandler = wheelCall[1];

            // Simulate wheel down (positive deltaY)
            wheelHandler({ deltaY: 100 } as WheelEvent);

            expect(component.tailEnabled).toBe(true);
        });

        it('should not react to wheel when tail is already disabled', () => {
            const mockNativeElement = {
                scrollTop: 0, clientHeight: 500, scrollHeight: 2000,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            };
            const mockVp = {
                scrollTo: vi.fn(),
                scrollToOffset: vi.fn(),
                getViewportSize: vi.fn().mockReturnValue(500),
                elementRef: { nativeElement: mockNativeElement },
                elementScrolled: () => new Subject<void>().asObservable()
            } as any;

            component.viewport = mockVp;
            component.tailEnabled = false;

            const wheelCall = mockNativeElement.addEventListener.mock.calls.find(
                (c: any[]) => c[0] === 'wheel'
            );
            const wheelHandler = wheelCall[1];

            wheelHandler({ deltaY: -100 } as WheelEvent);

            expect(component.tailEnabled).toBe(false);
        });
    });

    describe('minimap integration', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should expose viewportScrollOffset', () => {
            expect(component.viewportScrollOffset).toBe(0);
        });

        it('should expose viewportVisibleSize', () => {
            expect(component.viewportVisibleSize).toBe(0);
        });

        it('should expose totalScrollHeight', () => {
            expect(component.totalScrollHeight).toBe(0);
        });

        it('should handle onMinimapScrollToLine', () => {
            component.viewport = {
                scrollToOffset: vi.fn(),
                getViewportSize: vi.fn().mockReturnValue(500),
                elementRef: { nativeElement: { scrollTop: 0, scrollHeight: 1000, addEventListener: vi.fn(), removeEventListener: vi.fn() } },
                elementScrolled: () => new Subject<void>().asObservable()
            } as any;

            component.onMinimapScrollToLine(50);

            // 50*20 - 500/2 + 20/2 = 760
            expect(component.viewport.scrollToOffset).toHaveBeenCalledWith(760);
        });

        it('should disable tail when user scrolls via minimap line', () => {
            component.viewport = {
                scrollToOffset: vi.fn(),
                getViewportSize: vi.fn().mockReturnValue(500),
                elementRef: { nativeElement: { scrollTop: 0, scrollHeight: 1000, addEventListener: vi.fn(), removeEventListener: vi.fn() } },
                elementScrolled: () => new Subject<void>().asObservable()
            } as any;
            component.tailEnabled = true;

            component.onMinimapScrollToLine(50);

            expect(component.tailEnabled).toBe(false);
        });

        it('should disable tail when user scrolls via minimap offset', () => {
            component.viewport = {
                scrollToOffset: vi.fn(),
                getViewportSize: vi.fn().mockReturnValue(500),
                elementRef: { nativeElement: { scrollTop: 0, scrollHeight: 1000, addEventListener: vi.fn(), removeEventListener: vi.fn() } },
                elementScrolled: () => new Subject<void>().asObservable()
            } as any;
            component.tailEnabled = true;

            component.onMinimapScrollToOffset(500);

            expect(component.tailEnabled).toBe(false);
        });

        it('should not disable tail on programmatic scroll (no wheel event fired)', () => {
            const scrollSubject = new Subject<void>();
            const mockNativeElement = {
                scrollTop: 0, scrollHeight: 1000,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            };
            const mockVp = {
                scrollTo: vi.fn(),
                scrollToOffset: vi.fn(),
                getViewportSize: vi.fn().mockReturnValue(500),
                elementRef: { nativeElement: mockNativeElement },
                elementScrolled: () => scrollSubject.asObservable()
            } as any;

            component.viewport = mockVp;
            component.tailEnabled = true;

            // Programmatic scrollToBottom — no wheel event fires
            (component as any).scrollToBottom();

            // Scroll event fires from the programmatic scroll
            scrollSubject.next();

            // Tail stays enabled because only wheel events can disable it
            expect(component.tailEnabled).toBe(true);
        });

    });

    describe('downloadLog', () => {
        let mockAnchor: any;
        let originalCreateElement: typeof document.createElement;
        let originalCreateObjectURL: typeof URL.createObjectURL;
        let originalRevokeObjectURL: typeof URL.revokeObjectURL;

        beforeEach(() => {
            mockAnchor = { href: '', download: '', click: vi.fn() };
            originalCreateElement = document.createElement.bind(document);
            vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
                if (tag === 'a') return mockAnchor;
                return originalCreateElement(tag);
            });
            originalCreateObjectURL = URL.createObjectURL;
            originalRevokeObjectURL = URL.revokeObjectURL;
            URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
            URL.revokeObjectURL = vi.fn();
        });

        afterEach(() => {
            URL.createObjectURL = originalCreateObjectURL;
            URL.revokeObjectURL = originalRevokeObjectURL;
        });

        it('should call downloadLog with correct server and source', () => {
            component.ngOnInit();

            component.downloadLog();

            expect(mockGameServersService.downloadLog).toHaveBeenCalledWith('server1', 'Server');
        });

        it('should trigger a file download via anchor click', () => {
            component.ngOnInit();

            component.downloadLog();

            expect(mockAnchor.click).toHaveBeenCalled();
            expect(mockAnchor.download).toBe('Test Server_Server.rpt');
        });

        it('should set isDownloading to false after download completes', () => {
            component.ngOnInit();

            component.downloadLog();

            expect(component.isDownloading).toBe(false);
        });

        it('should use current activeSource for download', () => {
            component.ngOnInit();
            component.activeSource = 'HC1';

            component.downloadLog();

            expect(mockGameServersService.downloadLog).toHaveBeenCalledWith('server1', 'HC1');
        });

        it('should revoke the object URL after download', () => {
            component.ngOnInit();

            component.downloadLog();

            expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
        });
    });

    describe('close', () => {
        it('should close the dialog', () => {
            component.close();

            expect(mockDialogRef.close).toHaveBeenCalled();
        });
    });

    describe('isSearchMatch', () => {
        it('should return true for a matching line index', () => {
            component.searchMatchLines = new Set([5, 10, 15]);

            expect(component.isSearchMatch(10)).toBe(true);
        });

        it('should return false for a non-matching line index', () => {
            component.searchMatchLines = new Set([5, 10, 15]);

            expect(component.isSearchMatch(7)).toBe(false);
        });
    });

    describe('isActiveSearchMatch', () => {
        it('should return true when index matches current search result', () => {
            component.searchResults = [
                { lineIndex: 5, text: 'a' },
                { lineIndex: 10, text: 'b' }
            ];
            component.currentSearchIndex = 1;

            expect(component.isActiveSearchMatch(10)).toBe(true);
        });

        it('should return false when index does not match current search result', () => {
            component.searchResults = [
                { lineIndex: 5, text: 'a' },
                { lineIndex: 10, text: 'b' }
            ];
            component.currentSearchIndex = 0;

            expect(component.isActiveSearchMatch(10)).toBe(false);
        });

        it('should return false when currentSearchIndex is -1', () => {
            component.searchResults = [{ lineIndex: 5, text: 'a' }];
            component.currentSearchIndex = -1;

            expect(component.isActiveSearchMatch(5)).toBe(false);
        });

        it('should return false when currentSearchIndex is out of bounds', () => {
            component.searchResults = [{ lineIndex: 5, text: 'a' }];
            component.currentSearchIndex = 5;

            expect(component.isActiveSearchMatch(5)).toBe(false);
        });
    });

    describe('trackByIndex', () => {
        it('should return the index', () => {
            expect(component.trackByIndex(42)).toBe(42);
        });
    });

    describe('reconnection', () => {
        beforeEach(async () => {
            component.ngOnInit();
            await mockServersHub.connected;
        });

        it('should re-subscribe to the active source on reconnect', () => {
            mockServersHub.invoke.mockClear();

            reconnectedSubject.next();

            expect(mockServersHub.invoke).toHaveBeenCalledWith('SubscribeToLog', 'server1', 'Server');
        });

        it('should re-subscribe to the current source after switching', async () => {
            await component.switchSource('HC1');
            mockServersHub.invoke.mockClear();

            reconnectedSubject.next();

            expect(mockServersHub.invoke).toHaveBeenCalledWith('SubscribeToLog', 'server1', 'HC1');
        });

        it('should reset log state on reconnect', () => {
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['line1', 'line2'], 0, true);
            expect(component.logLines.length).toBe(2);
            expect(component.isLoading).toBe(false);

            reconnectedSubject.next();

            expect(component.logLines).toEqual([]);
            expect(component.highlightedLines).toEqual([]);
            expect(component.isLoading).toBe(true);
            expect(component.searchResults).toEqual([]);
            expect(component.searchMatchLines.size).toBe(0);
            expect(component.currentSearchIndex).toBe(-1);
            expect(component.linkedLineIndex).toBe(-1);
        });

        it('should preserve tail mode on reconnect', () => {
            component.tailEnabled = true;

            reconnectedSubject.next();

            expect((component as any).scrollToBottomOnLoad).toBe(true);
        });

        it('should not set scrollToBottomOnLoad when tail is disabled', () => {
            component.tailEnabled = false;

            reconnectedSubject.next();

            expect((component as any).scrollToBottomOnLoad).toBe(false);
        });
    });

    describe('ngOnDestroy', () => {
        it('should clean up handlers and disconnect hub', () => {
            component.ngOnInit();

            component.ngOnDestroy();

            expect(mockServersHub.off).toHaveBeenCalledWith('ReceiveLogContent', expect.any(Function));
            expect(mockServersHub.off).toHaveBeenCalledWith('ReceiveLogAppend', expect.any(Function));
            expect(mockServersHub.invoke).toHaveBeenCalledWith('UnsubscribeFromLog', 'server1', 'Server');
            expect(mockServersHub.disconnect).toHaveBeenCalled();
        });

        it('should remove wheel event listener from viewport', () => {
            const mockNativeElement = {
                scrollTop: 0, scrollHeight: 1000,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            };
            const mockVp = {
                scrollTo: vi.fn(),
                scrollToOffset: vi.fn(),
                getViewportSize: vi.fn().mockReturnValue(500),
                elementRef: { nativeElement: mockNativeElement },
                elementScrolled: () => new Subject<void>().asObservable()
            } as any;
            component.viewport = mockVp;
            component.ngOnInit();

            component.ngOnDestroy();

            expect(mockNativeElement.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
        });

        it('should unsubscribe from the active source on destroy', async () => {
            component.ngOnInit();
            await component.switchSource('HC1');

            component.ngOnDestroy();

            expect(mockServersHub.invoke).toHaveBeenCalledWith('UnsubscribeFromLog', 'server1', 'HC1');
        });

        it('should not throw when hubConnection is not set', () => {
            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });

    describe('scrollToLine from dialog data', () => {
        it('should disable tail when scrollToLine is provided', () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    ServerLogModalComponent,
                    { provide: MatDialogRef, useValue: mockDialogRef },
                    { provide: MAT_DIALOG_DATA, useValue: { server: testServer, scrollToLine: 42 } },
                    { provide: GameServersService, useValue: mockGameServersService },
                    { provide: ServersHubService, useValue: mockServersHub },
                    { provide: DomSanitizer, useValue: mockSanitizer }
                ]
            });

            const comp = TestBed.inject(ServerLogModalComponent);
            expect(comp.tailEnabled).toBe(false);
        });
    });

    describe('copyLineLink', () => {
        let writeTextSpy: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            writeTextSpy = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: writeTextSpy },
                writable: true,
                configurable: true
            });
            (globalThis as any).window = { location: { origin: 'http://localhost:4200' } };
        });

        afterEach(() => {
            delete (globalThis as any).window;
        });

        it('should copy a URL with server id and line number to clipboard', () => {
            const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;

            component.copyLineLink(event, 41);

            expect(event.stopPropagation).toHaveBeenCalled();
            expect(writeTextSpy).toHaveBeenCalledWith(
                expect.stringContaining('/operations/servers?log=server1&line=42')
            );
        });

        it('should use 1-based line number', () => {
            const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;

            component.copyLineLink(event, 0);

            expect(writeTextSpy).toHaveBeenCalledWith(
                expect.stringContaining('&line=1')
            );
        });
    });

    describe('onKeydown', () => {
        it('should scroll to top and disable tail on Home key', () => {
            const mockViewport = { scrollToIndex: vi.fn() } as any;
            (component as any)._viewport = mockViewport;
            component.tailEnabled = true;

            const event = { key: 'Home', preventDefault: vi.fn() } as unknown as KeyboardEvent;
            component.onKeydown(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(component.tailEnabled).toBe(false);
            expect(mockViewport.scrollToIndex).toHaveBeenCalledWith(0);
        });

        it('should scroll to bottom on End key', () => {
            const mockViewport = { scrollTo: vi.fn() } as any;
            (component as any)._viewport = mockViewport;

            const event = { key: 'End', preventDefault: vi.fn() } as unknown as KeyboardEvent;
            component.onKeydown(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockViewport.scrollTo).toHaveBeenCalledWith({ bottom: 0 });
        });

        it('should not prevent default for other keys', () => {
            const event = { key: 'a', preventDefault: vi.fn() } as unknown as KeyboardEvent;
            component.onKeydown(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('should handle Home when viewport is not set', () => {
            component.viewport = undefined;

            const event = { key: 'Home', preventDefault: vi.fn() } as unknown as KeyboardEvent;
            expect(() => component.onKeydown(event)).not.toThrow();
        });

        it('should not intercept Home/End when focused on an input element', () => {
            const mockViewport = { scrollToIndex: vi.fn() } as any;
            (component as any)._viewport = mockViewport;

            const event = { key: 'Home', preventDefault: vi.fn(), target: { tagName: 'INPUT' } } as unknown as KeyboardEvent;
            component.onKeydown(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(mockViewport.scrollToIndex).not.toHaveBeenCalled();
        });
    });

    describe('copy handler', () => {
        let mockViewportEl: any;
        let mockViewport: any;
        let mockGetSelection: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            component.ngOnInit();
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', [
                'Line A',
                'Line B is a very long line that wraps',
                'Line C',
                'Line D',
                'Line E'
            ], 0, true);

            mockViewportEl = {
                contains: vi.fn().mockReturnValue(true),
                querySelectorAll: vi.fn().mockReturnValue([]),
                querySelector: vi.fn().mockReturnValue(null)
            };
            mockViewport = {
                elementRef: { nativeElement: mockViewportEl },
                scrollToIndex: vi.fn(),
                scrollTo: vi.fn(),
                scrollToOffset: vi.fn(),
                getViewportSize: vi.fn().mockReturnValue(400),
                elementScrolled: vi.fn().mockReturnValue(of())
            };
            (component as any)._viewport = mockViewport;

            mockGetSelection = vi.fn().mockReturnValue(null);
            (document as any).getSelection = mockGetSelection;
        });

        afterEach(() => {
            delete (document as any).getSelection;
        });

        function createCopyEvent(): ClipboardEvent {
            const clipboardData = { setData: vi.fn() };
            return {
                clipboardData,
                preventDefault: vi.fn()
            } as unknown as ClipboardEvent;
        }

        function createMockSelection(anchorNode: any, focusNode: any, intersectingElements: any[]) {
            const intersectSet = new Set(intersectingElements);
            return {
                isCollapsed: false,
                anchorNode,
                focusNode,
                focusOffset: 0,
                getRangeAt: vi.fn().mockReturnValue({
                    intersectsNode: (el: any) => intersectSet.has(el)
                })
            };
        }

        it('should not intercept copy when no selection exists', () => {
            const event = createCopyEvent();
            component.handleCopy(event);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('should deduplicate wrapped lines when copying', () => {
            const insideNode = {};
            const el0 = { getAttribute: vi.fn().mockReturnValue('0') };
            const el1a = { getAttribute: vi.fn().mockReturnValue('1') };
            const el1b = { getAttribute: vi.fn().mockReturnValue('1') };
            const el2 = { getAttribute: vi.fn().mockReturnValue('2') };
            const allEls = [el0, el1a, el1b, el2];
            mockViewportEl.querySelectorAll.mockReturnValue(allEls);
            mockGetSelection.mockReturnValue(createMockSelection(insideNode, insideNode, allEls));

            const event = createCopyEvent();
            component.handleCopy(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.clipboardData!.setData).toHaveBeenCalledWith(
                'text/plain',
                'Line A\nLine B is a very long line that wraps\nLine C'
            );
        });

        it('should use saved selection range to include lines that scrolled out of view', () => {
            // Simulate: user selected from line 1 to line 3, then scrolled so only lines 2-4 visible
            const mockPreserver = (component as any).selectionPreserver;
            vi.spyOn(mockPreserver, 'getSelectionRange').mockReturnValue({
                anchor: { viewLineIndex: 1, charOffset: 0 },
                focus: { viewLineIndex: 3, charOffset: 6 }
            });

            const insideNode = {};
            const el2 = { getAttribute: vi.fn().mockReturnValue('2') };
            const el3 = { getAttribute: vi.fn().mockReturnValue('3') };
            mockViewportEl.querySelectorAll.mockReturnValue([el2, el3]);
            mockGetSelection.mockReturnValue(createMockSelection(insideNode, insideNode, [el2, el3]));

            const event = createCopyEvent();
            component.handleCopy(event);

            // viewLineIndex maps 1:1 to logLineIndex in this test (no wrapping measured)
            // Should copy full lines 1-3
            expect(event.clipboardData!.setData).toHaveBeenCalledWith(
                'text/plain',
                'Line B is a very long line that wraps\nLine C\nLine D'
            );
        });

        it('should use charOffset for partial first and last lines when copying', () => {
            const mockPreserver = (component as any).selectionPreserver;
            // Select from char 5 of line 0 ("A") to char 6 of line 2 ("Line C")
            // Line 0 = "Line A", line 1 = "Line B is a very long line that wraps", line 2 = "Line C"
            vi.spyOn(mockPreserver, 'getSelectionRange').mockReturnValue({
                anchor: { viewLineIndex: 0, charOffset: 5 },
                focus: { viewLineIndex: 2, charOffset: 4 }
            });

            const insideNode = {};
            mockViewportEl.querySelectorAll.mockReturnValue([]);
            mockGetSelection.mockReturnValue(createMockSelection(insideNode, insideNode, []));

            const event = createCopyEvent();
            component.handleCopy(event);

            // "Line A".substring(5) = "A", middle line full, "Line C".substring(0, 4) = "Line"
            expect(event.clipboardData!.setData).toHaveBeenCalledWith(
                'text/plain',
                'A\nLine B is a very long line that wraps\nLine'
            );
        });

        it('should handle single-line partial selection with charOffset', () => {
            const mockPreserver = (component as any).selectionPreserver;
            vi.spyOn(mockPreserver, 'getSelectionRange').mockReturnValue({
                anchor: { viewLineIndex: 1, charOffset: 5 },
                focus: { viewLineIndex: 1, charOffset: 10 }
            });

            const insideNode = {};
            mockViewportEl.querySelectorAll.mockReturnValue([]);
            mockGetSelection.mockReturnValue(createMockSelection(insideNode, insideNode, []));

            const event = createCopyEvent();
            component.handleCopy(event);

            // "Line B is a very long line that wraps".substring(5, 10) = "B is "
            expect(event.clipboardData!.setData).toHaveBeenCalledWith(
                'text/plain',
                'B is '
            );
        });

        it('should copy only selected lines, not all lines', () => {
            const insideNode = {};
            const el1 = { getAttribute: vi.fn().mockReturnValue('1') };
            const el2 = { getAttribute: vi.fn().mockReturnValue('2') };
            mockViewportEl.querySelectorAll.mockReturnValue([
                { getAttribute: vi.fn().mockReturnValue('0') },
                el1,
                el2,
                { getAttribute: vi.fn().mockReturnValue('3') }
            ]);
            mockGetSelection.mockReturnValue(createMockSelection(insideNode, insideNode, [el1, el2]));

            const event = createCopyEvent();
            component.handleCopy(event);

            expect(event.clipboardData!.setData).toHaveBeenCalledWith(
                'text/plain',
                'Line B is a very long line that wraps\nLine C'
            );
        });
    });

    describe('search highlighting', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should include search term markup when search query is set and content arrives', () => {
            component.searchQuery = 'error';
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['an error occurred'], 0, true);

            // Search marks are applied during content receive when searchQuery is set
            const calls = mockSanitizer.bypassSecurityTrustHtml.mock.calls.map((c: any[]) => c[0]);
            const hasSearchMark = calls.some((html: string) => html.includes('search-term'));
            expect(hasSearchMark).toBe(true);
        });

        it('should not include search term markup when searchQuery is empty', () => {
            component.searchQuery = '';
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['an error occurred'], 0, true);

            const calls = mockSanitizer.bypassSecurityTrustHtml.mock.calls.map((c: any[]) => c[0]);
            const hasSearchMark = calls.some((html: string) => html.includes('search-term'));
            expect(hasSearchMark).toBe(false);
        });
    });
});
