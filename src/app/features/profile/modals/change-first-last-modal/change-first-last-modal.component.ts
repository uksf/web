import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { AccountService } from '@app/core/services/account.service';
import { nameCase, titleCase } from '@app/shared/services/helper.service';
import { Rank } from '@app/shared/models/rank';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-change-first-last-modal',
    templateUrl: './change-first-last-modal.component.html',
    styleUrls: ['./change-first-last-modal.component.scss']
})
export class ChangeFirstLastModalComponent implements OnInit {
    form = this.formBuilder.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required]
    });
    changed = false;
    original: string;
    rank: string;

    constructor(private formBuilder: FormBuilder, private httpClient: HttpClient, private urls: UrlService, private accountService: AccountService) {
        this.form.controls.firstName.setValue(this.accountService.account.firstname);
        this.form.controls.lastName.setValue(this.accountService.account.lastname);
        this.httpClient.get(this.urls.apiUrl + '/ranks').pipe(first()).subscribe({
            next: (ranks: Rank[]) => {
                const rank = ranks.find((x) => x.name === this.accountService.account.rank);
                this.rank = rank ? rank.abbreviation : null;
            }
        });
    }

    ngOnInit() {
        this.original = JSON.stringify(this.form.getRawValue());
    }

    changeName() {
        const formString = JSON.stringify(this.form.getRawValue()).replace(/[\n\r]/g, '');
        this.httpClient
            .put(this.urls.apiUrl + '/accounts/name', formString, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
            .pipe(first())
            .subscribe({
                next: () => {
                    this.accountService.getAccount()?.subscribe({
                        next: () => {
                            this.changed = true;
                        }
                    });
                }
            });
    }

    get changesMade() {
        return this.original !== JSON.stringify(this.form.getRawValue());
    }

    get formErrors() {
        return this.form.errors.error;
    }

    get displayName(): string {
        let firstName = titleCase(this.form.controls.firstName.value);
        let lastName = nameCase(this.form.controls.lastName.value);
        return `${this.rank ? `${this.rank}.` : ''}${lastName}.${firstName ? firstName[0] : '?'}`;
    }
}
