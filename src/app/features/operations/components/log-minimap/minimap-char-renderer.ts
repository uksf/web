/**
 * VS Code-style minimap character bitmap renderer.
 *
 * Pre-computes 1×2 pixel alpha bitmaps for printable ASCII (32–126),
 * then renders lines by blending foreground color × alpha onto a background
 * directly into an ImageData pixel buffer.
 */

const CHAR_WIDTH = 1;
const CHAR_HEIGHT = 2;
const SAMPLE_FONT_SIZE = 16;
const PRINTABLE_START = 32;
const PRINTABLE_END = 126;

/** Two alpha values (top pixel, bottom pixel) for a single character */
export interface CharBitmap {
    top: number;    // 0–255
    bottom: number; // 0–255
}

/** Pre-computed bitmap atlas for ASCII 32–126 */
export type CharAtlas = Map<number, CharBitmap>;

/**
 * Generate character bitmaps by rendering each printable ASCII character
 * on a hidden canvas, downsampling to 1×2 pixels with area averaging,
 * and normalizing brightness.
 */
export function generateCharBitmaps(canvas: HTMLCanvasElement): CharAtlas {
    const atlas: CharAtlas = new Map();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return atlas;

    const cellW = SAMPLE_FONT_SIZE;
    const cellH = SAMPLE_FONT_SIZE;
    canvas.width = cellW;
    canvas.height = cellH;

    ctx.font = `bold ${SAMPLE_FONT_SIZE}px monospace`;
    ctx.textBaseline = 'top';

    let globalMax = 0;
    const rawValues: { code: number; top: number; bottom: number }[] = [];

    for (let code = PRINTABLE_START; code <= PRINTABLE_END; code++) {
        ctx.clearRect(0, 0, cellW, cellH);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String.fromCharCode(code), 0, 0);

        const imageData = ctx.getImageData(0, 0, cellW, cellH);
        const pixels = imageData.data;
        const halfH = Math.floor(cellH / 2);

        // Area-average top half → top pixel
        let topSum = 0;
        for (let y = 0; y < halfH; y++) {
            for (let x = 0; x < cellW; x++) {
                topSum += pixels[(y * cellW + x) * 4 + 3]; // alpha channel
            }
        }
        const topAvg = topSum / (halfH * cellW);

        // Area-average bottom half → bottom pixel
        let bottomSum = 0;
        for (let y = halfH; y < cellH; y++) {
            for (let x = 0; x < cellW; x++) {
                bottomSum += pixels[(y * cellW + x) * 4 + 3];
            }
        }
        const bottomAvg = bottomSum / ((cellH - halfH) * cellW);

        globalMax = Math.max(globalMax, topAvg, bottomAvg);
        rawValues.push({ code, top: topAvg, bottom: bottomAvg });
    }

    // Normalize so brightest pixel = 255
    const scale = globalMax > 0 ? 255 / globalMax : 0;
    for (const { code, top, bottom } of rawValues) {
        atlas.set(code, {
            top: Math.round(top * scale),
            bottom: Math.round(bottom * scale)
        });
    }

    // Space gets zero alpha
    atlas.set(32, { top: 0, bottom: 0 });

    return atlas;
}

/** Parse a CSS hex color (#rrggbb or #rgb) into [r, g, b] */
export function parseHexColor(hex: string): [number, number, number] {
    if (hex.startsWith('rgba')) {
        // Handle rgba() format — extract r,g,b ignoring alpha
        const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
    }
    const h = hex.replace('#', '');
    if (h.length === 3) {
        return [
            parseInt(h[0] + h[0], 16),
            parseInt(h[1] + h[1], 16),
            parseInt(h[2] + h[2], 16)
        ];
    }
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16)
    ];
}

/** Parsed color cache to avoid re-parsing on every character */
const colorCache = new Map<string, [number, number, number]>();

function getCachedColor(color: string): [number, number, number] {
    let rgb = colorCache.get(color);
    if (!rgb) {
        rgb = parseHexColor(color);
        colorCache.set(color, rgb);
    }
    return rgb;
}

/**
 * Render a single line of text into an ImageData buffer at the given Y offset.
 *
 * @param line - raw text of the line
 * @param segments - classified color segments from classifyRptLine()
 * @param atlas - pre-computed character bitmaps
 * @param data - ImageData.data (Uint8ClampedArray) to write into
 * @param canvasWidth - width of the ImageData in pixels
 * @param yOffset - Y pixel offset (top row of this line's 2px height)
 * @param bgR - background red component
 * @param bgG - background green component
 * @param bgB - background blue component
 * @param maxChars - maximum characters to render per line
 */
export function renderLineToImageData(
    line: string,
    segments: { color: string; start: number; end: number }[],
    atlas: CharAtlas,
    data: Uint8ClampedArray,
    canvasWidth: number,
    yOffset: number,
    bgR: number,
    bgG: number,
    bgB: number,
    maxChars: number
): void {
    const len = line.length;
    if (len === 0 || segments.length === 0) return;

    const charsToRender = Math.min(len, maxChars, canvasWidth / CHAR_WIDTH);
    const topRowStart = yOffset * canvasWidth * 4;
    const bottomRowStart = (yOffset + 1) * canvasWidth * 4;

    // Build a per-character color lookup from segments
    for (const seg of segments) {
        const startChar = Math.round(seg.start * len);
        const endChar = Math.min(Math.round(seg.end * len), charsToRender);
        const [fgR, fgG, fgB] = getCachedColor(seg.color);

        for (let col = startChar; col < endChar; col++) {
            if (col >= charsToRender) break;

            const code = line.charCodeAt(col);
            if (code < PRINTABLE_START || code > PRINTABLE_END) continue;

            const bitmap = atlas.get(code);
            if (!bitmap || (bitmap.top === 0 && bitmap.bottom === 0)) continue;

            const x = col * CHAR_WIDTH;
            if (x >= canvasWidth) break;

            // Top pixel
            if (bitmap.top > 0) {
                const alpha = bitmap.top / 255;
                const idx = topRowStart + x * 4;
                data[idx] = bgR + (fgR - bgR) * alpha;
                data[idx + 1] = bgG + (fgG - bgG) * alpha;
                data[idx + 2] = bgB + (fgB - bgB) * alpha;
                data[idx + 3] = 255;
            }

            // Bottom pixel
            if (bitmap.bottom > 0) {
                const alpha = bitmap.bottom / 255;
                const idx = bottomRowStart + x * 4;
                data[idx] = bgR + (fgR - bgR) * alpha;
                data[idx + 1] = bgG + (fgG - bgG) * alpha;
                data[idx + 2] = bgB + (fgB - bgB) * alpha;
                data[idx + 3] = 255;
            }
        }
    }
}

/**
 * Fill an ImageData buffer region with a solid color.
 * Used for background initialization.
 */
export function fillBackground(
    data: Uint8ClampedArray,
    width: number,
    startY: number,
    endY: number,
    r: number,
    g: number,
    b: number
): void {
    // Create one row of pixels
    const rowBytes = width * 4;
    const row = new Uint8Array(rowBytes);
    for (let x = 0; x < width; x++) {
        const idx = x * 4;
        row[idx] = r;
        row[idx + 1] = g;
        row[idx + 2] = b;
        row[idx + 3] = 255;
    }

    // Bulk-copy the row for each Y
    const u8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    for (let y = startY; y < endY; y++) {
        u8.set(row, y * rowBytes);
    }
}
