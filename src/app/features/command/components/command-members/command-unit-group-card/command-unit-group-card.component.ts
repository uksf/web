import { Component, Input, OnInit, ViewChild, ViewChildren } from '@angular/core';
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
export class CommandUnitGroupCardComponent implements OnInit {
    @ViewChild(MatAccordion) accordion: MatAccordion;
    @ViewChildren(CommandUnitGroupCardComponent) children;
    @Input('unit') unit: Unit;
    @Input('hideEmpty') hideEmpty: boolean = false;

    constructor() {}

    ngOnInit(): void {}

    public expandAll(): void {
        this.accordion.openAll();
        this.children.forEach((x) => x.expandAll());
    }

    public collapseAll(): void {
        this.accordion.closeAll();
        this.children.forEach((x) => x.collapseAll());
    }

    public get isEmpty(): boolean {
        return !any(this.unit.memberObjects) && all(this.children.toArray(), (x) => x.isEmpty);
    }

    trackByMemberId(_: number, member: Account) {
        return member.id;
    }

    trackByUnitId(_: number, unit: Unit) {
        return unit.id;
    }
}
