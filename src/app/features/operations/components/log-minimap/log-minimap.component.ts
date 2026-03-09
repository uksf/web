import {
    Component, ElementRef, ViewChild, OnDestroy,
    input, output, effect, AfterViewInit, inject
} from '@angular/core';
import { RptLogSearchResult } from '../../models/game-server';
import { classifyRptLine, RPT_COLORS, type RptColorSegment } from '../../utils/rpt-syntax-highlighter';
import { createLineProjection, type LineProjection } from './line-projection';
import {
    generateCharBitmaps, renderLineToImageData, fillBackground,
    type CharAtlas
} from './minimap-char-renderer';

const MINIMAP_WIDTH = 120;       // chars per line
const LINE_HEIGHT_PX = 2;        // pixels per line

const SCROLLBAR_THUMB_RADIUS = 4;
const SCROLLBAR_TRACK_RADIUS = 4;
const SEARCH_MARKER_COLOR = 'rgba(255, 200, 0, 0.5)';
const SEARCH_MARKER_ACTIVE_COLOR = 'rgba(255, 200, 0, 0.9)';

/** Compute which line the minimap content window starts at (proportional scrolling) */
export function computeStartLine(
    scrollTop: number, maxScroll: number, totalLines: number, visibleLines: number, itemSize: number
): number {
    if (totalLines <= visibleLines) return 0;
    if (maxScroll <= 0) return 0;

    const scrollFraction = scrollTop / maxScroll;
    const maxStartLine = totalLines - visibleLines;
    return Math.round(scrollFraction * maxStartLine);
}

/** Calculate viewport slider position and height on the overlay canvas */
export function computeSlider(
    scrollTop: number, viewportSize: number, totalHeight: number,
    canvasHeight: number, startLine: number, totalLines: number, visibleLines: number
): { top: number; height: number } {
    if (totalHeight <= 0 || totalLines <= 0) return { top: 0, height: canvasHeight };

    const vpFraction = viewportSize / totalHeight;
    const sliderHeight = Math.max(Math.round(vpFraction * canvasHeight), 20);

    const maxScroll = totalHeight - viewportSize;
    const maxSliderTop = canvasHeight - sliderHeight;
    const scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
    const top = Math.round(scrollFraction * maxSliderTop);

    return { top: Math.max(0, Math.min(top, maxSliderTop)), height: sliderHeight };
}

@Component({
    selector: 'app-log-minimap',
    templateUrl: './log-minimap.component.html',
    styleUrls: ['./log-minimap.component.scss'],
    standalone: true
})
export class LogMinimapComponent implements AfterViewInit, OnDestroy {
    private hostRef = inject(ElementRef);

    logLines = input<string[]>([]);
    searchResults = input<RptLogSearchResult[]>([]);
    searchQuery = input<string>('');
    currentSearchIndex = input<number>(-1);
    viewportOffset = input<number>(0);
    viewportSize = input<number>(0);
    totalHeight = input<number>(0);
    itemSize = input<number>(20);
    contentWidth = input<number>(0);

    scrollToLine = output<number>();
    scrollToOffset = output<number>();

    @ViewChild('contentCanvas') contentCanvasRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('overlayCanvas') overlayCanvasRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('scrollbarCanvas') scrollbarCanvasRef!: ElementRef<HTMLCanvasElement>;

    private charAtlas: CharAtlas | null = null;
    private bitmapCanvas: HTMLCanvasElement | null = null;
    private cachedSegments: RptColorSegment[][] = [];
    private lastClassifiedIndex = 0;
    private projection: LineProjection | null = null;
    private charsPerRow = 80;
    private charWidthPx = 0;

    private contentImageData: ImageData | null = null;
    private prevStartLine = -1;
    private prevRenderedCount = 0;

    private isDragging = false;
    private isScrollbarDragging = false;
    private dragStartY = 0;
    private dragStartOffset = 0;

    private currentScale = 1;
    private currentDpr = 1;

    private contentFrameId: number | null = null;
    private overlayFrameId: number | null = null;
    private resizeObserver: ResizeObserver | null = null;

    // Canvas colors resolved from CSS custom properties
    private bgR = 18;
    private bgG = 18;
    private bgB = 18;
    private scrollbarTrackColor = '#1c1c1c';
    private scrollbarThumbColor = '#484848';

    constructor() {
        // Classify new lines incrementally
        effect(() => {
            const lines = this.logLines();
            if (lines.length > this.lastClassifiedIndex) {
                for (let i = this.lastClassifiedIndex; i < lines.length; i++) {
                    this.cachedSegments[i] = classifyRptLine(lines[i]);
                }
                this.lastClassifiedIndex = lines.length;
            } else if (lines.length < this.lastClassifiedIndex) {
                // Lines replaced (source switch)
                this.cachedSegments = lines.map(l => classifyRptLine(l));
                this.lastClassifiedIndex = lines.length;
                this.prevStartLine = -1;
            }
            this.scheduleContentRedraw();
        });

        // Overlay redraws on scroll/search changes
        effect(() => {
            this.viewportOffset();
            this.viewportSize();
            this.totalHeight();
            this.searchResults();
            this.currentSearchIndex();
            this.searchQuery();
            this.scheduleOverlayRedraw();
        });

        // Content redraws when scroll position changes the visible window
        effect(() => {
            this.viewportOffset();
            this.totalHeight();
            this.scheduleContentRedraw();
        });

        // Recompute projection when lines or content width change
        effect(() => {
            this.logLines();
            this.contentWidth();
            this.updateProjection();
            this.scheduleContentRedraw();
        });
    }

    ngAfterViewInit(): void {
        this.resolveThemeColors();
        this.initAtlas();
        this.measureCharWidth();
        this.resizeObserver = new ResizeObserver(() => {
            this.prevStartLine = -1; // force full redraw on resize
            this.scheduleContentRedraw();
            this.scheduleOverlayRedraw();
        });
        this.resizeObserver.observe(this.contentCanvasRef.nativeElement);
        this.scheduleContentRedraw();
        this.scheduleOverlayRedraw();
    }

    ngOnDestroy(): void {
        if (this.contentFrameId !== null) cancelAnimationFrame(this.contentFrameId);
        if (this.overlayFrameId !== null) cancelAnimationFrame(this.overlayFrameId);
        this.resizeObserver?.disconnect();
        this.cleanupDocumentListeners();
    }

    private resolveThemeColors(): void {
        const styles = getComputedStyle(this.hostRef.nativeElement);
        const bg = styles.getPropertyValue('--minimap-bg').trim();
        if (bg) {
            const rgb = this.parseHexColor(bg);
            if (rgb) {
                this.bgR = rgb.r;
                this.bgG = rgb.g;
                this.bgB = rgb.b;
            }
        }
        const track = styles.getPropertyValue('--minimap-scrollbar-track').trim();
        if (track) this.scrollbarTrackColor = track;
        const thumb = styles.getPropertyValue('--minimap-scrollbar-thumb').trim();
        if (thumb) this.scrollbarThumbColor = thumb;
    }

    private parseHexColor(hex: string): { r: number; g: number; b: number } | null {
        const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if (!match) return null;
        return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
    }

    private initAtlas(): void {
        this.bitmapCanvas = document.createElement('canvas');
        this.currentDpr = window.devicePixelRatio ?? 1;
        this.currentScale = this.currentDpr >= 2 ? 2 : 1;
        this.charAtlas = generateCharBitmaps(this.bitmapCanvas, this.currentScale);
    }

    private measureCharWidth(): void {
        if (!this.bitmapCanvas) return;
        const ctx = this.bitmapCanvas.getContext('2d');
        if (!ctx) return;
        ctx.font = '13px Cascadia Code, Fira Code, Consolas, Monaco, monospace';
        this.charWidthPx = ctx.measureText('x').width;
    }

    private updateProjection(): void {
        const width = this.contentWidth();
        if (width > 0 && this.charWidthPx > 0) {
            this.charsPerRow = Math.max(1, Math.floor(width / this.charWidthPx));
        }
        this.projection = createLineProjection(this.logLines(), this.charsPerRow);
    }

    private checkDprChange(): boolean {
        const dpr = window.devicePixelRatio ?? 1;
        const scale = dpr >= 2 ? 2 : 1;
        if (scale !== this.currentScale) {
            this.currentDpr = dpr;
            this.currentScale = scale;
            this.charAtlas = generateCharBitmaps(this.bitmapCanvas!, this.currentScale);
            this.contentImageData = null;
            this.prevStartLine = -1;
            return true;
        }
        this.currentDpr = dpr;
        return false;
    }

    // --- Minimap mouse handling ---

    onMinimapMouseDown(event: MouseEvent): void {
        event.preventDefault();
        const canvas = this.overlayCanvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const canvasHeight = canvas.clientHeight;

        const { startLine, visibleLines } = this.getMinimapWindow(canvasHeight);
        const slider = this.getSlider(canvasHeight);

        if (y >= slider.top && y <= slider.top + slider.height) {
            this.isDragging = true;
            this.dragStartY = y;
            this.dragStartOffset = this.viewportOffset();
        } else {
            // Click on minimap background → scroll to that line
            const clickedViewLine = startLine + Math.floor(y / LINE_HEIGHT_PX);
            const proj = this.projection;
            const totalViewLines = proj?.viewLineCount ?? this.logLines().length;
            const clampedViewLine = Math.max(0, Math.min(clickedViewLine, totalViewLines - 1));
            const clampedLine = proj ? proj.getViewLine(clampedViewLine).logLineIndex : clampedViewLine;
            this.scrollToLine.emit(clampedLine);

            // Start dragging from the new position, using the same centered offset
            // the parent applies when scrolling to a line
            this.isDragging = true;
            this.dragStartY = y;
            const lineOffset = clampedLine * this.itemSize();
            const centeredOffset = Math.max(0, lineOffset - this.viewportSize() / 2 + this.itemSize() / 2);
            this.dragStartOffset = centeredOffset;
        }
        this.setupDocumentListeners();
    }

    // --- Scrollbar mouse handling ---

    onScrollbarMouseDown(event: MouseEvent): void {
        event.preventDefault();
        const canvas = this.scrollbarCanvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const canvasHeight = canvas.clientHeight;

        const thumbRect = this.getScrollbarThumb(canvasHeight);

        if (y >= thumbRect.top && y <= thumbRect.top + thumbRect.height) {
            this.isScrollbarDragging = true;
            this.dragStartY = y;
            this.dragStartOffset = this.viewportOffset();
        } else {
            // Click on track → jump to proportional position
            const scrollFraction = y / canvasHeight;
            const maxScroll = this.totalHeight() - this.viewportSize();
            const newOffset = Math.max(0, Math.min(scrollFraction * this.totalHeight() - this.viewportSize() / 2, maxScroll));
            this.scrollToOffset.emit(newOffset);

            this.isScrollbarDragging = true;
            this.dragStartY = y;
            this.dragStartOffset = newOffset;
        }
        this.setupDocumentListeners();
    }

    private onDocumentMouseMove = (event: MouseEvent): void => {
        if (this.isDragging) {
            this.handleMinimapDrag(event);
        } else if (this.isScrollbarDragging) {
            this.handleScrollbarDrag(event);
        }
    };

    private handleMinimapDrag(event: MouseEvent): void {
        const canvas = this.overlayCanvasRef.nativeElement;
        const canvasHeight = canvas.clientHeight;
        if (canvasHeight === 0) return;

        const rect = canvas.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const deltaY = y - this.dragStartY;
        const slider = this.getSlider(canvasHeight);
        const maxSliderTravel = canvasHeight - slider.height;
        if (maxSliderTravel <= 0) return;

        const maxScroll = this.totalHeight() - this.viewportSize();
        const deltaScroll = (deltaY / maxSliderTravel) * maxScroll;
        const newOffset = Math.max(0, Math.min(this.dragStartOffset + deltaScroll, maxScroll));
        this.scrollToOffset.emit(newOffset);
    }

    private handleScrollbarDrag(event: MouseEvent): void {
        const canvas = this.scrollbarCanvasRef.nativeElement;
        const canvasHeight = canvas.clientHeight;
        if (canvasHeight === 0) return;

        const rect = canvas.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const deltaY = y - this.dragStartY;
        const thumbRect = this.getScrollbarThumb(canvasHeight);
        const maxThumbTravel = canvasHeight - thumbRect.height;
        if (maxThumbTravel <= 0) return;

        const maxScroll = this.totalHeight() - this.viewportSize();
        const deltaScroll = (deltaY / maxThumbTravel) * maxScroll;
        const newOffset = Math.max(0, Math.min(this.dragStartOffset + deltaScroll, maxScroll));
        this.scrollToOffset.emit(newOffset);
    }

    private onDocumentMouseUp = (): void => {
        this.isDragging = false;
        this.isScrollbarDragging = false;
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

    // --- Rendering ---

    private scheduleContentRedraw(): void {
        if (this.contentFrameId !== null) return;
        this.contentFrameId = requestAnimationFrame(() => {
            this.contentFrameId = null;
            this.drawContent();
        });
    }

    private scheduleOverlayRedraw(): void {
        if (this.overlayFrameId !== null) return;
        this.overlayFrameId = requestAnimationFrame(() => {
            this.overlayFrameId = null;
            this.drawOverlay();
            this.drawScrollbar();
        });
    }

    private getMinimapWindow(canvasHeight: number): { startLine: number; visibleLines: number } {
        const totalLines = this.projection?.viewLineCount ?? this.logLines().length;
        const visibleLines = Math.floor(canvasHeight / LINE_HEIGHT_PX);
        const maxScroll = this.totalHeight() - this.viewportSize();
        const startLine = computeStartLine(
            this.viewportOffset(), maxScroll, totalLines, visibleLines, this.itemSize()
        );
        return { startLine, visibleLines };
    }

    private getSlider(canvasHeight: number): { top: number; height: number } {
        const { startLine, visibleLines } = this.getMinimapWindow(canvasHeight);
        const totalLines = this.projection?.viewLineCount ?? this.logLines().length;
        return computeSlider(
            this.viewportOffset(), this.viewportSize(), this.totalHeight(),
            canvasHeight, startLine, totalLines, visibleLines
        );
    }

    private getScrollbarThumb(canvasHeight: number): { top: number; height: number } {
        const totalH = this.totalHeight();
        if (totalH <= 0) return { top: 0, height: canvasHeight };
        const vpFraction = this.viewportSize() / totalH;
        const thumbHeight = Math.max(Math.round(vpFraction * canvasHeight), 20);
        const maxScroll = totalH - this.viewportSize();
        const maxThumbTop = canvasHeight - thumbHeight;
        const scrollFraction = maxScroll > 0 ? this.viewportOffset() / maxScroll : 0;
        const top = Math.round(scrollFraction * maxThumbTop);
        return { top: Math.max(0, Math.min(top, maxThumbTop)), height: thumbHeight };
    }

    private drawContent(): void {
        const canvas = this.contentCanvasRef?.nativeElement;
        if (!canvas || !this.charAtlas) return;

        this.checkDprChange();

        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (displayWidth === 0 || displayHeight === 0) return;

        const dpr = this.currentDpr;
        const scale = this.currentScale;
        const bufferWidth = Math.floor(displayWidth * dpr);
        const bufferHeight = Math.floor(displayHeight * dpr);

        canvas.width = bufferWidth;
        canvas.height = bufferHeight;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const lines = this.logLines();
        const proj = this.projection;
        const atlas = this.charAtlas;
        const scaledLineHeight = LINE_HEIGHT_PX * scale;
        const totalViewLines = proj?.viewLineCount ?? lines.length;
        // Use display height for visible line count (consistent with overlay/slider calculations)
        const visibleLines = Math.floor(displayHeight / LINE_HEIGHT_PX);
        const maxScroll = this.totalHeight() - this.viewportSize();
        const startLine = computeStartLine(
            this.viewportOffset(), maxScroll, totalViewLines, visibleLines, this.itemSize()
        );

        const endLine = Math.min(startLine + visibleLines, totalViewLines);
        const renderCount = endLine - startLine;

        // Create or reuse ImageData
        if (!this.contentImageData || this.contentImageData.width !== bufferWidth || this.contentImageData.height !== bufferHeight) {
            this.contentImageData = ctx.createImageData(bufferWidth, bufferHeight);
            this.prevStartLine = -1;
        }

        const data = this.contentImageData.data;

        // Fill background
        fillBackground(data, bufferWidth, 0, bufferHeight, this.bgR, this.bgG, this.bgB);

        // Render visible lines
        for (let i = 0; i < renderCount; i++) {
            const viewLineIdx = startLine + i;
            if (!proj || viewLineIdx >= proj.viewLineCount) break;

            const { text, logLineIndex } = proj.getViewLine(viewLineIdx);
            const segments = logLineIndex < this.cachedSegments.length
                ? this.cachedSegments[logLineIndex]
                : [];
            const yOffset = i * scaledLineHeight;

            renderLineToImageData(
                text,
                segments,
                atlas,
                data as Uint8ClampedArray,
                bufferWidth,
                yOffset,
                this.bgR, this.bgG, this.bgB,
                MINIMAP_WIDTH,
                this.currentScale
            );
        }

        ctx.putImageData(this.contentImageData, 0, 0);
        this.prevStartLine = startLine;
        this.prevRenderedCount = renderCount;

        // Also redraw overlay since content position changed
        this.scheduleOverlayRedraw();
    }

    private drawOverlay(): void {
        const canvas = this.overlayCanvasRef?.nativeElement;
        if (!canvas) return;

        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (displayWidth === 0 || displayHeight === 0) return;

        const dpr = this.currentDpr;
        canvas.width = Math.floor(displayWidth * dpr);
        canvas.height = Math.floor(displayHeight * dpr);
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        const totalLines = this.projection?.viewLineCount ?? this.logLines().length;
        if (totalLines === 0) return;

        const visibleLines = Math.floor(displayHeight / LINE_HEIGHT_PX);
        const maxScroll = this.totalHeight() - this.viewportSize();
        const startLine = computeStartLine(
            this.viewportOffset(), maxScroll, totalLines, visibleLines, this.itemSize()
        );

        // Draw search highlights on visible minimap lines
        this.drawSearchMarkers(ctx, displayWidth, startLine, visibleLines, totalLines);

        // Draw viewport slider
        const slider = this.getSlider(displayHeight);
        ctx.fillStyle = this.isDragging ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, slider.top, displayWidth, slider.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, slider.top + 0.5, displayWidth - 1, slider.height - 1);
    }

    private drawSearchMarkers(
        ctx: CanvasRenderingContext2D, width: number,
        startLine: number, visibleLines: number, totalLines: number
    ): void {
        const results = this.searchResults();
        if (!results.length) return;

        const activeIdx = this.currentSearchIndex();
        const endLine = startLine + visibleLines;
        const proj = this.projection;

        for (let i = 0; i < results.length; i++) {
            const logLineIdx = results[i].lineIndex;
            const viewLineIdx = proj ? proj.logLineToViewLine(logLineIdx) : logLineIdx;
            const viewLineCount = proj ? proj.getViewLineCountForLogLine(logLineIdx) : 1;
            if (viewLineIdx + viewLineCount <= startLine || viewLineIdx >= endLine) continue;

            const y = (viewLineIdx - startLine) * LINE_HEIGHT_PX;
            const markerHeight = viewLineCount * LINE_HEIGHT_PX;
            const isActive = i === activeIdx;

            ctx.fillStyle = isActive ? RPT_COLORS.searchActive : RPT_COLORS.search;
            ctx.globalAlpha = isActive ? 0.8 : 0.5;
            ctx.fillRect(0, y, width, markerHeight);
        }
        ctx.globalAlpha = 1;
    }

    private drawScrollbar(): void {
        const canvas = this.scrollbarCanvasRef?.nativeElement;
        if (!canvas) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (width === 0 || height === 0) return;

        const dpr = this.currentDpr;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);

        // Track background
        ctx.fillStyle = this.scrollbarTrackColor;
        this.roundRect(ctx, 0, 0, width, height, SCROLLBAR_TRACK_RADIUS);
        ctx.fill();

        // Thumb
        const thumb = this.getScrollbarThumb(height);
        ctx.fillStyle = this.scrollbarThumbColor;
        this.roundRect(ctx, 0, thumb.top, width, thumb.height, SCROLLBAR_THUMB_RADIUS);
        ctx.fill();

        // Search markers across full scrollbar height
        const results = this.searchResults();
        const totalLines = this.logLines().length;
        const totalViewLines = this.projection?.viewLineCount ?? totalLines;
        if (results.length > 0 && totalViewLines > 0) {
            const proj = this.projection;
            const activeIdx = this.currentSearchIndex();
            for (let i = 0; i < results.length; i++) {
                const logLineIdx = results[i].lineIndex;
                const viewLineIdx = proj ? proj.logLineToViewLine(logLineIdx) : logLineIdx;
                const viewLineCount = proj ? proj.getViewLineCountForLogLine(logLineIdx) : 1;
                const y = Math.round((viewLineIdx / totalViewLines) * height);
                const markerH = Math.max(2, Math.round((viewLineCount / totalViewLines) * height));
                const isActive = i === activeIdx;
                ctx.fillStyle = isActive ? SEARCH_MARKER_ACTIVE_COLOR : SEARCH_MARKER_COLOR;
                ctx.fillRect(0, y, width, markerH);
            }
        }
    }

    private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
