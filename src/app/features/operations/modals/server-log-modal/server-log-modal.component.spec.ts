import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';

import { ServersHubService } from '../../services/servers-hub.service';
import { GameServersService } from '../../services/game-servers.service';
import { ServerLogModalComponent } from './server-log-modal.component';
import { RptLogSearchResponse, RptLogSource } from '../../models/game-server';

describe('ServerLogModalComponent', () => {
    let component: ServerLogModalComponent;
    let mockDialogRef: any;
    let mockGameServersService: any;
    let mockServersHub: any;
    let mockSanitizer: any;
    let signalRCallbacks: Record<string, Function>;

    const testServer = {
        id: 'server1',
        name: 'Test Server',
        status: {
            parsedUptime: '00:00:00',
            stopping: false,
            started: true,
            running: true,
            mission: 'test_mission',
            players: 5
        }
    };

    const testSources: RptLogSource[] = [
        { name: 'Server', isServer: true },
        { name: 'HC1', isServer: false }
    ];

    beforeEach(() => {
        signalRCallbacks = {};

        mockDialogRef = { close: vi.fn() };

        mockGameServersService = {
            getLogSources: vi.fn().mockReturnValue(of(testSources)),
            searchLog: vi.fn().mockReturnValue(of({ results: [], totalMatches: 0 })),
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
            reconnected$: new Subject<void>().asObservable()
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
    });

    describe('ngOnInit', () => {
        it('should load log sources', () => {
            component.ngOnInit();

            expect(mockGameServersService.getLogSources).toHaveBeenCalledWith('server1');
            expect(component.sources).toEqual(testSources);
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

            await component.switchSource('HC1');

            expect(component.logLines).toEqual([]);
            expect(component.highlightedLines).toEqual([]);
            expect(component.isLoading).toBe(true);
            expect(component.searchResults).toEqual([]);
            expect(component.searchMatchLines.size).toBe(0);
            expect(component.currentSearchIndex).toBe(-1);
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
            expect(mockGameServersService.searchLog).not.toHaveBeenCalled();
        });

        it('should clear results when query is whitespace', () => {
            component.searchQuery = '   ';

            component.search();

            expect(mockGameServersService.searchLog).not.toHaveBeenCalled();
            expect(component.currentSearchIndex).toBe(-1);
        });

        it('should rehighlight all lines when clearing search', () => {
            component.logLines = ['line1', 'line2'];
            component.highlightedLines = ['old' as any, 'old' as any];
            component.searchQuery = '';

            component.search();

            expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalled();
        });

        it('should call searchLog with correct parameters', () => {
            component.searchQuery = 'error';

            component.search();

            expect(mockGameServersService.searchLog).toHaveBeenCalledWith('server1', 'Server', 'error');
        });

        it('should populate search results', () => {
            const response: RptLogSearchResponse = {
                results: [
                    { lineIndex: 5, text: 'error at line 5' },
                    { lineIndex: 10, text: 'error at line 10' }
                ],
                totalMatches: 2
            };
            mockGameServersService.searchLog.mockReturnValue(of(response));
            component.searchQuery = 'error';

            component.search();

            expect(component.searchResults).toEqual(response.results);
            expect(component.searchMatchLines.has(5)).toBe(true);
            expect(component.searchMatchLines.has(10)).toBe(true);
            expect(component.currentSearchIndex).toBe(0);
        });

        it('should set currentSearchIndex to -1 when no results', () => {
            mockGameServersService.searchLog.mockReturnValue(of({ results: [], totalMatches: 0 }));
            component.searchQuery = 'nonexistent';

            component.search();

            expect(component.currentSearchIndex).toBe(-1);
        });

        it('should rehighlight all lines after receiving search results', () => {
            component.logLines = ['error here', 'no match'];
            component.highlightedLines = ['old' as any, 'old' as any];
            mockGameServersService.searchLog.mockReturnValue(of({ results: [{ lineIndex: 0, text: 'error here' }], totalMatches: 1 }));
            component.searchQuery = 'error';
            mockSanitizer.bypassSecurityTrustHtml.mockClear();

            component.search();

            expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledTimes(2);
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

        it('should debounce and call search after 300ms', () => {
            component.searchQuery = 'test';
            const searchSpy = vi.spyOn(component, 'search');

            component.onSearchChange();

            expect(searchSpy).not.toHaveBeenCalled();

            vi.advanceTimersByTime(300);

            expect(searchSpy).toHaveBeenCalledOnce();
        });

        it('should cancel previous debounce when called again', () => {
            component.searchQuery = 'test';
            const searchSpy = vi.spyOn(component, 'search');

            component.onSearchChange();
            vi.advanceTimersByTime(200);
            component.onSearchChange();
            vi.advanceTimersByTime(200);

            expect(searchSpy).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);

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
                elementRef: { nativeElement: { scrollTop: 0 } }
            } as any;

            component.onMinimapScrollToLine(50);

            // 50*20 - 500/2 + 20/2 = 760
            expect(component.viewport.scrollToOffset).toHaveBeenCalledWith(760);
        });

        it('should handle onMinimapSearchNavigate', () => {
            component.searchResults = [
                { lineIndex: 10, text: 'a' },
                { lineIndex: 50, text: 'b' }
            ];

            component.onMinimapSearchNavigate(1);

            expect(component.currentSearchIndex).toBe(1);
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

    describe('ngOnDestroy', () => {
        it('should clean up handlers and disconnect hub', () => {
            component.ngOnInit();

            component.ngOnDestroy();

            expect(mockServersHub.off).toHaveBeenCalledWith('ReceiveLogContent', expect.any(Function));
            expect(mockServersHub.off).toHaveBeenCalledWith('ReceiveLogAppend', expect.any(Function));
            expect(mockServersHub.disconnect).toHaveBeenCalled();
        });

        it('should not throw when hubConnection is not set', () => {
            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });

    describe('search highlighting', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should include search term markup in highlighted lines when searchQuery is set', () => {
            component.searchQuery = 'error';
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['an error occurred'], 0, true);

            const htmlArg = mockSanitizer.bypassSecurityTrustHtml.mock.calls[0][0];
            expect(htmlArg).toContain('search-term');
        });

        it('should not include search term markup when searchQuery is empty', () => {
            component.searchQuery = '';
            signalRCallbacks['ReceiveLogContent']('server1', 'Server', ['an error occurred'], 0, true);

            const htmlArg = mockSanitizer.bypassSecurityTrustHtml.mock.calls[0][0];
            expect(htmlArg).not.toContain('search-term');
        });
    });
});
