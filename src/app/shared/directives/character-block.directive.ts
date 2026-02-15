import { Directive, HostListener } from '@angular/core';

/** Regex that allows only characters NOT in the blocked set. Use with TextInputComponent's [keypressFilter]. */
export const CHARACTER_BLOCK_PATTERN = /^[^`±~!@#$%^&*§¡€¢¶•ªº«()_+={}|\[\]\\:;"<>?,./]*$/;

@Directive({
    selector: '[appCharacterBlock]',
})
export class CharacterBlockDirective {
    constructor() {}

    @HostListener('keypress', ['$event']) onKeyPress(event: KeyboardEvent) {
        return CHARACTER_BLOCK_PATTERN.test(event.key);
    }
}
