import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';
import { UrlService } from '../../Services/url.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-opord-page',
    templateUrl: './opord-page.component.html',
    styleUrls: ['./opord-page.component.scss'],
})
export class OpordPageComponent implements OnInit {
    opordData;
    opordId;
    editing = false;
    description = 'sss';

    constructor(private auth: AuthenticationService, private urls: UrlService, private route: ActivatedRoute, private httpClient: HttpClient) {
        this.opordId = this.route.snapshot.params.id;
    }

    ngOnInit() {
        this.httpClient.get(this.urls.apiUrl + '/OperationOrder/' + this.opordId).subscribe({
            next: (result) => {
                this.opordData = result;
                this.description = this.opordData.description;
            }
        });
    }

    saveDescription() {
        this.opordData.description = this.description;
        this.httpClient.put(this.urls.apiUrl + '/OperationOrder', this.opordData).subscribe({});
    }
}
