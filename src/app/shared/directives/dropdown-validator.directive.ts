import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
    selector: '[mustSelectFromDropdown]',
    providers: [{ provide: NG_VALIDATORS, useExisting: MustSelectFromDropdownValidatorDirective, multi: true }],
    standalone: false
})
export class MustSelectFromDropdownValidatorDirective implements Validator {
    @Input('mustSelectFromDropdownElements') elements: IDropdownElement[];
    @Input('mustSelectFromDropdownElementMatcher') elementMatcher: (element: IDropdownElement, match: string) => boolean;
    @Input('mustSelectFromDropdownElementDisplayWith') elementDisplayWith: (element: IDropdownElement) => string;

    validate(control: AbstractControl) {
        if (!control || !control.value) {
            return null;
        }

        const matchValue = typeof control.value === 'string' ? control.value : this.elementDisplayWith(<IDropdownElement>control.value);
        if (this.elements.findIndex((element: IDropdownElement) => this.elementMatcher(element, matchValue.toLowerCase())) === -1) {
            return { invalid: true };
        }

        return null;
    }
}
