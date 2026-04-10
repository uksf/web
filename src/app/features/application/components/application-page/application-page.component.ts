import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/core/services/account.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { MembershipState } from '@app/shared/models/account';
import { ApplicationState } from '@app/features/application/models/application';
import { ApplicationService } from '../../services/application.service';
import { ApplicationAnalyticsService } from '../../services/application-analytics.service';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatCard } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ApplicationInfoComponent } from '../application-info/application-info.component';
import { ApplicationIdentityComponent } from '../application-identity/application-identity.component';
import { ApplicationEmailConfirmationComponent } from '../application-email-confirmation/application-email-confirmation.component';
import { ApplicationCommunicationsComponent } from '../application-communications/application-communications.component';
import { ApplicationDetailsComponent } from '../application-details/application-details.component';
import { ApplicationEditComponent } from '../application-edit/application-edit.component';

@Component({
    selector: 'app-application-page',
    templateUrl: './application-page.component.html',
    styleUrls: ['./application-page.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        MatCard,
        RouterLink,
        NgClass,
        ApplicationInfoComponent,
        ApplicationIdentityComponent,
        ApplicationEmailConfirmationComponent,
        ApplicationCommunicationsComponent,
        ApplicationDetailsComponent,
        ApplicationEditComponent
    ]
})
export class ApplicationPageComponent implements OnInit {
    private applicationService = inject(ApplicationService);
    private analytics = inject(ApplicationAnalyticsService);
    dialog = inject(MatDialog);
    private accountService = inject(AccountService);

    step = 1;

    ngOnInit() {
        this.checkStep();
    }

    checkStep() {
        if (this.accountService.account) {
            const previousStep = this.step;
            if (this.accountService.account.application && this.accountService.account.application.state !== ApplicationState.WAITING) {
                this.step = 6;
            } else if (this.accountService.account.membershipState === MembershipState.UNCONFIRMED) {
                this.step = 3;
            } else if (this.accountService.account.membershipState === MembershipState.CONFIRMED && !this.connected()) {
                this.step = 4;
            } else if (this.connected() && !this.submitted()) {
                this.step = 5;
            } else {
                this.step = 6;
            }

            if (previousStep === 3 && this.step > 3) {
                this.analytics.trackEvent('email_confirmed');
            }
        }
    }

    loggedOut() {
        return this.accountService.account === undefined;
    }

    connected() {
        return (
            this.accountService.account.teamspeakIdentities &&
            this.accountService.account.teamspeakIdentities.length > 0 &&
            this.accountService.account.steamname &&
            this.accountService.account.discordId
        );
    }

    submitted() {
        return this.accountService.account.application && this.accountService.account.application.state === ApplicationState.WAITING;
    }

    previous() {
        setTimeout(() => {
            this.step--;
            this.checkStep();
        }, 1);
    }

    next(_event) {
        const completedStep = this.step;
        setTimeout(() => {
            this.step++;
            this.checkStep();
            this.trackStepCompletion(completedStep);
        }, 1);
    }

    private trackStepCompletion(completedStep: number) {
        switch (completedStep) {
            case 2: this.analytics.trackEvent('account_created'); break;
            case 4: this.analytics.trackEvent('comms_linked'); break;
        }
    }

    submit(details: string) {
        this.applicationService
            .submitApplication(this.accountService.account.id, details)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.accountService
                        .getAccount()
                        ?.pipe(first())
                        .subscribe({
                            next: () => {
                                this.step = 6;
                                this.analytics.trackEvent('application_submitted');
                            }
                        });
                },
                error: (error) => {
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                }
            });
    }
}
