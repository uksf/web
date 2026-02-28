import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet } from '@angular/router';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { ConnectionContainer, SignalRService } from '@app/core/services/signalr.service';
import { SignalRHubsService } from '@app/core/services/signalr-hubs.service';
import { HeaderBarComponent } from '@app/core/components/header-bar/header-bar.component';
import { SideBarComponent } from '@app/core/components/side-bar/side-bar.component';
import { FooterBarComponent } from '@app/core/components/footer-bar/footer-bar.component';

@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet, HeaderBarComponent, SideBarComponent, FooterBarComponent]
})
export class AppComponent implements OnInit, OnDestroy {
    private overlayContainer = inject(OverlayContainer);
    private platformId = inject(PLATFORM_ID);
    private dialog = inject(MatDialog);
    private signalrService = inject(SignalRService);
    private signalRHubsService = inject(SignalRHubsService);

    static utilityHubConnection: ConnectionContainer;

    ngOnInit() {
        this.overlayContainer.getContainerElement().classList.add('dark-theme');

        this.checkBrowser();
        AppComponent.utilityHubConnection = this.signalrService.connect('utility');
    }

    ngOnDestroy() {
        this.signalRHubsService.disconnect();
        if (AppComponent.utilityHubConnection) {
            AppComponent.utilityHubConnection.dispose();
            AppComponent.utilityHubConnection.connection.stop();
        }
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
