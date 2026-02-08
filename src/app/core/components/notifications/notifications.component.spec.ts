import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationsComponent } from './notifications.component';
import { Notification } from '@app/core/services/notifications.service';
import { of, Subject, BehaviorSubject } from 'rxjs';
import { NavigationEnd } from '@angular/router';

describe('NotificationsComponent', () => {
    let component: NotificationsComponent;
    let mockRouter: any;
    let mockElementRef: any;
    let mockNotificationsService: any;
    let mockSignalrService: any;
    let mockAccountService: any;
    let routerEvents$: Subject<any>;

    const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
        id: 'n1',
        icon: 'info',
        message: 'Test notification',
        link: '/test',
        read: false,
        timestamp: new Date(),
        ...overrides
    });

    beforeEach(() => {
        routerEvents$ = new Subject<any>();
        mockRouter = {
            events: routerEvents$.asObservable(),
            url: '/home',
            navigate: vi.fn()
        };
        mockElementRef = {
            nativeElement: {
                contains: vi.fn().mockReturnValue(false)
            }
        };
        mockNotificationsService = {
            getNotifications: vi.fn().mockReturnValue(of([])),
            markRead: vi.fn().mockReturnValue(of({})),
            clear: vi.fn().mockReturnValue(of({}))
        };
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
        mockAccountService = {
            account: { id: 'user1' },
            accountChange$: new BehaviorSubject({ id: 'user1' })
        };

        component = new NotificationsComponent(
            mockRouter,
            mockElementRef,
            mockNotificationsService,
            mockSignalrService,
            mockAccountService
        );
    });

    describe('updateNotifications', () => {
        it('filters unread notifications', () => {
            component.notifications = [
                makeNotification({ id: '1', read: false }),
                makeNotification({ id: '2', read: true }),
                makeNotification({ id: '3', read: false })
            ];

            component.updateNotifications();

            expect(component.unreadNotifications).toHaveLength(2);
            expect(component.unreadNotifications.map(n => n.id)).toEqual(['1', '3']);
        });

        it('clears notifications matching current route', () => {
            mockRouter.url = '/test';
            component.notifications = [
                makeNotification({ id: '1', link: '/test' }),
                makeNotification({ id: '2', link: '/other' })
            ];

            component.updateNotifications();

            expect(mockNotificationsService.clear).toHaveBeenCalledWith(
                [expect.objectContaining({ id: '1' })]
            );
        });

        it('returns empty when all notifications are read', () => {
            component.notifications = [
                makeNotification({ id: '1', read: true }),
                makeNotification({ id: '2', read: true })
            ];

            component.updateNotifications();

            expect(component.unreadNotifications).toHaveLength(0);
        });
    });

    describe('onReceiveNotification', () => {
        it('prepends new notification to list', () => {
            component.notifications = [makeNotification({ id: '1' })];
            const newNotification = makeNotification({ id: '2', message: 'New' });

            (component as any).onReceiveNotification(newNotification);

            expect(component.notifications).toHaveLength(2);
            expect(component.notifications[0].id).toBe('2');
        });
    });

    describe('onReceiveRead', () => {
        it('marks matching notifications as read', () => {
            component.notifications = [
                makeNotification({ id: '1', read: false }),
                makeNotification({ id: '2', read: false }),
                makeNotification({ id: '3', read: false })
            ];

            (component as any).onReceiveRead(['1', '3']);

            expect(component.notifications[0].read).toBe(true);
            expect(component.notifications[1].read).toBe(false);
            expect(component.notifications[2].read).toBe(true);
        });

        it('ignores unknown ids', () => {
            component.notifications = [
                makeNotification({ id: '1', read: false })
            ];

            (component as any).onReceiveRead(['unknown']);

            expect(component.notifications[0].read).toBe(false);
        });
    });

    describe('onReceiveClear', () => {
        it('removes matching notifications', () => {
            component.notifications = [
                makeNotification({ id: '1' }),
                makeNotification({ id: '2' }),
                makeNotification({ id: '3' })
            ];

            (component as any).onReceiveClear(['1', '3']);

            expect(component.notifications).toHaveLength(1);
            expect(component.notifications[0].id).toBe('2');
        });

        it('ignores unknown ids', () => {
            component.notifications = [
                makeNotification({ id: '1' })
            ];

            (component as any).onReceiveClear(['unknown']);

            expect(component.notifications).toHaveLength(1);
        });
    });

    describe('openNotification', () => {
        beforeEach(() => {
            // Mock window for blockScrolling/unblockScrolling
            (globalThis as any).window = { onscroll: null, scrollTo: vi.fn() };
        });

        afterEach(() => {
            delete (globalThis as any).window;
        });

        it('navigates to notification link and clears it', () => {
            const notification = makeNotification({ link: '/some-page' });

            component.openNotification(notification);

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/some-page']);
            expect(mockNotificationsService.clear).toHaveBeenCalledWith([notification]);
        });

        it('does nothing when notification has no link', () => {
            const notification = makeNotification({ link: '' });

            component.openNotification(notification);

            expect(mockRouter.navigate).not.toHaveBeenCalled();
        });
    });

    describe('togglePanel', () => {
        beforeEach(() => {
            (globalThis as any).window = { onscroll: null, scrollTo: vi.fn() };
        });

        afterEach(() => {
            delete (globalThis as any).window;
        });

        it('toggles panel state', () => {
            expect(component.panel).toBe(false);

            component.togglePanel();
            expect(component.panel).toBe(true);

            component.togglePanel();
            expect(component.panel).toBe(false);
        });
    });

    describe('clear', () => {
        it('sends single notification when provided', () => {
            const notification = makeNotification({ id: '1' });

            component.clear(notification);

            expect(mockNotificationsService.clear).toHaveBeenCalledWith([notification]);
        });

        it('sends all notifications when none provided', () => {
            component.notifications = [
                makeNotification({ id: '1' }),
                makeNotification({ id: '2' })
            ];

            component.clear();

            expect(mockNotificationsService.clear).toHaveBeenCalledWith(component.notifications);
        });
    });

    describe('waitForId', () => {
        it('resolves immediately when account id is available', async () => {
            mockAccountService.account = { id: 'user1' };

            const id = await (component as any).waitForId();

            expect(id).toBe('user1');
        });

        it('waits for accountChange$ when account is not yet available', async () => {
            mockAccountService.account = null;
            const accountChange$ = new Subject<any>();
            mockAccountService.accountChange$ = accountChange$;

            const idPromise = (component as any).waitForId();
            accountChange$.next({ id: 'user2' });

            const id = await idPromise;
            expect(id).toBe('user2');
        });
    });

    describe('trackById', () => {
        it('returns notification id', () => {
            const notification = makeNotification({ id: 'test-id' });
            expect(component.trackById(0, notification)).toBe('test-id');
        });
    });

    describe('onClick', () => {
        beforeEach(() => {
            (globalThis as any).window = { onscroll: null, scrollTo: vi.fn() };
        });

        afterEach(() => {
            delete (globalThis as any).window;
        });

        it('closes panel when clicking outside', () => {
            component.panel = true;
            mockElementRef.nativeElement.contains.mockReturnValue(false);

            component.onClick({} as any);

            expect(component.panel).toBe(false);
        });

        it('keeps panel open when clicking inside', () => {
            component.panel = true;
            mockElementRef.nativeElement.contains.mockReturnValue(true);

            component.onClick({} as any);

            expect(component.panel).toBe(true);
        });
    });
});
