import { Component, Input, ChangeDetectionStrategy, EventEmitter, Output, SimpleChange } from '@angular/core';
import { Loa, LoaReviewState } from '../personnel-loas/personnel-loas.component';
import { NgxPermissionsService } from 'ngx-permissions';
import { Permissions } from 'app/Services/permissions';
import { AnimationTriggerMetadata, trigger, state, style, transition, animate } from '@angular/animations';

export const expansionAnimations: {
    readonly indicatorRotate: AnimationTriggerMetadata;
    readonly bodyExpansion: AnimationTriggerMetadata;
} = {
    /** Animation that rotates the indicator arrow. */
    indicatorRotate: trigger('indicatorRotate', [
        state('collapsed, void', style({ transform: 'rotate(0deg)' })),
        state('expanded', style({ transform: 'rotate(180deg)' })),
        transition('expanded <=> collapsed, void => collapsed',
            animate('200ms cubic-bezier(0.4,0.0,0.2,1)')),
    ]),

    /** Animation that expands and collapses the panel content. */
    bodyExpansion: trigger('bodyExpansion', [
        state('collapsed, void', style({ height: '0', visibility: 'hidden' })),
        state('expanded', style({ height: '*', visibility: 'visible' })),
        transition('expanded <=> collapsed, void => collapsed',
            animate('150ms cubic-bezier(0.4,0.0,0.2,1)')),
    ])
};

@Component({
    selector: 'app-personnel-loas-list',
    templateUrl: './personnel-loas-list.component.html',
    styleUrls: ['../../../Pages/personnel-page/personnel-page.component.scss', '../personnel-loas/personnel-loas.component.scss', './personnel-loas-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        expansionAnimations.indicatorRotate,
        expansionAnimations.bodyExpansion
    ]
})
export class PersonnelLoasListComponent {
    @Input() title: string;
    @Input() completeLoas: Array<Loa>;
    @Input() filterString: string;
    @Input() deletable = true;
    @Output() deleteEvent = new EventEmitter();
    loaReviewState = LoaReviewState;
    filteredLoas: any[] = [];
    loas: Array<Loa> = [];
    pageIndex = 0;
    length = 15;
    lengths = [
        { 'value': 10, 'name': '10' },
        { 'value': 15, 'name': '15' },
        { 'value': 30, 'name': '30' }
    ];
    selectedIndex = -1;

    constructor(private permissions: NgxPermissionsService) { }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }): void {
        this.filter();
    }

    filter() {
        this.filteredLoas = [];
        this.completeLoas.forEach(element => {
            if (String(element.name).toLowerCase().indexOf(this.filterString.toLowerCase()) !== -1) {
                this.filteredLoas.push(element);
            }
        });
        this.loas = this.filteredLoas.filter(x => this.filteredLoas.includes(x));
        this.pageIndex = 0;
        this.navigate(-1);
    }

    navigate(mode) {
        switch (mode) {
            case 0: // Previous
                this.pageIndex -= this.length;
                break;
            case 1: // Next
                this.pageIndex += this.length;
                break;
            default: // Don't navigate
                break;
        }
        this.loas = this.filteredLoas.slice(this.pageIndex, this.pageIndex + this.length);
        this.selectedIndex = -1;
    }

    trackByLoa(loa): number { return loa; }

    min(a, b) {
        return Math.min(a, b);
    }

    getExpandedState(loaIndex) {
        return loaIndex === this.selectedIndex ? 'expanded' : 'collapsed';
    }

    activate(loaIndex) {
        this.selectedIndex = this.selectedIndex === loaIndex ? -1 : loaIndex;
    }

    canViewReason(loa: Loa) {
        if (loa.inChainOfCommand) {
            return true;
        }
        const permissions = this.permissions.getPermissions();
        if (permissions[Permissions.NCO] || permissions[Permissions.COMMAND] || permissions[Permissions.SR1]) {
            return true;
        }

        return false;
    }

    canDelete(loa: Loa) {
        if (!this.deletable) {
            return false;
        }
        if (loa.inChainOfCommand) {
            return true;
        }
        const permissions = this.permissions.getPermissions();
        if (permissions[Permissions.SR10]) {
            return true;
        }

        return false;
    }

    delete(loa: Loa) {
        this.deleteEvent.emit(loa);
    }
}
