import { Component, OnInit, inject } from '@angular/core';
import { first, takeUntil } from 'rxjs/operators';
import { TeamspeakClientsHubService } from '@app/shared/services/teamspeak-clients-hub.service';
import { DebouncedCallback } from '@app/shared/utils/debounce-callback';
import { DestroyableComponent } from '@app/shared/components';
import { HomeService, InstagramImage, TeamspeakOnlineUser } from '../../services/home.service';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { SideContentAreaComponent } from '../../../../shared/components/content-areas/side-content-area/side-content-area.component';
import { MatCard } from '@angular/material/card';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ZonedTime } from '../../../../shared/pipes/time.pipe';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [DefaultContentAreasComponent, MainContentAreaComponent, SideContentAreaComponent, MatCard, FlexFillerComponent, MatProgressSpinner, ZonedTime]
})
export class HomePageComponent extends DestroyableComponent implements OnInit {
    private homeService = inject(HomeService);
    private teamspeakHub = inject(TeamspeakClientsHubService);

    commanders: TeamspeakOnlineUser[];
    recruiters: TeamspeakOnlineUser[];
    members: TeamspeakOnlineUser[];
    guests: TeamspeakOnlineUser[];
    content = [];
    instagramImages: InstagramImage[] = [];
    _time: Date;
    private debouncedUpdate = new DebouncedCallback();
    private timeInterval: ReturnType<typeof setInterval>;

    private onReceiveClients = () => {
        this.debouncedUpdate.schedule(() => {
            this.getClients();
        });
    };

    constructor() {
        super();
        this._time = new Date();
        this.timeInterval = setInterval(() => {
            this._time = new Date();
        }, 250);
    }

    ngOnInit(): void {
        this.getClients();
        this.teamspeakHub.connect();
        this.teamspeakHub.on('ReceiveClients', this.onReceiveClients);
        this.teamspeakHub.reconnected$.pipe(takeUntil(this.destroy$)).subscribe({
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
        this.teamspeakHub.off('ReceiveClients', this.onReceiveClients);
        this.teamspeakHub.disconnect();
    }

    get time() {
        return this._time;
    }

    private getClients() {
        this.homeService
            .getOnlineAccounts()
            .pipe(first())
            .subscribe({
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
        return item.id || String(index);
    }

    trackByDisplayName(index: number, item: { displayName: string }): string {
        return item.displayName;
    }

    private getInstagramImages() {
        this.homeService
            .getInstagramImages()
            .pipe(first())
            .subscribe({
                next: (response) => {
                    if (response.length > 0) {
                        this.instagramImages = response;
                    }
                }
            });
    }
}
