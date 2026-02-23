import { Directive, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';

@Directive({
    selector: '[appSpotlight]',
})
export class SpotlightDirective implements OnDestroy {
    @Input() spotlightSize = 200;
    @Input() spotlightColor = 'rgba(255, 255, 255, 0.08)';

    private cachedRect: DOMRect | null = null;

    constructor(private el: ElementRef<HTMLElement>) {}

    ngOnDestroy(): void {
        this.onMouseLeave();
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        if (!this.cachedRect) {
            return;
        }
        const x = event.clientX - this.cachedRect.left;
        const y = event.clientY - this.cachedRect.top;
        this.el.nativeElement.style.setProperty('--spotlight-x', `${x}px`);
        this.el.nativeElement.style.setProperty('--spotlight-y', `${y}px`);
    }

    @HostListener('mouseenter')
    onMouseEnter(): void {
        this.cachedRect = this.el.nativeElement.getBoundingClientRect();
        this.el.nativeElement.classList.add('spotlight-active');
        this.el.nativeElement.style.setProperty('--spotlight-size', `${this.spotlightSize}px`);
        this.el.nativeElement.style.setProperty('--spotlight-color', this.spotlightColor);
    }

    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.cachedRect = null;
        this.el.nativeElement.classList.remove('spotlight-active');
        this.el.nativeElement.style.removeProperty('--spotlight-x');
        this.el.nativeElement.style.removeProperty('--spotlight-y');
        this.el.nativeElement.style.removeProperty('--spotlight-size');
        this.el.nativeElement.style.removeProperty('--spotlight-color');
    }
}
