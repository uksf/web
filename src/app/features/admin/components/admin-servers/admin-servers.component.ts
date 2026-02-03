import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import type { ServerInfrastructureCurrent, ServerInfrastructureInstalled, ServerInfrastructureLatest, ServerInfrastructureUpdate } from '@app/Models/ServerInfrastructure';
import { MessageModalComponent } from '@app/Modals/message-modal/message-modal.component';
import { UksfError } from '@app/Models/Response';

@Component({
    selector: 'app-admin-servers',
    templateUrl: './admin-servers.component.html',
    styleUrls: ['../admin-page/admin-page.component.scss', './admin-servers.component.scss']
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
        return this.latest.latestBuild === this.current.currentBuild;
    }

    isLatestUpdate(): boolean {
        return this.current.currentUpdated >= this.latest.latestUpdate;
    }

    isInstalled(): boolean {
        return this.installed.installedVersion !== '0';
    }

    getBuildColour(): string {
        return this.current && this.latest ? (this.isLatestBuild() ? 'green' : 'red') : 'gray';
    }

    getDateColour(): string {
        return this.current && this.latest ? (this.isLatestUpdate() ? 'green' : 'red') : 'gray';
    }

    allDataLoaded(): boolean {
        return !!(this.current && this.latest && this.installed);
    }

    isUpdateRequired(): boolean {
        return !this.isLatestBuild() || !this.isLatestUpdate() || !this.isInstalled();
    }

    isUpdateDisabled(): boolean {
        return this.allDataLoaded() ? !this.forced && !this.isUpdateRequired() : true;
    }

    getUpdateRequiredColour(): string {
        return this.allDataLoaded() ? (this.isUpdateRequired() ? 'red' : 'green') : 'gray';
    }

    getUpdateRequiredText(): string {
        return this.allDataLoaded() ? (this.isUpdateRequired() ? 'Yes' : 'No') : '...';
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
