import { Component, Input, OnInit } from '@angular/core';
import { Account } from '../../../../Models/Account';
import { expansionAnimations } from '../../../../Services/animations.service';
import { MatDialog } from '@angular/material/dialog';
import { RequestRankModalComponent } from '../../../../Modals/command/request-rank-modal/request-rank-modal.component';
import { RequestRoleModalComponent } from '../../../../Modals/command/request-role-modal/request-role-modal.component';
import { RequestTransferModalComponent } from '../../../../Modals/command/request-transfer-modal/request-transfer-modal.component';
import { RequestModalData } from '../../../../Models/Shared';

@Component({
    selector: 'app-command-member-card',
    templateUrl: './command-member-card.component.html',
    styleUrls: ['./command-member-card.component.scss'],
    animations: [expansionAnimations.indicatorRotate, expansionAnimations.bodyExpansion]
})
export class CommandMemberCardComponent implements OnInit {
    @Input('member') member: Account;
    expanded: boolean = false;
    hover: boolean = false;

    constructor(private dialog: MatDialog) {}

    ngOnInit(): void {}

    editRank() {
        const data: RequestModalData = {
            ids: [this.member.id]
        };
        this.dialog.open(RequestRankModalComponent, {
            data: data
        });
    }

    editRole() {
        const data: RequestModalData = {
            ids: [this.member.id]
        };
        this.dialog.open(RequestRoleModalComponent, {
            data: data
        });
    }

    editUnit() {
        const data: RequestModalData = {
            ids: [this.member.id]
        };
        this.dialog.open(RequestTransferModalComponent, {
            data: data
        });
    }

    toggle(event) {
        this.expanded = !this.expanded;

        event.stopPropagation();
    }

    onMouseOver() {
        this.hover = true;
    }

    onMouseLeave() {
        this.hover = false;
    }

    get toggleState(): string {
        return this.expanded ? 'expanded' : 'collapsed';
    }
}
