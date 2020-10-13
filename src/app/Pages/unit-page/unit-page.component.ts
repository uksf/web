import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { DataSource } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ResponseUnit } from '../../Models/Units';

@Component({
    selector: 'app-unit-page',
    templateUrl: './unit-page.component.html',
    styleUrls: ['./unit-page.component.scss'],
})
export class UnitPageComponent {
    unit: ResponseUnit;
    displayedColumns = ['unitRole', 'name', 'role'];
    private id: string;

    constructor(private route: ActivatedRoute, private httpClient: HttpClient, private urls: UrlService, public dialog: MatDialog, private location: Location) {
        this.route.params.subscribe((params) => {
            this.id = params.id;
            this.httpClient.get(`${this.urls.apiUrl}/units/${this.id}`).subscribe((unit: ResponseUnit) => {
                this.unit = unit;
            });
        });
    }

    resolveUnitRole(unitRole: string): string {
        return unitRole === 'N' ? 'NCOiC' : unitRole === '' ? '' : `${unitRole}iC`;
    }

    back() {
        this.location.back();
    }
}
