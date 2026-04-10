import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleChange } from '@angular/core';
import { PaginatorComponent, PagedEvent } from './paginator.component';

describe('PaginatorComponent', () => {
    let component: PaginatorComponent;
    let emittedEvents: PagedEvent[];

    beforeEach(() => {
        component = new PaginatorComponent();
        emittedEvents = [];
        component.page.subscribe((event: PagedEvent) => emittedEvents.push(event));
    });

    it('should initialize with default values', () => {
        expect(component.pageIndex).toBe(0);
        expect(component.pageSize).toBe(15);
        expect(component.total).toBe(0);
        expect(component.pageSizes).toEqual([10, 15, 30, 50]);
    });

    describe('pageChange', () => {
        it('should increment pageIndex and emit event for next page', () => {
            component.pageChange(1);

            expect(component.pageIndex).toBe(1);
            expect(emittedEvents).toEqual([{ pageIndex: 1, pageSize: 15 }]);
        });

        it('should decrement pageIndex and emit event for previous page', () => {
            component.pageIndex = 2;

            component.pageChange(-1);

            expect(component.pageIndex).toBe(1);
            expect(emittedEvents).toEqual([{ pageIndex: 1, pageSize: 15 }]);
        });

        it('should emit event with zero change for page size reset', () => {
            component.pageIndex = 3;

            component.pageChange(0);

            expect(component.pageIndex).toBe(3);
            expect(emittedEvents).toEqual([{ pageIndex: 3, pageSize: 15 }]);
        });

        it('should emit current pageSize in event', () => {
            component.pageSize = 30;

            component.pageChange(1);

            expect(emittedEvents).toEqual([{ pageIndex: 1, pageSize: 30 }]);
        });
    });

    describe('ngOnChanges', () => {
        it('should adjust pageIndex when total shrinks below current page', () => {
            component.pageIndex = 3;
            component.pageSize = 15;
            component.total = 20;

            component.ngOnChanges({ total: new SimpleChange(60, 20, false) });

            expect(component.pageIndex).toBe(1);
            expect(emittedEvents).toEqual([{ pageIndex: 1, pageSize: 15 }]);
        });

        it('should not adjust pageIndex when current page is still valid', () => {
            component.pageIndex = 0;
            component.pageSize = 15;
            component.total = 20;

            component.ngOnChanges({ total: new SimpleChange(30, 20, false) });

            expect(component.pageIndex).toBe(0);
            expect(emittedEvents).toEqual([]);
        });

        it('should set pageIndex to 0 when total is less than one page', () => {
            component.pageIndex = 5;
            component.pageSize = 15;
            component.total = 10;

            component.ngOnChanges({ total: new SimpleChange(100, 10, false) });

            expect(component.pageIndex).toBe(0);
            expect(emittedEvents).toEqual([{ pageIndex: 0, pageSize: 15 }]);
        });

        it('should not emit when total is 0', () => {
            component.pageIndex = 0;
            component.total = 0;

            component.ngOnChanges({ total: new SimpleChange(10, 0, false) });

            expect(emittedEvents).toEqual([]);
        });
    });

    describe('min', () => {
        it('should return the smaller of two numbers', () => {
            expect(component.min(5, 10)).toBe(5);
            expect(component.min(10, 5)).toBe(5);
            expect(component.min(7, 7)).toBe(7);
        });
    });
});
