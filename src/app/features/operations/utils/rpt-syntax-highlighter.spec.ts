import { describe, it, expect } from 'vitest';
import { highlightRptLine, RPT_COLORS, classifyRptLine } from './rpt-syntax-highlighter';

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

describe('RPT_COLORS', () => {
    it('should export color constants for all syntax classes', () => {
        expect(RPT_COLORS.timestamp).toBe('#6a737d');
        expect(RPT_COLORS.error).toBe('#f97583');
        expect(RPT_COLORS.warning).toBe('#ffab70');
        expect(RPT_COLORS.info).toBe('#85e89d');
        expect(RPT_COLORS.modTag).toBe('#79b8ff');
        expect(RPT_COLORS.modComponent).toBe('#b392f0');
        expect(RPT_COLORS.string).toBe('#9ecbff');
        expect(RPT_COLORS.noise).toBe('#6a737d');
        expect(RPT_COLORS.separator).toBe('#6a737d');
        expect(RPT_COLORS.mission).toBe('#85e89d');
        expect(RPT_COLORS.defaultText).toBe('#d4d4d4');
        expect(RPT_COLORS.search).toBe('rgba(255, 200, 0, 0.5)');
        expect(RPT_COLORS.searchActive).toBe('rgba(255, 200, 0, 0.9)');
    });
});

describe('classifyRptLine', () => {
    it('should classify a noise line', () => {
        const result = classifyRptLine('Skipped loading of addon my_addon');
        expect(result).toEqual([{ color: '#6a737d', start: 0, end: 1 }]);
    });

    it('should classify a separator line', () => {
        const result = classifyRptLine('========================================');
        expect(result).toEqual([{ color: '#6a737d', start: 0, end: 1 }]);
    });

    it('should classify an error line', () => {
        const result = classifyRptLine('Error in expression <something>');
        expect(result).toEqual([{ color: '#f97583', start: 0, end: 1 }]);
    });

    it('should classify a mission line', () => {
        const result = classifyRptLine('Mission file: co40_uksf_op.Altis');
        expect(result).toEqual([{ color: '#85e89d', start: 0, end: 1 }]);
    });

    it('should classify a plain line as default text', () => {
        const result = classifyRptLine('just a plain log line');
        expect(result).toEqual([{ color: '#d4d4d4', start: 0, end: 1 }]);
    });

    it('should classify a timestamp line with segments', () => {
        const result = classifyRptLine('12:34:56 Some log message');
        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result[0]).toEqual({ color: '#6a737d', start: 0, end: expect.closeTo(8 / 25, 1) });
    });

    it('should classify ERROR keyword', () => {
        const result = classifyRptLine('12:00:00 ERROR something failed');
        const errorSegment = result.find(s => s.color === '#f97583');
        expect(errorSegment).toBeDefined();
    });

    it('should classify mod tag with component', () => {
        const result = classifyRptLine('[ACE] (medical) Initialized');
        const tagSegment = result.find(s => s.color === '#79b8ff');
        const compSegment = result.find(s => s.color === '#b392f0');
        expect(tagSegment).toBeDefined();
        expect(compSegment).toBeDefined();
    });

    it('should classify quoted strings', () => {
        const result = classifyRptLine('Loading file "config.bin" from disk');
        const stringSegment = result.find(s => s.color === '#9ecbff');
        expect(stringSegment).toBeDefined();
    });

    it('should return empty array for empty line', () => {
        const result = classifyRptLine('');
        expect(result).toEqual([]);
    });
});
