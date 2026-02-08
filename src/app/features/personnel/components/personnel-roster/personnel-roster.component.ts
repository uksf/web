import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CountryPickerService, ICountry } from '@app/shared/services/country-picker/country-picker.service';
import { RosterAccount } from '@app/shared/models/account';
import { first } from 'rxjs/operators';
import { MembersService } from '@app/shared/services/members.service';

@Component({
    selector: 'app-personnel-roster',
    templateUrl: './personnel-roster.component.html',
    styleUrls: ['../../../units/components/units-page/units-page.component.scss', './personnel-roster.component.scss']
})
export class PersonnelRosterComponent {
    public countries: ICountry[];
    displayedColumns = ['nation', 'name', 'rank', 'roleAssignment', 'unitAssignment'];
    rosterData: MatTableDataSource<RosterAccount>;

    constructor(private membersService: MembersService) {
        this.countries = CountryPickerService.countries;
        this.membersService.getRoster().pipe(first()).subscribe({
            next: (response: RosterAccount[]) => {
                this.rosterData = new MatTableDataSource(response);
            }
        });
    }
}
