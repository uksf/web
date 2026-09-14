import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OperationsServersComponent } from './operations-servers.component';
import { setupOperationsServersSpec, teardownOperationsServersSpec } from './operations-servers.spec-setup';

describe('OperationsServersComponent missions', () => {
    let component: OperationsServersComponent;

    beforeEach(() => {
        component = setupOperationsServersSpec().component;
    });

    afterEach(() => {
        teardownOperationsServersSpec();
    });

    describe('mapMission', () => {
        it('maps dropdown element to Mission', () => {
            const element = { value: '/path/to/mission.pbo', displayValue: 'mission', data: 'Altis' };

            const result = component.mapMission(element);

            expect(result).toEqual({ path: '/path/to/mission.pbo', name: 'mission', map: 'Altis', size: 0, lastModified: '' });
        });
    });

    describe('mapMissionElement', () => {
        it('maps Mission to dropdown element', () => {
            const mission = { path: '/path/to/mission.pbo', name: 'mission', map: 'Altis' };

            const result = component.mapMissionElement(mission);

            expect(result).toEqual({ value: '/path/to/mission.pbo', displayValue: 'mission', data: 'Altis' });
        });
    });

    describe('missionFormatter', () => {
        it('formats mission name and map', () => {
            expect(component.missionFormatter('co40_test', 'Altis')).toBe('co40_test.Altis');
        });
    });

    describe('getMissionName', () => {
        it('returns map and name formatted', () => {
            const element = { value: '/path', displayValue: 'co40_test', data: 'Altis' };

            expect(component.getMissionName(element)).toBe('Altis, co40_test');
        });
    });

    describe('getMissionTooltip', () => {
        it('returns mission path', () => {
            const element = { value: '/path/to/mission.pbo', displayValue: 'mission', data: 'Altis' };

            expect(component.getMissionTooltip(element)).toBe('/path/to/mission.pbo');
        });
    });

    describe('displayWithMission', () => {
        it('returns empty string for null element', () => {
            expect(component.displayWithMission(null)).toBe('');
        });

        it('returns formatted mission name', () => {
            const element = { value: '/path', displayValue: 'co40_test', data: 'Altis' };

            expect(component.displayWithMission(element)).toBe('co40_test.Altis');
        });
    });

    describe('missionFilter', () => {
        it('matches by name', () => {
            const element = { value: '/path/co40_test.Altis.pbo', displayValue: 'co40_test', data: 'Altis' };

            expect(component.missionFilter(element, 'co40')).toBe(true);
        });

        it('matches by path', () => {
            const element = { value: '/path/co40_test.Altis.pbo', displayValue: 'co40_test', data: 'Altis' };

            expect(component.missionFilter(element, '/path')).toBe(true);
        });

        it('returns false for no match', () => {
            const element = { value: '/path/co40_test.Altis.pbo', displayValue: 'co40_test', data: 'Altis' };

            expect(component.missionFilter(element, 'xyz')).toBe(false);
        });
    });

    describe('missionMatcher', () => {
        it('matches formatted mission string', () => {
            const element = { value: '/path', displayValue: 'co40_test', data: 'Altis' };

            expect(component.missionMatcher(element, 'co40_test.altis')).toBe(true);
        });

        it('returns false for non-matching string', () => {
            const element = { value: '/path', displayValue: 'co40_test', data: 'Altis' };

            expect(component.missionMatcher(element, 'wrong')).toBe(false);
        });
    });
});
