import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ActivatedRoute, Params } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { DocsSidebarComponent } from './docs-sidebar.component';

describe('DocsSidebarComponent', () => {
    let breakpoint: BehaviorSubject<BreakpointState>;
    let queryParams: BehaviorSubject<Params>;

    function create(narrow: boolean, params: Params = {}): DocsSidebarComponent {
        breakpoint = new BehaviorSubject<BreakpointState>({ matches: narrow, breakpoints: {} });
        queryParams = new BehaviorSubject<Params>(params);
        TestBed.configureTestingModule({
            providers: [
                DocsSidebarComponent,
                { provide: BreakpointObserver, useValue: { isMatched: () => narrow, observe: () => breakpoint } },
                { provide: ActivatedRoute, useValue: { queryParams } },
                { provide: MatDialog, useValue: { open: vi.fn() } }
            ]
        });
        const component = TestBed.inject(DocsSidebarComponent);
        component.ngOnInit();
        return component;
    }

    beforeEach(() => TestBed.resetTestingModule());

    it('starts open beside the document on wide screens', () => {
        const component = create(false);

        expect(component.overlay).toBe(false);
        expect(component.collapsed).toBe(false);
    });

    it('starts hidden on narrow screens, even when a document is open', () => {
        const component = create(true, { folder: 'f', document: 'd' });

        expect(component.overlay).toBe(true);
        expect(component.collapsed).toBe(true);
    });

    it('closes on narrow screens once a document is picked', () => {
        const component = create(true);
        component.toggleCollapse();

        queryParams.next({ folder: 'f', document: 'd' });

        expect(component.collapsed).toBe(true);
    });

    it('stays open on wide screens when a document is picked', () => {
        const component = create(false);

        queryParams.next({ folder: 'f', document: 'd' });

        expect(component.collapsed).toBe(false);
    });

    it('closes on Escape only when covering the page', () => {
        const narrow = create(true);
        narrow.toggleCollapse();
        narrow.onEscape();
        expect(narrow.collapsed).toBe(true);

        TestBed.resetTestingModule();
        const wide = create(false);
        wide.onEscape();
        expect(wide.collapsed).toBe(false);
    });

    it('switches layout when the screen crosses the breakpoint', () => {
        const component = create(false);

        breakpoint.next({ matches: true, breakpoints: {} });
        expect(component.overlay).toBe(true);
        expect(component.collapsed).toBe(true);

        breakpoint.next({ matches: false, breakpoints: {} });
        expect(component.overlay).toBe(false);
        expect(component.collapsed).toBe(false);
    });
});
