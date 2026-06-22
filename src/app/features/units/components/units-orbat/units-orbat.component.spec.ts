import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { UnitsOrbatComponent } from './units-orbat.component';
import { UnitsService } from '@app/features/command/services/units.service';

describe('UnitsOrbatComponent', () => {
    let component: UnitsOrbatComponent;
    let mockUnitsService: any;
    let mockRouter: any;

    beforeEach(() => {
        mockRouter = { navigate: vi.fn() };
        mockUnitsService = { getChart: vi.fn() };
    });

    function createComponent(): UnitsOrbatComponent {
        TestBed.configureTestingModule({
            providers: [
                UnitsOrbatComponent,
                { provide: Router, useValue: mockRouter },
                { provide: UnitsService, useValue: mockUnitsService }
            ]
        });
        return TestBed.inject(UnitsOrbatComponent);
    }

    describe('mapToTreeNode (via constructor)', () => {
        it('propagates isAttachedMedic through to rootNodes member data', () => {
            mockUnitsService.getChart.mockReturnValue(
                of({
                    id: 'troop',
                    name: '3 Troop',
                    children: [],
                    members: [
                        {
                            name: 'Pvt.Edic',
                            role: 'Medic',
                            chainOfCommandPosition: '',
                            isAttachedMedic: true,
                            attachedTroopName: null
                        }
                    ]
                })
            );

            component = createComponent();

            expect(component.rootNodes[0].data.members[0].isAttachedMedic).toBe(true);
        });

        it('propagates attachedTroopName through to rootNodes member data', () => {
            mockUnitsService.getChart.mockReturnValue(
                of({
                    id: 'sfm',
                    name: 'SFM',
                    children: [],
                    members: [
                        {
                            name: 'Pvt.Smith',
                            role: 'Rifleman',
                            chainOfCommandPosition: 'NCO',
                            isAttachedMedic: false,
                            attachedTroopName: '3 Troop'
                        }
                    ]
                })
            );

            component = createComponent();

            expect(component.rootNodes[0].data.members[0].attachedTroopName).toBe('3 Troop');
        });

        it('maps label and children correctly', () => {
            mockUnitsService.getChart.mockReturnValue(
                of({
                    id: 'root',
                    name: 'Root Unit',
                    children: [
                        {
                            id: 'child',
                            name: 'Child Unit',
                            children: [],
                            members: []
                        }
                    ],
                    members: []
                })
            );

            component = createComponent();

            expect(component.rootNodes[0].label).toBe('Root Unit');
            expect(component.rootNodes[0].children[0].label).toBe('Child Unit');
        });
    });
});
