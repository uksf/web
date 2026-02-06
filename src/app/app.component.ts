import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { ConnectionContainer, SignalRService } from '@app/core/services/signalr.service';

@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    static utilityHubConnection: ConnectionContainer;

    constructor(private overlayContainer: OverlayContainer, @Inject(PLATFORM_ID) private platformId, private dialog: MatDialog, private signalrService: SignalRService) {}

    ngOnInit() {
        this.overlayContainer.getContainerElement().classList.add('dark-theme');

        this.checkBrowser();
        AppComponent.utilityHubConnection = this.signalrService.connect('utility');
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
                .afterClosed()
                .subscribe({
                    next: (result) => {
                        if (result) {
                            localStorage.setItem('chromeWarning', 'dismissed');
                        }
                    }
                });
        } else {
            localStorage.setItem('chromeWarning', 'dismissed');
        }
    }
}
