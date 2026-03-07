export const RPT_COLORS = {
    timestamp: '#6a737d',
    error: '#f97583',
    warning: '#ffab70',
    info: '#85e89d',
    modTag: '#79b8ff',
    modComponent: '#b392f0',
    string: '#9ecbff',
    noise: '#6a737d',
    separator: '#6a737d',
    mission: '#85e89d',
    defaultText: '#d4d4d4',
    search: 'rgba(255, 200, 0, 0.5)',
    searchActive: 'rgba(255, 200, 0, 0.9)'
} as const;

export interface RptColorSegment {
    color: string;
    cssClass: string; // CSS class name, empty for default text
    start: number;    // 0..1 proportion of line length
    end: number;      // 0..1 proportion of line length
}

function seg(cssClass: string, color: string, start: number, end: number): RptColorSegment {
    return { color, cssClass, start, end };
}

export function classifyRptLine(line: string): RptColorSegment[] {
    if (!line.length) return [];
    const len = line.length;

    // Full-line patterns
    if (line.includes('Skipped loading of addon') || line.includes('Updating base class')) {
        return [seg('rpt-noise', RPT_COLORS.noise, 0, 1)];
    }
    if (/^====/.test(line) || /^----/.test(line)) {
        return [seg('rpt-separator', RPT_COLORS.separator, 0, 1)];
    }
    if (line.includes('Error in expression') || line.includes('Error position:') || /Error \w+:/.test(line)) {
        return [seg('rpt-error', RPT_COLORS.error, 0, 1)];
    }
    if (line.includes('Mission file:') || line.includes('Mission world:') || line.includes('Mission id:')) {
        return [seg('rpt-mission', RPT_COLORS.mission, 0, 1)];
    }

    // Inline patterns — collect segments
    const segments: RptColorSegment[] = [];
    let hasInlineMatch = false;

    // Timestamp at start
    const tsMatch = line.match(/^(\d{2}:\d{2}:\d{2})/);
    if (tsMatch) {
        segments.push(seg('rpt-timestamp', RPT_COLORS.timestamp, 0, tsMatch[1].length / len));
        hasInlineMatch = true;
    }

    // Mod tag + component: [ACE] (medical)
    const tagCompRegex = /\[(\w+)\]\s*\((\w+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = tagCompRegex.exec(line)) !== null) {
        const tagStart = m.index;
        const tagName = m[1];
        const compName = m[2];
        segments.push(seg('rpt-mod-tag', RPT_COLORS.modTag, tagStart / len, (tagStart + tagName.length + 2) / len));
        const compStart = m.index + m[0].indexOf('(' + compName + ')');
        segments.push(seg('rpt-mod-component', RPT_COLORS.modComponent, compStart / len, (compStart + compName.length + 2) / len));
        hasInlineMatch = true;
    }

    // Standalone mod tags (not already matched as tag+component)
    const tagRegex = /\[(\w+)\]/g;
    while ((m = tagRegex.exec(line)) !== null) {
        const alreadyMatched = segments.some(s =>
            Math.abs(s.start - m!.index / len) < 0.001 && s.cssClass === 'rpt-mod-tag'
        );
        if (!alreadyMatched) {
            segments.push(seg('rpt-mod-tag', RPT_COLORS.modTag, m.index / len, (m.index + m[0].length) / len));
            hasInlineMatch = true;
        }
    }

    // Keywords
    const keywords: { pattern: RegExp; cssClass: string; color: string }[] = [
        { pattern: /\bERROR\b/g, cssClass: 'rpt-error', color: RPT_COLORS.error },
        { pattern: /\bWARNING\b/g, cssClass: 'rpt-warning', color: RPT_COLORS.warning },
        { pattern: /\bWarning\b/g, cssClass: 'rpt-warning', color: RPT_COLORS.warning },
        { pattern: /\bINFO\b/g, cssClass: 'rpt-info', color: RPT_COLORS.info }
    ];
    for (const kw of keywords) {
        while ((m = kw.pattern.exec(line)) !== null) {
            segments.push(seg(kw.cssClass, kw.color, m.index / len, (m.index + m[0].length) / len));
            hasInlineMatch = true;
        }
    }

    // Quoted strings
    const strRegex = /"[^"]*"/g;
    while ((m = strRegex.exec(line)) !== null) {
        segments.push(seg('rpt-string', RPT_COLORS.string, m.index / len, (m.index + m[0].length) / len));
        hasInlineMatch = true;
    }

    if (!hasInlineMatch) {
        return [seg('', RPT_COLORS.defaultText, 0, 1)];
    }

    // Fill gaps with default text
    segments.sort((a, b) => a.start - b.start);
    const filled: RptColorSegment[] = [];
    let cursor = 0;
    for (const s of segments) {
        if (s.start > cursor + 0.001) {
            filled.push(seg('', RPT_COLORS.defaultText, cursor, s.start));
        }
        filled.push(s);
        cursor = Math.max(cursor, s.end);
    }
    if (cursor < 0.999) {
        filled.push(seg('', RPT_COLORS.defaultText, cursor, 1));
    }
    return filled;
}

const ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
};

function escapeHtml(text: string): string {
    return text.replace(/[&<>"]/g, (char) => ESCAPE_MAP[char]);
}

export function highlightRptLine(line: string): string {
    if (!line.length) return '';
    const segments = classifyRptLine(line);
    const len = line.length;
    let result = '';
    for (const s of segments) {
        const start = Math.round(s.start * len);
        const end = Math.round(s.end * len);
        const text = escapeHtml(line.substring(start, end));
        if (s.cssClass) {
            result += `<span class="${s.cssClass}">${text}</span>`;
        } else {
            result += text;
        }
    }
    return result;
}
