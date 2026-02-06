import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import type { ServerInfrastructureCurrent, ServerInfrastructureInstalled, ServerInfrastructureLatest, ServerInfrastructureUpdate } from '@app/shared/models/server-infrastructure';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { UksfError } from '@app/shared/models/response';

@Component({
    selector: 'app-admin-servers',
    templateUrl: './admin-servers.component.html',
    styleUrls: ['../admin-page/admin-page.component.scss', './admin-servers.component.scss']
})
export class AdminServersComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
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

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getInfrastructureInfo() {
        this.httpClient.get(`${this.urls.apiUrl}/servers/infrastructure/isUpdating`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (updating: boolean) => {
                this.updating = updating;
            }
        });
        this.httpClient.get(`${this.urls.apiUrl}/servers/infrastructure/latest`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (info: ServerInfrastructureLatest) => {
                this.latest = info;
            }
        });
        this.httpClient.get(`${this.urls.apiUrl}/servers/infrastructure/current`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (info: ServerInfrastructureCurrent) => {
                this.current = info;
            }
        });
        this.httpClient.get(`${this.urls.apiUrl}/servers/infrastructure/installed`).pipe(takeUntil(this.destroy$)).subscribe({
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
        this.httpClient.get(`${this.urls.apiUrl}/servers/infrastructure/update`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (updateResult: ServerInfrastructureUpdate) => {
                this.dialog
                    .open(MessageModalComponent, {
                        data: {
                            message: `Version updated from ${this.installed.installedVersion} to ${updateResult.newVersion}\nUpdate output:\n\n${updateResult.updateOutput}`
                        }
                    })
                    .afterClosed()
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.getInfrastructureInfo();
                        }
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
