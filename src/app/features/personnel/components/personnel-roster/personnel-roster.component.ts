import { Component } from '@angular/core';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { CountryPickerService, ICountry } from '@app/shared/services/country-picker/country-picker.service';
import { RosterAccount } from '@app/shared/models/account';
import { first } from 'rxjs/operators';
import { MembersService } from '@app/shared/services/members.service';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { CountryImage } from '../../../../shared/pipes/country.pipe';

@Component({
    selector: 'app-personnel-roster',
    templateUrl: './personnel-roster.component.html',
    styleUrls: ['../../../units/components/units-page/units-page.component.scss', './personnel-roster.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        MatProgressSpinner,
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        RouterLink,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        CountryImage
    ]
})
export class PersonnelRosterComponent {
    public countries: ICountry[];
    displayedColumns = ['nation', 'name', 'rank', 'roleAssignment', 'unitAssignment'];
    rosterData: MatTableDataSource<RosterAccount>;

    constructor(private membersService: MembersService) {
        this.countries = CountryPickerService.countries;
        this.membersService
            .getRoster()
            .pipe(first())
            .subscribe({
                next: (response: RosterAccount[]) => {
                    this.rosterData = new MatTableDataSource(response);
                }
            });
    }
}
