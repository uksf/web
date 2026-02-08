import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FooterBarComponent } from './footer-bar.component';

describe('FooterBarComponent', () => {
    let component: FooterBarComponent;

    beforeEach(() => {
        (globalThis as any).window = { screen: { width: 1024 } };
        component = new FooterBarComponent();
    });

    afterEach(() => {
        delete (globalThis as any).window;
    });

    describe('getCurrentYear', () => {
        it('returns current year', () => {
            expect(component.getCurrentYear()).toBe(new Date().getFullYear());
        });
    });

    describe('ngOnInit', () => {
        it('sets mobile false for desktop width', () => {
            (globalThis as any).window.screen.width = 1024;

            component.ngOnInit();

            expect(component.mobile).toBe(false);
            expect(component.mobileSmall).toBe(false);
        });

        it('sets mobile true for tablet width', () => {
            (globalThis as any).window.screen.width = 768;

            component.ngOnInit();

            expect(component.mobile).toBe(true);
            expect(component.mobileSmall).toBe(false);
        });

        it('sets mobileSmall true for small phone width', () => {
            (globalThis as any).window.screen.width = 375;

            component.ngOnInit();

            expect(component.mobile).toBe(false);
            expect(component.mobileSmall).toBe(true);
        });
    });

    describe('onResize', () => {
        it('updates mobile flags on resize', () => {
            (globalThis as any).window.screen.width = 500;

            component.onResize();

            expect(component.mobile).toBe(true);
            expect(component.mobileSmall).toBe(false);
        });
    });
});
