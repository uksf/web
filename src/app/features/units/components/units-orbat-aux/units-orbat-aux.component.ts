import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { UrlService } from '@app/core/services/url.service';
import { Router } from '@angular/router';
import { ResponseUnitChartNode } from '@app/features/units/models/units';
import { TreeNode } from 'primeng/api';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-units-orbat-aux',
    templateUrl: './units-orbat-aux.component.html',
    styleUrls: ['../units-page/units-page.component.scss', './units-orbat-aux.component.scss'],
})
export class UnitsOrbatAuxComponent {
    rootNodes: TreeNode[];
    selectedNode;

    constructor(private httpClient: HttpClient, private urls: UrlService, private auth: AuthenticationService, private router: Router) {
        this.httpClient.get(`${this.urls.apiUrl}/units/chart/auxiliary`).pipe(first()).subscribe({
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
