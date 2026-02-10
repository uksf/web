import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
    selector: '[appSpotlight]',
})
export class SpotlightDirective {
    @Input() spotlightSize = 200;
    @Input() spotlightColor = 'rgba(255, 255, 255, 0.06)';

    constructor(private el: ElementRef<HTMLElement>) {}

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        const rect = this.el.nativeElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.el.nativeElement.style.setProperty('--spotlight-x', `${x}px`);
        this.el.nativeElement.style.setProperty('--spotlight-y', `${y}px`);
    }

    @HostListener('mouseenter')
    onMouseEnter(): void {
        this.el.nativeElement.classList.add('spotlight-active');
        this.el.nativeElement.style.setProperty('--spotlight-size', `${this.spotlightSize}px`);
        this.el.nativeElement.style.setProperty('--spotlight-color', this.spotlightColor);
    }

    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.el.nativeElement.classList.remove('spotlight-active');
        this.el.nativeElement.style.removeProperty('--spotlight-x');
        this.el.nativeElement.style.removeProperty('--spotlight-y');
        this.el.nativeElement.style.removeProperty('--spotlight-size');
        this.el.nativeElement.style.removeProperty('--spotlight-color');
    }
}
