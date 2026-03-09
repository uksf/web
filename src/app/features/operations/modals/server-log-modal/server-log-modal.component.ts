import { Component, HostListener, OnInit, ViewChild, inject, NgZone } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { first, takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

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
    scrollToLine?: number;
}

const ITEM_SIZE = 20;

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
    private ngZone = inject(NgZone);

    server: GameServer;
    sources: RptLogSource[] = [];
    activeSource = 'Server';
    logLines: string[] = [];
    highlightedLines: SafeHtml[] = [];
    isLoading = true;
    tailEnabled = false;
    searchQuery = '';
    searchResults: RptLogSearchResult[] = [];
    searchMatchLines: Set<number> = new Set();
    totalMatches = 0;
    currentSearchIndex = -1;
    isDownloading = false;
    viewportScrollOffset = 0;
    viewportVisibleSize = 0;
    totalScrollHeight = 0;
    logContentWidth = 0;
    linkedLineIndex = -1;

    private baseHtml: string[] = [];
    private baseHighlightedLines: SafeHtml[] = [];
    private _viewport: CdkVirtualScrollViewport | undefined;
    private metricsRafId: number | null = null;
    private pendingScrollToBottom = false;
    private programmaticScroll = false;

    @HostListener('window:keydown', ['$event'])
    handleKeydown(event: KeyboardEvent) {
        this.onKeydown(event);
    }

    @ViewChild(CdkVirtualScrollViewport)
    set viewport(vp: CdkVirtualScrollViewport | undefined) {
        if (vp && vp !== this._viewport) {
            this._viewport = vp;
            vp.elementScrolled().pipe(
                takeUntil(this.destroy$)
            ).subscribe(() => {
                this.ngZone.run(() => {
                    if (this.programmaticScroll) {
                        this.programmaticScroll = false;
                    } else {
                        this.tailEnabled = false;
                    }
                    this.updateViewportMetrics();
                });
            });
            this.scheduleMetricsUpdate();
            if (this.pendingScrollToBottom) {
                this.pendingScrollToBottom = false;
                setTimeout(() => this.scrollToBottom());
            } else if (this.pendingScrollToLine !== undefined) {
                const line = this.pendingScrollToLine;
                this.pendingScrollToLine = undefined;
                this.linkedLineIndex = Math.max(0, line - 1);
                setTimeout(() => this.scrollToLineIndex(line));
            }
        }
    }

    get viewport(): CdkVirtualScrollViewport | undefined {
        return this._viewport;
    }

    private searchDebounce = new DebouncedCallback(50);

    private pendingScrollToLine: number | undefined;

    constructor() {
        super();
        this.server = this.data.server;
        this.pendingScrollToLine = this.data.scrollToLine;
        if (this.pendingScrollToLine !== undefined) {
            this.tailEnabled = false;
        } else {
            this.tailEnabled = this.isServerActive();
        }
    }

    private isServerActive(): boolean {
        const status = this.server.status;
        if (!status) {
            return false;
        }
        return status.running || status.started || status.stopping;
    }

    ngOnInit(): void {
        this.sources = this.server.logSources ?? [{ name: 'Server', isServer: true }];

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

    private onReceiveLogContent = (serverId: string, source: string, lines: string[], _startLineIndex: number, isComplete: boolean) => {
        if (serverId !== this.server.id || source !== this.activeSource) {
            return;
        }
        this.logLines.push(...lines);
        const htmls = lines.map(l => highlightRptLine(l));
        this.baseHtml.push(...htmls);
        const baseSafe = htmls.map(html => this.sanitizer.bypassSecurityTrustHtml(html));
        this.baseHighlightedLines.push(...baseSafe);
        if (this.searchQuery.trim()) {
            const highlighted = htmls.map(html =>
                this.sanitizer.bypassSecurityTrustHtml(this.addSearchHighlights(html, this.searchQuery))
            );
            this.highlightedLines.push(...highlighted);
        } else {
            this.highlightedLines.push(...baseSafe);
        }
        if (isComplete) {
            this.isLoading = false;
            if (this.searchQuery.trim()) {
                this.search();
            }
            if (this.pendingScrollToLine !== undefined) {
                if (this.viewport) {
                    const line = this.pendingScrollToLine;
                    this.pendingScrollToLine = undefined;
                    this.linkedLineIndex = Math.max(0, line - 1);
                    setTimeout(() => this.scrollToLineIndex(line));
                }
                // else: viewport setter will handle it when viewport appears
            } else if (this.tailEnabled) {
                if (this.viewport) {
                    setTimeout(() => this.scrollToBottom());
                } else {
                    this.pendingScrollToBottom = true;
                }
            }
        }
        this.scheduleMetricsUpdate();
    };

    private onReceiveLogAppend = (serverId: string, source: string, lines: string[]) => {
        if (serverId !== this.server.id || source !== this.activeSource) {
            return;
        }
        this.logLines.push(...lines);
        const htmls = lines.map(l => highlightRptLine(l));
        this.baseHtml.push(...htmls);
        const baseSafe = htmls.map(html => this.sanitizer.bypassSecurityTrustHtml(html));
        this.baseHighlightedLines.push(...baseSafe);
        if (this.searchQuery.trim()) {
            const highlighted = htmls.map(html =>
                this.sanitizer.bypassSecurityTrustHtml(this.addSearchHighlights(html, this.searchQuery))
            );
            this.highlightedLines.push(...highlighted);
        } else {
            this.highlightedLines.push(...baseSafe);
        }
        if (this.tailEnabled) {
            setTimeout(() => this.scrollToBottom());
        }
        this.scheduleMetricsUpdate();
    };

    async switchSource(sourceName: string): Promise<void> {
        if (!sourceName || sourceName === this.activeSource) {
            return;
        }
        await this.serversHub.invoke('UnsubscribeFromLog', this.server.id, this.activeSource);
        this.logLines = [];
        this.highlightedLines = [];
        this.baseHtml = [];
        this.baseHighlightedLines = [];
        this.isLoading = true;
        this.searchResults = [];
        this.searchMatchLines = new Set();
        this.totalMatches = 0;
        this.currentSearchIndex = -1;
        this.linkedLineIndex = -1;
        this.activeSource = sourceName;
        this.serversHub.invoke('SubscribeToLog', this.server.id, sourceName);
    }

    toggleTail(): void {
        this.tailEnabled = !this.tailEnabled;
        if (this.tailEnabled) {
            this.scrollToBottom();
        }
    }

    onKeydown(event: KeyboardEvent): void {
        const tag = (event.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
            return;
        }
        if (event.key === 'Home') {
            event.preventDefault();
            this.tailEnabled = false;
            this.programmaticScroll = true;
            this.viewport?.scrollToIndex(0);
        } else if (event.key === 'End') {
            event.preventDefault();
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
            this.totalMatches = 0;
            this.currentSearchIndex = -1;
            this.highlightedLines = [...this.baseHighlightedLines];
            return;
        }
        const query = this.searchQuery.toLowerCase();
        const results: RptLogSearchResult[] = [];
        for (let i = 0; i < this.logLines.length; i++) {
            if (this.logLines[i].toLowerCase().includes(query)) {
                results.push({ lineIndex: i, text: this.logLines[i] });
            }
        }
        this.searchResults = results;
        this.searchMatchLines = new Set(results.map(r => r.lineIndex));
        this.totalMatches = results.length;
        this.currentSearchIndex = results.length > 0 ? 0 : -1;
        this.rehighlightForSearch();
        if (this.currentSearchIndex >= 0) {
            this.scrollToSearchResult();
        }
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

    onMinimapScrollToLine(lineIndex: number): void {
        if (!this.viewport) return;
        this.tailEnabled = false;
        this.programmaticScroll = true;
        const viewportSize = this.viewport.getViewportSize();
        const offset = lineIndex * ITEM_SIZE;
        const centeredOffset = Math.max(0, offset - (viewportSize / 2) + (ITEM_SIZE / 2));
        this.viewport.scrollToOffset(centeredOffset);
    }

    onMinimapScrollToOffset(offset: number): void {
        if (!this.viewport) return;
        this.tailEnabled = false;
        this.programmaticScroll = true;
        this.viewport.scrollToOffset(Math.max(0, offset));
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

    copyLineLink(event: MouseEvent, lineIndex: number): void {
        event.stopPropagation();
        const lineNumber = lineIndex + 1;
        const url = `${window.location.origin}/operations/servers?log=${this.server.id}&line=${lineNumber}`;
        navigator.clipboard.writeText(url).catch(() => {});
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
        if (this.metricsRafId !== null) {
            cancelAnimationFrame(this.metricsRafId);
        }
        this.serversHub.off('ReceiveLogContent', this.onReceiveLogContent);
        this.serversHub.off('ReceiveLogAppend', this.onReceiveLogAppend);
        this.serversHub.invoke('UnsubscribeFromLog', this.server.id, this.activeSource).catch(() => {});
        this.serversHub.disconnect();
        super.ngOnDestroy();
    }

    private scheduleMetricsUpdate(): void {
        if (this.metricsRafId !== null) return;
        if (typeof requestAnimationFrame !== 'undefined') {
            this.metricsRafId = requestAnimationFrame(() => {
                this.metricsRafId = null;
                this.ngZone.run(() => this.updateViewportMetrics());
            });
        } else {
            this.updateViewportMetrics();
        }
    }

    private updateViewportMetrics(): void {
        if (!this.viewport) return;
        const el = this.viewport.elementRef.nativeElement;
        this.viewportScrollOffset = el.scrollTop;
        this.viewportVisibleSize = this.viewport.getViewportSize();
        this.totalScrollHeight = el.scrollHeight;

        // Content area width: viewport minus line-number gutter (60px + 8px padding + 1px border) and content padding (8px)
        const viewportWidth = el.clientWidth;
        this.logContentWidth = Math.max(0, viewportWidth - 69 - 8);
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

    private rehighlightForSearch(): void {
        this.highlightedLines = [...this.baseHighlightedLines];
        if (this.searchQuery.trim()) {
            for (const result of this.searchResults) {
                const i = result.lineIndex;
                if (i < this.baseHtml.length) {
                    this.highlightedLines[i] = this.sanitizer.bypassSecurityTrustHtml(
                        this.addSearchHighlights(this.baseHtml[i], this.searchQuery)
                    );
                }
            }
        }
    }

    private scrollToLineIndex(lineNumber: number): void {
        if (!this.viewport) return;
        this.programmaticScroll = true;
        const index = Math.max(0, lineNumber - 1);
        const viewportSize = this.viewport.getViewportSize();
        const offset = index * ITEM_SIZE;
        const centeredOffset = Math.max(0, offset - (viewportSize / 2) + (ITEM_SIZE / 2));
        this.viewport.scrollToOffset(centeredOffset);
    }

    private scrollToBottom(): void {
        if (this.viewport) {
            this.programmaticScroll = true;
            this.viewport.scrollTo({ bottom: 0 });
        }
    }

    private scrollToSearchResult(): void {
        if (!this.viewport || this.currentSearchIndex < 0 || this.currentSearchIndex >= this.searchResults.length) {
            return;
        }
        this.programmaticScroll = true;
        const lineIndex = this.searchResults[this.currentSearchIndex].lineIndex;
        const viewportSize = this.viewport.getViewportSize();
        const offset = lineIndex * ITEM_SIZE;
        const centeredOffset = Math.max(0, offset - (viewportSize / 2) + (ITEM_SIZE / 2));
        this.viewport.scrollToOffset(centeredOffset);
    }
}
