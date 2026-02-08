import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { first, takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ResponseUnit } from '@app/features/units/models/units';
import { UnitsService } from '@app/features/command/services/units.service';
import { DestroyableComponent } from '@app/shared/components';

@Component({
    selector: 'app-unit-page',
    templateUrl: './unit-page.component.html',
    styleUrls: ['./unit-page.component.scss'],
})
export class UnitPageComponent extends DestroyableComponent {
    unit: ResponseUnit;
    displayedColumns = ['chainOfCommandPosition', 'name', 'role'];
    private id: string;

    constructor(private route: ActivatedRoute, private unitsService: UnitsService, public dialog: MatDialog, private location: Location) {
        super();
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe({
            next: (params) => {
                this.id = params.id;
                this.unitsService.getUnit(this.id).pipe(first()).subscribe({
                    next: (unit: ResponseUnit) => {
                        this.unit = unit;
                    }
                });
            }
        });
    }

    back() {
        this.location.back();
    }
}
