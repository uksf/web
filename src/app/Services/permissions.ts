export class Permissions {
    // Member state
    public static readonly CONFIRMED = 'CONFIRMED';
    public static readonly MEMBER = 'MEMBER';
    public static readonly UNCONFIRMED = 'UNCONFIRMED';

    // API
    public static readonly SUPERADMIN = 'SUPERADMIN';
    public static readonly ADMIN = 'ADMIN';
    public static readonly COMMAND = 'COMMAND';
    public static readonly NCO = 'NCO';
    public static readonly PERSONNEL = 'PERSONNEL';
    public static readonly RECRUITER = 'RECRUITER';
    public static readonly RECRUITER_LEAD = 'RECRUITER_LEAD';
    public static readonly SERVERS = 'SERVERS';
    public static readonly TESTER = 'TESTER';

    // Frontend only
    public static readonly ACTIVITY = 'ACTIVITY';
    public static readonly DISCHARGES = 'DISCHARGES';
    public static readonly SR5 = 'SR5';
    public static readonly UNLOGGED = 'UNLOGGED';

    public static LookUp(): Record<string, string[]> {
        if (this.lookup) {
            return this.lookup;
        }

        let lookup: Record<string, string[]> = {};

        lookup[Permissions.SUPERADMIN] = [Permissions.SUPERADMIN];
        lookup[Permissions.ADMIN] = [Permissions.ADMIN];
        lookup[Permissions.COMMAND] = [Permissions.COMMAND, Permissions.SERVERS, Permissions.ACTIVITY];
        lookup[Permissions.NCO] = [Permissions.NCO, Permissions.SERVERS, Permissions.ACTIVITY, Permissions.DISCHARGES];
        lookup[Permissions.PERSONNEL] = [Permissions.PERSONNEL];
        lookup[Permissions.RECRUITER] = [Permissions.RECRUITER, Permissions.ACTIVITY, Permissions.DISCHARGES];
        lookup[Permissions.RECRUITER_LEAD] = [Permissions.RECRUITER_LEAD];
        lookup[Permissions.SERVERS] = [Permissions.SERVERS, Permissions.SR5];
        lookup[Permissions.TESTER] = [Permissions.TESTER];

        this.lookup = lookup;
        return this.lookup;
    }

    private static lookup: Record<string, string[]> = undefined;
}
