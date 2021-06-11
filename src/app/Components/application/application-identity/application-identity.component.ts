import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { CountryPickerService, ICountry } from 'app/Services/CountryPicker/country-picker.service';
import { CountryImage } from 'app/Pipes/country.pipe';
import { Router } from '@angular/router';
import { ConfirmValidParentMatcher, InstantErrorStateMatcher } from '../../../Services/formhelper.service';
import { nameCase, titleCase } from '../../../Services/helper.service';
import { IDropdownElement } from '../../elements/dropdown/dropdown.component';

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
    styleUrls: ['../../../Pages/application-page/application-page.component.scss', './application-identity.component.scss']
})
export class ApplicationIdentityComponent implements OnInit {
    @Output() nextEvent = new EventEmitter();
    @ViewChild('day') dobDay: ElementRef;
    @ViewChild('month') dobMonth: ElementRef;
    @ViewChild('year') dobYear: ElementRef;
    formGroup: FormGroup;
    pending = false;
    confirmValidParentMatcher = new ConfirmValidParentMatcher();
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    countries: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validating = false;

    validation_messages = {
        email: [
            { type: 'required', message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email' },
            { type: 'emailTaken', message: 'That email has already been taken' }
        ],
        password: [{ type: 'required', message: 'Password is required' }],
        confirmPassword: [
            { type: 'required', message: 'Confirm password is required' },
            { type: 'mismatchedPasswords', message: 'Passwords are not the same' }
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
            { type: 'leap', message: "Invalid date: February only has a 29th day if it's a leap year" }
        ]
    };

    constructor(public dialog: MatDialog, public formBuilder: FormBuilder, private httpClient: HttpClient, private urls: UrlService, private router: Router) {
        this.formGroup = formBuilder.group({
            name: ['', Validators.maxLength(0)],
            email: ['', [Validators.required, Validators.email], this.validateEmail.bind(this)],
            passwordGroup: formBuilder.group(
                {
                    password: ['', Validators.required],
                    confirmPassword: ['', Validators.required]
                },
                { validator: matchingPasswords('password', 'confirmPassword') }
            ),
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            dobGroup: formBuilder.group(
                {
                    day: ['', Validators.required],
                    month: ['', Validators.required],
                    year: ['', Validators.required]
                },
                { validator: validDob('day', 'month', 'year') }
            ),
            nation: ['']
        });
    }

    ngOnInit(): void {
        this.httpClient.get(`${this.urls.apiUrl}/accounts/nations`).subscribe({
            next: (orderedCountries: string[]) => {
                const countries = CountryPickerService.countries;
                orderedCountries.forEach((countryValue: string, orderedIndex: number) => {
                    const index = countries.findIndex((country: ICountry) => country.value === countryValue);
                    if (index !== -1) {
                        countries.splice(orderedIndex, 0, countries.splice(index, 1)[0]);
                    }
                });
                this.countries.next(countries.map(this.mapCountryElement));
                this.countries.complete();
            }
        });
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
                    map((exists: boolean) => {
                        this.validating = false;
                        return exists ? { emailTaken: true } : null;
                    })
                );
            })
        );
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

    next() {
        // Honeypot field must be empty
        if (this.formGroup.value.name !== '') {
            return;
        }

        this.pending = true;
        const formObj = this.formGroup.getRawValue();
        let body = {
            Email: formObj.email,
            Password: formObj.passwordGroup.password,
            FirstName: formObj.firstName,
            LastName: formObj.lastName,
            DobYear: formObj.dobGroup.year,
            DobMonth: formObj.dobGroup.month,
            DobDay: formObj.dobGroup.day,
            Nation: formObj.nation.value
        };
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

        this.httpClient.put(this.urls.apiUrl + '/accounts', body, { headers: headers }).subscribe(
            () => {
                this.pending = false;
                this.dialog
                    .open(MessageModalComponent, {
                        data: {
                            message: 'Your account has been successfully created.\n\nYou will now be redirected to log in, after which you can continue your application.',
                            button: 'Continue'
                        }
                    })
                    .afterClosed()
                    .subscribe(() => {
                        this.router.navigate(['/login'], { queryParams: { redirect: 'application' } }).then();
                    });
            },
            (error) => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: error.error }
                });
                this.pending = false;
            }
        );
    }

    get displayName(): string {
        let firstName = titleCase(this.formGroup.controls['firstName'].value);
        let lastName = nameCase(this.formGroup.controls['lastName'].value);
        return `Cdt.${lastName}.${firstName ? firstName[0] : '?'}`;
    }

    mapCountry(dropdownElement: IDropdownElement): ICountry {
        return {
            value: dropdownElement.value,
            name: dropdownElement.displayValue,
            image: dropdownElement.data
        };
    }

    mapCountryElement(country: ICountry): IDropdownElement {
        const countryImagePipe = new CountryImage();
        return {
            value: country.value,
            displayValue: country.name,
            data: countryImagePipe.transform(country.value)
        };
    }
}
