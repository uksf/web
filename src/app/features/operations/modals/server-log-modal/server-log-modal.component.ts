import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { first } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { CdkVirtualForOf } from '@angular/cdk/scrolling';

import { DestroyableComponent } from '@app/shared/components/destroyable/destroyable.component';
import { SignalRService, ConnectionContainer } from '@app/core/services/signalr.service';
import { GameServersService } from '../../services/game-servers.service';
import { GameServer, RptLogSource, RptLogSearchResult } from '../../models/game-server';
import { highlightRptLine } from '../../utils/rpt-syntax-highlighter';

interface ServerLogDialogData {
    server: GameServer;
}

@Component({
    selector: 'app-server-log-modal',
    templateUrl: './server-log-modal.component.html',
    styleUrls: ['./server-log-modal.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        ScrollingModule,
        CdkVirtualForOf
    ]
})
export class ServerLogModalComponent extends DestroyableComponent implements OnInit {
    private dialogRef = inject(MatDialogRef<ServerLogModalComponent>);
    private data: ServerLogDialogData = inject(MAT_DIALOG_DATA);
    private gameServersService = inject(GameServersService);
    private signalrService = inject(SignalRService);
    private sanitizer = inject(DomSanitizer);

    server: GameServer;
    sources: RptLogSource[] = [];
    activeSource = 'Server';
    logLines: string[] = [];
    highlightedLines: SafeHtml[] = [];
    isLoading = true;
    tailEnabled = true;
    searchQuery = '';
    searchResults: RptLogSearchResult[] = [];
    searchMatchLines: Set<number> = new Set();
    currentSearchIndex = -1;

    @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

    private hubConnection!: ConnectionContainer;

    constructor() {
        super();
        this.server = this.data.server;
    }

    ngOnInit(): void {
        this.gameServersService.getLogSources(this.server.id).pipe(first()).subscribe({
            next: (sources) => {
                this.sources = sources;
            }
        });

        this.hubConnection = this.signalrService.connect('servers');

        this.hubConnection.connection.on('ReceiveLogContent',
            (serverId: string, source: string, lines: string[], startLineIndex: number, isComplete: boolean) => {
                if (serverId !== this.server.id || source !== this.activeSource) {
                    return;
                }
                this.logLines.splice(startLineIndex, 0, ...lines);
                const highlighted = lines.map(l => this.sanitizer.bypassSecurityTrustHtml(highlightRptLine(l)));
                this.highlightedLines.splice(startLineIndex, 0, ...highlighted);
                if (isComplete) {
                    this.isLoading = false;
                }
                if (this.tailEnabled && !this.isLoading) {
                    setTimeout(() => this.scrollToBottom());
                }
            }
        );

        this.hubConnection.connection.on('ReceiveLogAppend',
            (serverId: string, source: string, lines: string[]) => {
                if (serverId !== this.server.id || source !== this.activeSource) {
                    return;
                }
                this.logLines.push(...lines);
                const highlighted = lines.map(l => this.sanitizer.bypassSecurityTrustHtml(highlightRptLine(l)));
                this.highlightedLines.push(...highlighted);
                if (this.tailEnabled) {
                    setTimeout(() => this.scrollToBottom());
                }
            }
        );

        this.hubConnection.connection.invoke('SubscribeToLog', this.server.id, 'Server');
    }

    switchSource(source: string): void {
        if (source === this.activeSource) {
            return;
        }
        this.hubConnection.connection.invoke('UnsubscribeFromLog', this.server.id, this.activeSource);
        this.logLines = [];
        this.highlightedLines = [];
        this.isLoading = true;
        this.searchResults = [];
        this.searchMatchLines = new Set();
        this.currentSearchIndex = -1;
        this.activeSource = source;
        this.hubConnection.connection.invoke('SubscribeToLog', this.server.id, source);
    }

    toggleTail(): void {
        this.tailEnabled = !this.tailEnabled;
        if (this.tailEnabled) {
            this.scrollToBottom();
        }
    }

    search(): void {
        if (!this.searchQuery.trim()) {
            this.searchResults = [];
            this.searchMatchLines = new Set();
            this.currentSearchIndex = -1;
            return;
        }
        this.gameServersService.searchLog(this.server.id, this.activeSource, this.searchQuery).pipe(first()).subscribe({
            next: (response) => {
                this.searchResults = response.results;
                this.searchMatchLines = new Set(response.results.map(r => r.lineIndex));
                this.currentSearchIndex = response.results.length > 0 ? 0 : -1;
                if (this.currentSearchIndex >= 0) {
                    this.scrollToSearchResult();
                }
            }
        });
    }

    searchNext(): void {
        if (!this.searchResults.length) {
            return;
        }
        this.currentSearchIndex = (this.currentSearchIndex + 1) % this.searchResults.length;
        this.scrollToSearchResult();
    }

    searchPrev(): void {
        if (!this.searchResults.length) {
            return;
        }
        this.currentSearchIndex = (this.currentSearchIndex - 1 + this.searchResults.length) % this.searchResults.length;
        this.scrollToSearchResult();
    }

    downloadLog(): void {
        window.open(this.gameServersService.getLogDownloadUrl(this.server.id, this.activeSource), '_blank');
    }

    close(): void {
        this.dialogRef.close();
    }

    isSearchMatch(index: number): boolean {
        return this.searchMatchLines.has(index);
    }

    isActiveSearchMatch(index: number): boolean {
        if (this.currentSearchIndex < 0 || this.currentSearchIndex >= this.searchResults.length) {
            return false;
        }
        return this.searchResults[this.currentSearchIndex].lineIndex === index;
    }

    trackByIndex(index: number): number {
        return index;
    }

    override ngOnDestroy(): void {
        if (this.hubConnection) {
            this.hubConnection.connection.invoke('UnsubscribeFromLog', this.server.id, this.activeSource);
            this.hubConnection.connection.off('ReceiveLogContent');
            this.hubConnection.connection.off('ReceiveLogAppend');
            this.hubConnection.dispose();
            this.hubConnection.connection.stop().then();
        }
        super.ngOnDestroy();
    }

    private scrollToBottom(): void {
        if (this.viewport) {
            this.viewport.scrollTo({ bottom: 0 });
        }
    }

    private scrollToSearchResult(): void {
        if (this.viewport && this.currentSearchIndex >= 0 && this.currentSearchIndex < this.searchResults.length) {
            const lineIndex = this.searchResults[this.currentSearchIndex].lineIndex;
            this.viewport.scrollToIndex(lineIndex);
        }
    }
}
