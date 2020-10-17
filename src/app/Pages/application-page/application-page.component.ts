import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from 'app/Services/url.service';
import { AccountService } from 'app/Services/account.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { ApplicationState, MembershipState } from '../../Models/Account';

@Component({
    selector: 'app-application-page',
    templateUrl: './application-page.component.html',
    styleUrls: ['./application-page.component.scss'],
})
export class ApplicationPageComponent implements OnInit {
    step = 1;
    email: string;
    details: any;

    constructor(private httpClient: HttpClient, public formBuilder: FormBuilder, private urls: UrlService, public dialog: MatDialog, private accountService: AccountService) {}

    ngOnInit() {
        this.checkStep();
    }

    checkStep() {
        if (this.accountService.account) {
            // Application completed
            if (this.accountService.account.application && this.accountService.account.application.state !== ApplicationState.WAITING) {
                this.step = 7;
            } else if (this.accountService.account.membershipState === MembershipState.UNCONFIRMED) {
                // Needs to confirm email
                this.email = this.accountService.account.email;
                this.step = 3;
            } else if (this.accountService.account.membershipState === MembershipState.CONFIRMED && !this.connected()) {
                // Needs to connect communications
                this.step = 4;
            } else if (this.connected() && !this.submitted() && !this.details) {
                // Needs to fill details
                this.step = 5;
            } else if (this.connected() && !this.submitted() && this.details) {
                // Needs to agree and submit
                this.step = 6;
            } else {
                // Submitted
                this.step = 7;
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

    next(event) {
        setTimeout(() => {
            if (this.step === 2) {
                this.email = event.email;
            }
            if (this.step === 5) {
                this.details = event;
            }
            this.step++;
            this.checkStep();
        }, 1);
    }

    check() {
        setTimeout(() => {
            this.checkStep();
        }, 1);
    }

    submit() {
        this.httpClient
            .post(this.urls.apiUrl + '/applications', this.details, {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            })
            .subscribe(
                () => {
                    this.accountService.getAccount(() => {
                        this.next(null);
                    });
                },
                (error) => {
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error },
                    });
                }
            );
    }
}
