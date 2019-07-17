import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';
import { UrlService } from '../../Services/url.service';
import { ApiService } from '../../Services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-oprep-page',
    templateUrl: './oprep-page.component.html',
    styleUrls: ['./oprep-page.component.css']
})
export class OprepPageComponent implements OnInit {
    oprepEntity;
    groupedAttendance;
    opordId;
    description = 'sss';
    editing = false;

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
            () => { return this.api.httpClient.get(this.urls.apiUrl + '/OperationReport/' + this.opordId) },
            result => {
                this.groupedAttendance = result.groupedAttendance;
                this.oprepEntity = result.operationEntity;
                this.description = this.oprepEntity.description;
            },
            'failed to get opord data'
        );
    }

    getAttendeeColor(attendanceState) {
        if (attendanceState === 2) {
            return 'red';
        } else if (attendanceState === 4) {
            return 'grey';
        } else {
            return 'black';
        }
    }

    getAttendeePopup(attendanceState) {
        if (attendanceState === 2) {
            return 'missing';
        } else if (attendanceState === 4) {
            return 'valid LOA';
        } else {
            return 'attended';
        }
    }

    saveDescription() {
        this.oprepEntity.description = this.description;
        this.api.sendRequest(
            () => { return this.api.httpClient.put(this.urls.apiUrl + '/OperationReport', this.oprepEntity) },
            result => { },
            'failed to get opord data'
        );
    }
}
