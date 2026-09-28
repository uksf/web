import { UntypedFormGroup, ValidationErrors } from '@angular/forms';

export function matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
    return (group: UntypedFormGroup): ValidationErrors | null => {
        const password = group.controls[passwordKey];
        const confirmPassword = group.controls[confirmPasswordKey];
        if (password.value !== confirmPassword.value) {
            return { mismatchedPasswords: true };
        }
        return null;
    };
}

export function validDob(dayKey: string, monthKey: string, yearKey: string) {
    return (group: UntypedFormGroup): ValidationErrors | null => {
        if (group.controls[dayKey].value === '' || group.controls[monthKey].value === '' || group.controls[yearKey].value === '') {
            return null;
        }

        const day = parseInt(group.controls[dayKey].value, 10);
        const month = parseInt(group.controls[monthKey].value, 10);
        const year = parseInt(group.controls[yearKey].value, 10);
        const valid = !isNaN(new Date(`${month}/${day}/${year}`).getTime());
        if (isNaN(day) || isNaN(month) || isNaN(year) || !valid) {
            return { nan: true };
        }
        if (day < 1 || day > 31) {
            return { day: true };
        }
        if (month < 1 || month > 12) {
            return { month: true };
        }
        if (year < 1900) {
            return { dead: true };
        }
        if (year > new Date().getFullYear()) {
            return { born: true };
        }
        if ((month === 4 || month === 6 || month === 9 || month === 11) && day === 31) {
            return { monthday: true };
        }
        if (month === 2) {
            const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
            if (day > 29) {
                return { febhigh: true };
            }
            if (day === 29 && !leap) {
                return { leap: true };
            }
        }
    };
}
