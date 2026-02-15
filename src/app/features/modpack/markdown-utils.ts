import { MarkdownService } from 'ngx-markdown';

/**
 * Synchronous wrapper around MarkdownService.parse().
 *
 * In ngx-markdown 17+, parse() returns `string | Promise<string>`.
 * It only returns a Promise when async plugins (mermaid, katex, etc.)
 * are configured. Since we don't use any, the result is always a string.
 * This wrapper asserts that at runtime, failing fast if a future upgrade
 * introduces async behaviour unexpectedly.
 */
export function parseMarkdownSync(service: MarkdownService, markdown: string): string {
    const result = service.parse(markdown);
    if (typeof result !== 'string') {
        throw new Error('MarkdownService.parse() returned a Promise — async markdown plugins are not supported');
    }
    return result;
}
