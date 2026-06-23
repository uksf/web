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
    @Input() showMedicLinks = true; // medic attachments are a combat-chart concern only
    @Input() twoLineHeader = false; // force the unit name onto two lines (aux chart)

    get isEmpty(): boolean {
        return !(this.members?.length > 0);
    }

    get headerLine1(): string {
        const i = this.name.indexOf(' ');
        return i < 0 ? this.name : this.name.slice(0, i);
    }

    get headerLine2(): string {
        const i = this.name.indexOf(' ');
        return i < 0 ? '' : this.name.slice(i + 1);
    }
}
