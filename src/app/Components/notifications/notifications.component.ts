import { Component, OnInit, ElementRef, HostListener, ViewChild, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { SignalRService, ConnectionContainer } from 'app/Services/signalr.service';
import { AccountService } from 'app/Services/account.service';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
    panel = false;
    notifications = new Array<any>();
    unreadNotifications = new Array<any>();
    private unreadTimeout;
    private hubConnection: ConnectionContainer;

    constructor(private router: Router, private elementRef: ElementRef, private httpClient: HttpClient, private urlService: UrlService, private signalrService: SignalRService, private accountService: AccountService) {
        router.events.subscribe(event => {
            this.onClose();
            this.panel = false;

            if (event instanceof NavigationEnd) {
                this.updateNotifications();
            }
        });
    }

    ngOnInit() {
        this.getNotifications();
        this.waitForId().then(id => {
            this.hubConnection = this.signalrService.connect(`notifications?userId=${id}`);
            this.hubConnection.connection.on('ReceiveNotification', (notification) => {
                this.notifications.unshift(notification);
                this.updateNotifications();
            });
            this.hubConnection.connection.on('ReceiveRead', (ids: any[]) => {
                ids.forEach(readId => {
                    const notification = this.notifications.find(x => x.id === readId);
                    if (notification) {
                        notification.read = true;
                    }
                });
                this.updateNotifications();
            });
            this.hubConnection.connection.on('ReceiveClear', (ids: any[]) => {
                ids.forEach(clearId => {
                    const index = this.notifications.findIndex(x => x.id === clearId);
                    if (index > -1) {
                        this.notifications.splice(index, 1);
                    }
                });
                this.updateNotifications();
            });
            this.hubConnection.reconnectEvent.subscribe(() => {
                this.getNotifications();
            });
        });
    }

    ngOnDestroy() {
        this.hubConnection.connection.stop();
        clearTimeout(this.unreadTimeout);
    }

    getNotifications() {
        this.httpClient.get(this.urlService.apiUrl + '/notifications').subscribe(response => {
            this.notifications = response as any[];
            this.updateNotifications();
        });
    }

    updateNotifications() {
        this.unreadNotifications = this.notifications.filter(x => !x.read);
        this.notifications.forEach(x => {
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
                    this.httpClient.post(this.urlService.apiUrl + '/notifications/read', {
                        notifications: this.unreadNotifications
                    }).subscribe(_ => {
                        this.unreadTimeout = null;
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

    openNotification(notification) {
        if (notification.link) {
            this.clear(notification);
            this.router.navigate([notification.link]);
            this.onClose();
        }
    }

    clear(notification = null) {
        const clear = notification ? [notification] : this.notifications;
        this.httpClient.post(this.urlService.apiUrl + '/notifications/clear', {
            clear: clear
        }).subscribe();
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

    waitForId(): Promise<string> {
        return new Promise<string>(async (resolve) => {
            while (!this.accountService.account || !this.accountService.account.id) {
                await this.delay(100);
            }
            resolve(this.accountService.account.id);
        });
    }

    async delay(delay: number) { return new Promise(resolve => setTimeout(resolve, delay)); }
}
