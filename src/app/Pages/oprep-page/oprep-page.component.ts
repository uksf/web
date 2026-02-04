import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';
import { UrlService } from '../../Services/url.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-oprep-page',
    templateUrl: './oprep-page.component.html',
    styleUrls: ['./oprep-page.component.css'],
})
export class OprepPageComponent implements OnInit {
    oprepEntity;
    groupedAttendance;
    opordId;
    description = 'sss';
    editing = false;

    constructor(private auth: AuthenticationService, private urls: UrlService, private route: ActivatedRoute, private httpClient: HttpClient) {
        this.opordId = this.route.snapshot.params.id;
    }

    ngOnInit() {
        this.httpClient.get(this.urls.apiUrl + '/OperationReport/' + this.opordId).subscribe({
            next: (result: any) => {
                this.groupedAttendance = result.groupedAttendance;
                this.oprepEntity = result.operationEntity;
                this.description = this.oprepEntity.description;
            }
        });
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
        this.httpClient.put(this.urls.apiUrl + '/OperationReport', this.oprepEntity).subscribe({});
    }
}
