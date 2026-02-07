import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-edit-server-mods-modal',
    templateUrl: './edit-server-mods-modal.component.html',
    styleUrls: ['./edit-server-mods-modal.component.scss'],
})
export class EditServerModsModalComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    server;
    before: string;
    availableMods;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.server = data.server;
    }

    get changes() {
        return JSON.stringify(this.availableMods) !== this.before;
    }

    ngOnInit() {
        this.getAvailableMods();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getAvailableMods() {
        this.httpClient.get(this.urls.apiUrl + `/gameservers/${this.server.id}/mods`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                this.populateServerMods(response);
                this.before = JSON.stringify(this.availableMods);
            }
        });
    }

    populateServerMods(mods) {
        mods.forEach((mod) => {
            mod.selected = !!this.server.mods.find((x) => x.path === mod.path);
            mod.serverMod = !!this.server.serverMods.find((x) => x.path === mod.path);
        });
        this.availableMods = mods;
    }

    duplicateSelected(mod): boolean {
        return this.availableMods.findIndex((x) => x !== mod && x.name === mod.name && (x.selected || x.serverMod)) !== -1;
    }

    submit() {
        const mods = [];
        const serverMods = [];
        this.availableMods.forEach((mod) => {
            if (mod.selected) {
                mods.push(mod);
            } else if (mod.serverMod) {
                serverMods.push(mod);
            }
        });
        this.server.mods = mods;
        this.server.serverMods = serverMods;

        this.httpClient
            .post(
                `${this.urls.apiUrl}/gameservers/${this.server.id}/mods`,
                this.server,
                {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                    }),
                }
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.dialog.closeAll();
                }
            });
    }

    reset() {
        this.httpClient
            .get(`${this.urls.apiUrl}/gameservers/${this.server.id}/mods/reset`, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({ availableMods, mods, serverMods }: any) => {
                    this.server.mods = mods;
                    this.server.serverMods = serverMods;
                    this.populateServerMods(availableMods);
                }
            });
    }
}
