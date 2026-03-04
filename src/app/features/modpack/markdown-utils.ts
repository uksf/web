import { marked } from 'marked';

/**
 * Synchronous markdown parser using marked directly with async: false.
 *
 * All links are post-processed to open in new tabs with nofollow.
 */
export function parseMarkdownSync(markdown: string): string {
    const result = marked.parse(markdown, { async: false });
    return result.replace(/<a /g, '<a target="_blank" rel="nofollow" ');
}
