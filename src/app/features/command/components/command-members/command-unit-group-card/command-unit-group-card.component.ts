import { AfterViewInit, ChangeDetectorRef, Component, Input, ViewChild, ViewChildren } from '@angular/core';
import { Unit } from '@app/features/units/models/units';
import { MatAccordion } from '@angular/material/expansion';
import { all, any } from '@app/shared/services/helper.service';
import { Account } from '@app/shared/models/account';

@Component({
    selector: 'app-command-unit-group-card',
    templateUrl: './command-unit-group-card.component.html',
    styleUrls: ['./command-unit-group-card.component.scss'],
    standalone: false
})
export class CommandUnitGroupCardComponent implements AfterViewInit {
    @ViewChild(MatAccordion) accordion: MatAccordion;
    @ViewChildren(CommandUnitGroupCardComponent) children;
    @Input('unit') unit: Unit;
    @Input('hideEmpty') hideEmpty: boolean = false;

    constructor(private cdr: ChangeDetectorRef) {}

    ngAfterViewInit(): void {
        this.cdr.detectChanges();
    }

    public expandAll(): void {
        this.accordion.openAll();
        this.children.forEach((x) => x.expandAll());
    }

    public collapseAll(): void {
        this.accordion.closeAll();
        this.children.forEach((x) => x.collapseAll());
    }

    public get isEmpty(): boolean {
        const childArray = this.children?.toArray() ?? [];
        return !any(this.unit.memberObjects) && all(childArray, (x) => x.isEmpty);
    }

    trackByMemberId(_: number, member: Account) {
        return member.id;
    }

    trackByUnitId(_: number, unit: Unit) {
        return unit.id;
    }
}
