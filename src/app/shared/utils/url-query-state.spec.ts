import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, convertToParamMap, Params, Router } from '@angular/router';
import { UrlQueryState } from './url-query-state';

describe('UrlQueryState', () => {
    let replaceState: ReturnType<typeof vi.fn>;
    let injector: Injector & { destroy: () => void };

    const create = (query: Params) => {
        replaceState = vi.fn();
        const router = {
            createUrlTree: (_: unknown[], extras: { queryParams: Params }) => extras.queryParams,
            serializeUrl: (queryParams: Params) => '/page?' + new URLSearchParams(queryParams).toString()
        };
        injector = Injector.create({
            providers: [
                { provide: Router, useValue: router },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParams: query, queryParamMap: convertToParamMap(query) } } },
                { provide: Location, useValue: { replaceState, getState: () => ({ navigationId: 3 }) } }
            ]
        }) as Injector & { destroy: () => void };
        return runInInjectionContext(injector, () => new UrlQueryState());
    };

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('reads typed values and falls back for missing or invalid ones', () => {
        const state = create({ filter: 'smith', page: '2', group: 'true', size: 'abc', levels: 'INFO,ERROR', sort: 'bogus' });

        expect(state.string('filter')).toBe('smith');
        expect(state.number('page', 0)).toBe(2);
        expect(state.number('size', 15)).toBe(15);
        expect(state.flag('group')).toBe(true);
        expect(state.list('levels')).toEqual(['INFO', 'ERROR']);
        expect(state.oneOf('sort', ['name', 'rank'], 'name')).toBe('name');
    });

    it('writes once after typing stops and replaces the history entry', () => {
        const state = create({ tab: 'x' });
        state.string('filter');

        state.set({ filter: 's' });
        state.set({ filter: 'sm' });
        vi.advanceTimersByTime(299);
        expect(replaceState).not.toHaveBeenCalled();

        state.set({ filter: 'smi' });
        vi.advanceTimersByTime(300);
        expect(replaceState).toHaveBeenCalledTimes(1);
        expect(replaceState).toHaveBeenCalledWith('/page?tab=x&filter=smi', '', { navigationId: 3 });
    });

    it('drops values that equal their default so the URL stays short', () => {
        const state = create({ filter: 'smith', page: '2' });
        state.string('filter');
        state.number('page', 0);
        state.number('size', 15);

        state.set({ filter: '', page: 0, size: 15 });
        vi.advanceTimersByTime(300);

        expect(replaceState).toHaveBeenCalledWith('/page?', '', { navigationId: 3 });
    });

    it('does not write after the component is destroyed', () => {
        const state = create({});

        state.set({ filter: 'smith' });
        injector.destroy();
        vi.advanceTimersByTime(1000);

        expect(replaceState).not.toHaveBeenCalled();
    });
});
