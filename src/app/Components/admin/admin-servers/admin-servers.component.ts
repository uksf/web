import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import type { ServerInfrastructureCurrent, ServerInfrastructureInstalled, ServerInfrastructureLatest, ServerInfrastructureUpdate } from '../../../Models/ServerInfrastructure';
import { MessageModalComponent } from '../../../Modals/message-modal/message-modal.component';
import { UksfError } from '../../../Models/Response';

@Component({
    selector: 'app-admin-servers',
    templateUrl: './admin-servers.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.scss', './admin-servers.component.scss']
})
export class AdminServersComponent implements OnInit {
    latest: ServerInfrastructureLatest;
    current: ServerInfrastructureCurrent;
    installed: ServerInfrastructureInstalled;
    updating: boolean = false;
    forced: boolean = false;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {}

    @HostListener('window:keydown', ['$event'])
    @HostListener('window:keyup', ['$event'])
    onKey(event: KeyboardEvent) {
        this.forced = event.shiftKey;
    }

    ngOnInit(): void {
        this.getInfrastructureInfo();
    }

    getInfrastructureInfo() {
        this.httpClient.get(`${this.urls.apiUrl}/servers/infrastructure/isUpdating`).subscribe({
            next: (updating: boolean) => {
                this.updating = updating;
            }
        });
        this.httpClient.get(`${this.urls.apiUrl}/servers/infrastructure/latest`).subscribe({
            next: (info: ServerInfrastructureLatest) => {
                this.latest = info;
            }
        });
        this.httpClient.get(`${this.urls.apiUrl}/servers/infrastructure/current`).subscribe({
            next: (info: ServerInfrastructureCurrent) => {
                this.current = info;
            }
        });
        this.httpClient.get(`${this.urls.apiUrl}/servers/infrastructure/installed`).subscribe({
            next: (info: ServerInfrastructureInstalled) => {
                this.installed = info;
            }
        });
    }

    isLatestBuild(): boolean {
        if (!this.latest || !this.current) {
            return false;
        }

        return this.latest.latestBuild === this.current.currentBuild;
    }

    isLatestUpdate(): boolean {
        if (!this.latest || !this.current) {
            return false;
        }

        return this.current.currentUpdated >= this.latest.latestUpdate;
    }

    isInstalled(): boolean {
        if (!this.installed) {
            return false;
        }

        return this.installed.installedVersion !== '0';
    }

    isUpdateRequired(): boolean {
        if (!this.latest || !this.current || !this.installed) {
            return false;
        }

        return !this.isLatestBuild() || !this.isLatestUpdate() || !this.isInstalled();
    }

    update() {
        if (this.updating) {
            return;
        }

        this.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/servers/infrastructure/update`).subscribe({
            next: (updateResult: ServerInfrastructureUpdate) => {
                this.dialog
                    .open(MessageModalComponent, {
                        data: {
                            message: `Version updated from ${this.installed.installedVersion} to ${updateResult.newVersion}\nUpdate output:\n\n${updateResult.updateOutput}`
                        }
                    })
                    .afterClosed()
                    .subscribe(() => {
                        this.getInfrastructureInfo();
                    });
            },
            error: (error: UksfError) => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: error.error }
                });
                this.getInfrastructureInfo();
            }
        });
    }
}
