import { Component, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ResponseUnit } from '@app/features/units/models/units';
import { UnitsService } from '@app/features/command/services/units.service';

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

    constructor(private route: ActivatedRoute, private unitsService: UnitsService, public dialog: MatDialog, private location: Location) {
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe({
            next: (params) => {
                this.id = params.id;
                this.unitsService.getUnit(this.id).pipe(takeUntil(this.destroy$)).subscribe({
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
