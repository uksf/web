import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

export interface ReferenceOption {
    value: string;
    viewValue: string;
}

export const REFERENCE_OPTIONS: ReferenceOption[] = [
    { value: 'Recruiter', viewValue: 'Recruiter' },
    { value: 'Steam', viewValue: 'Steam' },
    { value: 'Reddit', viewValue: 'Reddit' },
    { value: 'YouTube', viewValue: 'YouTube' },
    { value: 'Instagram', viewValue: 'Instagram' },
    { value: 'Google', viewValue: 'Google' },
    { value: 'Arma 3 Discord', viewValue: 'Arma 3 Discord' },
    { value: 'Friend', viewValue: 'Friend' },
    { value: 'Other', viewValue: 'Other' }
];

export const REFERENCE_ELEMENTS: IDropdownElement[] = REFERENCE_OPTIONS.map(o => ({ value: o.value, displayValue: o.viewValue }));

export function findReferenceElement(value: string): IDropdownElement | null {
    return REFERENCE_ELEMENTS.find(e => e.value === value) ?? null;
}

export const ROLE_PREFERENCE_OPTIONS = ['NCO', 'Officer', 'Aviation', 'Medic'] as const;

export interface ValidationMessage {
    type: string;
    message: string;
}

export const DETAILS_VALIDATION_MESSAGES: Record<string, ValidationMessage[]> = {
    armaExperience: [{ type: 'required', message: 'Details about your Arma experience are required' }],
    unitsExperience: [{ type: 'required', message: 'Details about your past Arma unit experience is required' }],
    background: [{ type: 'required', message: 'Some background info about yourself is required' }]
};

export function buildDetailsFormGroup(fb: UntypedFormBuilder): UntypedFormGroup {
    const formGroup = fb.group({
        name: ['', Validators.maxLength(0)],
        armaExperience: ['', Validators.required],
        unitsExperience: ['', Validators.required],
        background: ['', Validators.required],
        militaryExperience: [false],
        reference: ['', Validators.required]
    });
    const rolePreferenceControls: Record<string, UntypedFormControl> = {};
    ROLE_PREFERENCE_OPTIONS.forEach((x) => {
        rolePreferenceControls[x] = new UntypedFormControl(false);
    });
    formGroup.addControl('rolePreferences', new UntypedFormGroup(rolePreferenceControls));
    return formGroup;
}

export function extractRolePreferences(formGroup: UntypedFormGroup): Record<string, unknown> {
    const formObj = formGroup.getRawValue();
    const rolePreferences: string[] = [];
    const rolePreferencesGroup = formGroup.controls['rolePreferences'] as UntypedFormGroup;
    for (const key in rolePreferencesGroup.controls) {
        if (rolePreferencesGroup.controls.hasOwnProperty(key)) {
            if (rolePreferencesGroup.controls[key].value) {
                rolePreferences.push(key);
            }
        }
    }
    formObj.rolePreferences = rolePreferences;
    // Extract raw value from IDropdownElement if reference is an object
    if (formObj.reference && typeof formObj.reference === 'object') {
        formObj.reference = (formObj.reference as IDropdownElement).value;
    }
    return formObj;
}
