import { describe, it, expect, beforeEach } from 'vitest';
import { ElementRef } from '@angular/core';
import { SpotlightDirective } from './spotlight.directive';

function createMockElement(): HTMLElement {
    const classes = new Set<string>();
    const styles = new Map<string, string>();

    return {
        classList: {
            add: (cls: string) => classes.add(cls),
            remove: (cls: string) => classes.delete(cls),
            contains: (cls: string) => classes.has(cls),
        },
        style: {
            setProperty: (name: string, value: string) => styles.set(name, value),
            removeProperty: (name: string) => { styles.delete(name); return ''; },
            getPropertyValue: (name: string) => styles.get(name) ?? '',
        },
        getBoundingClientRect: () => ({
            left: 100, top: 50, right: 300, bottom: 150,
            width: 200, height: 100, x: 100, y: 50,
            toJSON: () => {},
        }),
    } as unknown as HTMLElement;
}

describe('SpotlightDirective', () => {
    let directive: SpotlightDirective;
    let element: HTMLElement;

    beforeEach(() => {
        element = createMockElement();
        directive = new SpotlightDirective(new ElementRef(element));
    });

    it('should add spotlight-active class on mouseenter', () => {
        directive.onMouseEnter();
        expect(element.classList.contains('spotlight-active')).toBe(true);
    });

    it('should remove spotlight-active class on mouseleave', () => {
        directive.onMouseEnter();
        expect(element.classList.contains('spotlight-active')).toBe(true);

        directive.onMouseLeave();
        expect(element.classList.contains('spotlight-active')).toBe(false);
    });

    it('should set --spotlight-x and --spotlight-y on mousemove', () => {
        directive.onMouseMove({ clientX: 150, clientY: 80 } as MouseEvent);

        expect(element.style.getPropertyValue('--spotlight-x')).toBe('50px');
        expect(element.style.getPropertyValue('--spotlight-y')).toBe('30px');
    });

    it('should set custom size and color as CSS variables on mouseenter', () => {
        directive.spotlightSize = 300;
        directive.spotlightColor = 'rgba(255, 200, 0, 0.1)';

        directive.onMouseEnter();

        expect(element.style.getPropertyValue('--spotlight-size')).toBe('300px');
        expect(element.style.getPropertyValue('--spotlight-color')).toBe('rgba(255, 200, 0, 0.1)');
    });

    it('should clear CSS variables on mouseleave', () => {
        directive.onMouseEnter();
        expect(element.style.getPropertyValue('--spotlight-size')).toBe('200px');

        directive.onMouseLeave();

        expect(element.style.getPropertyValue('--spotlight-x')).toBe('');
        expect(element.style.getPropertyValue('--spotlight-y')).toBe('');
        expect(element.style.getPropertyValue('--spotlight-size')).toBe('');
        expect(element.style.getPropertyValue('--spotlight-color')).toBe('');
    });
});
