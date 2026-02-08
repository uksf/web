import { describe, it, expect } from 'vitest';
import { Permissions } from './permissions';

describe('Permissions', () => {
    describe('LookUp', () => {
        it('returns a record of role to permissions mappings', () => {
            const lookup = Permissions.LookUp();

            expect(lookup).toBeDefined();
            expect(typeof lookup).toBe('object');
        });

        it('maps SUPERADMIN to itself', () => {
            const lookup = Permissions.LookUp();

            expect(lookup[Permissions.SUPERADMIN]).toEqual([Permissions.SUPERADMIN]);
        });

        it('maps COMMAND to COMMAND, SERVERS, and ACTIVITY', () => {
            const lookup = Permissions.LookUp();

            expect(lookup[Permissions.COMMAND]).toEqual([Permissions.COMMAND, Permissions.SERVERS, Permissions.ACTIVITY]);
        });

        it('maps NCO to NCO, SERVERS, ACTIVITY, and DISCHARGES', () => {
            const lookup = Permissions.LookUp();

            expect(lookup[Permissions.NCO]).toEqual([Permissions.NCO, Permissions.SERVERS, Permissions.ACTIVITY, Permissions.DISCHARGES]);
        });

        it('maps RECRUITER to RECRUITER, ACTIVITY, and DISCHARGES', () => {
            const lookup = Permissions.LookUp();

            expect(lookup[Permissions.RECRUITER]).toEqual([Permissions.RECRUITER, Permissions.ACTIVITY, Permissions.DISCHARGES]);
        });

        it('maps SERVERS to SERVERS and SR5', () => {
            const lookup = Permissions.LookUp();

            expect(lookup[Permissions.SERVERS]).toEqual([Permissions.SERVERS, Permissions.SR5]);
        });

        it('returns the same instance on subsequent calls', () => {
            const lookup1 = Permissions.LookUp();
            const lookup2 = Permissions.LookUp();

            expect(lookup1).toBe(lookup2);
        });

        it('contains all expected roles', () => {
            const lookup = Permissions.LookUp();
            const expectedRoles = [
                Permissions.SUPERADMIN,
                Permissions.ADMIN,
                Permissions.COMMAND,
                Permissions.NCO,
                Permissions.PERSONNEL,
                Permissions.RECRUITER,
                Permissions.RECRUITER_LEAD,
                Permissions.SERVERS,
                Permissions.TESTER
            ];

            expectedRoles.forEach(role => {
                expect(lookup[role]).toBeDefined();
            });
        });
    });
});
