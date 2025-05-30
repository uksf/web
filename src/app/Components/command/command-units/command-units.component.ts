import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { AddUnitModalComponent } from '../../../Modals/command/add-unit-modal/add-unit-modal.component';
import { ITreeOptions, KEYS, TREE_ACTIONS, TreeNode } from '@circlon/angular-tree-component';
import { Permissions } from 'app/Services/permissions';
import { PermissionsService } from 'app/Services/permissions.service';
import { RequestUnitUpdateOrder, RequestUnitUpdateParent, ResponseUnit, UnitTreeDataSet } from '../../../Models/Units';

@Component({
    selector: 'app-command-units',
    templateUrl: './command-units.component.html',
    styleUrls: ['../../../Pages/command-page/command-page.component.scss', './command-units.component.scss']
})
export class CommandUnitsComponent implements OnInit {
    @ViewChild('combatUnitsTree') combatUnitsTree: TreeNode;
    @ViewChild('auxiliaryUnitsTree') auxiliaryUnitsTree: TreeNode;
    @ViewChild('secondaryUnitsTree') secondaryUnitsTree: TreeNode;
    options: ITreeOptions = {
        actionMapping: {
            mouse: {
                click: null,
                dblClick: TREE_ACTIONS.TOGGLE_EXPANDED
            },
            keys: {
                [KEYS.SPACE]: null,
                [KEYS.ENTER]: null
            }
        }
    };
    updatingOrder = false;
    combat: any[];
    auxiliary: any[];
    secondary: any[];

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private permissions: PermissionsService) {
        if (permissions.hasPermission(Permissions.ADMIN)) {
            this.options = {
                allowDrag: (node: TreeNode) => !this.updatingOrder && node.parent && !node.parent.data.virtual,
                allowDrop: true,
                actionMapping: {
                    mouse: {
                        dblClick: TREE_ACTIONS.TOGGLE_EXPANDED
                    }
                }
            };
        }
    }

    ngOnInit() {
        this.getUnits();
    }

    resetTree() {
        this.updatingOrder = false;
        this.combatUnitsTree.treeModel.expandAll();
        this.auxiliaryUnitsTree.treeModel.expandAll();
        this.secondaryUnitsTree.treeModel.expandAll();
        if (this.combatUnitsTree.treeModel.getFocusedNode()) {
            this.combatUnitsTree.treeModel.getFocusedNode().toggleActivated();
            this.combatUnitsTree.treeModel.getFocusedNode().blur();
        }
        if (this.auxiliaryUnitsTree.treeModel.getFocusedNode()) {
            this.auxiliaryUnitsTree.treeModel.getFocusedNode().toggleActivated();
            this.auxiliaryUnitsTree.treeModel.getFocusedNode().blur();
        }
        if (this.secondaryUnitsTree.treeModel.getFocusedNode()) {
            this.secondaryUnitsTree.treeModel.getFocusedNode().toggleActivated();
            this.secondaryUnitsTree.treeModel.getFocusedNode().blur();
        }
    }

    getUnits() {
        this.httpClient.get(`${this.urls.apiUrl}/units/tree`).subscribe((response: UnitTreeDataSet) => {
            this.combat = response.combatNodes;
            this.auxiliary = response.auxiliaryNodes;
            this.secondary = response.secondaryNodes;
            setTimeout(() => {
                this.resetTree();
            }, 100);
        });
    }

    addUnit() {
        this.dialog
            .open(AddUnitModalComponent, {})
            .afterClosed()
            .subscribe((_) => {
                this.getUnits();
            });
    }

    editUnit(event) {
        this.httpClient.get(`${this.urls.apiUrl}/units/${event.node.id}`).subscribe((unit: ResponseUnit) => {
            this.dialog
                .open(AddUnitModalComponent, {
                    data: {
                        unit: unit
                    }
                })
                .afterClosed()
                .subscribe((_) => {
                    this.getUnits();
                });
        });
    }

    onMove(event) {
        this.updatingOrder = true;
        if (event.from.parent.id !== event.to.parent.id) {
            const body: RequestUnitUpdateParent = {
                index: event.to.index,
                parentId: event.to.parent.id
            };
            this.httpClient.patch(`${this.urls.apiUrl}/units/${event.node.id}/parent`, body).subscribe((_) => {
                this.getUnits();
            });
        } else {
            const body: RequestUnitUpdateOrder = {
                index: event.to.index
            };
            this.httpClient.patch(`${this.urls.apiUrl}/units/${event.node.id}/order`, body).subscribe((_) => {
                this.getUnits();
            });
        }
    }
}
