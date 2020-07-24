import { Component, OnInit, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-edit-server-mods-modal',
    templateUrl: './edit-server-mods-modal.component.html',
    styleUrls: ['./edit-server-mods-modal.component.scss']
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
        this.httpClient.get(this.urls.apiUrl + `/gameservers/${this.server.id}/mods`).subscribe(response => {
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
            if (this.server.serverMods.find(x => x.path === mod.path)) {
                mod.serverMod = true;
            } else {
                mod.serverMod = false;
            }
        });
        this.availableMods = mods;
    }

    duplicateSelected(mod): boolean {
        return this.availableMods.findIndex(x => x !== mod && x.name === mod.name && (x.selected || x.serverMod)) !== -1;
    }

    submit() {
        const mods = [];
        const serverMods = [];
        this.availableMods.forEach(mod => {
            if (mod.selected) {
                mods.push(mod);
            } else if (mod.serverMod) {
                serverMods.push(mod);
            }
        });
        this.httpClient.post(`${this.urls.apiUrl}/gameservers/${this.server.id}/mods`, { mods: JSON.stringify(mods), serverMods: serverMods }, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(_ => {
            this.dialog.closeAll();
        });
    }

    reset() {
        this.httpClient.get(`${this.urls.apiUrl}/gameservers/${this.server.id}/mods/reset`, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(response => {
            this.populateServerMods(response);
        });
    }
}
