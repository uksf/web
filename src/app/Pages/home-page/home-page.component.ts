import { Component, OnInit } from '@angular/core';
import { UrlService } from '../../Services/url.service';
import { HttpClient } from '@angular/common/http';
import { ConnectionContainer, SignalRService } from 'app/Services/signalr.service';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
    commanders;
    recruiters;
    members;
    guests;
    content = [];
    instagramImages: InstagramImage[] = [];
    _time: Date;
    private hubConnection: ConnectionContainer;
    private updateTimeout;

    constructor(private httpClient: HttpClient, private urls: UrlService, private signalrService: SignalRService) {
        this._time = new Date();
        setInterval(() => {
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
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.mergeUpdates(() => {
                this.getClients();
            });
        });

        this.getInstagramImages();
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
        this.httpClient.get(this.urls.apiUrl + '/teamspeak/onlineAccounts').subscribe((response) => {
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
        });
    }

    private getInstagramImages() {
        this.httpClient.get(this.urls.apiUrl + '/instagram').subscribe((response: InstagramImage[]) => {
            if (response.length > 0) {
                this.instagramImages = response;
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
