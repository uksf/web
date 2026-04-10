import { AfterViewInit, ChangeDetectorRef, Component, Input, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { Unit } from '@app/features/units/models/units';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { all, any } from '@app/shared/services/helper.service';
import { Account } from '@app/shared/models/account';
import { CommandMemberCardComponent } from '../command-member-card/command-member-card.component';

@Component({
    selector: 'app-command-unit-group-card',
    templateUrl: './command-unit-group-card.component.html',
    styleUrls: ['./command-unit-group-card.component.scss'],
    imports: [MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, CommandMemberCardComponent]
})
export class CommandUnitGroupCardComponent implements AfterViewInit {
    private cdr = inject(ChangeDetectorRef);

    @ViewChild(MatAccordion) accordion: MatAccordion;
    @ViewChildren(CommandUnitGroupCardComponent) children: QueryList<CommandUnitGroupCardComponent>;
    @Input('unit') unit: Unit;
    @Input('hideEmpty') hideEmpty: boolean = false;

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
