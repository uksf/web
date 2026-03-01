import { Component, HostListener, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LoaService } from '@app/shared/services/loa.service';
import { RequestLoaModalComponent } from '@app/shared/modals/request-loa-modal/request-loa-modal.component';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { formatDate } from '@angular/common';
import { Loa } from '@app/features/command/models/loa';
import { PersonnelLoasListComponent } from '../personnel-loas-list/personnel-loas-list.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, first, takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { DestroyableComponent } from '@app/shared/components';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatButton } from '@angular/material/button';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker';

export type ViewMode = 'all' | 'coc' | 'mine';
export type DateMode = 'all' | 'nextOp' | 'nextTraining' | 'select';

export interface ViewModeItem {
    mode: ViewMode;
    name: string;
    icon: string;
}

export interface DateModeItem {
    mode: DateMode;
    name: string;
    icon: string;
}

@Component({
    selector: 'app-personnel-loas',
    templateUrl: './personnel-loas.component.html',
    styleUrls: ['../personnel-page/personnel-page.component.scss', './personnel-loas.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        MatButton,
        FlexFillerComponent,
        TextInputComponent,
        FormsModule,
        MatTooltip,
        MatMenuTrigger,
        MatIcon,
        MatMenu,
        MatMenuItem,
        MatFormField,
        MatLabel,
        MatInput,
        MatDatepickerInput,
        MatDatepickerToggle,
        MatSuffix,
        MatDatepicker,
        PersonnelLoasListComponent
    ]
})
export class PersonnelLoasComponent extends DestroyableComponent implements OnInit {
    private loaService = inject(LoaService);
    private dialog = inject(MatDialog);

    @ViewChildren(PersonnelLoasListComponent) loaLists: QueryList<PersonnelLoasListComponent>;
    mobile = false;
    viewModes: ViewModeItem[] = [
        { mode: 'all', name: 'All', icon: 'people_outline' },
        { mode: 'coc', name: 'My CoC', icon: 'people' },
        { mode: 'mine', name: 'Mine', icon: 'person' }
    ];
    dateModes: DateModeItem[] = [
        { mode: 'all', name: 'All', icon: 'calendar_view_month' },
        { mode: 'nextOp', name: 'Next Op', icon: 'public' },
        { mode: 'nextTraining', name: 'Next Training', icon: 'school' },
        { mode: 'select', name: 'Select Date', icon: 'date_range' }
    ];
    viewMode: ViewModeItem;
    dateMode: DateModeItem;
    filterString: string = '';
    selectedDate?: Moment = this.getUkNow();
    private filterSubject = new Subject<string>();

    constructor() {
        super();
        this.dateMode = this.dateModes[0];
        this.viewMode = this.viewModes[0];
    }

    ngOnInit(): void {
        this.filterSubject.pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.update();
            }
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

    changeViewMode(newViewMode: ViewModeItem) {
        this.viewMode = newViewMode;
        this.update();
    }

    changeDateMode(newDateMode: DateModeItem) {
        if (newDateMode.mode === 'select') {
            this.selectedDate = this.getUkNow();
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
            .pipe(first())
            .subscribe({
                next: (_) => {
                    this.update();
                }
            });
    }

    delete(loa: Loa) {
        this.dialog
            .open(ConfirmationModalComponent, {
                data: {
                    message: `Are you sure you want to delete LOA for '${loa.name}' from '${formatDate(loa.start, 'd MMM y', 'en-GB', 'UTC')}' to '${formatDate(loa.end, 'd MMM y', 'en-GB', 'UTC')}'?`
                }
            })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (result) => {
                    if (!result) {
                        return;
                    }
                    this.loaService
                        .deleteLoa(loa.id)
                        .pipe(first())
                        .subscribe({
                            next: (_) => {
                                this.update();
                            }
                        });
                }
            });
    }

    getDisplayForDateMode(dateMode: string): string {
        switch (dateMode) {
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
        const today = this.getUkNow();
        const currentDayOfWeek = today.isoWeekday();

        if (currentDayOfWeek <= dayOfWeek) {
            return today.isoWeekday(dayOfWeek);
        } else {
            return today.add(1, 'weeks').isoWeekday(dayOfWeek);
        }
    }

    private getUkNow() {
        return moment().tz('Europe/London');
    }
}
