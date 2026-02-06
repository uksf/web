import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';

@Component({
    selector: 'app-operations-activity',
    templateUrl: './operations-activity.component.html',
    styleUrls: ['../operations-page/operations-page.component.scss', './operations-activity.component.scss'],
})
export class OperationsActivityComponent implements OnInit {
    activityData;

    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    ngOnInit() {
        this.httpClient.get(this.urls.apiUrl + '/operations').subscribe({
            next: (response) => {
                this.activityData = response;
            }
        });
    }
}
