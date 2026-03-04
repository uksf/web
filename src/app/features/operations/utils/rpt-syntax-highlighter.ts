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
    start: number; // 0..1 proportion of line length
    end: number;   // 0..1 proportion of line length
}

export function classifyRptLine(line: string): RptColorSegment[] {
    if (!line.length) return [];
    const len = line.length;

    // Full-line patterns
    if (line.includes('Skipped loading of addon') || line.includes('Updating base class')) {
        return [{ color: RPT_COLORS.noise, start: 0, end: 1 }];
    }
    if (/^====/.test(line) || /^----/.test(line)) {
        return [{ color: RPT_COLORS.separator, start: 0, end: 1 }];
    }
    if (line.includes('Error in expression') || line.includes('Error position:') || /Error \w+:/.test(line)) {
        return [{ color: RPT_COLORS.error, start: 0, end: 1 }];
    }
    if (line.includes('Mission file:') || line.includes('Mission world:') || line.includes('Mission id:')) {
        return [{ color: RPT_COLORS.mission, start: 0, end: 1 }];
    }

    // Inline patterns — collect segments
    const segments: RptColorSegment[] = [];
    let hasInlineMatch = false;

    // Timestamp at start
    const tsMatch = line.match(/^(\d{2}:\d{2}:\d{2})/);
    if (tsMatch) {
        segments.push({ color: RPT_COLORS.timestamp, start: 0, end: tsMatch[1].length / len });
        hasInlineMatch = true;
    }

    // Mod tag + component: [ACE] (medical)
    const tagCompRegex = /\[(\w+)\]\s*\((\w+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = tagCompRegex.exec(line)) !== null) {
        const tagStart = m.index;
        const tagName = m[1];
        const compName = m[2];
        segments.push({ color: RPT_COLORS.modTag, start: tagStart / len, end: (tagStart + tagName.length + 2) / len });
        const compStart = m.index + m[0].indexOf('(' + compName + ')');
        segments.push({ color: RPT_COLORS.modComponent, start: compStart / len, end: (compStart + compName.length + 2) / len });
        hasInlineMatch = true;
    }

    // Standalone mod tags (not already matched as tag+component)
    const tagRegex = /\[(\w+)\]/g;
    while ((m = tagRegex.exec(line)) !== null) {
        const alreadyMatched = segments.some(s =>
            Math.abs(s.start - m!.index / len) < 0.001 && s.color === RPT_COLORS.modTag
        );
        if (!alreadyMatched) {
            segments.push({ color: RPT_COLORS.modTag, start: m.index / len, end: (m.index + m[0].length) / len });
            hasInlineMatch = true;
        }
    }

    // Keywords
    const keywords: Array<{ pattern: RegExp; color: string }> = [
        { pattern: /\bERROR\b/g, color: RPT_COLORS.error },
        { pattern: /\bWARNING\b/g, color: RPT_COLORS.warning },
        { pattern: /\bWarning\b/g, color: RPT_COLORS.warning },
        { pattern: /\bINFO\b/g, color: RPT_COLORS.info }
    ];
    for (const kw of keywords) {
        while ((m = kw.pattern.exec(line)) !== null) {
            segments.push({ color: kw.color, start: m.index / len, end: (m.index + m[0].length) / len });
            hasInlineMatch = true;
        }
    }

    // Quoted strings
    const strRegex = /"[^"]*"/g;
    while ((m = strRegex.exec(line)) !== null) {
        segments.push({ color: RPT_COLORS.string, start: m.index / len, end: (m.index + m[0].length) / len });
        hasInlineMatch = true;
    }

    if (!hasInlineMatch) {
        return [{ color: RPT_COLORS.defaultText, start: 0, end: 1 }];
    }

    // Fill gaps with default text
    segments.sort((a, b) => a.start - b.start);
    const filled: RptColorSegment[] = [];
    let cursor = 0;
    for (const seg of segments) {
        if (seg.start > cursor + 0.001) {
            filled.push({ color: RPT_COLORS.defaultText, start: cursor, end: seg.start });
        }
        filled.push(seg);
        cursor = Math.max(cursor, seg.end);
    }
    if (cursor < 0.999) {
        filled.push({ color: RPT_COLORS.defaultText, start: cursor, end: 1 });
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

function wrapLine(className: string, content: string): string {
    return `<span class="${className}">${content}</span>`;
}

export function highlightRptLine(line: string): string {
    const escaped = escapeHtml(line);

    // Full-line patterns (return early)
    if (escaped.includes('Skipped loading of addon') || escaped.includes('Updating base class')) {
        return wrapLine('rpt-noise', escaped);
    }

    if (/^====/.test(escaped) || /^----/.test(escaped)) {
        return wrapLine('rpt-separator', escaped);
    }

    if (escaped.includes('Error in expression') || escaped.includes('Error position:') || /Error \w+:/.test(escaped)) {
        return wrapLine('rpt-error', escaped);
    }

    if (escaped.includes('Mission file:') || escaped.includes('Mission world:') || escaped.includes('Mission id:')) {
        return wrapLine('rpt-mission', escaped);
    }

    // Inline replacements
    let result = escaped;

    // Timestamp at start
    result = result.replace(/^(\d{2}:\d{2}:\d{2})/, '<span class="rpt-timestamp">$1</span>');

    // Mod tag + component: [ACE] (medical)
    // Use sentinel to prevent standalone regex from re-matching tags already handled
    const tagComponentPairs: string[] = [];
    result = result.replace(/\[(\w+)\]\s*\((\w+)\)/g, (_match, tag, component) => {
        const index = tagComponentPairs.length;
        tagComponentPairs.push(`<span class="rpt-mod-tag">[${tag}]</span> <span class="rpt-mod-component">(${component})</span>`);
        return `\x00TC${index}\x00`;
    });

    // Standalone mod tag: [ACE]
    result = result.replace(/\[(\w+)\]/g, '<span class="rpt-mod-tag">[$1]</span>');

    // Restore tag+component pairs
    for (let i = 0; i < tagComponentPairs.length; i++) {
        result = result.replace(`\x00TC${i}\x00`, tagComponentPairs[i]);
    }

    // Keywords
    result = result.replace(/\bERROR\b/g, '<span class="rpt-error">ERROR</span>');
    result = result.replace(/\bWARNING\b/g, '<span class="rpt-warning">WARNING</span>');
    result = result.replace(/\bWarning\b/g, '<span class="rpt-warning">Warning</span>');
    result = result.replace(/\bINFO\b/g, '<span class="rpt-info">INFO</span>');

    // Quoted strings (already HTML-escaped, so match &quot;)
    result = result.replace(/&quot;[^&]*&quot;/g, (match) => `<span class="rpt-string">${match}</span>`);

    return result;
}
