import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AdminDiscordLogsComponent } from './admin-discord-logs.component';
import { DiscordUserEventType } from '@app/features/admin/models/logging';
import { SortDirection } from '@app/shared/models/sort-direction';
import { LogsService } from '../../services/logs.service';
import { AdminHubService } from '../../services/admin-hub.service';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { of } from 'rxjs';

describe('AdminDiscordLogsComponent', () => {
    let component: AdminDiscordLogsComponent;
    let mockLogsService: any;

    beforeEach(() => {
        mockLogsService = {
            getBasicLogs: vi.fn().mockReturnValue(of({ data: [], totalCount: 0 })),
            getDiscordLogs: vi.fn().mockReturnValue(of({ data: [], totalCount: 0 })),
        };

        TestBed.configureTestingModule({
            providers: [
                AdminDiscordLogsComponent,
                { provide: LogsService, useValue: mockLogsService },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: AdminHubService, useValue: { connect: vi.fn(), disconnect: vi.fn(), on: vi.fn(), off: vi.fn(), reconnected$: of() } },
                { provide: Clipboard, useValue: { copy: vi.fn() } },
            ]
        });

        component = TestBed.inject(AdminDiscordLogsComponent);
        component.paginator = { pageIndex: 0, pageSize: 25, length: 0, page: of() } as any;
        component.sort = { direction: 'desc', active: 'timestamp', sortChange: of() } as any;
    });

    describe('buildParams', () => {
        it('does not include eventTypes param when no event types are selected (shows all)', () => {
            component.selectedEventTypes = [];
            const params = component.buildParams();
            expect(params.has('eventTypes')).toBe(false);
        });

        it('does not include eventTypes param when all event types are selected (shows all)', () => {
            component.selectedEventTypes = [...component.allEventTypes];
            const params = component.buildParams();
            expect(params.has('eventTypes')).toBe(false);
        });

        it('includes eventTypes param when some event types are selected', () => {
            component.selectedEventTypes = [DiscordUserEventType.JOINED, DiscordUserEventType.BANNED];
            const params = component.buildParams();
            expect(params.get('eventTypes')).toBe('Joined,Banned');
        });

        it('still includes base params from parent', () => {
            component.selectedEventTypes = [...component.allEventTypes];
            const params = component.buildParams();
            expect(params.get('page')).toBe('1');
            expect(params.get('pageSize')).toBe('25');
            expect(params.get('sortDirection')).toBe(String(SortDirection.DESCENDING));
            expect(params.get('sortField')).toBe('timestamp');
        });

        it('uses api string format for event types', () => {
            component.selectedEventTypes = [DiscordUserEventType.MESSAGE_DELETED];
            const params = component.buildParams();
            expect(params.get('eventTypes')).toBe('Message_Deleted');
        });
    });

    describe('onEventTypeSelectionChange', () => {
        it('updates selectedEventTypes and resets paginator and refreshes', () => {
            const refreshSpy = vi.spyOn(component, 'refreshData').mockImplementation(() => {});
            component.paginator.pageIndex = 2;

            component.onEventTypeSelectionChange({ value: [DiscordUserEventType.LEFT] } as any);

            expect(component.selectedEventTypes).toEqual([DiscordUserEventType.LEFT]);
            expect(component.paginator.pageIndex).toBe(0);
            expect(refreshSpy).toHaveBeenCalled();
        });
    });

    describe('eventTypeToString', () => {
        it('converts all event types', () => {
            expect(component.eventTypeToString(DiscordUserEventType.JOINED)).toBe('JOINED');
            expect(component.eventTypeToString(DiscordUserEventType.LEFT)).toBe('LEFT');
            expect(component.eventTypeToString(DiscordUserEventType.BANNED)).toBe('BANNED');
            expect(component.eventTypeToString(DiscordUserEventType.UNBANNED)).toBe('UNBANNED');
            expect(component.eventTypeToString(DiscordUserEventType.MESSAGE_DELETED)).toBe('MESSAGE DELETED');
        });
    });

    describe('refreshData', () => {
        it('calls logsService.getDiscordLogs and updates datasource', () => {
            const mockData = [{
                id: '1', message: 'test', level: 0, timestamp: new Date(), partitionKey: 'p',
                discordUserEventType: DiscordUserEventType.JOINED, instigatorId: '', instigatorName: '', channelName: '', name: 'user'
            }];
            mockLogsService.getDiscordLogs.mockReturnValue(of({ data: mockData, totalCount: 1 }));

            component.refreshData();

            expect(mockLogsService.getDiscordLogs).toHaveBeenCalled();
            expect(component.dataLoaded).toBe(true);
            expect(component.paginator.length).toBe(1);
            expect(component.datasource.data).toEqual(mockData);
        });
    });
});
