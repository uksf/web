import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../../Services/Authentication/authentication.service';
import { UrlService } from '../../../Services/url.service';
import { Router } from '@angular/router';
import { ResponseUnitChartNode } from '../../../Models/Units';
import { TreeNode } from 'primeng/api';

@Component({
    selector: 'app-units-orbat-secondary',
    templateUrl: './units-orbat-secondary.component.html',
    styleUrls: ['../../../Pages/units-page/units-page.component.scss', './units-orbat-secondary.component.scss', './units-orbat-secondary.component.scss-theme.scss'],
})
export class UnitsOrbatSecondaryComponent {
    rootNodes: TreeNode[];
    selectedNode;

    constructor(private httpClient: HttpClient, private urls: UrlService, private auth: AuthenticationService, private router: Router) {
        this.httpClient.get<ResponseUnitChartNode>(`${this.urls.apiUrl}/units/chart/secondary`).subscribe((rootNodeData: ResponseUnitChartNode) => {
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
