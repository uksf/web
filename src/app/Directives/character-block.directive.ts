import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[appCharacterBlock]',
})
export class CharacterBlockDirective {
    constructor(private elementRef: ElementRef) {}

    @HostListener('keypress', ['$event']) onKeyPress(event) {
        let result = this.elementRef.nativeElement.value + event.key;
        return new RegExp(/^[a-zA-ZÀ-ȕ]+-?([a-zA-ZÀ-ȕ]+)*$/g).test(result);
    }

    @HostListener('paste', ['$event']) blockPaste() {
        setTimeout(() => {
            let result: string = this.elementRef.nativeElement.value.replace(/\s/g, '');
            result = result.match(new RegExp(/[a-zA-ZÀ-ȕ]+-?([a-zA-ZÀ-ȕ]+)*/g)).join('');
            this.elementRef.nativeElement.value = result;
            this.elementRef.nativeElement.dispatchEvent(new Event('input'));
        }, 1);
    }
}
