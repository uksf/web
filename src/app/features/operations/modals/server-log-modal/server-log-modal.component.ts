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
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { DebouncedCallback } from '@app/shared/utils/debounce-callback';
import { ServersHubService } from '../../services/servers-hub.service';
import { GameServersService } from '../../services/game-servers.service';
import { GameServer, RptLogSource, RptLogSearchResult } from '../../models/game-server';
import { highlightRptLine } from '../../utils/rpt-syntax-highlighter';
import { LogMinimapComponent } from '../../components/log-minimap/log-minimap.component';

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
        CdkVirtualForOf,
        TextInputComponent,
        LogMinimapComponent
    ]
})
export class ServerLogModalComponent extends DestroyableComponent implements OnInit {
    private dialogRef = inject(MatDialogRef<ServerLogModalComponent>);
    private data: ServerLogDialogData = inject(MAT_DIALOG_DATA);
    private gameServersService = inject(GameServersService);
    private serversHub = inject(ServersHubService);
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
    isDownloading = false;
    viewportScrollOffset = 0;
    viewportVisibleSize = 0;
    totalScrollHeight = 0;

    @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

    private searchDebounce = new DebouncedCallback(300);

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

        this.serversHub.connect();

        this.serversHub.on('ReceiveLogContent',
            this.onReceiveLogContent
        );

        this.serversHub.on('ReceiveLogAppend',
            this.onReceiveLogAppend
        );

        this.serversHub.connected.then(() => {
            this.serversHub.invoke('SubscribeToLog', this.server.id, 'Server');
        });
    }

    private onReceiveLogContent = (serverId: string, source: string, lines: string[], startLineIndex: number, isComplete: boolean) => {
        if (serverId !== this.server.id || source !== this.activeSource) {
            return;
        }
        this.logLines.splice(startLineIndex, 0, ...lines);
        const highlighted = lines.map(l => this.highlightLine(l));
        this.highlightedLines.splice(startLineIndex, 0, ...highlighted);
        if (isComplete) {
            this.isLoading = false;
            if (this.searchQuery.trim()) {
                this.search();
            }
        }
        if (this.tailEnabled && !this.isLoading) {
            setTimeout(() => this.scrollToBottom());
        }
        setTimeout(() => this.updateViewportMetrics());
    };

    private onReceiveLogAppend = (serverId: string, source: string, lines: string[]) => {
        if (serverId !== this.server.id || source !== this.activeSource) {
            return;
        }
        this.logLines.push(...lines);
        const highlighted = lines.map(l => this.highlightLine(l));
        this.highlightedLines.push(...highlighted);
        if (this.tailEnabled) {
            setTimeout(() => this.scrollToBottom());
        }
        setTimeout(() => this.updateViewportMetrics());
    };

    async switchSource(sourceName: string): Promise<void> {
        if (!sourceName || sourceName === this.activeSource) {
            return;
        }
        await this.serversHub.invoke('UnsubscribeFromLog', this.server.id, this.activeSource);
        this.logLines = [];
        this.highlightedLines = [];
        this.isLoading = true;
        this.searchResults = [];
        this.searchMatchLines = new Set();
        this.currentSearchIndex = -1;
        this.activeSource = sourceName;
        this.serversHub.invoke('SubscribeToLog', this.server.id, sourceName);
    }

    toggleTail(): void {
        this.tailEnabled = !this.tailEnabled;
        if (this.tailEnabled) {
            this.scrollToBottom();
        }
    }

    onSearchChange(): void {
        this.searchDebounce.schedule(() => this.search());
    }

    search(): void {
        if (!this.searchQuery.trim()) {
            this.searchResults = [];
            this.searchMatchLines = new Set();
            this.currentSearchIndex = -1;
            this.rehighlightAll();
            return;
        }
        this.gameServersService.searchLog(this.server.id, this.activeSource, this.searchQuery).pipe(first()).subscribe({
            next: (response) => {
                this.searchResults = response.results;
                this.searchMatchLines = new Set(response.results.map(r => r.lineIndex));
                this.currentSearchIndex = response.results.length > 0 ? 0 : -1;
                this.rehighlightAll();
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

    onLineClick(lineIndex: number): void {
        const nearestIndex = this.findNearestSearchResult(lineIndex);
        if (nearestIndex < 0) {
            return;
        }
        this.currentSearchIndex = nearestIndex;
    }

    onViewportScroll(): void {
        this.updateViewportMetrics();
    }

    onMinimapScrollToLine(lineIndex: number): void {
        if (!this.viewport) return;
        const itemSize = 20;
        const viewportSize = this.viewport.getViewportSize();
        const offset = lineIndex * itemSize;
        const centeredOffset = Math.max(0, offset - (viewportSize / 2) + (itemSize / 2));
        this.viewport.scrollToOffset(centeredOffset);
    }

    onMinimapSearchNavigate(resultIndex: number): void {
        if (resultIndex < 0 || resultIndex >= this.searchResults.length) return;
        this.currentSearchIndex = resultIndex;
        this.scrollToSearchResult();
    }

    findNearestSearchResult(lineIndex: number): number {
        if (!this.searchResults.length) {
            return -1;
        }
        let nearestIndex = 0;
        let nearestDistance = Math.abs(this.searchResults[0].lineIndex - lineIndex);
        for (let i = 1; i < this.searchResults.length; i++) {
            const distance = Math.abs(this.searchResults[i].lineIndex - lineIndex);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }
        return nearestIndex;
    }

    downloadLog(): void {
        this.isDownloading = true;
        this.gameServersService.downloadLog(this.server.id, this.activeSource).pipe(first()).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${this.server.name}_${this.activeSource}.rpt`;
                a.click();
                URL.revokeObjectURL(url);
                this.isDownloading = false;
            },
            error: () => {
                this.isDownloading = false;
            }
        });
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
        this.searchDebounce.cancel();
        this.serversHub.off('ReceiveLogContent', this.onReceiveLogContent);
        this.serversHub.off('ReceiveLogAppend', this.onReceiveLogAppend);
        this.serversHub.disconnect();
        super.ngOnDestroy();
    }

    private updateViewportMetrics(): void {
        if (!this.viewport) return;
        const el = this.viewport.elementRef.nativeElement;
        this.viewportScrollOffset = el.scrollTop;
        this.viewportVisibleSize = this.viewport.getViewportSize();
        this.totalScrollHeight = el.scrollHeight;
    }

    private highlightLine(line: string): SafeHtml {
        let html = highlightRptLine(line);
        if (this.searchQuery.trim()) {
            html = this.addSearchHighlights(html, this.searchQuery);
        }
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }

    private addSearchHighlights(html: string, query: string): string {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(${escapedQuery})`, 'gi');
        return html.replace(/(<[^>]+>)|([^<]+)/g, (match, tag: string, text: string) => {
            if (tag) {
                return tag;
            }
            return text.replace(pattern, '<mark class="search-term">$1</mark>');
        });
    }

    private rehighlightAll(): void {
        this.highlightedLines = this.logLines.map(l => this.highlightLine(l));
    }

    private scrollToBottom(): void {
        if (this.viewport) {
            this.viewport.scrollTo({ bottom: 0 });
        }
    }

    private scrollToSearchResult(): void {
        if (!this.viewport || this.currentSearchIndex < 0 || this.currentSearchIndex >= this.searchResults.length) {
            return;
        }
        const lineIndex = this.searchResults[this.currentSearchIndex].lineIndex;
        const itemSize = 20;
        const viewportSize = this.viewport.getViewportSize();
        const offset = lineIndex * itemSize;
        const centeredOffset = Math.max(0, offset - (viewportSize / 2) + itemSize);
        this.viewport.scrollToOffset(centeredOffset);
    }
}
