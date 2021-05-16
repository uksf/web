import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, timer } from 'rxjs';
import { switchMap, map, startWith } from 'rxjs/operators';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { ICountry, CountryPickerService } from 'app/Services/CountryPicker/country-picker.service';
import { CountryName } from 'app/Pipes/country.pipe';
import { Router } from '@angular/router';
import { ConfirmValidParentMatcher, InstantErrorStateMatcher } from '../../../Services/formhelper.service';
import { titleCase } from '../../../Services/helper.service';

function matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
    return (group: FormGroup): { [key: string]: any } => {
        const password = group.controls[passwordKey];
        const confirmPassword = group.controls[confirmPasswordKey];
        if (password.value !== confirmPassword.value) {
            return { mismatchedPasswords: true };
        }
    };
}

function validDob(dayKey: string, monthKey: string, yearKey: string) {
    return (group: FormGroup): { [key: string]: any } => {
        if (group.controls[dayKey].value === '' || group.controls[monthKey].value === '' || group.controls[yearKey].value === '') {
            return;
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

@Component({
    selector: 'app-application-identity',
    templateUrl: './application-identity.component.html',
    styleUrls: ['../../../Pages/application-page/application-page.component.scss', './application-identity.component.scss'],
})
export class ApplicationIdentityComponent {
    @Output() nextEvent = new EventEmitter();
    @ViewChild('day') dobDay: ElementRef;
    @ViewChild('month') dobMonth: ElementRef;
    @ViewChild('year') dobYear: ElementRef;
    formGroup: FormGroup;
    pending = false;
    confirmValidParentMatcher = new ConfirmValidParentMatcher();
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    countries: ICountry[];
    filteredCountries: Observable<ICountry[]>;
    validating = false;

    validation_messages = {
        email: [
            { type: 'required', message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email' },
            { type: 'emailTaken', message: 'That email has already been taken' },
        ],
        password: [{ type: 'required', message: 'Password is required' }],
        confirmPassword: [
            { type: 'required', message: 'Confirm password is required' },
            { type: 'mismatchedPasswords', message: 'Passwords are not the same' },
        ],
        dob: [
            { type: 'required', message: 'Date of Birth is required' },
            { type: 'nan', message: 'Invalid date: Not a number' },
            { type: 'dead', message: 'Invalid date: Statistically you should be dead.' },
            { type: 'born', message: "Invalid date: You can't be born yet" },
            { type: 'day', message: 'Invalid date: Day should be between 1 and 31' },
            { type: 'month', message: 'Invalid date: Month should be between 1 and 12' },
            { type: 'monthday', message: "Invalid date: There aren't that many days in that month" },
            { type: 'febhigh', message: "Invalid date: February doesn't have that many days" },
            { type: 'leap', message: "Invalid date: February only has a 29th day if it's a leap year" },
        ],
        nation: [
            { type: 'required', message: 'Nation of Residence is required' },
            { type: 'invalid', message: 'Invalid Nation of Residence. Please select one from the list' },
        ],
    };

    constructor(public dialog: MatDialog, public formBuilder: FormBuilder, private httpClient: HttpClient, private urls: UrlService, private router: Router) {
        this.formGroup = formBuilder.group({
            name: ['', Validators.maxLength(0)],
            email: ['', [Validators.required, Validators.email], this.validateEmail.bind(this)],
            passwordGroup: formBuilder.group(
                {
                    password: ['', Validators.required],
                    confirmPassword: ['', Validators.required],
                },
                { validator: matchingPasswords('password', 'confirmPassword') }
            ),
            firstname: ['', Validators.required],
            lastname: ['', Validators.required],
            dobGroup: formBuilder.group(
                {
                    day: ['', Validators.required],
                    month: ['', Validators.required],
                    year: ['', Validators.required],
                },
                { validator: validDob('day', 'month', 'year') }
            ),
            nation: ['', { updateOn: 'blur', validators: [Validators.required], asyncValidators: [this.validNation.bind(this)] }],
        });
        this.countries = CountryPickerService.countries;
    }

    ngOnInit(): void {
        this.filteredCountries = this.formGroup.get(['nation']).valueChanges.pipe(
            startWith(''),
            map((x) => this.filterCountry(x))
        );
    }

    private validNation(control: AbstractControl): ValidationErrors {
        this.validating = true;
        return timer(250).pipe(
            switchMap(() => {
                if (!control.value) {
                    this.validating = false;
                    return of(null);
                }
                if (this.countries.find((nation) => nation.value === control.value)) {
                    this.validating = false;
                    return of(null);
                } else {
                    this.validating = false;
                    return of({ invalid: true });
                }
            })
        );
    }

    private validateEmail(control: AbstractControl): Observable<ValidationErrors> {
        // Honeypot field must be empty
        if (this.formGroup.value.name !== '') {
            return of(null);
        }
        this.validating = true;
        return timer(500).pipe(
            switchMap(() => {
                if (!control.value) {
                    this.validating = false;
                    return of(null);
                }
                return this.httpClient.get(this.urls.apiUrl + '/accounts/exists?check=' + control.value).pipe(
                    map((response) => {
                        this.validating = false;
                        return response['exists'] ? { emailTaken: true } : null;
                    })
                );
            })
        );
    }

    private filterCountry(value: string): ICountry[] {
        const filterValue = value.toLowerCase();
        return this.countries.filter((x) => x.name.toLowerCase().includes(filterValue));
    }

    numberOnly(event: KeyboardEvent, fieldName: string, min: number, max: number) {
        if (event.key === 'ArrowRight') {
            if (fieldName === 'day') {
                this.dobMonth.nativeElement.focus();
            } else if (fieldName === 'month') {
                this.dobYear.nativeElement.focus();
            }
        } else if (event.key === 'ArrowLeft') {
            if (fieldName === 'month') {
                this.dobDay.nativeElement.focus();
            } else if (fieldName === 'year') {
                this.dobMonth.nativeElement.focus();
            }
        }

        const field: AbstractControl = this.formGroup.get(['dobGroup', fieldName]);
        const value = parseInt(field.value, 10);

        if (value < min) {
            field.setValue(min);
        } else if (value > max) {
            field.setValue(max);
        }
    }

    countryDisplayName(value: string): string {
        if (!value) {
            return '';
        }

        const countryName = new CountryName();
        return countryName.transform(value);
    }

    next() {
        // Honeypot field must be empty
        if (this.formGroup.value.name !== '') {
            return;
        }
        this.pending = true;
        const formObj = this.formGroup.getRawValue();
        formObj.password = formObj.passwordGroup.password;
        delete formObj.passwordGroup;
        const formString = JSON.stringify(formObj).replace(/[\n\r]/g, '');

        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.httpClient.put(this.urls.apiUrl + '/accounts', formString, { headers: headers }).subscribe(
            () => {
                this.pending = false;
                this.dialog
                    .open(MessageModalComponent, {
                        data: { message: 'Your account has been successfully created.\n\nYou will now be redirected to log in, after which you can continue your application.', button: 'Continue' },
                    })
                    .afterClosed()
                    .subscribe(() => {
                        this.router.navigate(['/login'], { queryParams: { redirect: 'application' } }).then();
                    });
            },
            (error) => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: error.error },
                });
                this.pending = false;
            }
        );
    }

    get displayName(): string {
        let firstName = titleCase(this.formGroup.controls['firstname'].value);
        let lastName = titleCase(this.formGroup.controls['lastname'].value);
        return `Cdt.${lastName}.${firstName ? firstName[0] : '?'}`;
    }
}
