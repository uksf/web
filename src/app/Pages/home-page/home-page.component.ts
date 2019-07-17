import { Component, NgZone } from '@angular/core';
import { UrlService } from '../../Services/url.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material';
import { CreateIssueModalComponent } from '../../Modals/create-issue-modal/create-issue-modal.component';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {
    recruiters;
    members;
    guests;
    content = [];
    _time: number;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, zone: NgZone) {
        this.httpClient.get('https://api.uk-sf.co.uk/accounts/online').subscribe(
            // this.httpClient.get(this.urls.apiUrl + '/accounts/online').subscribe(
            response => {
                if (response) {
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
            }, error => this.urls.errorWrapper('Failed to get online teamspeak clients', error)
        );

        this._time = Date.now();
        setInterval(() => {
            this._time = Date.now()
        }, 100);
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
