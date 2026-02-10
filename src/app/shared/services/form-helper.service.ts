import { ErrorStateMatcher } from '@angular/material/core';
import { AbstractControl, FormControl, FormGroupDirective, NgForm } from '@angular/forms';

export interface ValidationMessage {
    type: string;
    message: string | (() => string);
}

/** Returns the message for the first matching error on the control, or empty string. */
export function getValidationError(control: AbstractControl | null, messages: ValidationMessage[]): string {
    if (!control) {
        return '';
    }
    for (const v of messages) {
        if (control.hasError(v.type)) {
            return typeof v.message === 'function' ? v.message() : v.message;
        }
    }
    return '';
}

export class InstantErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return !!(control && !control.valid && (control.dirty || control.touched));
    }
}

export class ConfirmValidParentMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return !!(!control.parent.valid && control && (control.dirty || control.touched));
    }
}
