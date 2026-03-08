import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    generateCharBitmaps,
    parseHexColor,
    renderLineToImageData,
    fillBackground,
    type CharAtlas
} from './minimap-char-renderer';

function createMockCanvas(): HTMLCanvasElement {
    const pixels = new Uint8ClampedArray(16 * 16 * 4);
    const imageData = { data: pixels, width: 16, height: 16 };
    const ctx = {
        font: '',
        textBaseline: '',
        clearRect: vi.fn(),
        fillStyle: '',
        fillText: vi.fn((_char: string) => {
            // Simulate some pixel coverage for non-space characters
            if (_char !== ' ') {
                for (let y = 2; y < 14; y++) {
                    for (let x = 1; x < 10; x++) {
                        pixels[(y * 16 + x) * 4 + 3] = 200; // alpha
                    }
                }
            }
        }),
        getImageData: vi.fn(() => {
            const copy = new Uint8ClampedArray(pixels);
            // Reset for next call
            pixels.fill(0);
            return { ...imageData, data: copy };
        })
    };

    return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ctx)
    } as unknown as HTMLCanvasElement;
}

describe('minimap-char-renderer', () => {
    describe('parseHexColor', () => {
        it('should parse 6-digit hex', () => {
            expect(parseHexColor('#ff8040')).toEqual([255, 128, 64]);
        });

        it('should parse 3-digit hex', () => {
            expect(parseHexColor('#f00')).toEqual([255, 0, 0]);
        });

        it('should parse hex without hash', () => {
            expect(parseHexColor('6a737d')).toEqual([106, 115, 125]);
        });

        it('should parse rgba format', () => {
            expect(parseHexColor('rgba(255, 200, 0, 0.5)')).toEqual([255, 200, 0]);
        });
    });

    describe('generateCharBitmaps', () => {
        it('should generate bitmaps for printable ASCII range', () => {
            const canvas = createMockCanvas();
            const atlas = generateCharBitmaps(canvas);

            // Should have entries for ASCII 32-126
            expect(atlas.size).toBe(126 - 32 + 1);
        });

        it('should set space to zero alpha', () => {
            const canvas = createMockCanvas();
            const atlas = generateCharBitmaps(canvas);

            const space = atlas.get(32)!;
            expect(space.top).toBe(0);
            expect(space.bottom).toBe(0);
        });

        it('should have non-zero alpha for visible characters', () => {
            const canvas = createMockCanvas();
            const atlas = generateCharBitmaps(canvas);

            // 'A' = 65
            const a = atlas.get(65)!;
            expect(a.top + a.bottom).toBeGreaterThan(0);
        });

        it('should normalize brightness so max is 255', () => {
            const canvas = createMockCanvas();
            const atlas = generateCharBitmaps(canvas);

            let maxAlpha = 0;
            for (const [code, bitmap] of atlas) {
                if (code === 32) continue; // skip space
                maxAlpha = Math.max(maxAlpha, bitmap.top, bitmap.bottom);
            }
            expect(maxAlpha).toBe(255);
        });
    });

    describe('renderLineToImageData', () => {
        let atlas: CharAtlas;

        beforeEach(() => {
            atlas = new Map();
            // Simple atlas: 'A' (65) has full brightness, space (32) has zero
            atlas.set(65, { top: 255, bottom: 128 });
            atlas.set(66, { top: 200, bottom: 200 });
            atlas.set(32, { top: 0, bottom: 0 });
        });

        it('should render characters into pixel data', () => {
            const width = 10;
            const height = 4;
            const data = new Uint8ClampedArray(width * height * 4);
            // Fill with background
            fillBackground(data, width, 0, height, 30, 30, 30);

            renderLineToImageData(
                'AB',
                [{ color: '#ff0000', start: 0, end: 1 }],
                atlas, data, width, 0,
                30, 30, 30, 120
            );

            // Pixel at (0,0) should be blended red (A top = 255 → full alpha, fg replaces bg)
            const idx = 0;
            expect(data[idx]).toBe(255);     // R: fully red
            expect(data[idx + 1]).toBe(0);   // G: fg green (0) at full alpha
            expect(data[idx + 2]).toBe(0);   // B: fg blue (0) at full alpha
            expect(data[idx + 3]).toBe(255); // A: opaque
        });

        it('should skip whitespace characters', () => {
            const width = 10;
            const height = 4;
            const data = new Uint8ClampedArray(width * height * 4);
            fillBackground(data, width, 0, height, 30, 30, 30);

            renderLineToImageData(
                ' A',
                [{ color: '#ff0000', start: 0, end: 1 }],
                atlas, data, width, 0,
                30, 30, 30, 120
            );

            // Pixel at (0,0) — space — should remain background
            expect(data[0]).toBe(30);
            expect(data[1]).toBe(30);
            expect(data[2]).toBe(30);
        });

        it('should handle empty line', () => {
            const width = 10;
            const height = 4;
            const data = new Uint8ClampedArray(width * height * 4);
            fillBackground(data, width, 0, height, 30, 30, 30);

            // Should not throw
            renderLineToImageData(
                '',
                [{ color: '#ff0000', start: 0, end: 1 }],
                atlas, data, width, 0,
                30, 30, 30, 120
            );

            // Background unchanged
            expect(data[0]).toBe(30);
        });

        it('should respect maxChars limit', () => {
            const width = 10;
            const height = 4;
            const data = new Uint8ClampedArray(width * height * 4);
            fillBackground(data, width, 0, height, 30, 30, 30);

            renderLineToImageData(
                'AAAAAA',
                [{ color: '#ff0000', start: 0, end: 1 }],
                atlas, data, width, 0,
                30, 30, 30, 3 // maxChars = 3
            );

            // Pixel at col 3 should still be background (not rendered)
            const idx = 3 * 4;
            expect(data[idx]).toBe(30);
        });

        it('should blend with correct alpha for partial brightness', () => {
            const width = 10;
            const height = 4;
            const data = new Uint8ClampedArray(width * height * 4);
            fillBackground(data, width, 0, height, 0, 0, 0);

            // B has top=200, bottom=200
            renderLineToImageData(
                'B',
                [{ color: '#ffffff', start: 0, end: 1 }],
                atlas, data, width, 0,
                0, 0, 0, 120
            );

            // Top pixel: alpha = 200/255 ≈ 0.784, blend = 0 + (255-0)*0.784 ≈ 200
            const topIdx = 0;
            expect(data[topIdx]).toBeCloseTo(200, 0);
        });
    });

    describe('fillBackground', () => {
        it('should fill region with solid color', () => {
            const width = 5;
            const height = 4;
            const data = new Uint8ClampedArray(width * height * 4);

            fillBackground(data, width, 0, height, 26, 26, 26);

            // Check first pixel
            expect(data[0]).toBe(26);
            expect(data[1]).toBe(26);
            expect(data[2]).toBe(26);
            expect(data[3]).toBe(255);

            // Check last pixel
            const last = (width * height - 1) * 4;
            expect(data[last]).toBe(26);
            expect(data[last + 3]).toBe(255);
        });

        it('should only fill specified Y range', () => {
            const width = 5;
            const height = 6;
            const data = new Uint8ClampedArray(width * height * 4);
            data.fill(0);

            fillBackground(data, width, 2, 4, 100, 100, 100);

            // Row 0 should be untouched
            expect(data[0]).toBe(0);
            // Row 2 should be filled
            const row2Start = 2 * width * 4;
            expect(data[row2Start]).toBe(100);
            // Row 4 should be untouched
            const row4Start = 4 * width * 4;
            expect(data[row4Start]).toBe(0);
        });
    });
});
