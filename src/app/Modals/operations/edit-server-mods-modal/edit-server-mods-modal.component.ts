import { Component, OnInit, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-edit-server-mods-modal',
    templateUrl: './edit-server-mods-modal.component.html',
    styleUrls: ['./edit-server-mods-modal.component.css']
})
export class EditServerModsModalComponent implements OnInit {
    server;
    availableMods;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.server = data.server;
    }

    ngOnInit() {
        this.getAvailableMods();
    }

    getAvailableMods() {
        this.httpClient.get(this.urls.apiUrl + '/gameservers/mods').subscribe(response => {
            this.populateServerMods(response);
        });
    }

    populateServerMods(mods) {
        mods.forEach(mod => {
            if (this.server.mods.find(x => x.path === mod.path)) {
                mod.selected = true;
            } else {
                mod.selected = false;
            }
        });
        this.availableMods = mods;
    }

    submit() {
        const mods = [];
        this.availableMods.forEach(mod => {
            if (mod.selected) {
                mods.push(mod);
            }
        });
        this.httpClient.post(`${this.urls.apiUrl}/gameservers/mods/${this.server.id}`, JSON.stringify(mods), {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(_ => {
            this.dialog.closeAll();
        });
    }
}
