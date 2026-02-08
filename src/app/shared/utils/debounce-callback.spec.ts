import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DebouncedCallback } from './debounce-callback';

describe('DebouncedCallback', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should invoke callback after default delay', () => {
        const debounced = new DebouncedCallback();
        const callback = vi.fn();

        debounced.schedule(callback);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(500);
        expect(callback).toHaveBeenCalledOnce();
    });

    it('should invoke callback after custom delay', () => {
        const debounced = new DebouncedCallback(100);
        const callback = vi.fn();

        debounced.schedule(callback);

        vi.advanceTimersByTime(99);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledOnce();
    });

    it('should cancel previous invocation when schedule is called again', () => {
        const debounced = new DebouncedCallback(200);
        const firstCallback = vi.fn();
        const secondCallback = vi.fn();

        debounced.schedule(firstCallback);
        vi.advanceTimersByTime(150);
        debounced.schedule(secondCallback);

        vi.advanceTimersByTime(200);
        expect(firstCallback).not.toHaveBeenCalled();
        expect(secondCallback).toHaveBeenCalledOnce();
    });

    it('should not invoke callback after cancel', () => {
        const debounced = new DebouncedCallback();
        const callback = vi.fn();

        debounced.schedule(callback);
        debounced.cancel();

        vi.advanceTimersByTime(1000);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should handle cancel when nothing is scheduled', () => {
        const debounced = new DebouncedCallback();
        // Should not throw
        debounced.cancel();
    });

    it('should handle multiple schedule calls, only running the last one', () => {
        const debounced = new DebouncedCallback(100);
        const callbacks = [vi.fn(), vi.fn(), vi.fn()];

        debounced.schedule(callbacks[0]);
        debounced.schedule(callbacks[1]);
        debounced.schedule(callbacks[2]);

        vi.advanceTimersByTime(100);

        expect(callbacks[0]).not.toHaveBeenCalled();
        expect(callbacks[1]).not.toHaveBeenCalled();
        expect(callbacks[2]).toHaveBeenCalledOnce();
    });

    it('should allow scheduling again after callback fires', () => {
        const debounced = new DebouncedCallback(100);
        const firstCallback = vi.fn();
        const secondCallback = vi.fn();

        debounced.schedule(firstCallback);
        vi.advanceTimersByTime(100);
        expect(firstCallback).toHaveBeenCalledOnce();

        debounced.schedule(secondCallback);
        vi.advanceTimersByTime(100);
        expect(secondCallback).toHaveBeenCalledOnce();
    });

    it('should allow scheduling again after cancel', () => {
        const debounced = new DebouncedCallback(100);
        const callback = vi.fn();

        debounced.schedule(vi.fn());
        debounced.cancel();

        debounced.schedule(callback);
        vi.advanceTimersByTime(100);
        expect(callback).toHaveBeenCalledOnce();
    });
});
