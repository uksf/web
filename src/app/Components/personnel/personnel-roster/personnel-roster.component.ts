import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatTableDataSource } from '@angular/material/table';
import { CountryPickerService, ICountry } from '../../../Services/CountryPicker/country-picker.service';
import { RosterAccount } from '../../../Models/Account';

@Component({
    selector: 'app-personnel-roster',
    templateUrl: './personnel-roster.component.html',
    styleUrls: ['../../../Pages/units-page/units-page.component.scss', './personnel-roster.component.scss']
})
export class PersonnelRosterComponent {
    public countries: ICountry[];
    displayedColumns = ['nation', 'name', 'rank', 'roleAssignment', 'unitAssignment'];
    rosterData: MatTableDataSource<RosterAccount>;

    constructor(private httpClient: HttpClient, private urls: UrlService) {
        this.countries = CountryPickerService.countries;
        this.httpClient.get(this.urls.apiUrl + '/accounts/roster').subscribe((response: RosterAccount[]) => {
            this.rosterData = new MatTableDataSource(response);
        });
    }
}
