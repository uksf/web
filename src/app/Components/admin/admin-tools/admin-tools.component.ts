import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';

@Component({
    selector: 'app-admin-tools',
    templateUrl: './admin-tools.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.css', './admin-tools.component.css']
})
export class AdminToolsComponent {
    updating;

    constructor(private httpClient: HttpClient, private urls: UrlService) { }

    invalidateCaches() {
        this.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/data/invalidate`).subscribe(_ => {
            this.updating = false;
        }, _ => {
            this.updating = false;
        });
    }

    getDiscordRoles() {
        this.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/discord/roles`, {responseType: 'text'}).subscribe(response => {
            console.log(response);
            this.updating = false;
        }, error => {
            console.log(error);
            this.updating = false;
        });
    }

    updateDiscordRoles() {
        this.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/discord/updateuserroles`).subscribe(_ => {
            this.updating = false;
        }, _ => {
            this.updating = false;
        });
    }
}
