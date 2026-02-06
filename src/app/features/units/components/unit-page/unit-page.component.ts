import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ResponseUnit } from '@app/features/units/models/Units';

@Component({
    selector: 'app-unit-page',
    templateUrl: './unit-page.component.html',
    styleUrls: ['./unit-page.component.scss'],
})
export class UnitPageComponent {
    unit: ResponseUnit;
    displayedColumns = ['chainOfCommandPosition', 'name', 'role'];
    private id: string;

    constructor(private route: ActivatedRoute, private httpClient: HttpClient, private urls: UrlService, public dialog: MatDialog, private location: Location) {
        this.route.params.subscribe({
            next: (params) => {
                this.id = params.id;
                this.httpClient.get(`${this.urls.apiUrl}/units/${this.id}`).subscribe({
                    next: (unit: ResponseUnit) => {
                        this.unit = unit;
                    }
                });
            }
        });
    }

    back() {
        this.location.back();
    }
}
