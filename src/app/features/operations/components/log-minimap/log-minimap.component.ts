import {
    Component, ElementRef, ViewChild, OnDestroy,
    input, output, effect, AfterViewInit
} from '@angular/core';
import { RptLogSearchResult } from '../../models/game-server';
import { classifyRptLine, RPT_COLORS, RptColorSegment } from '../../utils/rpt-syntax-highlighter';

/** Map a line index to a canvas Y coordinate */
export function lineToCanvasY(lineIndex: number, totalLines: number, canvasHeight: number): number {
    if (totalLines === 0) return 0;
    return (lineIndex / totalLines) * canvasHeight;
}

/** Convert a canvas Y position back to a line number */
export function canvasYToLine(y: number, totalLines: number, canvasHeight: number): number {
    if (canvasHeight === 0) return 0;
    const line = Math.round((y / canvasHeight) * totalLines);
    return Math.max(0, Math.min(totalLines, line));
}

/** Calculate the viewport slider rectangle on the minimap */
export function getViewportSliderRect(
    offset: number, vpSize: number, totalH: number, canvasHeight: number
): { top: number; height: number } {
    if (totalH === 0) return { top: 0, height: canvasHeight };
    const top = (offset / totalH) * canvasHeight;
    const height = Math.min((vpSize / totalH) * canvasHeight, canvasHeight - top);
    return { top, height };
}

/** Find the nearest search result within a pixel tolerance of a Y coordinate */
export function findSearchResultAtY(
    y: number, results: RptLogSearchResult[], totalLines: number, canvasHeight: number, tolerancePx: number
): number {
    if (!results.length) return -1;
    let nearest = -1;
    let nearestDist = Infinity;
    for (let i = 0; i < results.length; i++) {
        const resultY = lineToCanvasY(results[i].lineIndex, totalLines, canvasHeight);
        const dist = Math.abs(y - resultY);
        if (dist < nearestDist && dist <= tolerancePx) {
            nearestDist = dist;
            nearest = i;
        }
    }
    return nearest;
}

@Component({
    selector: 'app-log-minimap',
    templateUrl: './log-minimap.component.html',
    styleUrls: ['./log-minimap.component.scss'],
    standalone: true
})
export class LogMinimapComponent implements AfterViewInit, OnDestroy {
    logLines = input<string[]>([]);
    searchResults = input<RptLogSearchResult[]>([]);
    currentSearchIndex = input<number>(-1);
    viewportOffset = input<number>(0);
    viewportSize = input<number>(0);
    totalHeight = input<number>(0);
    itemSize = input<number>(20);

    scrollToLine = output<number>();
    scrollToOffset = output<number>();
    navigateToSearchResult = output<number>();

    @ViewChild('minimapCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

    isDragging = false;
    isHovering = false;
    private dragStartY = 0;
    private dragStartOffset = 0;
    private cachedSegments: RptColorSegment[][] = [];
    private animationFrameId: number | null = null;
    private resizeObserver: ResizeObserver | null = null;

    constructor() {
        effect(() => {
            this.logLines();
            this.searchResults();
            this.currentSearchIndex();
            this.viewportOffset();
            this.viewportSize();
            this.totalHeight();
            this.scheduleRedraw();
        });

        effect(() => {
            const lines = this.logLines();
            this.cachedSegments = lines.map(line => classifyRptLine(line));
        });
    }

    ngAfterViewInit(): void {
        this.resizeObserver = new ResizeObserver(() => this.scheduleRedraw());
        this.resizeObserver.observe(this.canvasRef.nativeElement);
        this.scheduleRedraw();
    }

    ngOnDestroy(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.resizeObserver?.disconnect();
        this.cleanupDocumentListeners();
    }

    onMouseDown(event: MouseEvent): void {
        event.preventDefault();
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const totalLines = this.logLines().length;
        const canvasHeight = canvas.clientHeight;

        const searchIdx = findSearchResultAtY(
            y, this.searchResults(), totalLines, canvasHeight, 5
        );
        if (searchIdx >= 0) {
            this.navigateToSearchResult.emit(searchIdx);
            return;
        }

        const slider = getViewportSliderRect(
            this.viewportOffset(), this.viewportSize(), this.totalHeight(), canvasHeight
        );
        if (y >= slider.top && y <= slider.top + slider.height) {
            this.startDrag(y);
            this.setupDocumentListeners();
            return;
        }

        const line = canvasYToLine(y, totalLines, canvasHeight);
        this.scrollToLine.emit(line);
    }

    onMouseMove(_event: MouseEvent): void {
        if (!this.isDragging) {
            this.isHovering = true;
            this.scheduleRedraw();
        }
    }

    onMouseLeave(): void {
        if (!this.isDragging) {
            this.isHovering = false;
            this.scheduleRedraw();
        }
    }

    startDrag(y: number): void {
        this.isDragging = true;
        this.dragStartY = y;
        this.dragStartOffset = this.viewportOffset();
    }

    endDrag(): void {
        this.isDragging = false;
    }

    private onDocumentMouseMove = (event: MouseEvent): void => {
        if (!this.isDragging) return;
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const deltaY = y - this.dragStartY;
        const canvasHeight = canvas.clientHeight;
        const totalH = this.totalHeight();

        if (canvasHeight === 0 || totalH === 0) return;

        const deltaScroll = (deltaY / canvasHeight) * totalH;
        const newOffset = this.dragStartOffset + deltaScroll;
        const maxOffset = totalH - this.viewportSize();
        const clampedOffset = Math.max(0, Math.min(maxOffset, newOffset));
        this.scrollToOffset.emit(clampedOffset);
    };

    private onDocumentMouseUp = (): void => {
        this.endDrag();
        this.cleanupDocumentListeners();
    };

    private setupDocumentListeners(): void {
        document.addEventListener('mousemove', this.onDocumentMouseMove);
        document.addEventListener('mouseup', this.onDocumentMouseUp);
    }

    private cleanupDocumentListeners(): void {
        document.removeEventListener('mousemove', this.onDocumentMouseMove);
        document.removeEventListener('mouseup', this.onDocumentMouseUp);
    }

    private scheduleRedraw(): void {
        if (this.animationFrameId !== null) return;
        this.animationFrameId = requestAnimationFrame(() => {
            this.animationFrameId = null;
            this.draw();
        });
    }

    private draw(): void {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        const lines = this.logLines();
        const totalLines = lines.length;

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        if (totalLines > 0) {
            this.drawContent(ctx, displayWidth, displayHeight, totalLines);
            this.drawSearchHighlights(ctx, displayWidth, displayHeight, totalLines);
            this.drawViewportSlider(ctx, displayWidth, displayHeight);
        }
    }

    private drawContent(
        ctx: CanvasRenderingContext2D, width: number, height: number, totalLines: number
    ): void {
        const lineH = Math.max(height / totalLines, 1);
        const charWidth = 1.5;
        const maxChars = Math.floor(width / charWidth);

        for (let i = 0; i < this.cachedSegments.length; i++) {
            const y = lineToCanvasY(i, totalLines, height);
            const segments = this.cachedSegments[i];
            const lineLen = this.logLines()[i]?.length ?? 0;

            for (const seg of segments) {
                ctx.fillStyle = seg.color;
                if (seg.color === RPT_COLORS.defaultText) {
                    ctx.globalAlpha = 0.4;
                } else {
                    ctx.globalAlpha = 0.8;
                }
                const x = seg.start * Math.min(lineLen, maxChars) * charWidth;
                const w = (seg.end - seg.start) * Math.min(lineLen, maxChars) * charWidth;
                ctx.fillRect(x, y, Math.max(w, 1), Math.max(lineH, 1));
            }
        }
        ctx.globalAlpha = 1;
    }

    private drawSearchHighlights(
        ctx: CanvasRenderingContext2D, width: number, height: number, totalLines: number
    ): void {
        const results = this.searchResults();
        const activeIdx = this.currentSearchIndex();

        for (let i = 0; i < results.length; i++) {
            const y = lineToCanvasY(results[i].lineIndex, totalLines, height);
            ctx.fillStyle = i === activeIdx ? RPT_COLORS.searchActive : RPT_COLORS.search;
            ctx.fillRect(0, y, width, Math.max(height / totalLines, 2));
        }
    }

    private drawViewportSlider(
        ctx: CanvasRenderingContext2D, width: number, height: number
    ): void {
        const slider = getViewportSliderRect(
            this.viewportOffset(), this.viewportSize(), this.totalHeight(), height
        );

        const fillAlpha = this.isHovering || this.isDragging ? 0.15 : 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${fillAlpha})`;
        ctx.fillRect(0, slider.top, width, slider.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, slider.top + 0.5, width - 1, slider.height - 1);
    }
}
