import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { PermissionsService } from 'app/Services/permissions.service';

@Component({
    selector: 'app-personnel-activity',
    templateUrl: './personnel-activity.component.html',
    styleUrls: ['../../../Pages/personnel-page/personnel-page.component.scss', './personnel-activity.component.scss']
})
export class PersonnelActivityComponent implements OnInit {

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private permissions: PermissionsService) { }

    ngOnInit() { }
}
