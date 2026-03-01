import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { of } from 'rxjs';

import { SignalRService } from '@app/core/services/signalr.service';
import { GameServersService } from '../../services/game-servers.service';
import { ServerLogModalComponent } from './server-log-modal.component';
import { RptLogSearchResponse, RptLogSource } from '../../models/game-server';

describe('ServerLogModalComponent', () => {
    let component: ServerLogModalComponent;
    let mockDialogRef: any;
    let mockGameServersService: any;
    let mockSignalRService: any;
    let mockSanitizer: any;
    let mockConnection: any;
    let mockHubConnection: any;
    let signalRCallbacks: Record<string, Function>;
    let originalWindow: any;

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
            getLogDownloadUrl: vi.fn().mockReturnValue('http://localhost:5500/gameservers/server1/log/download?source=Server')
        };

        mockConnection = {
            on: vi.fn((event: string, callback: Function) => {
                signalRCallbacks[event] = callback;
            }),
            off: vi.fn(),
            invoke: vi.fn().mockResolvedValue(undefined),
            stop: vi.fn().mockResolvedValue(undefined)
        };

        mockHubConnection = {
            connection: mockConnection,
            reconnectEvent: { complete: vi.fn() },
            dispose: vi.fn()
        };

        mockSignalRService = {
            connect: vi.fn().mockReturnValue(mockHubConnection)
        };

        mockSanitizer = {
            bypassSecurityTrustHtml: vi.fn((html: string) => html)
        };

        originalWindow = (globalThis as any).window;
        (globalThis as any).window = { open: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                ServerLogModalComponent,
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { server: testServer } },
                { provide: GameServersService, useValue: mockGameServersService },
                { provide: SignalRService, useValue: mockSignalRService },
                { provide: DomSanitizer, useValue: mockSanitizer }
            ]
        });

        component = TestBed.inject(ServerLogModalComponent);
    });

    afterEach(() => {
        (globalThis as any).window = originalWindow;
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
        });
    });

    describe('ngOnInit', () => {
        it('should load log sources', () => {
            component.ngOnInit();

            expect(mockGameServersService.getLogSources).toHaveBeenCalledWith('server1');
            expect(component.sources).toEqual(testSources);
        });

        it('should connect to SignalR servers hub', () => {
            component.ngOnInit();

            expect(mockSignalRService.connect).toHaveBeenCalledWith('servers');
        });

        it('should register ReceiveLogContent handler', () => {
            component.ngOnInit();

            expect(mockConnection.on).toHaveBeenCalledWith('ReceiveLogContent', expect.any(Function));
        });

        it('should register ReceiveLogAppend handler', () => {
            component.ngOnInit();

            expect(mockConnection.on).toHaveBeenCalledWith('ReceiveLogAppend', expect.any(Function));
        });

        it('should subscribe to Server log on init', () => {
            component.ngOnInit();

            expect(mockConnection.invoke).toHaveBeenCalledWith('SubscribeToLog', 'server1', 'Server');
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
        beforeEach(() => {
            component.ngOnInit();
            mockConnection.invoke.mockClear();
        });

        it('should not switch when source is the same', () => {
            component.switchSource('Server');

            expect(mockConnection.invoke).not.toHaveBeenCalled();
        });

        it('should unsubscribe from old source', () => {
            component.switchSource('HC1');

            expect(mockConnection.invoke).toHaveBeenCalledWith('UnsubscribeFromLog', 'server1', 'Server');
        });

        it('should subscribe to new source', () => {
            component.switchSource('HC1');

            expect(mockConnection.invoke).toHaveBeenCalledWith('SubscribeToLog', 'server1', 'HC1');
        });

        it('should reset log state', () => {
            component.logLines = ['old'];
            component.highlightedLines = ['old' as any];
            component.isLoading = false;
            component.searchResults = [{ lineIndex: 0, text: 'match' }];
            component.searchMatchLines = new Set([0]);
            component.currentSearchIndex = 0;

            component.switchSource('HC1');

            expect(component.logLines).toEqual([]);
            expect(component.highlightedLines).toEqual([]);
            expect(component.isLoading).toBe(true);
            expect(component.searchResults).toEqual([]);
            expect(component.searchMatchLines.size).toBe(0);
            expect(component.currentSearchIndex).toBe(-1);
        });

        it('should update activeSource', () => {
            component.switchSource('HC1');

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

    describe('downloadLog', () => {
        it('should open download URL in new tab', () => {
            component.ngOnInit();

            component.downloadLog();

            expect(mockGameServersService.getLogDownloadUrl).toHaveBeenCalledWith('server1', 'Server');
            expect((globalThis as any).window.open).toHaveBeenCalledWith(
                'http://localhost:5500/gameservers/server1/log/download?source=Server',
                '_blank'
            );
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
        it('should unsubscribe, clean up handlers, dispose, and stop connection', () => {
            component.ngOnInit();

            component.ngOnDestroy();

            expect(mockConnection.invoke).toHaveBeenCalledWith('UnsubscribeFromLog', 'server1', 'Server');
            expect(mockConnection.off).toHaveBeenCalledWith('ReceiveLogContent');
            expect(mockConnection.off).toHaveBeenCalledWith('ReceiveLogAppend');
            expect(mockHubConnection.dispose).toHaveBeenCalled();
            expect(mockConnection.stop).toHaveBeenCalled();
        });

        it('should not throw when hubConnection is not set', () => {
            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });
});
