import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material';
import { Observable, timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { AddUnitModalComponent } from '../../../Modals/command/add-unit-modal/add-unit-modal.component';
import { ITreeOptions, TreeNode, KEYS, TREE_ACTIONS } from 'angular-tree-component';
import { NgxPermissionsService } from 'ngx-permissions';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { Permissions } from 'app/Services/permissions';

@Component({
    selector: 'app-command-units',
    templateUrl: './command-units.component.html',
    styleUrls: ['../../../Pages/command-page/command-page.component.css', './command-units.component.css']
})
export class CommandUnitsComponent implements OnInit {
    @ViewChild('combatUnitsTree', {static: false}) combatUnitsTree: TreeNode;
    @ViewChild('auxiliaryUnitsTree', {static: false}) auxiliaryUnitsTree: TreeNode;
    options: ITreeOptions = {
        actionMapping: {
            mouse: {
                click: null,
                dblClick: TREE_ACTIONS.TOGGLE_EXPANDED
            }, keys: {
                [KEYS.SPACE]: null,
                [KEYS.ENTER]: null
            }
        }
    };
    updatingOrder = false;
    combatUnits;
    auxiliaryUnits;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private permissions: NgxPermissionsService) {
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
        if (this.combatUnitsTree.treeModel.getFocusedNode()) {
            this.combatUnitsTree.treeModel.getFocusedNode().toggleActivated();
            this.combatUnitsTree.treeModel.getFocusedNode().blur();
        }
        if (this.auxiliaryUnitsTree.treeModel.getFocusedNode()) {
            this.auxiliaryUnitsTree.treeModel.getFocusedNode().toggleActivated();
            this.auxiliaryUnitsTree.treeModel.getFocusedNode().blur();
        }
    }

    getUnits() {
        this.httpClient.get(`${this.urls.apiUrl}/units/tree`).subscribe(response => {
            this.combatUnits = response['combatUnits'];
            this.auxiliaryUnits = response['auxiliaryUnits'];
            setTimeout(() => {
                this.resetTree();
            }, 100);
        });
    }

    addUnit() {
        this.dialog.open(AddUnitModalComponent, {}).afterClosed().subscribe(_ => {
            this.getUnits();
        });
    }

    editUnit(event) {
        this.dialog.open(AddUnitModalComponent, {
            data: {
                unit: event.node.data.unit
            }
        }).afterClosed().subscribe(_ => {
            this.getUnits();
        });
    }

    deleteUnit(unit) {
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${unit.name}'?` }
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.httpClient.delete(`${this.urls.apiUrl}/units/${unit.id}`).subscribe(_ => {
                this.getUnits();
            });
        });
    }

    onMove(event) {
        this.updatingOrder = true;
        if (event.node.unit.parent !== event.to.parent.unit.id) {
            this.httpClient.post(`${this.urls.apiUrl}/units/parent`, { unit: event.node.unit, parentUnit: event.to.parent.unit, index: event.to.index }).subscribe(_ => {
                this.getUnits();
            });
        } else {
            this.httpClient.post(`${this.urls.apiUrl}/units/order`, { unit: event.node.unit, index: event.to.index }).subscribe(_ => {
                this.getUnits();
            });
        }
    }
}
