/**
 * VS Code-style minimap character bitmap renderer.
 *
 * Pre-computes pixel alpha bitmaps for printable ASCII (32–126),
 * then renders lines by blending foreground color × alpha onto a background
 * directly into an ImageData pixel buffer.
 *
 * At scale 1: each character is 1×2 pixels.
 * At scale 2: each character is 2×4 pixels (for high-DPI / retina displays).
 */

const CHAR_WIDTH = 1;
const CHAR_HEIGHT = 2;
const SAMPLE_FONT_SIZE = 16;
const PRINTABLE_START = 32;
const PRINTABLE_END = 126;

/** Alpha values for a single character at a given scale.
 *  Scale 1: 2 values (1×2). Scale 2: 8 values (2×4), stored row-major. */
export interface CharBitmap {
    alphas: number[]; // length = charWidth * charHeight
}

/** Pre-computed bitmap atlas for ASCII 32–126 */
export type CharAtlas = Map<number, CharBitmap>;

/**
 * Generate character bitmaps by rendering each printable ASCII character
 * on a hidden canvas, downsampling to charW×charH pixels with area averaging,
 * and normalizing brightness.
 *
 * @param canvas - offscreen canvas for rendering
 * @param scale - DPI scale factor (default 1). Character dimensions = (1*scale) × (2*scale)
 */
export function generateCharBitmaps(canvas: HTMLCanvasElement, scale: number = 1): CharAtlas {
    const atlas: CharAtlas = new Map();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return atlas;

    const charW = CHAR_WIDTH * scale;
    const charH = CHAR_HEIGHT * scale;

    const cellW = SAMPLE_FONT_SIZE;
    const cellH = SAMPLE_FONT_SIZE;
    canvas.width = cellW;
    canvas.height = cellH;

    ctx.font = `bold ${SAMPLE_FONT_SIZE}px monospace`;
    ctx.textBaseline = 'top';

    let globalMax = 0;
    const rawValues: { code: number; alphas: number[] }[] = [];

    for (let code = PRINTABLE_START; code <= PRINTABLE_END; code++) {
        ctx.clearRect(0, 0, cellW, cellH);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String.fromCharCode(code), 0, 0);

        const imageData = ctx.getImageData(0, 0, cellW, cellH);
        const pixels = imageData.data;

        // Area-average downsample: divide the cellW×cellH source into charW×charH destination pixels
        const alphas: number[] = [];
        for (let dy = 0; dy < charH; dy++) {
            const srcYStart = Math.floor((dy * cellH) / charH);
            const srcYEnd = Math.floor(((dy + 1) * cellH) / charH);
            for (let dx = 0; dx < charW; dx++) {
                const srcXStart = Math.floor((dx * cellW) / charW);
                const srcXEnd = Math.floor(((dx + 1) * cellW) / charW);

                let sum = 0;
                let count = 0;
                for (let y = srcYStart; y < srcYEnd; y++) {
                    for (let x = srcXStart; x < srcXEnd; x++) {
                        sum += pixels[(y * cellW + x) * 4 + 3]; // alpha channel
                        count++;
                    }
                }
                const avg = count > 0 ? sum / count : 0;
                alphas.push(avg);
                globalMax = Math.max(globalMax, avg);
            }
        }

        rawValues.push({ code, alphas });
    }

    // Normalize so brightest pixel = 255
    const normScale = globalMax > 0 ? 255 / globalMax : 0;
    for (const { code, alphas } of rawValues) {
        atlas.set(code, {
            alphas: alphas.map(a => Math.round(a * normScale))
        });
    }

    // Space gets zero alpha
    atlas.set(32, { alphas: new Array(charW * charH).fill(0) });

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
 * @param yOffset - Y pixel offset (top row of this line's pixel height)
 * @param bgR - background red component
 * @param bgG - background green component
 * @param bgB - background blue component
 * @param maxChars - maximum characters to render per line
 * @param scale - DPI scale factor (default 1)
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
    maxChars: number,
    scale: number = 1
): void {
    const len = line.length;
    if (len === 0 || segments.length === 0) return;

    const charW = CHAR_WIDTH * scale;
    const charH = CHAR_HEIGHT * scale;
    const charsToRender = Math.min(len, maxChars, Math.floor(canvasWidth / charW));

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
            if (!bitmap || bitmap.alphas.every(a => a === 0)) continue;

            const x = col * charW;
            if (x >= canvasWidth) break;

            // Render charW × charH pixel block
            for (let dy = 0; dy < charH; dy++) {
                for (let dx = 0; dx < charW; dx++) {
                    const alphaVal = bitmap.alphas[dy * charW + dx];
                    if (alphaVal > 0) {
                        const alpha = alphaVal / 255;
                        const idx = ((yOffset + dy) * canvasWidth + x + dx) * 4;
                        data[idx] = bgR + (fgR - bgR) * alpha;
                        data[idx + 1] = bgG + (fgG - bgG) * alpha;
                        data[idx + 2] = bgB + (fgB - bgB) * alpha;
                        data[idx + 3] = 255;
                    }
                }
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
