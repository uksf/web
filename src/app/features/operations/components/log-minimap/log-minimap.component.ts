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

/**
 * VS Code-style minimap layout computation (from minimap.ts MinimapLayout.create).
 *
 * Key differences from a naive implementation:
 * 1. Slider height = visible viewport lines × minimap line height (not a proportional
 *    ratio of canvas height). This ensures the slider covers exactly the lines visible
 *    in the viewport.
 * 2. Slider position uses a computed ratio: maxSliderTop / maxScroll, mapping the
 *    editor's scroll range to the minimap's slider travel range.
 * 3. startLine is derived from the slider position, then sliderTop is re-derived
 *    from startLine to guarantee pixel-perfect alignment.
 */
export function computeMinimapLayout(
    scrollTop: number, viewportSize: number, totalHeight: number,
    canvasHeight: number, totalLines: number, itemSize: number
): { startLine: number; visibleLines: number; sliderTop: number; sliderHeight: number } {
    const visibleLines = Math.floor(canvasHeight / LINE_HEIGHT_PX);

    if (totalLines <= 0) {
        return { startLine: 0, visibleLines, sliderTop: 0, sliderHeight: canvasHeight };
    }

    const contentHeight = totalLines * itemSize;

    if (contentHeight <= viewportSize) {
        return { startLine: 0, visibleLines, sliderTop: 0, sliderHeight: canvasHeight };
    }

    // 1. Slider height: visible viewport lines converted to minimap pixels.
    //    VS Code: sliderHeight = expectedViewportLineCount * minimapLineHeight / pixelRatio
    //    Our minimapLineHeight (LINE_HEIGHT_PX) is already in CSS pixels, so no pixelRatio division.
    const viewportLineCount = viewportSize / itemSize;
    const sliderHeight = Math.max(Math.round(viewportLineCount * LINE_HEIGHT_PX), 20);
    const maxSliderTop = Math.max(0, canvasHeight - sliderHeight);

    // 2. Slider position: VS Code's computedSliderRatio = maxSliderTop / maxScroll
    const maxScroll = totalHeight - viewportSize;
    const computedSliderRatio = maxScroll > 0 ? maxSliderTop / maxScroll : 0;
    const rawSliderTop = scrollTop * computedSliderRatio;

    // 3. First visible view line (fractional for sub-line accuracy)
    const viewportFirstLineFrac = Math.min(scrollTop / itemSize, totalLines - 1);

    // 4. Derive startLine from slider position, then re-derive sliderTop from startLine
    //    to guarantee pixel-perfect alignment (VS Code's sliderTopAligned approach).
    //    Use totalHeight (not contentHeight) for maxStartLine so the minimap can show
    //    empty space matching the viewport's bottom padding.
    const exactLinesAbove = rawSliderTop / LINE_HEIGHT_PX;
    const totalScrollLines = Math.ceil(totalHeight / itemSize);
    const maxStartLine = Math.max(0, totalScrollLines - visibleLines);
    const startLine = Math.max(0, Math.min(Math.round(viewportFirstLineFrac - exactLinesAbove), maxStartLine));
    const sliderTop = Math.max(0, Math.min(Math.round((viewportFirstLineFrac - startLine) * LINE_HEIGHT_PX), maxSliderTop));

    return { startLine, visibleLines, sliderTop, sliderHeight };
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

        const layout = this.getLayout(canvasHeight);

        if (y >= layout.sliderTop && y <= layout.sliderTop + layout.sliderHeight) {
            this.isDragging = true;
            this.dragStartY = y;
            this.dragStartOffset = this.viewportOffset();
        } else {
            // Click on minimap background → scroll to the line at the click position
            const clickedViewLine = layout.startLine + Math.floor(y / LINE_HEIGHT_PX);
            const totalViewLines = this.projection?.viewLineCount ?? this.logLines().length;
            const clampedViewLine = Math.max(0, Math.min(clickedViewLine, totalViewLines - 1));

            // Center the clicked line in the viewport
            const newOffset = Math.max(0, Math.min(
                clampedViewLine * this.itemSize() - this.viewportSize() / 2 + this.itemSize() / 2,
                this.totalHeight() - this.viewportSize()
            ));
            this.scrollToOffset.emit(newOffset);

            // For drag continuity, compute where the slider will end up after the jump
            // so that dragStartY matches the slider's new center position
            const newLayout = computeMinimapLayout(
                newOffset, this.viewportSize(), this.totalHeight(),
                canvasHeight, totalViewLines, this.itemSize()
            );
            this.isDragging = true;
            this.dragStartY = newLayout.sliderTop + newLayout.sliderHeight / 2;
            this.dragStartOffset = newOffset;
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
        const layout = this.getLayout(canvasHeight);
        const maxSliderTravel = canvasHeight - layout.sliderHeight;
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

    private getLayout(canvasHeight: number) {
        const totalLines = this.projection?.viewLineCount ?? this.logLines().length;
        return computeMinimapLayout(
            this.viewportOffset(), this.viewportSize(), this.totalHeight(),
            canvasHeight, totalLines, this.itemSize()
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
        const layout = this.getLayout(displayHeight);
        const startLine = layout.startLine;
        const visibleLines = layout.visibleLines;

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

        const layout = this.getLayout(displayHeight);

        // Draw search highlights on visible minimap lines
        this.drawSearchMarkers(ctx, displayWidth, layout.startLine, layout.visibleLines, totalLines);

        // Draw viewport slider
        ctx.fillStyle = this.isDragging ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, layout.sliderTop, displayWidth, layout.sliderHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, layout.sliderTop + 0.5, displayWidth - 1, layout.sliderHeight - 1);
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

        // Search markers positioned relative to scroll height (accounts for bottom padding)
        const results = this.searchResults();
        const totalH = this.totalHeight();
        if (results.length > 0 && totalH > 0) {
            const proj = this.projection;
            const iSize = this.itemSize();
            const activeIdx = this.currentSearchIndex();
            for (let i = 0; i < results.length; i++) {
                const logLineIdx = results[i].lineIndex;
                const viewLineIdx = proj ? proj.logLineToViewLine(logLineIdx) : logLineIdx;
                const viewLineCount = proj ? proj.getViewLineCountForLogLine(logLineIdx) : 1;
                // Map line's scroll offset to scrollbar position
                const lineScrollOffset = viewLineIdx * iSize;
                const y = Math.round((lineScrollOffset / totalH) * height);
                const markerH = Math.max(2, Math.round((viewLineCount * iSize / totalH) * height));
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
