import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';
import { UrlService } from '../../Services/url.service';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../Services/api.service';

@Component({
    selector: 'app-opord-page',
    templateUrl: './opord-page.component.html',
    styleUrls: ['./opord-page.component.css']
})
export class OpordPageComponent implements OnInit {
    opordData;
    opordId;
    editing = false;
    description = 'sss';

    constructor(
        private auth: AuthenticationService,
        private urls: UrlService,
        private route: ActivatedRoute,
        private api: ApiService
    ) {
        this.opordId = this.route.snapshot.params.id
    }

    ngOnInit() {
        this.api.sendRequest(
            () => { return this.api.httpClient.get(this.urls.apiUrl + '/OperationOrder/' + this.opordId) },
            result => { this.opordData = result.result; this.description = this.opordData.description; },
            'failed to get opord data'
        );
    }

    saveDescription() {
        this.opordData.description = this.description;
        this.api.sendRequest(
            () => { return this.api.httpClient.put(this.urls.apiUrl + '/OperationOrder', this.opordData) },
            () => { },
            'failed to get opord data'
        );
    }
}
