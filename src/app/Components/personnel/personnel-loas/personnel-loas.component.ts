import { Component, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
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
import moment, { Moment } from 'moment';

export interface ModeItem {
    mode: string;
    name: string;
    icon: string;
}

@Component({
    selector: 'app-personnel-loas',
    templateUrl: './personnel-loas.component.html',
    styleUrls: ['../../../Pages/personnel-page/personnel-page.component.scss', './personnel-loas.component.scss']
})
export class PersonnelLoasComponent implements OnInit {
    @ViewChildren(PersonnelLoasListComponent) loaLists: QueryList<PersonnelLoasListComponent>;
    mobile = false;
    viewModes: ModeItem[] = [
        { mode: 'all', name: 'All', icon: 'people_outline' },
        { mode: 'coc', name: 'My CoC', icon: 'people' },
        { mode: 'mine', name: 'Mine', icon: 'person' }
    ];
    dateModes: ModeItem[] = [
        { mode: 'all', name: 'All', icon: 'calendar_view_month' },
        { mode: 'today', name: 'Today', icon: 'today' },
        { mode: 'nextOp', name: 'Next Op', icon: 'public' },
        { mode: 'nextTraining', name: 'Next Training', icon: 'cycle' },
        { mode: 'select', name: 'Select Date', icon: 'date_range' }
    ];
    viewMode: ModeItem;
    dateMode: ModeItem;
    filterString: string = '';
    selectedDate?: Moment = moment();
    private filterSubject = new Subject<string>();

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {
        this.dateMode = this.dateModes[0];
        this.viewMode = this.viewModes[0];
    }

    ngOnInit(): void {
        this.filterSubject.pipe(debounceTime(150), distinctUntilChanged()).subscribe(() => {
            this.update();
        });

        this.mobile = window.screen.width < 400 || window.screen.height < 500;
    }

    @HostListener('window:resize')
    onResize() {
        this.mobile = window.screen.width < 400 || window.screen.height < 500;
    }

    update() {
        this.loaLists.forEach((x) => x.update(this.dateMode, this.viewMode, this.filterString, this.selectedDate));
    }

    changeViewMode(newViewMode: ModeItem) {
        this.viewMode = newViewMode;
        this.update();
    }

    changeDateMode(newDateMode: ModeItem) {
        if (newDateMode.mode === 'select') {
            this.selectedDate = moment();
        } else {
            this.selectedDate = null;
        }

        this.dateMode = newDateMode;
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

    getDisplayForDateMode(dateMode: string): string {
        switch (dateMode) {
            case 'today':
                return ` (${moment().format('DD MMM')})`;
            case 'nextOp':
                return ` (${this.getNextDayOfWeek(6).format('DD MMM yy')})`;
            case 'nextTraining':
                return ` (${this.getNextDayOfWeek(3).format('DD MMM yy')})`;
            case 'all':
            case 'select':
            default:
                return '';
        }
    }

    private getNextDayOfWeek(dayOfWeek: number) {
        const today = moment();
        const currentDayOfWeek = today.isoWeekday();

        if (currentDayOfWeek <= dayOfWeek) {
            return today.isoWeekday(dayOfWeek);
        } else {
            return today.add(1, 'weeks').isoWeekday(dayOfWeek);
        }
    }
}
