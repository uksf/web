import { describe, it, expect } from 'vitest';
import { highlightRptLine, RPT_COLORS, classifyRptLine, extractRptTags, type RptLogLevel } from './rpt-syntax-highlighter';

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

    it('highlights Error keyword in timestamped lines', () => {
        const result = highlightRptLine("13:35:25 Error: Bone lip_lwrf doesn't exist in skeleton OFP2_ManSkeleton");
        expect(result).toContain('<span class="rpt-error">Error</span>');
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

    it('highlights TRACE keyword with distinct class', () => {
        const result = highlightRptLine('12:00:00 TRACE some details');
        expect(result).toContain('<span class="rpt-trace">TRACE</span>');
    });
});

describe('RPT_COLORS', () => {
    it('should export color constants for all syntax classes', () => {
        expect(RPT_COLORS.timestamp).toBe('#6a737d');
        expect(RPT_COLORS.error).toBe('#f97583');
        expect(RPT_COLORS.warning).toBe('#ffab70');
        expect(RPT_COLORS.info).toBe('#85e89d');
        expect(RPT_COLORS.trace).toBe('#56d6db');
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
        expect(result).toEqual([{ color: '#6a737d', cssClass: 'rpt-noise', start: 0, end: 1 }]);
    });

    it('should classify a separator line', () => {
        const result = classifyRptLine('========================================');
        expect(result).toEqual([{ color: '#6a737d', cssClass: 'rpt-separator', start: 0, end: 1 }]);
    });

    it('should classify an error line', () => {
        const result = classifyRptLine('Error in expression <something>');
        expect(result).toEqual([{ color: '#f97583', cssClass: 'rpt-error', start: 0, end: 1 }]);
    });

    it('should classify Error: as inline keyword in timestamped line', () => {
        const result = classifyRptLine("13:35:25 Error: Bone lip_lwrf doesn't exist in skeleton OFP2_ManSkeleton");
        const errorSeg = result.find(s => s.cssClass === 'rpt-error');
        expect(errorSeg).toBeDefined();
        expect(errorSeg!.start).toBeGreaterThan(0);
    });

    it('should classify a mission line', () => {
        const result = classifyRptLine('Mission file: co40_uksf_op.Altis');
        expect(result).toEqual([{ color: '#85e89d', cssClass: 'rpt-mission', start: 0, end: 1 }]);
    });

    it('should classify a plain line as default text', () => {
        const result = classifyRptLine('just a plain log line');
        expect(result).toEqual([{ color: '#d4d4d4', cssClass: '', start: 0, end: 1 }]);
    });

    it('should classify a timestamp line with segments', () => {
        const result = classifyRptLine('12:34:56 Some log message');
        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result[0]).toEqual({ color: '#6a737d', cssClass: 'rpt-timestamp', start: 0, end: expect.closeTo(8 / 25, 1) });
    });

    it('should classify ERROR keyword', () => {
        const result = classifyRptLine('12:00:00 ERROR something failed');
        const errorSegment = result.find(s => s.cssClass === 'rpt-error');
        expect(errorSegment).toBeDefined();
    });

    it('should classify mod tag with component', () => {
        const result = classifyRptLine('[ACE] (medical) Initialized');
        const tagSegment = result.find(s => s.cssClass === 'rpt-mod-tag');
        const compSegment = result.find(s => s.cssClass === 'rpt-mod-component');
        expect(tagSegment).toBeDefined();
        expect(compSegment).toBeDefined();
    });

    it('should classify quoted strings', () => {
        const result = classifyRptLine('Loading file "config.bin" from disk');
        const stringSegment = result.find(s => s.cssClass === 'rpt-string');
        expect(stringSegment).toBeDefined();
    });

    it('should return empty array for empty line', () => {
        const result = classifyRptLine('');
        expect(result).toEqual([]);
    });
});

describe('extractRptTags', () => {
    it('returns empty arrays for empty line', () => {
        expect(extractRptTags('')).toEqual({ mods: [], components: [], level: null });
    });

    it('extracts paired mod tag + component', () => {
        const tags = extractRptTags('12:34:56 [UKSF] (statistics) Player killed');
        expect(tags.mods).toEqual(['UKSF']);
        expect(tags.components).toEqual(['statistics']);
    });

    it('ignores standalone mod tag with no component (avoids false positives)', () => {
        const tags = extractRptTags('[CBA] Loading config');
        expect(tags.mods).toEqual([]);
        expect(tags.components).toEqual([]);
    });

    it('ignores standalone component without preceding mod', () => {
        const tags = extractRptTags('(api) server started');
        expect(tags.mods).toEqual([]);
        expect(tags.components).toEqual([]);
    });

    it('ignores unrelated square brackets like version tags', () => {
        const tags = extractRptTags('Allocator: tbb4malloc_bi_x64.dll [2017.0.0.0] [2017.0.0.0]');
        expect(tags.mods).toEqual([]);
        expect(tags.components).toEqual([]);
    });

    it('ignores numeric-only parens', () => {
        const tags = extractRptTags('Frame rate drop (5) seconds');
        expect(tags.components).toEqual([]);
    });

    it('extracts multiple pairs, deduped in order', () => {
        const tags = extractRptTags('[ACE] (medical) done, [UKSF] (api) init, [ACE] (medical) again');
        expect(tags.mods).toEqual(['ACE', 'UKSF']);
        expect(tags.components).toEqual(['medical', 'api']);
    });

    it('allows whitespace between mod and component', () => {
        const tags = extractRptTags('[UKSF]   (garage) spawning');
        expect(tags.mods).toEqual(['UKSF']);
        expect(tags.components).toEqual(['garage']);
    });

    it('ignores mod followed by non-component paren', () => {
        // `[UKSF] (5)` is not the canonical pattern — (5) isn't a real component
        const tags = extractRptTags('[UKSF] (5) count');
        expect(tags.mods).toEqual([]);
        expect(tags.components).toEqual([]);
    });

    it('classifies error level from Error prefix', () => {
        expect(extractRptTags('Error in expression').level).toBe('error');
    });

    it('classifies error level from ERROR keyword', () => {
        expect(extractRptTags('12:00:00 ERROR something failed').level).toBe('error');
    });

    it('classifies error level from Error keyword', () => {
        expect(extractRptTags('12:00:00 Error: something broke').level).toBe('error');
    });

    it('classifies warning level from WARNING keyword', () => {
        expect(extractRptTags('12:00:00 WARNING something happened').level).toBe('warning');
    });

    it('classifies warning level from Warning keyword', () => {
        expect(extractRptTags('Warning message here').level).toBe('warning');
    });

    it('classifies info level from INFO keyword', () => {
        expect(extractRptTags('12:00:00 INFO server started').level).toBe('info');
    });

    it('classifies trace level from TRACE keyword', () => {
        expect(extractRptTags('12:00:00 TRACE some details').level).toBe('trace');
    });

    it('returns null level for plain lines', () => {
        expect(extractRptTags('just a plain log line').level).toBeNull();
    });

    it('returns null level for noise lines', () => {
        expect(extractRptTags('Skipped loading of addon some_addon').level).toBeNull();
    });
});
