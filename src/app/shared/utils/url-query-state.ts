import { DestroyRef, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DebouncedCallback } from './debounce-callback';

export type QueryValue = string | number | boolean | null | undefined;

export const URL_QUERY_WRITE_DELAY_MS = 300;

export class UrlQueryState {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly location = inject(Location);
    private readonly write = new DebouncedCallback(URL_QUERY_WRITE_DELAY_MS);
    private readonly defaults = new Map<string, string>();
    private current: Params = { ...this.route.snapshot.queryParams };

    constructor() {
        inject(DestroyRef).onDestroy(() => this.write.cancel());
    }

    string(key: string, fallback = ''): string {
        this.defaults.set(key, fallback);
        return this.raw(key) ?? fallback;
    }

    number(key: string, fallback: number): number {
        this.defaults.set(key, String(fallback));
        const value = Number(this.raw(key));
        return this.raw(key) !== null && Number.isFinite(value) ? value : fallback;
    }

    flag(key: string): boolean {
        this.defaults.set(key, 'false');
        return this.raw(key) === 'true';
    }

    oneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
        const value = this.string(key, fallback);
        return allowed.includes(value as T) ? (value as T) : fallback;
    }

    list(key: string): string[] {
        this.defaults.set(key, '');
        return (this.raw(key) ?? '').split(',').filter(Boolean);
    }

    set(values: Record<string, QueryValue | readonly string[]>) {
        for (const [key, value] of Object.entries(values)) {
            const text = Array.isArray(value) ? value.join(',') : value === null || value === undefined ? '' : String(value);
            if (text === '' || text === this.defaults.get(key)) {
                delete this.current[key];
            } else {
                this.current[key] = text;
            }
        }
        this.write.schedule(() => this.flush());
    }

    private raw(key: string): string | null {
        return this.route.snapshot.queryParamMap.get(key);
    }

    private flush() {
        const tree = this.router.createUrlTree([], { relativeTo: this.route, queryParams: this.current });
        this.location.replaceState(this.router.serializeUrl(tree), '', this.location.getState());
    }
}
