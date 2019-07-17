import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatTableDataSource } from '@angular/material';
import { CountryPickerService, ICountry } from 'app/Services/CountryPicker/country-picker.service';

@Component({
    selector: 'app-units-roster',
    templateUrl: './units-roster.component.html',
    styleUrls: ['../../../Pages/units-page/units-page.component.scss', './units-roster.component.css']
})
export class UnitsRosterComponent {
    public countries: ICountry[];
    displayedColumns = ['name', 'rank', 'roleAssignment', 'unitAssignment', 'nation'];
    rosterData: MatTableDataSource<any>;

    constructor(private httpClient: HttpClient, private urls: UrlService) {
        this.countries = CountryPickerService.countries;
        this.httpClient.get<any[]>(this.urls.apiUrl + '/accounts/roster').subscribe(response => {
            this.rosterData = new MatTableDataSource(response);
        });
    }
}
