#:package MongoDB.Driver@3.6.0
#:property PublishAot=false

using System.Text.Json;
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;

const string RequiredDatabase = "devLocal";

if (args.Length < 2 || (args[1] != "doctor" && args.Length < 3))
{
    Console.Error.WriteLine("usage: verify-data <settings-json> doctor|account <email>|mission <session-id>|gameserver-port <port>|application <email>|cleanup <run-id> [--dry-run] account|funnel|application|mission...");
    return 2;
}

var settingsPath = args[0];
var settings = JsonDocument.Parse(File.ReadAllText(settingsPath));
var connectionString = settings.RootElement.GetProperty("appSettings").GetProperty("connectionStrings").GetProperty("database").GetString()!;
var databaseName = MongoUrl.Create(connectionString).DatabaseName;
if (databaseName != RequiredDatabase)
{
    Console.Error.WriteLine($"refusing: the API points at '{databaseName}', not '{RequiredDatabase}'");
    return 3;
}

var database = new MongoClient(connectionString).GetDatabase(databaseName);
var accounts = database.GetCollection<BsonDocument>("accounts");
var codes = database.GetCollection<BsonDocument>("confirmationCodes");
var missionSessions = database.GetCollection<BsonDocument>("missionSessions");
var playerMissionStats = database.GetCollection<BsonDocument>("playerMissionStats");
var commentThreads = database.GetCollection<BsonDocument>("commentThreads");
var notifications = database.GetCollection<BsonDocument>("notifications");
var units = database.GetCollection<BsonDocument>("units");
var funnelEvents = database.GetCollection<BsonDocument>("applicationFunnelEvents");

static string VisitorId(string email) => $"verify-{Regex.Match(email, "v[0-9]{14}-[0-9a-f]{4}").Value}";

static List<string> ApplicationThreads(BsonDocument account)
{
    var application = account.GetValue("application", BsonNull.Value);
    return application.IsBsonDocument
        ? new[] { "recruiterCommentThread", "applicationCommentThread" }.Select(x => application.AsBsonDocument.GetValue(x, BsonNull.Value)).Where(x => !x.IsBsonNull).Select(x => x.ToString()!).ToList()
        : [];
}

async Task<long> UnitMembersTotal() =>
    (await units.Find(FilterDefinition<BsonDocument>.Empty).Project(Builders<BsonDocument>.Projection.Include("members")).ToListAsync())
        .Sum(x => (long)x.GetValue("members", new BsonArray()).AsBsonArray.Count);

FilterDefinition<BsonDocument> AccountNotifications(ObjectId accountId) =>
    Builders<BsonDocument>.Filter.Or(
        Builders<BsonDocument>.Filter.Eq("owner", accountId),
        Builders<BsonDocument>.Filter.Eq("link", $"/recruitment/{accountId}")
    );

switch (args[1])
{
    case "doctor":
        await database.RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1));
        var server = MongoUrl.Create(connectionString).Server;
        var addresses = await System.Net.Dns.GetHostAddressesAsync(server.Host);
        Console.WriteLine($"database={databaseName} server={server.Host}:{server.Port} ips={string.Join(",", addresses.Select(x => x.ToString()))} reachable");
        return 0;

    case "account":
        var account = await accounts.Find(Builders<BsonDocument>.Filter.Eq("email", args[2])).FirstOrDefaultAsync();
        if (account is null)
        {
            var orphanCodes = await codes.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("value", args[2]));
            var orphanFunnel = await funnelEvents.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("visitorId", VisitorId(args[2])));
            Console.WriteLine(JsonSerializer.Serialize(new { found = false, confirmationCodes = orphanCodes, funnelEvents = orphanFunnel }));
            return 1;
        }

        var state = account.GetValue("membershipState", BsonNull.Value);
        string[] membershipStates = ["Unconfirmed", "Confirmed", "Member", "Discharged", "Server", "Empty"];
        var stateName = state.IsInt32 && state.AsInt32 < membershipStates.Length ? membershipStates[state.AsInt32] : state.ToString();
        Console.WriteLine(JsonSerializer.Serialize(new { found = true, id = account["_id"].ToString(), email = args[2], membershipState = stateName }));
        return 0;

    case "gameserver-port":
        var servers = await database.GetCollection<BsonDocument>("gameServers").CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("apiPort", int.Parse(args[2])));
        Console.WriteLine(JsonSerializer.Serialize(new { apiPort = int.Parse(args[2]), configuredServers = servers }));
        return servers == 0 ? 0 : 1;

    case "mission":
        var session = await missionSessions.Find(Builders<BsonDocument>.Filter.Eq("sessionId", args[2])).FirstOrDefaultAsync();
        if (session is null)
        {
            var orphanStats = await playerMissionStats.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("missionSessionId", args[2]));
            Console.WriteLine(JsonSerializer.Serialize(new { found = false, playerMissionStats = orphanStats }));
            return 1;
        }

        var presence = session.GetValue("playerPresence", new BsonArray()).AsBsonArray.Select(x => x.AsBsonDocument).ToList();
        Console.WriteLine(JsonSerializer.Serialize(new
        {
            found = true,
            sessionId = args[2],
            mission = session.GetValue("mission", BsonNull.Value).ToString(),
            map = session.GetValue("map", BsonNull.Value).ToString(),
            missionStarted = session.GetValue("missionStarted", BsonNull.Value).ToString(),
            missionEnded = session.GetValue("missionEnded", BsonNull.Value).ToString(),
            durationSeconds = session.GetValue("durationSeconds", BsonNull.Value).ToString(),
            players = presence.Select(x => x.GetValue("uid", BsonNull.Value).ToString()).ToArray(),
            presence = presence.Select(x => new
            {
                uid = x.GetValue("uid", BsonNull.Value).ToString(),
                name = x.GetValue("name", BsonNull.Value).ToString(),
                connected = x.GetValue("connected", BsonNull.Value).ToString(),
                disconnected = x.GetValue("disconnected", BsonNull.Value).ToString()
            }).ToArray()
        }));
        return 0;

    case "application":
        var applicant = await accounts.Find(Builders<BsonDocument>.Filter.Eq("email", args[2])).FirstOrDefaultAsync();
        if (applicant is null)
        {
            Console.WriteLine(JsonSerializer.Serialize(new { found = false }));
            return 1;
        }

        var applicantId = applicant["_id"].AsObjectId;
        var application = applicant.GetValue("application", BsonNull.Value);
        var applicationState = application.IsBsonDocument ? application.AsBsonDocument.GetValue("state", BsonNull.Value) : BsonNull.Value;
        string[] applicationStates = ["Accepted", "Rejected", "Waiting"];
        var notificationIds = (await notifications.Find(AccountNotifications(applicantId)).Project(Builders<BsonDocument>.Projection.Include("_id")).ToListAsync()).Select(x => x["_id"].ToString()).ToArray();
        var holdingUnits = (await units.Find(Builders<BsonDocument>.Filter.AnyEq("members", applicantId)).Project(Builders<BsonDocument>.Projection.Include("_id")).ToListAsync()).Select(x => x["_id"].ToString()).ToArray();
        var applicantFunnel = await funnelEvents.Find(Builders<BsonDocument>.Filter.Eq("visitorId", VisitorId(args[2]))).ToListAsync();
        Console.WriteLine(JsonSerializer.Serialize(new
        {
            found = true,
            accountId = applicantId.ToString(),
            applicationState = applicationState.IsInt32 && applicationState.AsInt32 < applicationStates.Length ? applicationStates[applicationState.AsInt32] : applicationState.IsBsonNull ? null : applicationState.ToString(),
            recruiter = application.IsBsonDocument ? application.AsBsonDocument.GetValue("recruiter", BsonNull.Value).ToString() : null,
            armaExperience = applicant.GetValue("armaExperience", BsonNull.Value).ToString(),
            reference = applicant.GetValue("reference", BsonNull.Value).ToString(),
            rolePreferences = applicant.GetValue("rolePreferences", new BsonArray()).AsBsonArray.Select(x => x.ToString()).ToArray(),
            rank = applicant.GetValue("rank", BsonNull.Value).ToString(),
            roleAssignment = applicant.GetValue("roleAssignment", BsonNull.Value).ToString(),
            serviceRecord = applicant.GetValue("serviceRecord", new BsonArray()).AsBsonArray.Count,
            commentThreads = ApplicationThreads(applicant),
            notifications = notificationIds,
            units = holdingUnits,
            unitMembersTotal = await UnitMembersTotal(),
            funnelEvents = applicantFunnel.Select(x => new { id = x["_id"].ToString(), @event = x.GetValue("event", BsonNull.Value).ToString() }).ToArray()
        }));
        return 0;

    case "cleanup":
        var runId = args[2];
        if (!Regex.IsMatch(runId, "^v[0-9]{14}-[0-9a-f]{4}$"))
        {
            Console.Error.WriteLine($"refusing: '{runId}' is not a verify run id");
            return 4;
        }

        var email = $"verify+{runId}@uksf-verify.invalid";
        var dryRun = args.Contains("--dry-run");
        var kinds = args.Skip(3).Where(x => x != "--dry-run").ToHashSet();
        var unknownKinds = kinds.Except(["account", "funnel", "mission", "application"]).ToList();
        if (kinds.Count == 0 || unknownKinds.Count > 0)
        {
            Console.Error.WriteLine($"refusing: cleanup needs record kinds 'account', 'funnel', 'application' or 'mission' from the run's manifest, got '{string.Join(" ", args.Skip(3))}'");
            return 4;
        }

        var sessionId = $"verify-{runId}";
        var deletions = new List<(string Name, IMongoCollection<BsonDocument> Collection, FilterDefinition<BsonDocument> Filter)>();
        var remainingChecks = new Dictionary<string, Func<Task<long>>>();
        ObjectId? manifestAccount = null;
        long unitMembersTotalBefore = 0;
        if (kinds.Contains("application"))
        {
            var manifestPath = Path.Combine(Path.GetDirectoryName(Path.GetFullPath(settingsPath))!, "application-writes.json");
            var manifest = JsonDocument.Parse(File.ReadAllText(manifestPath)).RootElement;
            var ownerId = ObjectId.Parse(manifest.GetProperty("accountId").GetString()!);
            manifestAccount = ownerId;
            var owner = await accounts.Find(Builders<BsonDocument>.Filter.And(Builders<BsonDocument>.Filter.Eq("_id", ownerId), Builders<BsonDocument>.Filter.Eq("email", email))).FirstOrDefaultAsync();
            if (owner is null)
            {
                Console.Error.WriteLine($"refusing: manifest account {ownerId} is not the run's tagged account {email}");
                return 5;
            }

            var manifestComplete = manifest.TryGetProperty("complete", out var completeFlag) && completeFlag.GetBoolean();
            if (!manifestComplete && owner.Contains("application") && !owner["application"].IsBsonNull)
            {
                Console.Error.WriteLine("refusing: the account has an application but the ownership manifest never recorded its ids");
                return 5;
            }

            List<ObjectId> Recorded(string name) => manifest.GetProperty(name).EnumerateArray().Select(x => ObjectId.Parse(x.GetString()!)).ToList();
            var recordedThreads = Recorded("commentThreads");
            var recordedNotifications = Recorded("notifications");
            if (Recorded("units").Count > 0)
            {
                Console.Error.WriteLine("refusing: the manifest records unit memberships, which this cleanup does not reverse");
                return 5;
            }

            if (recordedThreads.Select(x => x.ToString()).Except(ApplicationThreads(owner)).Any())
            {
                Console.Error.WriteLine("refusing: a recorded comment thread is not one of the account's application threads");
                return 5;
            }

            unitMembersTotalBefore = manifest.GetProperty("unitMembersTotal").GetInt64();
            deletions.Add(("commentThreads", commentThreads, Builders<BsonDocument>.Filter.In("_id", recordedThreads)));
            deletions.Add(("notifications", notifications, Builders<BsonDocument>.Filter.And(Builders<BsonDocument>.Filter.In("_id", recordedNotifications), AccountNotifications(ownerId))));
            remainingChecks["commentThreads"] = () => commentThreads.CountDocumentsAsync(Builders<BsonDocument>.Filter.In("_id", recordedThreads));
            remainingChecks["notifications"] = () => notifications.CountDocumentsAsync(AccountNotifications(ownerId));
            remainingChecks["unitsHoldingAccount"] = () => units.CountDocumentsAsync(Builders<BsonDocument>.Filter.AnyEq("members", ownerId));
        }

        if (kinds.Contains("funnel"))
        {
            var visitor = Builders<BsonDocument>.Filter.Eq("visitorId", VisitorId(email));
            deletions.Add(("applicationFunnelEvents", funnelEvents, visitor));
            remainingChecks["applicationFunnelEvents"] = () => funnelEvents.CountDocumentsAsync(visitor);
        }

        if (kinds.Contains("account"))
        {
            deletions.Add(("accounts", accounts, Builders<BsonDocument>.Filter.Eq("email", email)));
            deletions.Add(("confirmationCodes", codes, Builders<BsonDocument>.Filter.Eq("value", email)));
            remainingChecks["accounts"] = () => accounts.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("email", email));
            remainingChecks["confirmationCodes"] = () => codes.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("value", email));
        }

        if (kinds.Contains("mission"))
        {
            deletions.Add(("missionSessions", missionSessions, Builders<BsonDocument>.Filter.Eq("sessionId", sessionId)));
            deletions.Add(("playerMissionStats", playerMissionStats, Builders<BsonDocument>.Filter.Eq("missionSessionId", sessionId)));
        }

        var counts = new Dictionary<string, long>();
        foreach (var (name, collection, filter) in deletions)
        {
            counts[name] = dryRun ? await collection.CountDocumentsAsync(filter) : (await collection.DeleteManyAsync(filter)).DeletedCount;
        }

        if (dryRun)
        {
            Console.WriteLine(JsonSerializer.Serialize(new { runId, dryRun = true, wouldRemove = counts }));
            return 0;
        }

        var remaining = new Dictionary<string, long>();
        foreach (var (name, check) in remainingChecks)
        {
            remaining[name] = await check();
        }

        var unitMembers = manifestAccount is null ? (object?)null : new { before = unitMembersTotalBefore, now = await UnitMembersTotal() };
        Console.WriteLine(JsonSerializer.Serialize(new { runId, removed = counts, remaining, unitMembersTotal = unitMembers }));
        return remaining.Values.All(x => x == 0) ? 0 : 6;

    default:
        Console.Error.WriteLine($"unknown command '{args[1]}'");
        return 2;
}
