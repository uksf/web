import { describe, it, expect } from 'vitest';
import { mapBorderColour, capitaliseMapName } from './map-colour';

describe('mapBorderColour', () => {
    it('returns hex for known maps', () => {
        expect(mapBorderColour('Altis')).toMatch(/^#[0-9a-f]{6}$/i);
        expect(mapBorderColour('Tanoa')).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('returns hsl for unknown maps', () => {
        expect(mapBorderColour('SomeUnknownMap')).toMatch(/^hsl\(\d+, 65%, 55%\)$/);
    });

    it('is case-insensitive', () => {
        expect(mapBorderColour('Altis')).toBe(mapBorderColour('altis'));
        expect(mapBorderColour('TANOA')).toBe(mapBorderColour('tanoa'));
    });

    it('returns different colours for different maps', () => {
        expect(mapBorderColour('Altis')).not.toBe(mapBorderColour('Stratis'));
    });

    it('returns neutral colour for empty string', () => {
        expect(mapBorderColour('')).toBe('hsl(0, 0%, 50%)');
    });
});

describe('capitaliseMapName', () => {
    it('capitalises first letter of a lowercase name', () => {
        expect(capitaliseMapName('altis')).toBe('Altis');
    });

    it('preserves already capitalised names', () => {
        expect(capitaliseMapName('Tanoa')).toBe('Tanoa');
    });

    it('handles all-caps by lowering then capitalising', () => {
        expect(capitaliseMapName('STRATIS')).toBe('Stratis');
    });

    it('handles empty string', () => {
        expect(capitaliseMapName('')).toBe('');
    });

    it('handles multi-word map names', () => {
        expect(capitaliseMapName('proving grounds')).toBe('Proving grounds');
    });
});
