export class Permissions {
    // Member state
    public static readonly CONFIRMED = 'CONFIRMED';
    public static readonly MEMBER = 'MEMBER';
    public static readonly UNCONFIRMED = 'UNCONFIRMED';

    // API
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
    public static readonly UNLOGGED = 'UNLOGGED';
}
