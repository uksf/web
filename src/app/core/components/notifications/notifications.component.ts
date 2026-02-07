import { Component, OnInit, ElementRef, HostListener, ViewChild, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { SignalRService, ConnectionContainer } from '@app/core/services/signalr.service';
import { AccountService } from '@app/core/services/account.service';
import { Notification, NotificationsService } from '@app/core/services/notifications.service';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
    panel = false;
    notifications: Notification[] = [];
    unreadNotifications: Notification[] = [];
    private unreadTimeout: ReturnType<typeof setTimeout>;
    private hubConnection: ConnectionContainer;
    private destroy$ = new Subject<void>();

    private onReceiveNotification = (notification: Notification) => {
        this.notifications.unshift(notification);
        this.updateNotifications();
    };

    private onReceiveRead = (ids: string[]) => {
        ids.forEach((readId) => {
            const notification = this.notifications.find((x) => x.id === readId);
            if (notification) {
                notification.read = true;
            }
        });
        this.updateNotifications();
    };

    private onReceiveClear = (ids: string[]) => {
        ids.forEach((clearId) => {
            const index = this.notifications.findIndex((x) => x.id === clearId);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        });
        this.updateNotifications();
    };

    constructor(
        private router: Router,
        private elementRef: ElementRef,
        private notificationsService: NotificationsService,
        private signalrService: SignalRService,
        private accountService: AccountService
    ) {
        router.events.pipe(takeUntil(this.destroy$)).subscribe({
            next: (event) => {
                this.onClose();
                this.panel = false;

                if (event instanceof NavigationEnd) {
                    this.updateNotifications();
                }
            }
        });
    }

    ngOnInit() {
        this.getNotifications();
        this.waitForId().then((id) => {
            this.hubConnection = this.signalrService.connect(`notifications?userId=${id}`);
            this.hubConnection.connection.on('ReceiveNotification', this.onReceiveNotification);
            this.hubConnection.connection.on('ReceiveRead', this.onReceiveRead);
            this.hubConnection.connection.on('ReceiveClear', this.onReceiveClear);
            this.hubConnection.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
                next: () => {
                    this.getNotifications();
                }
            });
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.hubConnection) {
            this.hubConnection.connection.off('ReceiveNotification', this.onReceiveNotification);
            this.hubConnection.connection.off('ReceiveRead', this.onReceiveRead);
            this.hubConnection.connection.off('ReceiveClear', this.onReceiveClear);
            this.hubConnection.connection.stop();
        }
        clearTimeout(this.unreadTimeout);
    }

    getNotifications() {
        this.notificationsService.getNotifications().pipe(takeUntil(this.destroy$)).subscribe({
            next: (notifications) => {
                this.notifications = notifications;
                this.updateNotifications();
            }
        });
    }

    updateNotifications() {
        this.unreadNotifications = this.notifications.filter((x) => !x.read);
        this.notifications.forEach((x) => {
            if (x.link === this.router.url) {
                this.clear(x);
            }
        });
    }

    @HostListener('document:click', ['$event.target'])
    onClick(element) {
        if (!this.elementRef.nativeElement.contains(element)) {
            this.onClose();
            this.panel = false;
        }
    }

    togglePanel() {
        this.panel = !this.panel;
        if (this.panel) {
            if (this.unreadNotifications.length > 0) {
                this.unreadTimeout = setTimeout(() => {
                    this.notificationsService.markRead(this.unreadNotifications)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.unreadTimeout = null;
                            }
                        });
                }, 2000);
            }
            this.blockScrolling();
        } else {
            this.onClose();
        }
    }

    onClose() {
        this.unblockScrolling();
    }

    openNotification(notification: Notification) {
        if (notification.link) {
            this.clear(notification);
            this.router.navigate([notification.link]);
            this.onClose();
        }
    }

    clear(notification: Notification = null) {
        const clear = notification ? [notification] : this.notifications;
        this.notificationsService.clear(clear)
            .pipe(takeUntil(this.destroy$))
            .subscribe();
    }

    blockScrolling() {
        window.onscroll = this.scroll;
    }

    unblockScrolling() {
        window.onscroll = null;
    }

    scroll() {
        window.scrollTo(0, 0);
    }

    private waitForId(): Promise<string> {
        if (this.accountService.account?.id) {
            return Promise.resolve(this.accountService.account.id);
        }

        return new Promise<string>((resolve) => {
            const subscription = this.accountService.accountChange$.subscribe({
                next: (account) => {
                    if (account?.id) {
                        subscription.unsubscribe();
                        resolve(account.id);
                    }
                }
            });
        });
    }

    trackById(index: number, item: Notification): string {
        return item.id;
    }
}
