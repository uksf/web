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
    it('isEmpty is true with no members', () => {
        const component = create();
        component.members = [];
        expect(component.isEmpty).toBe(true);
    });

    it('isEmpty is false with members', () => {
        const component = create();
        component.members = [member({ name: 'Pte.A' })];
        expect(component.isEmpty).toBe(false);
    });
});
