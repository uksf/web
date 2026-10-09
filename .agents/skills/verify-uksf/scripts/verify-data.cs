#:package MongoDB.Driver@3.6.0
#:property PublishAot=false

using System.Text.Json;
using MongoDB.Bson;
using MongoDB.Driver;

const string RequiredDatabase = "devLocal";
var usage = "usage: verify-data <settings-json> doctor|account <email> [<account-id>]|application <account-id> <email>|funnel <run-id>|mission <session-id>|gameserver-port <port>";

if (args.Length < 2 || (args[1] != "doctor" && args.Length < 3) || (args[1] == "application" && args.Length < 4))
{
    Console.Error.WriteLine(usage);
    return 2;
}

var settings = JsonDocument.Parse(File.ReadAllText(args[0]));
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
var filter = Builders<BsonDocument>.Filter;

static List<string> ApplicationThreads(BsonDocument account)
{
    var application = account.GetValue("application", BsonNull.Value);
    return application.IsBsonDocument
        ? new[] { "recruiterCommentThread", "applicationCommentThread" }.Select(x => application.AsBsonDocument.GetValue(x, BsonNull.Value)).Where(x => !x.IsBsonNull).Select(x => x.ToString()!).ToList()
        : [];
}

static bool MintedBySameProcess(ObjectId id, ObjectId reference) => id.ToByteArray().Skip(4).Take(5).SequenceEqual(reference.ToByteArray().Skip(4).Take(5));

FilterDefinition<BsonDocument> RunAccount(ObjectId id, string email) => filter.And(filter.Eq("_id", id), filter.Eq("email", email));

async Task<long> UnitMembersTotal() =>
    (await units.Find(FilterDefinition<BsonDocument>.Empty).Project(Builders<BsonDocument>.Projection.Include("members")).ToListAsync())
        .Sum(x => (long)x.GetValue("members", new BsonArray()).AsBsonArray.Count);

async Task<List<string>> MintedThreads(ObjectId accountId)
{
    var since = new ObjectId(accountId.ToByteArray().Take(4).Concat(new byte[8]).ToArray());
    var ids = await commentThreads.Find(filter.Gte("_id", since)).Project(Builders<BsonDocument>.Projection.Include("_id")).ToListAsync();
    return ids.Select(x => x["_id"].AsObjectId).Where(x => MintedBySameProcess(x, accountId)).Select(x => x.ToString()).OrderBy(x => x).ToList();
}

async Task<List<string>> ExpectedNotificationOwners(ObjectId applicantId, BsonValue recruiter)
{
    var recruitmentUnitId = (await database.GetCollection<BsonDocument>("variables").Find(filter.Eq("key", "UNIT_ID_RECRUITMENT")).FirstOrDefaultAsync())?.GetValue("item", BsonNull.Value);
    var recruitmentUnit = recruitmentUnitId is null || recruitmentUnitId.IsBsonNull ? null : await units.Find(filter.Eq("_id", ObjectId.Parse(recruitmentUnitId.ToString()))).FirstOrDefaultAsync();
    var chain = recruitmentUnit?.GetValue("chainOfCommand", BsonNull.Value);
    var leads = chain is { IsBsonDocument: true } ? new[] { "first", "second", "third", "nco" }.Select(x => chain.AsBsonDocument.GetValue(x, BsonNull.Value)).Where(x => !x.IsBsonNull).Select(x => x.ToString()!) : [];
    var candidates = new[] { applicantId.ToString() }.Concat(recruiter.IsBsonNull ? [] : [recruiter.ToString()!]).Concat(leads).Distinct().ToList();
    var notifiable = await accounts.Find(filter.And(filter.In("_id", candidates.Select(ObjectId.Parse)), filter.Ne("membershipState", 3))).Project(Builders<BsonDocument>.Projection.Include("_id")).ToListAsync();
    return notifiable.Select(x => x["_id"].ToString()!).OrderBy(x => x).ToList();
}

switch (args[1])
{
    case "doctor":
        await database.RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1));
        var server = MongoUrl.Create(connectionString).Server;
        var addresses = await System.Net.Dns.GetHostAddressesAsync(server.Host);
        Console.WriteLine($"database={databaseName} server={server.Host}:{server.Port} ips={string.Join(",", addresses.Select(x => x.ToString()))} reachable");
        return 0;

    case "account":
        var byEmail = filter.Eq("email", args[2]);
        var account = await accounts.Find(args.Length > 3 ? RunAccount(ObjectId.Parse(args[3]), args[2]) : byEmail).FirstOrDefaultAsync();
        if (account is null)
        {
            var orphanCodes = await codes.CountDocumentsAsync(filter.Eq("value", args[2]));
            var visitor = $"verify-{args[2].Split('+', '@')[1]}";
            var orphanFunnel = await funnelEvents.CountDocumentsAsync(filter.Eq("visitorId", visitor));
            Console.WriteLine(JsonSerializer.Serialize(new { found = false, confirmationCodes = orphanCodes, funnelEvents = orphanFunnel }));
            return 1;
        }

        var state = account.GetValue("membershipState", BsonNull.Value);
        string[] membershipStates = ["Unconfirmed", "Confirmed", "Member", "Discharged", "Server", "Empty"];
        var stateName = state.IsInt32 && state.AsInt32 < membershipStates.Length ? membershipStates[state.AsInt32] : state.ToString();
        Console.WriteLine(JsonSerializer.Serialize(new { found = true, id = account["_id"].ToString(), email = args[2], membershipState = stateName }));
        return 0;

    case "funnel":
        var events = await funnelEvents.Find(filter.Eq("visitorId", $"verify-{args[2]}")).Project(Builders<BsonDocument>.Projection.Include("_id").Include("event")).ToListAsync();
        Console.WriteLine(JsonSerializer.Serialize(new { visitorId = $"verify-{args[2]}", events = events.Select(x => new { id = x["_id"].ToString(), @event = x.GetValue("event", BsonNull.Value).ToString() }).ToArray() }));
        return 0;

    case "gameserver-port":
        var servers = await database.GetCollection<BsonDocument>("gameServers").CountDocumentsAsync(filter.Eq("apiPort", int.Parse(args[2])));
        Console.WriteLine(JsonSerializer.Serialize(new { apiPort = int.Parse(args[2]), configuredServers = servers }));
        return servers == 0 ? 0 : 1;

    case "mission":
        var session = await missionSessions.Find(filter.Eq("sessionId", args[2])).FirstOrDefaultAsync();
        if (session is null)
        {
            var orphanStats = await playerMissionStats.CountDocumentsAsync(filter.Eq("missionSessionId", args[2]));
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
        var applicantId = ObjectId.Parse(args[2]);
        var applicant = await accounts.Find(RunAccount(applicantId, args[3])).FirstOrDefaultAsync();
        if (applicant is null)
        {
            Console.WriteLine(JsonSerializer.Serialize(new { found = false, mintedThreads = await MintedThreads(applicantId) }));
            return 1;
        }

        var application = applicant.GetValue("application", BsonNull.Value);
        var applicationState = application.IsBsonDocument ? application.AsBsonDocument.GetValue("state", BsonNull.Value) : BsonNull.Value;
        var recruiter = application.IsBsonDocument ? application.AsBsonDocument.GetValue("recruiter", BsonNull.Value) : BsonNull.Value;
        string[] applicationStates = ["Accepted", "Rejected", "Waiting"];
        var accountNotifications = filter.Or(filter.Eq("owner", applicantId), filter.Eq("link", $"/recruitment/{applicantId}"));
        var notificationDocs = await notifications.Find(accountNotifications).ToListAsync();
        var holdingUnits = (await units.Find(filter.AnyEq("members", applicantId)).Project(Builders<BsonDocument>.Projection.Include("_id")).ToListAsync()).Select(x => x["_id"].ToString()).ToArray();
        var threads = ApplicationThreads(applicant);
        var threadDocuments = await commentThreads.CountDocumentsAsync(filter.In("_id", threads.Select(ObjectId.Parse)));
        var visitorId = $"verify-{args[3].Split('+', '@')[1]}";
        var applicantFunnel = await funnelEvents.Find(filter.Eq("visitorId", visitorId)).ToListAsync();
        Console.WriteLine(JsonSerializer.Serialize(new
        {
            found = true,
            accountId = applicantId.ToString(),
            applicationState = applicationState.IsInt32 && applicationState.AsInt32 < applicationStates.Length ? applicationStates[applicationState.AsInt32] : applicationState.IsBsonNull ? null : applicationState.ToString(),
            recruiter = recruiter.IsBsonNull ? null : recruiter.ToString(),
            armaExperience = applicant.GetValue("armaExperience", BsonNull.Value).ToString(),
            unitsExperience = applicant.GetValue("unitsExperience", BsonNull.Value).ToString(),
            background = applicant.GetValue("background", BsonNull.Value).ToString(),
            reference = applicant.GetValue("reference", BsonNull.Value).ToString(),
            rolePreferences = applicant.GetValue("rolePreferences", new BsonArray()).AsBsonArray.Select(x => x.ToString()).ToArray(),
            rank = applicant.GetValue("rank", BsonNull.Value).ToString(),
            roleAssignment = applicant.GetValue("roleAssignment", BsonNull.Value).ToString(),
            serviceRecord = applicant.GetValue("serviceRecord", new BsonArray()).AsBsonArray.Select(x => x.AsBsonDocument.GetValue("occurence", BsonNull.Value).ToString()).ToArray(),
            commentThreads = threads,
            threadDocuments,
            mintedThreads = await MintedThreads(applicantId),
            notifications = notificationDocs.Select(x => x["_id"].ToString()).ToArray(),
            notificationOwners = notificationDocs.Select(x => x.GetValue("owner", BsonNull.Value).ToString()).OrderBy(x => x).ToArray(),
            recruiterAssigned = notificationDocs.Any(x => x.GetValue("owner", BsonNull.Value).ToString() == recruiter.ToString() && x.GetValue("link", BsonNull.Value).ToString() == $"/recruitment/{applicantId}"),
            expectedNotificationOwners = await ExpectedNotificationOwners(applicantId, recruiter),
            units = holdingUnits,
            unitMembersTotal = await UnitMembersTotal(),
            funnelEvents = applicantFunnel.Select(x => new { id = x["_id"].ToString(), @event = x.GetValue("event", BsonNull.Value).ToString() }).ToArray()
        }));
        return 0;

    default:
        Console.Error.WriteLine(usage);
        return 2;
}
