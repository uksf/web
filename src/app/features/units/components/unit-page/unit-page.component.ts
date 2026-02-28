import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { first, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ResponseUnit } from '@app/features/units/models/units';
import { UnitsService } from '@app/features/command/services/units.service';
import { DestroyableComponent } from '@app/shared/components';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard } from '@angular/material/card';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';

@Component({
    selector: 'app-unit-page',
    templateUrl: './unit-page.component.html',
    styleUrls: ['./unit-page.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        MatIconButton,
        MatIcon,
        MatCard,
        MatGridList,
        MatGridTile,
        RouterLink,
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow
    ]
})
export class UnitPageComponent extends DestroyableComponent {
    private route = inject(ActivatedRoute);
    private unitsService = inject(UnitsService);
    dialog = inject(MatDialog);
    private location = inject(Location);

    unit: ResponseUnit;
    displayedColumns = ['chainOfCommandPosition', 'name', 'role'];
    private id: string;

    constructor() {
        super();
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe({
            next: (params) => {
                this.id = params.id;
                this.unitsService
                    .getUnit(this.id)
                    .pipe(first())
                    .subscribe({
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
