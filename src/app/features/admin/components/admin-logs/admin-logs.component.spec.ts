import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AdminLogsComponent } from './admin-logs.component';
import { LogLevel } from '@app/features/admin/models/logging';
import { SortDirection } from '@app/shared/models/sort-direction';
import { LogsService } from '../../services/logs.service';
import { AdminHubService } from '../../services/admin-hub.service';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { of } from 'rxjs';

describe('AdminLogsComponent', () => {
    let component: AdminLogsComponent;
    let mockLogsService: any;

    beforeEach(() => {
        mockLogsService = { getBasicLogs: vi.fn().mockReturnValue(of({ data: [], totalCount: 0 })) };

        TestBed.configureTestingModule({
            providers: [
                AdminLogsComponent,
                { provide: LogsService, useValue: mockLogsService },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: AdminHubService, useValue: { connect: vi.fn(), disconnect: vi.fn(), on: vi.fn(), off: vi.fn(), reconnected$: of() } },
                { provide: Clipboard, useValue: { copy: vi.fn() } },
            ]
        });

        component = TestBed.inject(AdminLogsComponent);
        component.paginator = { pageIndex: 0, pageSize: 25, length: 0, page: of() } as any;
        component.sort = { direction: 'desc', active: 'timestamp', sortChange: of() } as any;
    });

    describe('buildParams', () => {
        it('does not include levels param when no levels are selected (shows all)', () => {
            component.selectedLevels = [];
            const params = component.buildParams();
            expect(params.has('levels')).toBe(false);
        });

        it('does not include levels param when all levels are selected (shows all)', () => {
            component.selectedLevels = [...component.allLevels];
            const params = component.buildParams();
            expect(params.has('levels')).toBe(false);
        });

        it('includes levels param when some levels are selected', () => {
            component.selectedLevels = [LogLevel.ERROR, LogLevel.WARNING];
            const params = component.buildParams();
            expect(params.get('levels')).toBe('ERROR,WARNING');
        });

        it('includes standard params', () => {
            const params = component.buildParams();
            expect(params.get('page')).toBe('1');
            expect(params.get('pageSize')).toBe('25');
            expect(params.get('sortDirection')).toBe(String(SortDirection.DESCENDING));
            expect(params.get('sortField')).toBe('timestamp');
            expect(params.get('filter')).toBe('');
        });

        it('uses ascending sort direction when sort is asc', () => {
            component.sort = { direction: 'asc', active: 'level', sortChange: of() } as any;
            const params = component.buildParams();
            expect(params.get('sortDirection')).toBe(String(SortDirection.ASCENDING));
            expect(params.get('sortField')).toBe('level');
        });

        it('defaults sortField to timestamp when sort.active is undefined', () => {
            component.sort = { direction: 'desc', active: undefined, sortChange: of() } as any;
            const params = component.buildParams();
            expect(params.get('sortField')).toBe('timestamp');
        });
    });

    describe('onLevelSelectionChange', () => {
        it('updates selectedLevels and resets paginator and refreshes', () => {
            const refreshSpy = vi.spyOn(component, 'refreshData').mockImplementation(() => {});
            component.paginator.pageIndex = 3;

            component.onLevelSelectionChange({ value: [LogLevel.ERROR] } as any);

            expect(component.selectedLevels).toEqual([LogLevel.ERROR]);
            expect(component.paginator.pageIndex).toBe(0);
            expect(refreshSpy).toHaveBeenCalled();
        });
    });

    describe('levelToString', () => {
        it('converts all levels', () => {
            expect(component.levelToString(LogLevel.DEBUG)).toBe('DEBUG');
            expect(component.levelToString(LogLevel.INFO)).toBe('INFO');
            expect(component.levelToString(LogLevel.WARNING)).toBe('WARNING');
            expect(component.levelToString(LogLevel.ERROR)).toBe('ERROR');
        });
    });

    describe('levelClass', () => {
        it('returns error class for ERROR level', () => {
            expect(component.levelClass(LogLevel.ERROR)).toBe('log-level-error');
        });

        it('returns warning class for WARNING level', () => {
            expect(component.levelClass(LogLevel.WARNING)).toBe('log-level-warning');
        });

        it('returns empty string for other levels', () => {
            expect(component.levelClass(LogLevel.DEBUG)).toBe('');
            expect(component.levelClass(LogLevel.INFO)).toBe('');
        });
    });

    describe('refreshData', () => {
        it('calls logsService.getBasicLogs and updates datasource', () => {
            const mockData = [{ id: '1', message: 'test', level: LogLevel.INFO, timestamp: new Date(), partitionKey: 'p' }];
            mockLogsService.getBasicLogs.mockReturnValue(of({ data: mockData, totalCount: 1 }));

            component.refreshData();

            expect(mockLogsService.getBasicLogs).toHaveBeenCalled();
            expect(component.dataLoaded).toBe(true);
            expect(component.paginator.length).toBe(1);
            expect(component.datasource.data).toEqual(mockData);
        });
    });

    describe('applyFilter', () => {
        it('trims and lowercases the filter value', () => {
            const nextSpy = vi.spyOn(component['filterSubject'], 'next');
            component.applyFilter('  Hello World  ');
            expect(component.filter).toBe('hello world');
            expect(nextSpy).toHaveBeenCalledWith('hello world');
        });
    });
});
