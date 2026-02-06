import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UrlService } from '@app/core/services/url.service';
import { HttpClient } from '@angular/common/http';
import { ConnectionContainer, SignalRService } from '@app/core/services/signalr.service';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, OnDestroy {
    commanders;
    recruiters;
    members;
    guests;
    content = [];
    instagramImages: InstagramImage[] = [];
    _time: Date;
    private hubConnection: ConnectionContainer;
    private updateTimeout;
    private timeInterval;
    private destroy$ = new Subject<void>();

    constructor(private httpClient: HttpClient, private urls: UrlService, private signalrService: SignalRService) {
        this._time = new Date();
        this.timeInterval = setInterval(() => {
            this._time = new Date();
        }, 250);
    }

    ngOnInit(): void {
        this.getClients();
        this.hubConnection = this.signalrService.connect('teamspeakClients');
        this.hubConnection.connection.on('ReceiveClients', () => {
            this.mergeUpdates(() => {
                this.getClients();
            });
        });
        this.hubConnection.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.mergeUpdates(() => {
                    this.getClients();
                });
            }
        });

        this.getInstagramImages();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        if (this.hubConnection) {
            this.hubConnection.connection.stop();
        }
    }

    get time() {
        return this._time;
    }

    private mergeUpdates(callback: () => void) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            callback();
        }, 500);
    }

    private getClients() {
        // this.httpClient.get('https://api.uk-sf.co.uk/teamspeak/onlineAccounts').subscribe(
        this.httpClient.get(this.urls.apiUrl + '/teamspeak/onlineAccounts').pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                if (response) {
                    if (response['commanders']) {
                        this.commanders = response['commanders'];
                    }
                    if (response['recruiters']) {
                        this.recruiters = response['recruiters'];
                    }
                    if (response['members']) {
                        this.members = response['members'];
                    }
                    if (response['guests']) {
                        this.guests = response['guests'];
                    }
                }
            }
        });
    }

    trackByInstagramId(index: number, item: InstagramImage): string {
        return item.id;
    }

    trackByDisplayName(index: number, item: any): string {
        return item.displayName;
    }

    private getInstagramImages() {
        this.httpClient.get(this.urls.apiUrl + '/instagram').pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: InstagramImage[]) => {
                if (response.length > 0) {
                    this.instagramImages = response;
                }
            }
        });
    }
}

export interface InstagramImage {
    id: string;
    permalink: string;
    media_type: string;
    media_url: string;
    timestamp: Date;
    base64: string;
}
