import { describe, it, expect } from 'vitest';
import { highlightRptLine } from './rpt-syntax-highlighter';

describe('highlightRptLine', () => {
    it('highlights timestamp at start of line', () => {
        const result = highlightRptLine('12:34:56 Some log message');
        expect(result).toContain('<span class="rpt-timestamp">12:34:56</span>');
        expect(result).toContain('Some log message');
    });

    it('highlights error lines', () => {
        const result = highlightRptLine('Error in expression <something>');
        expect(result).toContain('<span class="rpt-error">');
        expect(result).toContain('&lt;something&gt;');
    });

    it('highlights Error with type prefix', () => {
        const result = highlightRptLine('Error compiling: some issue');
        expect(result).toContain('<span class="rpt-error">');
    });

    it('highlights Error position lines', () => {
        const result = highlightRptLine('Error position: <something>');
        expect(result).toContain('<span class="rpt-error">');
    });

    it('highlights warning lines', () => {
        const result = highlightRptLine('12:00:00 WARNING something happened');
        expect(result).toContain('<span class="rpt-warning">WARNING</span>');
    });

    it('highlights Warning (capitalized)', () => {
        const result = highlightRptLine('Warning message here');
        expect(result).toContain('<span class="rpt-warning">Warning</span>');
    });

    it('highlights mod tags with components', () => {
        const result = highlightRptLine('[ACE] (medical) Initialized');
        expect(result).toContain('<span class="rpt-mod-tag">[ACE]</span>');
        expect(result).toContain('<span class="rpt-mod-component">(medical)</span>');
    });

    it('highlights standalone mod tags', () => {
        const result = highlightRptLine('[CBA] Loading config');
        expect(result).toContain('<span class="rpt-mod-tag">[CBA]</span>');
    });

    it('does not double-wrap mod tags that have components', () => {
        const result = highlightRptLine('[ACE] (medical) test');
        // Should have exactly one [ACE] tag span, not two
        const tagMatches = result.match(/rpt-mod-tag/g);
        expect(tagMatches).toHaveLength(1);
    });

    it('highlights quoted strings', () => {
        const result = highlightRptLine('Loading file "config.bin" from disk');
        expect(result).toContain('<span class="rpt-string">&quot;config.bin&quot;</span>');
    });

    it('dims noise lines', () => {
        const skipped = highlightRptLine('Skipped loading of addon some_addon');
        expect(skipped).toMatch(/^<span class="rpt-noise">.*<\/span>$/);

        const updating = highlightRptLine('Updating base class SomeClass');
        expect(updating).toMatch(/^<span class="rpt-noise">.*<\/span>$/);
    });

    it('escapes HTML entities', () => {
        const result = highlightRptLine('Value <5 & >3 is "valid"');
        expect(result).toContain('&lt;5');
        expect(result).toContain('&amp;');
        expect(result).toContain('&gt;3');
    });

    it('handles mission lines', () => {
        const result = highlightRptLine('Mission file: co40_uksf_op.Altis');
        expect(result).toMatch(/^<span class="rpt-mission">.*<\/span>$/);
    });

    it('handles separator lines', () => {
        const equals = highlightRptLine('========================================');
        expect(equals).toMatch(/^<span class="rpt-separator">.*<\/span>$/);

        const dashes = highlightRptLine('----------------------------------------');
        expect(dashes).toMatch(/^<span class="rpt-separator">.*<\/span>$/);
    });

    it('handles lines with no special patterns', () => {
        const result = highlightRptLine('just a plain log line');
        expect(result).toBe('just a plain log line');
    });

    it('highlights INFO keyword', () => {
        const result = highlightRptLine('12:00:00 INFO server started');
        expect(result).toContain('<span class="rpt-info">INFO</span>');
    });

    it('highlights inline ERROR keyword', () => {
        const result = highlightRptLine('12:00:00 ERROR something failed');
        expect(result).toContain('<span class="rpt-error">ERROR</span>');
    });
});
