import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ResponseUnitMember } from '@app/features/units/models/units';

@Component({
    selector: 'app-orbat-unit-node',
    templateUrl: './orbat-unit-node.component.html',
    styleUrls: ['./orbat-unit-node.component.scss'],
    imports: [MatIcon, MatTooltip]
})
export class OrbatUnitNodeComponent {
    @Input() name = '';
    @Input() members: ResponseUnitMember[] = [];

    get command(): ResponseUnitMember[] {
        return (this.members ?? []).filter((m) => !!m.chainOfCommandPosition);
    }

    get roster(): ResponseUnitMember[] {
        return (this.members ?? []).filter((m) => !m.chainOfCommandPosition);
    }

    get isEmpty(): boolean {
        return !(this.members?.length > 0);
    }
}
