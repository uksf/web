import { Component, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ResponseUnit } from '@app/features/units/models/units';

@Component({
    selector: 'app-unit-page',
    templateUrl: './unit-page.component.html',
    styleUrls: ['./unit-page.component.scss'],
})
export class UnitPageComponent implements OnDestroy {
    private destroy$ = new Subject<void>();
    unit: ResponseUnit;
    displayedColumns = ['chainOfCommandPosition', 'name', 'role'];
    private id: string;

    constructor(private route: ActivatedRoute, private httpClient: HttpClient, private urls: UrlService, public dialog: MatDialog, private location: Location) {
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe({
            next: (params) => {
                this.id = params.id;
                this.httpClient.get(`${this.urls.apiUrl}/units/${this.id}`).pipe(takeUntil(this.destroy$)).subscribe({
                    next: (unit: ResponseUnit) => {
                        this.unit = unit;
                    }
                });
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    back() {
        this.location.back();
    }
}
