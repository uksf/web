import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';

@Component({
    selector: 'app-operations-activity',
    templateUrl: './operations-activity.component.html',
    styleUrls: ['../../../Pages/operations-page/operations-page.component.scss', './operations-activity.component.css'],
})
export class OperationsActivityComponent implements OnInit {
    activityData;

    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    ngOnInit() {
        this.httpClient.get(this.urls.apiUrl + '/operations').subscribe((response) => {
            this.activityData = response;
        });
    }
}
