import { Component, OnInit } from '@angular/core';
import { first, takeUntil } from 'rxjs/operators';
import { ConnectionContainer, SignalRService } from '@app/core/services/signalr.service';
import { DebouncedCallback } from '@app/shared/utils/debounce-callback';
import { DestroyableComponent } from '@app/shared/components';
import { HomeService, InstagramImage, TeamspeakOnlineUser } from '../../services/home.service';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent extends DestroyableComponent implements OnInit {
    commanders: TeamspeakOnlineUser[];
    recruiters: TeamspeakOnlineUser[];
    members: TeamspeakOnlineUser[];
    guests: TeamspeakOnlineUser[];
    content = [];
    instagramImages: InstagramImage[] = [];
    _time: Date;
    private hubConnection: ConnectionContainer;
    private debouncedUpdate = new DebouncedCallback();
    private timeInterval: ReturnType<typeof setInterval>;

    private onReceiveClients = () => {
        this.debouncedUpdate.schedule(() => {
            this.getClients();
        });
    };

    constructor(private homeService: HomeService, private signalrService: SignalRService) {
        super();
        this._time = new Date();
        this.timeInterval = setInterval(() => {
            this._time = new Date();
        }, 250);
    }

    ngOnInit(): void {
        this.getClients();
        this.hubConnection = this.signalrService.connect('teamspeakClients');
        this.hubConnection.connection.on('ReceiveClients', this.onReceiveClients);
        this.hubConnection.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.debouncedUpdate.schedule(() => {
                    this.getClients();
                });
            }
        });

        this.getInstagramImages();
    }

    override ngOnDestroy() {
        super.ngOnDestroy();
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
        this.debouncedUpdate.cancel();
        if (this.hubConnection) {
            this.hubConnection.connection.off('ReceiveClients', this.onReceiveClients);
            this.hubConnection.connection.stop();
        }
    }

    get time() {
        return this._time;
    }

    private getClients() {
        this.homeService.getOnlineAccounts().pipe(first()).subscribe({
            next: (response) => {
                if (response) {
                    if (response.commanders) {
                        this.commanders = response.commanders;
                    }
                    if (response.recruiters) {
                        this.recruiters = response.recruiters;
                    }
                    if (response.members) {
                        this.members = response.members;
                    }
                    if (response.guests) {
                        this.guests = response.guests;
                    }
                }
            }
        });
    }

    trackByInstagramId(index: number, item: InstagramImage): string {
        return item.id;
    }

    trackByDisplayName(index: number, item: { displayName: string }): string {
        return item.displayName;
    }

    private getInstagramImages() {
        this.homeService.getInstagramImages().pipe(first()).subscribe({
            next: (response) => {
                if (response.length > 0) {
                    this.instagramImages = response;
                }
            }
        });
    }
}
