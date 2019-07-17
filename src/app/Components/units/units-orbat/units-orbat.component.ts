import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../../Services/Authentication/authentication.service';
import { UrlService } from '../../../Services/url.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-units-orbat',
    templateUrl: './units-orbat.component.html',
    styleUrls: ['../../../Pages/units-page/units-page.component.scss', './units-orbat.component.scss']
})
export class UnitsOrbatComponent {
    regiments;
    orbatData;
    selectedNode;

    constructor(
        private httpClient: HttpClient,
        private urls: UrlService,
        private auth: AuthenticationService,
        private router: Router) {
        this.httpClient.get(this.urls.apiUrl + '/units/filter?typeFilter=orgchart').subscribe(
            (data: any) => {
                this.orbatData = data;
            }
        );
        this.httpClient.get(this.urls.apiUrl + '/units/filter?typeFilter=regiments').subscribe(
            (data: any) => { this.regiments = data; }
        );
    }

    onNodeSelect(event) {
        this.router.navigate(['/units', event.node.id]);
    }
}
