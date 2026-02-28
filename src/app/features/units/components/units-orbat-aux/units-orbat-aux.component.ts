import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResponseUnitChartNode } from '@app/features/units/models/units';
import { TreeNode, PrimeTemplate } from 'primeng/api';
import { UnitsService } from '@app/features/command/services/units.service';
import { first } from 'rxjs/operators';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';

@Component({
    selector: 'app-units-orbat-aux',
    templateUrl: './units-orbat-aux.component.html',
    styleUrls: ['../units-page/units-page.component.scss', './units-orbat-aux.component.scss'],
    imports: [DefaultContentAreasComponent, MainContentAreaComponent, MatProgressSpinner, OrganizationChartModule, PrimeTemplate, FlexFillerComponent]
})
export class UnitsOrbatAuxComponent {
    private unitsService = inject(UnitsService);
    private router = inject(Router);

    rootNodes: TreeNode[];
    selectedNode;

    constructor() {
        this.unitsService
            .getChart('auxiliary')
            .pipe(first())
            .subscribe({
                next: (rootNodeData: ResponseUnitChartNode) => {
                    const rootNode: TreeNode = this.mapToTreeNode(rootNodeData);
                    this.rootNodes = [rootNode];
                }
            });
    }

    trackByName(index: number, item: { name: string }): string {
        return item.name;
    }

    onNodeSelect(event) {
        this.router.navigate(['/units', event.node.data.id]);
    }

    private mapToTreeNode(nodeData: ResponseUnitChartNode): TreeNode {
        return {
            label: nodeData.name,
            children: nodeData.children.map((childNode) => this.mapToTreeNode(childNode)),
            data: {
                id: nodeData.id,
                members: nodeData.members
            },
            type: 'unit',
            expanded: true
        };
    }
}
