import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ResponseUnitChartNode } from '@app/features/units/models/units';
import { TreeNode } from 'primeng/api';
import { UnitsService } from '@app/features/command/services/units.service';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-units-orbat',
    templateUrl: './units-orbat.component.html',
    styleUrls: ['../units-page/units-page.component.scss', './units-orbat.component.scss'],
})
export class UnitsOrbatComponent {
    rootNodes: TreeNode[];
    selectedNode;

    constructor(private unitsService: UnitsService, private router: Router) {
        this.unitsService.getChart('combat').pipe(first()).subscribe({
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
                members: nodeData.members,
            },
            type: 'unit',
            expanded: true,
        };
    }
}
