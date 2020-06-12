import { Component, OnInit } from '@angular/core';
import { UrlService } from '../../Services/url.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material';
import { CreateIssueModalComponent } from '../../Modals/create-issue-modal/create-issue-modal.component';
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
    _time: number;
    private hubConnection: ConnectionContainer;
    private updateTimeout;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private signalrService: SignalRService) {
        this._time = Date.now();
        setInterval(() => {
            this._time = Date.now()
        }, 100);
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

    private mergeUpdates(callback: () => void) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            callback();
        }, 500);
    }

    private getClients() {
        // this.httpClient.get('https://api.uk-sf.co.uk/accounts/online').subscribe(
        this.httpClient.get(this.urls.apiUrl + '/accounts/online').subscribe(
            response => {
                if (response) {
                    if (response['commanders']) {
                        this.commanders = response['commanders'];
                    };
                    if (response['recruiters']) {
                        this.recruiters = response['recruiters'];
                    };
                    if (response['members']) {
                        this.members = response['members'];
                    };
                    if (response['guests']) {
                        this.guests = response['guests'];
                    };
                }
            }, error => this.urls.errorWrapper('Failed to get online TeamSpeak clients', error)
        );
    }

    private getInstagramImages() {
        this.httpClient.get('https://www.instagram.com/uksfmilsim/?__a=1').subscribe((response: any) => {
            if (response.graphql) {
                const imageNodes: [] = response.graphql.user.edge_owner_to_timeline_media.edges;
                imageNodes.forEach((imageNode: any) => {
                    this.instagramImages.push({ uri: imageNode.node.display_url, shortcode: imageNode.node.shortcode });
                });
            }
        });
    }

    get time() {
        return this._time;
    }

    openIssueModal(type) {
        this.dialog.open(CreateIssueModalComponent, {
            data: {
                type: type
            }
        });
    }
}

export interface InstagramImage {
    uri: string;
    shortcode: string;
}
