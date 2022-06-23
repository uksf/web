import { Component, EventEmitter, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { OperationsServersComponent } from './Components/operations/operations-servers/operations-servers.component';
import { CommandRanksComponent } from './Components/command/command-ranks/command-ranks.component';
import { CommandRolesComponent } from './Components/command/command-roles/command-roles.component';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from './Modals/confirmation-modal/confirmation-modal.component';
import { ConnectionContainer, SignalRService } from './Services/signalr.service';

@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    static themeUpdatedEvent: EventEmitter<null>;
    static utilityHubConnection: ConnectionContainer;
    theme;

    constructor(private overlayContainer: OverlayContainer, @Inject(PLATFORM_ID) private platformId, private dialog: MatDialog, private signalrService: SignalRService) {
        AppComponent.themeUpdatedEvent = new EventEmitter();
    }

    ngOnInit() {
        this.theme = 'dark';
        this.updateTheme();

        this.checkBrowser();
        AppComponent.utilityHubConnection = this.signalrService.connect('utility');
    }

    updateTheme(newTheme = 'dark') {
        this.theme = newTheme;
        this.overlayContainer.getContainerElement().classList.add(this.theme + '-theme');
        localStorage.setItem('theme', this.theme);
        this.updateThemeSubscribers();
    }

    updateThemeSubscribers() {
        OperationsServersComponent.theme = this.theme;
        CommandRanksComponent.theme = this.theme;
        CommandRolesComponent.theme = this.theme;
        AppComponent.themeUpdatedEvent.emit();
    }

    get Theme() {
        return this.theme;
    }

    checkBrowser() {
        return; // disabled for now

        const chromeWarning = localStorage.getItem('chromeWarning');
        if (chromeWarning && chromeWarning === 'dismissed') {
            return;
        }

        const isBrowser = isPlatformBrowser(this.platformId);
        if (!isBrowser) {
            return;
        }
        const tempWindow = isBrowser ? window : null;
        const userAgent = isBrowser ? tempWindow.navigator.userAgent.toLowerCase() : null;
        if (!/webkit/.test(userAgent) || !/chrome/.test(userAgent) || /msie|trident|edge/.test(userAgent)) {
            // is not chrome
            this.dialog
                .open(ConfirmationModalComponent, {
                    data: {
                        message:
                            "It looks like you're using a browser other than Chrome.\nWe have had some users experience issues on other browsers, and as such we recommend using Chrome.\n\nBy pressing 'Dismiss', this message will not appear again",
                        button: 'Dismiss'
                    }
                })
                .componentInstance.confirmEvent.subscribe(() => {
                    localStorage.setItem('chromeWarning', 'dismissed');
                });
        } else {
            localStorage.setItem('chromeWarning', 'dismissed');
        }
    }
}
