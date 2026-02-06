import { Directive, HostListener } from '@angular/core';

@Directive({
    selector: '[appCharacterBlock]',
})
export class CharacterBlockDirective {
    constructor() {}

    @HostListener('keypress', ['$event']) onKeyPress(event) {
        return new RegExp(/^[^`±~!@#$%^&*§¡€¢¶•ªº«()_+={}|\[\]\\:;"<>?,./]*$/g).test(event.key);
    }
}
