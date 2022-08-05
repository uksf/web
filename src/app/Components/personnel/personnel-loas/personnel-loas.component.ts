import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { RequestLoaModalComponent } from '../../../Modals/command/request-loa-modal/request-loa-modal.component';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { formatDate } from '@angular/common';
import { Loa } from '../../../Models/Loa';
import { PersonnelLoasListComponent } from '../personnel-loas-list/personnel-loas-list.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-personnel-loas',
    templateUrl: './personnel-loas.component.html',
    styleUrls: ['../../../Pages/personnel-page/personnel-page.component.scss', './personnel-loas.component.scss']
})
export class PersonnelLoasComponent implements OnInit {
    @ViewChildren(PersonnelLoasListComponent) loaLists: QueryList<PersonnelLoasListComponent>;
    filterString: string = '';
    viewMode: string = 'all';
    private filterSubject = new Subject<string>();

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {}

    ngOnInit(): void {
        this.filterSubject.pipe(debounceTime(150), distinctUntilChanged()).subscribe(() => {
            this.update();
        });
    }

    update() {
        this.loaLists.forEach((x) => x.update(this.viewMode, this.filterString));
    }

    changeViewMode(viewMode: string) {
        this.viewMode = viewMode;
        this.update();
    }

    filter() {
        this.filterSubject.next(this.filterString);
    }

    createLoa() {
        this.dialog
            .open(RequestLoaModalComponent, {})
            .afterClosed()
            .subscribe((_) => {
                this.update();
            });
    }

    delete(loa: Loa) {
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: {
                message: `Are you sure you want to delete LOA for '${loa.name}' from '${formatDate(loa.start, 'd MMM y', 'en-GB', 'UTC')}' to '${formatDate(loa.end, 'd MMM y', 'en-GB', 'UTC')}'?`
            }
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.httpClient.delete(`${this.urls.apiUrl}/loa/${loa.id}`).subscribe((_) => {
                this.update();
            });
        });
    }
}
