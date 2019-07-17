import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { DataSource } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-unit-page',
    templateUrl: './unit-page.component.html',
    styleUrls: ['./unit-page.component.css']
})
export class UnitPageComponent {
    data;
    displayedColumns = ['name', 'role', 'status'];
    dataSource;
    private id: string;

    constructor(
        private route: ActivatedRoute,
        private httpClient: HttpClient,
        private urls: UrlService,
        public dialog: MatDialog,
        private location: Location) {
        this.route.params.subscribe(params => {
            this.id = params.id;
            this.dataSource = new UnitDataSource(this.id, this.httpClient, this.urls);
            this.httpClient.get(`${this.urls.apiUrl}/units/info/${this.id}`).subscribe((data) => { this.data = data; });
        });
    }

    back() {
        this.location.back();
    }
}

export class UnitDataSource extends DataSource<any> {
    constructor(private id: string, private httpClient: HttpClient, private urls: UrlService) {
        super();
    }

    connect(): Observable<object[]> {
        return this.httpClient.get(`${this.urls.apiUrl}/units/members/${this.id}`) as Observable<object[]>;
    }

    disconnect() { }
}
