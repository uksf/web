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
