import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { OrbatUnitNodeComponent } from './orbat-unit-node.component';
import { ResponseUnitMember } from '@app/features/units/models/units';

function member(partial: Partial<ResponseUnitMember>): ResponseUnitMember {
    return { name: '', role: '', chainOfCommandPosition: '', isAttachedMedic: false, attachedTroopName: null, ...partial };
}

function create(): OrbatUnitNodeComponent {
    TestBed.configureTestingModule({ providers: [OrbatUnitNodeComponent] });
    return TestBed.inject(OrbatUnitNodeComponent);
}

describe('OrbatUnitNodeComponent', () => {
    it('splits members with a CoC position into command, the rest into roster (in order)', () => {
        const component = create();
        component.members = [
            member({ name: 'CSgt.A', chainOfCommandPosition: '1iC' }),
            member({ name: 'Cpl.B', chainOfCommandPosition: '2iC' }),
            member({ name: 'Pte.C' })
        ];
        expect(component.command.map((m) => m.name)).toEqual(['CSgt.A', 'Cpl.B']);
        expect(component.roster.map((m) => m.name)).toEqual(['Pte.C']);
        expect(component.isEmpty).toBe(false);
    });

    it('isEmpty is true with no members', () => {
        const component = create();
        component.members = [];
        expect(component.isEmpty).toBe(true);
    });

    it('attached medics (troop-side) and attached-out medics (SFM-side) both fall in the roster', () => {
        const component = create();
        component.members = [
            member({ name: 'Sgt.Cmd', chainOfCommandPosition: '1iC' }),
            member({ name: 'Pte.SfmMedic', attachedTroopName: 'Air Troop' }),
            member({ name: 'Pte.TroopMedic', isAttachedMedic: true })
        ];
        expect(component.command.map((m) => m.name)).toEqual(['Sgt.Cmd']);
        expect(component.roster.map((m) => m.name)).toEqual(['Pte.SfmMedic', 'Pte.TroopMedic']);
    });
});
