import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HomePageComponent } from './home-page.component';
import { of } from 'rxjs';

describe('HomePageComponent', () => {
    let component: HomePageComponent;
    let mockHttpClient: any;
    let mockUrls: any;
    let mockSignalrService: any;

    beforeEach(() => {
        vi.useFakeTimers();
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of({}))
        };
        mockUrls = { apiUrl: 'http://localhost:5500' };
        mockSignalrService = {
            connect: vi.fn().mockReturnValue({
                connection: {
                    on: vi.fn(),
                    off: vi.fn(),
                    stop: vi.fn()
                },
                reconnectEvent: of()
            })
        };

        component = new HomePageComponent(mockHttpClient, mockUrls, mockSignalrService);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('initializes time to current date', () => {
            expect(component.time).toBeInstanceOf(Date);
        });
    });

    describe('getClients', () => {
        it('assigns typed response properties', () => {
            const mockResponse = {
                commanders: [{ displayName: 'Commander 1' }],
                recruiters: [{ displayName: 'Recruiter 1' }],
                members: [{ displayName: 'Member 1' }, { displayName: 'Member 2' }],
                guests: [{ displayName: 'Guest 1' }]
            };
            mockHttpClient.get.mockReturnValue(of(mockResponse));

            component.ngOnInit();

            expect(component.commanders).toEqual([{ displayName: 'Commander 1' }]);
            expect(component.recruiters).toEqual([{ displayName: 'Recruiter 1' }]);
            expect(component.members).toHaveLength(2);
            expect(component.guests).toHaveLength(1);
        });

        it('does not assign when response properties are missing', () => {
            mockHttpClient.get.mockReturnValue(of({}));

            component.ngOnInit();

            expect(component.commanders).toBeUndefined();
            expect(component.recruiters).toBeUndefined();
        });

        it('does not assign when response is null', () => {
            mockHttpClient.get.mockReturnValue(of(null));

            component.ngOnInit();

            expect(component.commanders).toBeUndefined();
        });
    });

    describe('trackByDisplayName', () => {
        it('returns displayName', () => {
            expect(component.trackByDisplayName(0, { displayName: 'Test User' })).toBe('Test User');
        });
    });

    describe('trackByInstagramId', () => {
        it('returns instagram image id', () => {
            const image = {
                id: 'img-1',
                permalink: '',
                media_type: 'IMAGE',
                media_url: '',
                timestamp: new Date(),
                base64: ''
            };
            expect(component.trackByInstagramId(0, image)).toBe('img-1');
        });
    });

    describe('ngOnInit', () => {
        it('connects to teamspeakClients SignalR hub', () => {
            component.ngOnInit();

            expect(mockSignalrService.connect).toHaveBeenCalledWith('teamspeakClients');
        });

        it('fetches instagram images', () => {
            mockHttpClient.get.mockReturnValue(of([]));

            component.ngOnInit();

            const calls = mockHttpClient.get.mock.calls;
            const instagramCall = calls.find(c => c[0].includes('/instagram'));
            expect(instagramCall).toBeDefined();
        });
    });

    describe('ngOnDestroy', () => {
        it('clears time interval', () => {
            component.ngOnInit();
            const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

            component.ngOnDestroy();

            expect(clearIntervalSpy).toHaveBeenCalled();
        });

        it('disconnects SignalR hub', () => {
            component.ngOnInit();
            const hubConnection = mockSignalrService.connect.mock.results[0].value;

            component.ngOnDestroy();

            expect(hubConnection.connection.off).toHaveBeenCalledWith('ReceiveClients', expect.any(Function));
            expect(hubConnection.connection.stop).toHaveBeenCalled();
        });
    });
});
