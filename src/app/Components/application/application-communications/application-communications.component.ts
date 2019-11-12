import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { AccountService } from 'app/Services/account.service';
import { Router, ActivatedRoute } from '@angular/router';
import { PermissionsService } from 'app/Services/permissions.service';

@Component({
    selector: 'app-application-communications',
    templateUrl: './application-communications.component.html',
    styleUrls: ['./application-communications.component.scss', '../../../Pages/new-application-page/new-application-page.component.scss']
})
export class ApplicationCommunicationsComponent {
    @Output() nextEvent = new EventEmitter();
    mode = 'teamspeak';

    constructor(
        private httpClient: HttpClient,
        private urls: UrlService,
        public dialog: MatDialog,
        private accountService: AccountService,
        private router: Router,
        private route: ActivatedRoute,
        private permissionsService: PermissionsService
    ) {
        if (window.location.href.indexOf('steamid=') !== -1) {
            const id = this.route.snapshot.queryParams['steamid'];
            const code = this.route.snapshot.queryParams['validation'];
            this.httpClient.post(this.urls.apiUrl + '/steamcode/' + id, { code: code }).subscribe(() => {
                this.router.navigate(['/application']).then(() => {
                    this.checkModes();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: 'Steam successfully connected' }
                    });
                });
            }, error => {
                this.router.navigate(['/application']).then(() => {
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error.error }
                    });
                });
            });
        } else if (window.location.href.indexOf('discordid=') !== -1) {
            const id = this.route.snapshot.queryParams['discordid'];
            const code = this.route.snapshot.queryParams['validation'];
            this.httpClient.post(this.urls.apiUrl + '/discordcode/' + id, { code: code }).subscribe(() => {
                this.router.navigate(['/application']).then(() => {
                    this.checkModes();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: 'Discord successfully connected' }
                    });
                });
            }, error => {
                this.router.navigate(['/application']).then(() => {
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error.error }
                    });
                });
            });
        }
    }

    ngOnInit(): void {
        this.checkModes();
    }

    connected() {
        this.checkModes();
    }

    checkModes() {
        if (this.accountService.account) {
            this.permissionsService.refresh().then(() => {
                if (!this.accountService.account.teamspeakIdentities || this.accountService.account.teamspeakIdentities.length === 0) {
                    this.mode = 'teamspeak';
                } else if (!this.accountService.account.steamname) {
                    this.mode = 'steam';
                } else if (!this.accountService.account.discordId) {
                    this.mode = 'discord';
                } else {
                    this.next();
                }
            });
        } else {
            this.router.navigate(['/login'], { queryParams: { redirect: 'application' } });
        }
    }

    connectSteam() {
        window.location.href = this.urls.steamUrl + '/steam/application';
    }

    connectDiscord() {
        window.location.href = this.urls.steamUrl + '/discord/application';
    }

    next() {
        this.nextEvent.emit();
    }
}
