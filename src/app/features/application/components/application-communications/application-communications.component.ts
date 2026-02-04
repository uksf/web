import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from '@app/Modals/message-modal/message-modal.component';
import { AccountService } from '@app/Services/account.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmationModalComponent } from '@app/Modals/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-application-communications',
    templateUrl: './application-communications.component.html',
    styleUrls: ['./application-communications.component.scss', '../application-page/application-page.component.scss'],
})
export class ApplicationCommunicationsComponent {
    @Output() nextEvent = new EventEmitter();
    mode = 'pending';
    private pendingValidation = false;

    constructor(private httpClient: HttpClient, private urls: UrlService, public dialog: MatDialog, private accountService: AccountService, private router: Router, private route: ActivatedRoute) {
        if (window.location.href.indexOf('steamid=') !== -1) {
            this.pendingValidation = true;
            const id = this.route.snapshot.queryParams['steamid'];
            if (id === 'fail') {
                this.router.navigate(['/application']).then(() => {
                    this.pendingValidation = false;
                    this.checkModes();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: 'Steam failed to connect' },
                    });
                });
            } else {
                const code = this.route.snapshot.queryParams['validation'];
                this.httpClient.post(this.urls.apiUrl + '/steamcode/' + id, { code: code }).subscribe({
                    next: () => {
                        this.router.navigate(['/application']).then(() => {
                            this.pendingValidation = false;
                            this.checkModes();
                            this.dialog.open(MessageModalComponent, {
                                data: { message: 'Steam successfully connected' },
                            });
                        });
                    },
                    error: (error) => {
                        this.router.navigate(['/application']).then(() => {
                            this.pendingValidation = false;
                            this.dialog.open(MessageModalComponent, {
                                data: { message: error.error },
                            });
                        });
                    }
                });
            }
        } else if (window.location.href.indexOf('discordid=') !== -1) {
            this.pendingValidation = true;
            const id = this.route.snapshot.queryParams['discordid'];
            if (id === 'fail') {
                this.router.navigate(['/application']).then(() => {
                    this.pendingValidation = false;
                    this.checkModes();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: 'Discord failed to connect' },
                    });
                });
            } else {
                const code = this.route.snapshot.queryParams['validation'];
                const added = this.route.snapshot.queryParams['added'];
                this.httpClient.post(this.urls.apiUrl + '/discordcode/' + id, { code: code }).subscribe({
                    next: () => {
                        this.router.navigate(['/application']).then(() => {
                            this.pendingValidation = false;
                            this.checkModes();
                            if (added === 'true') {
                                this.dialog.open(MessageModalComponent, {
                                    data: { message: 'Discord successfully connected' },
                                });
                            } else {
                                this.dialog
                                    .open(ConfirmationModalComponent, {
                                        data: {
                                            message: "Discord successfully connected\n\nWe were unable to add you to our Discord server.\nPlease join by pressing 'Join Discord'",
                                            button: 'Join Discord',
                                        },
                                    })
                                    .afterClosed()
                                    .subscribe({
                                        next: (result) => {
                                            if (result) {
                                                window.open('https://discord.uk-sf.co.uk', '_blank');
                                            }
                                        }
                                    });
                            }
                        });
                    },
                    error: (error) => {
                        this.router.navigate(['/application']).then(() => {
                            this.pendingValidation = false;
                            this.dialog.open(MessageModalComponent, {
                                data: { message: error.error },
                            });
                        });
                    }
                });
            }
        }
    }

    ngOnInit(): void {
        this.checkModes();
    }

    connected() {
        this.checkModes();
    }

    checkModes() {
        if (this.pendingValidation) {
            return;
        }

        if (this.accountService.account) {
            this.accountService.getAccount(() => {
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
            this.router.navigate(['/login'], { queryParams: { redirect: 'application' } }).then();
        }
    }

    connectSteam() {
        this.dialog
            .open(ConfirmationModalComponent, {
                data: {
                    message:
                        "By pressing 'Continue' you will be redirected to <b>steamcommunity.com</b> where you will be asked to log in." +
                        '\nBy doing so, we are able to read only your Steam User ID, which we store in our database for the purpose of verifying you have a valid Steam account and for recruitment communication.' +
                        '\nWe can read no more information about your account than this.' +
                        '\n\nPlease note this is done on the official Steam website, meaning we have zero interaction with your login process.' +
                        '\nIf you have any concerns about this process, please contact UKSF Staff for assistance.',
                    button: 'Continue',
                },
            })
            .afterClosed()
            .subscribe({
                next: (result) => {
                    if (result) {
                        window.location.href = this.urls.apiUrl + '/steamconnection/application';
                    }
                }
            });
    }

    connectDiscord() {
        this.dialog
            .open(ConfirmationModalComponent, {
                data: {
                    message:
                        "By pressing 'Continue' you will be redirected to <b>discord.com</b> where you will be asked to log in." +
                        '\nBy doing so, we are able to read only your Discord User ID, which we store in our database for the purpose of connectivity between this website and our Discord server.' +
                        '\nIn addition to reading your User ID, we will automatically add you to our Discord server.' +
                        '\nWe can read no more information about your account than this.' +
                        '\n\nPlease note this is done on the official Discord website, meaning we have zero interaction with your login process.' +
                        '\nIf you have any concerns about this process, please contact UKSF Staff for assistance.',
                    button: 'Continue',
                },
            })
            .afterClosed()
            .subscribe({
                next: (result) => {
                    if (result) {
                        window.location.href = this.urls.apiUrl + '/discordconnection/application';
                    }
                }
            });
    }

    next() {
        this.nextEvent.emit();
    }
}
