import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../../Services/Authentication/authentication.service';
import { UrlService } from '../../../Services/url.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-units-orbat-aux',
    templateUrl: './units-orbat-aux.component.html',
    styleUrls: ['../../../Pages/units-page/units-page.component.scss', './units-orbat-aux.component.css']
})
export class UnitsOrbatAuxComponent {
    auxData;
    selectedNode;

    constructor(
        private httpClient: HttpClient,
        private urls: UrlService,
        private auth: AuthenticationService,
        private router: Router) {
        this.httpClient.get(this.urls.apiUrl + '/units/filter?typeFilter=orgchartaux').subscribe(
            (data: any) => { this.auxData = data; }
        );
    }

    onNodeSelect(event) {
        this.router.navigate(['/units', event.node.id]);
    }
}
