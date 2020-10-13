import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../../Services/Authentication/authentication.service';
import { UrlService } from '../../../Services/url.service';
import { Router } from '@angular/router';
import { ResponseUnitChartNode } from '../../../Models/Units';
import { TreeNode } from 'primeng/api';

@Component({
    selector: 'app-units-orbat',
    templateUrl: './units-orbat.component.html',
    styleUrls: ['../../../Pages/units-page/units-page.component.scss', './units-orbat.component.scss'],
})
export class UnitsOrbatComponent {
    rootNodes: TreeNode[];
    selectedNode;

    constructor(private httpClient: HttpClient, private urls: UrlService, private auth: AuthenticationService, private router: Router) {
        this.httpClient.get(`${this.urls.apiUrl}/units/chart/combat`).subscribe((rootNodeData: ResponseUnitChartNode) => {
            const rootNode: TreeNode = this.mapToTreeNode(rootNodeData);
            this.rootNodes = [rootNode];
        });
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
