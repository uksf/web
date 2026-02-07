import { Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatTableDataSource } from '@angular/material/table';
import { CountryPickerService, ICountry } from '@app/shared/services/country-picker/country-picker.service';
import { RosterAccount } from '@app/shared/models/account';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-personnel-roster',
    templateUrl: './personnel-roster.component.html',
    styleUrls: ['../../../units/components/units-page/units-page.component.scss', './personnel-roster.component.scss']
})
export class PersonnelRosterComponent implements OnDestroy {
    private destroy$ = new Subject<void>();
    public countries: ICountry[];
    displayedColumns = ['nation', 'name', 'rank', 'roleAssignment', 'unitAssignment'];
    rosterData: MatTableDataSource<RosterAccount>;

    constructor(private httpClient: HttpClient, private urls: UrlService) {
        this.countries = CountryPickerService.countries;
        this.httpClient.get(this.urls.apiUrl + '/accounts/roster').pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: RosterAccount[]) => {
                this.rosterData = new MatTableDataSource(response);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
