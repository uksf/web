/**
 * Creates a debounced callback manager. Calls to `schedule()` will cancel any
 * pending invocation and schedule a new one after `delayMs` milliseconds.
 *
 * Call `cancel()` in ngOnDestroy to clear any pending timeout.
 */
export class DebouncedCallback {
    private timeoutId: ReturnType<typeof setTimeout> | null = null;

    constructor(private readonly delayMs: number = 500) {}

    schedule(callback: () => void): void {
        this.cancel();
        this.timeoutId = setTimeout(callback, this.delayMs);
    }

    cancel(): void {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}
