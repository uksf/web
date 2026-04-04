/**
 * Preserves native text selection across virtual scroll DOM mutations.
 *
 * Modelled after Chrome DevTools' ConsoleViewport: before the virtual scroll
 * recycler adds/removes DOM nodes, we snapshot the native Selection as logical
 * view-line indices. After the DOM settles, we restore the Selection —
 * clamping to invisible gap elements when the original nodes are gone.
 *
 * Gap elements contain a \uFEFF (zero-width no-break space) so the browser
 * has a text node to anchor the selection to.
 */

const GAP_CHAR = '\uFEFF';

interface SelectionEndpoint {
    /** Index into the viewLineEntries array */
    viewLineIndex: number;
    /** The DOM node the selection was anchored to */
    node: Node;
    /** Offset within that node */
    offset: number;
    /** Character offset within the full line text */
    charOffset: number;
}

interface SavedSelection {
    anchor: SelectionEndpoint;
    focus: SelectionEndpoint;
}

export class VirtualScrollSelection {
    private savedSelection: SavedSelection | null = null;
    private mutationObserver: MutationObserver | null = null;
    private topGap: HTMLElement | null = null;
    private bottomGap: HTMLElement | null = null;
    private contentWrapper: HTMLElement | null = null;
    private viewportEl: HTMLElement | null = null;
    private isRestoring = false;

    attach(viewportEl: HTMLElement): void {
        this.viewportEl = viewportEl;

        if (typeof viewportEl.querySelector !== 'function') return;
        this.contentWrapper = viewportEl.querySelector('.cdk-virtual-scroll-content-wrapper') as HTMLElement;
        if (!this.contentWrapper) return;

        this.topGap = document.createElement('div');
        this.topGap.className = 'selection-gap selection-gap-top';
        this.topGap.textContent = GAP_CHAR;

        this.bottomGap = document.createElement('div');
        this.bottomGap.className = 'selection-gap selection-gap-bottom';
        this.bottomGap.textContent = GAP_CHAR;

        this.contentWrapper.prepend(this.topGap);
        this.contentWrapper.append(this.bottomGap);

        this.mutationObserver = new MutationObserver(() => this.onDomMutated());
        this.mutationObserver.observe(this.contentWrapper, { childList: true });

        viewportEl.addEventListener('mousedown', this.onMouseDown);

        if (typeof document.addEventListener === 'function') {
            document.addEventListener('selectionchange', this.onSelectionChange);
        }
    }

    detach(): void {
        this.mutationObserver?.disconnect();
        this.mutationObserver = null;
        this.topGap?.remove();
        this.bottomGap?.remove();
        this.topGap = null;
        this.bottomGap = null;
        this.viewportEl?.removeEventListener('mousedown', this.onMouseDown);
        if (typeof document.removeEventListener === 'function') {
            document.removeEventListener('selectionchange', this.onSelectionChange);
        }
        this.viewportEl = null;
        this.contentWrapper = null;
        this.savedSelection = null;
    }

    /** Returns the saved anchor/focus view-line indices and char offsets, or null if no selection */
    getSelectionRange(): { anchor: { viewLineIndex: number; charOffset: number }; focus: { viewLineIndex: number; charOffset: number } } | null {
        if (!this.savedSelection) return null;
        return {
            anchor: { viewLineIndex: this.savedSelection.anchor.viewLineIndex, charOffset: this.savedSelection.anchor.charOffset },
            focus: { viewLineIndex: this.savedSelection.focus.viewLineIndex, charOffset: this.savedSelection.focus.charOffset }
        };
    }

    /** Call before any programmatic data change that will cause CDK to re-render */
    saveBeforeUpdate(): void {
        this.updateSavedSelection();
    }

    /** User clicked — clear stale selection so it doesn't resurrect on scroll. */
    private onMouseDown = (): void => {
        this.savedSelection = null;
    };

    /**
     * Track selection changes continuously. This fires as the user drags to
     * select, keeping savedSelection up-to-date BEFORE any scroll event can
     * trigger CDK recycling. Solves the race where CDK's scroll handler runs
     * before ours and collapses the native selection.
     */
    private onSelectionChange = (): void => {
        if (this.isRestoring) return;
        this.updateSavedSelection();
    };

    private onDomMutated(): void {
        if (!this.savedSelection) return;
        this.restoreSelection(this.savedSelection);
    }

    /**
     * Capture the current native selection. If an endpoint is in a gap element
     * (because we previously clamped it there), keep the saved logical position.
     */
    private updateSavedSelection(): void {
        if (typeof document.getSelection !== 'function') return;
        const selection = document.getSelection();
        if (!selection || selection.isCollapsed || !selection.anchorNode || !selection.focusNode) {
            // Don't null savedSelection — CDK may have recycled DOM nodes during this
            // scroll event (its handler can run before ours), collapsing the native
            // selection. The previously saved logical positions are still valid.
            return;
        }

        if (!this.viewportEl) return;
        if (!this.viewportEl.contains(selection.anchorNode) && !this.viewportEl.contains(selection.focusNode)) {
            return;
        }

        const anchor = this.resolveEndpoint(selection.anchorNode, selection.anchorOffset);
        const focus = this.resolveEndpoint(selection.focusNode, selection.focusOffset);

        // If both are in gaps or unresolvable, keep previous saved selection
        if (!anchor && !focus) return;

        this.savedSelection = {
            anchor: anchor ?? this.savedSelection?.anchor ?? { viewLineIndex: 0, node: selection.anchorNode, offset: 0, charOffset: 0 },
            focus: focus ?? this.savedSelection?.focus ?? { viewLineIndex: 0, node: selection.focusNode, offset: 0, charOffset: 0 }
        };
    }

    private resolveEndpoint(node: Node, offset: number): SelectionEndpoint | null {
        // If in a gap element, return null to keep the previous saved position
        if (this.topGap?.contains(node) || this.bottomGap?.contains(node)) {
            return null;
        }

        const el = node instanceof Element ? node : node.parentElement;
        const logLineEl = el?.closest?.('.log-line[data-view-index]');
        if (!logLineEl) return null;

        const viewLineIndex = parseInt(logLineEl.getAttribute('data-view-index')!, 10);
        const charOffset = this.computeCharOffset(logLineEl, node, offset);
        return { viewLineIndex, node, offset, charOffset };
    }

    /**
     * Compute the character offset within the full line text by using a Range.
     * This handles all node types correctly: Text nodes (offset = char position)
     * and Element nodes (offset = child index).
     */
    private computeCharOffset(logLineEl: Element, targetNode: Node, targetOffset: number): number {
        const contentEl = logLineEl.querySelector('.line-content');
        if (!contentEl) return 0;
        try {
            const range = document.createRange();
            range.selectNodeContents(contentEl);
            range.setEnd(targetNode, targetOffset);
            return range.toString().length;
        } catch {
            return 0;
        }
    }

    private restoreSelection(saved: SavedSelection): void {
        if (typeof document.getSelection !== 'function') return;
        const selection = document.getSelection();
        if (!selection) return;

        const anchorResolved = this.resolveForRestore(saved.anchor);
        const focusResolved = this.resolveForRestore(saved.focus);
        if (!anchorResolved || !focusResolved) return;

        this.isRestoring = true;
        try {
            selection.setBaseAndExtent(
                anchorResolved.node, anchorResolved.offset,
                focusResolved.node, focusResolved.offset
            );
        } catch {
            // Node may have been removed between capture and restore
        }
        // Clear after a macrotask so the selectionchange event (fired async)
        // from our setBaseAndExtent is suppressed.
        setTimeout(() => { this.isRestoring = false; });
    }

    private resolveForRestore(endpoint: SelectionEndpoint): { node: Node; offset: number } | null {
        // Check the node is still connected AND still inside the correct view-line
        // element. CDK recycles DOM elements for different items, so a connected node
        // might now represent a completely different line.
        if (endpoint.node.isConnected) {
            const el = endpoint.node instanceof Element ? endpoint.node : endpoint.node.parentElement;
            const logLineEl = el?.closest?.('.log-line[data-view-index]');
            if (logLineEl && parseInt(logLineEl.getAttribute('data-view-index')!, 10) === endpoint.viewLineIndex) {
                return { node: endpoint.node, offset: endpoint.offset };
            }
        }

        if (!this.contentWrapper) return null;

        // Node was removed — try to find the re-rendered element by view-line index
        const logLineEl = this.contentWrapper.querySelector(
            `.log-line[data-view-index="${endpoint.viewLineIndex}"]`
        );
        if (logLineEl) {
            // Restore character-precise position within the re-rendered element
            const restored = this.findPositionAtCharOffset(logLineEl, endpoint.charOffset);
            if (restored) return restored;

            // Fallback to first text node if char offset resolution fails
            const textNode = this.findFirstTextNode(logLineEl);
            if (textNode) {
                return { node: textNode, offset: 0 };
            }
        }

        // Element not rendered — clamp to the appropriate gap
        const renderedIndices = this.getRenderedIndexRange();
        const gapEl = (renderedIndices && endpoint.viewLineIndex < renderedIndices.first)
            ? this.topGap
            : this.bottomGap;

        if (gapEl?.firstChild) {
            const offset = gapEl === this.topGap ? 1 : 0;
            return { node: gapEl.firstChild, offset };
        }

        return null;
    }

    private findPositionAtCharOffset(logLineEl: Element, charOffset: number): { node: Node; offset: number } | null {
        const contentEl = logLineEl.querySelector('.line-content');
        if (!contentEl) return null;

        const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT);
        let remaining = charOffset;
        let node: Node | null;
        while ((node = walker.nextNode())) {
            const len = node.textContent?.length ?? 0;
            if (remaining <= len) {
                return { node, offset: remaining };
            }
            remaining -= len;
        }

        // charOffset past end — clamp to last text node
        const lastNode = this.findLastTextNode(contentEl);
        if (lastNode) {
            return { node: lastNode, offset: lastNode.textContent?.length ?? 0 };
        }
        return null;
    }

    private findLastTextNode(el: Element): Text | null {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let last: Text | null = null;
        let node: Node | null;
        while ((node = walker.nextNode())) {
            last = node as Text;
        }
        return last;
    }

    private getRenderedIndexRange(): { first: number; last: number } | null {
        if (!this.contentWrapper) return null;
        const all = this.contentWrapper.querySelectorAll('.log-line[data-view-index]');
        if (!all.length) return null;
        return {
            first: parseInt(all[0].getAttribute('data-view-index')!, 10),
            last: parseInt(all[all.length - 1].getAttribute('data-view-index')!, 10)
        };
    }

    private findFirstTextNode(el: Element): Text | null {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        return walker.nextNode() as Text | null;
    }
}
