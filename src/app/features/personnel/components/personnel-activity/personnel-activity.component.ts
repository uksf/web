import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { PermissionsService } from '@app/core/services/permissions.service';

@Component({
    selector: 'app-personnel-activity',
    templateUrl: './personnel-activity.component.html',
    styleUrls: ['../personnel-page/personnel-page.component.scss', './personnel-activity.component.scss']
})
export class PersonnelActivityComponent implements OnInit {

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private permissions: PermissionsService) { }

    ngOnInit() { }
}
