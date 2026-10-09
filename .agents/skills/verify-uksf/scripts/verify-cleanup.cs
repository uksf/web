#:package MongoDB.Driver@3.6.0
#:property PublishAot=false

using System.Text.Json;
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;

if (args.Length < 3)
{
    Console.Error.WriteLine("usage: verify-cleanup <settings-json> <run-id> [--dry-run] account|funnel|application|mission...");
    return 2;
}

var settingsPath = args[0];
var runDir = Path.GetDirectoryName(Path.GetFullPath(settingsPath))!;
var connectionString = JsonDocument.Parse(File.ReadAllText(settingsPath)).RootElement.GetProperty("appSettings").GetProperty("connectionStrings").GetProperty("database").GetString()!;
var databaseName = MongoUrl.Create(connectionString).DatabaseName;
if (databaseName != "devLocal")
{
    Console.Error.WriteLine($"refusing: the API points at '{databaseName}', not 'devLocal'");
    return 3;
}

var runId = args[1];
if (!Regex.IsMatch(runId, "^v[0-9]{14}-[0-9a-f]{16}$"))
{
    Console.Error.WriteLine($"refusing: '{runId}' is not a verify run id");
    return 4;
}

var dryRun = args.Contains("--dry-run");
var kinds = args.Skip(2).Where(x => x != "--dry-run").ToHashSet();
if (kinds.Count == 0 || kinds.Except(["account", "funnel", "mission", "application"]).Any())
{
    Console.Error.WriteLine($"refusing: cleanup needs record kinds 'account', 'funnel', 'application' or 'mission' from the run's manifest, got '{string.Join(" ", args.Skip(2))}'");
    return 4;
}

var database = new MongoClient(connectionString).GetDatabase(databaseName);
IMongoCollection<BsonDocument> Collection(string name) => database.GetCollection<BsonDocument>(name);
var filter = Builders<BsonDocument>.Filter;
var email = $"verify+{runId}@uksf-verify.invalid";
var visitorId = $"verify-{runId}";
var sessionId = $"verify-{runId}";

JsonElement? Manifest(string name) => File.Exists(Path.Combine(runDir, name)) ? JsonDocument.Parse(File.ReadAllText(Path.Combine(runDir, name))).RootElement : null;
List<ObjectId> Ids(JsonElement? manifest, string name) =>
    manifest is { } m && m.TryGetProperty(name, out var list) ? list.EnumerateArray().Select(x => ObjectId.Parse(x.GetString()!)).ToList() : [];
int Refuse(string message)
{
    Console.Error.WriteLine($"refusing: {message}");
    return 5;
}

var accountWrites = Manifest("account-writes.json");
ObjectId? accountId = accountWrites is { } aw && aw.TryGetProperty("accountId", out var pinned) ? ObjectId.Parse(pinned.GetString()!) : null;
var accounts = Collection("accounts");
var accountByEmail = await accounts.Find(filter.Eq("email", email)).FirstOrDefaultAsync();
if (accountId is null && (accountByEmail is not null || kinds.Contains("application")))
{
    return Refuse($"the run never recorded its account id, and {(accountByEmail is null ? "an application cannot be cleaned without it" : $"{email} exists as {accountByEmail["_id"]}")}; check it is this run's and remove it by hand");
}

if (accountByEmail is not null && accountByEmail["_id"].AsObjectId != accountId)
{
    return Refuse($"{email} is account {accountByEmail["_id"]}, not the pinned {accountId}");
}

var owner = accountId is { } id ? await accounts.Find(filter.And(filter.Eq("_id", id), filter.Eq("email", email))).FirstOrDefaultAsync() : null;
if (accountId is { } idTaken && owner is null && await accounts.CountDocumentsAsync(filter.Eq("_id", idTaken)) > 0)
{
    return Refuse($"account {idTaken} exists with another email");
}

var deletions = new List<(string Name, IMongoCollection<BsonDocument> Collection, FilterDefinition<BsonDocument> Filter)>();
var remainingChecks = new Dictionary<string, (IMongoCollection<BsonDocument> Collection, FilterDefinition<BsonDocument> Filter)>();
long? unitMembersTotalBefore = null;

async Task<long> UnitMembersTotal() =>
    (await Collection("units").Find(FilterDefinition<BsonDocument>.Empty).Project(Builders<BsonDocument>.Projection.Include("members")).ToListAsync())
        .Sum(x => (long)x.GetValue("members", new BsonArray()).AsBsonArray.Count);

if (kinds.Contains("application"))
{
    var manifest = Manifest("application-writes.json");
    var ownerId = accountId!.Value;
    if (manifest is null || manifest.Value.GetProperty("accountId").GetString() != ownerId.ToString())
    {
        return Refuse($"the application manifest does not name the pinned account {ownerId}");
    }

    if (manifest.Value.TryGetProperty("orphanRisk", out var risk) && risk.GetBoolean())
    {
        Console.Error.WriteLine($"orphan risk: the drive could not record which comment threads its submit created for account {ownerId}. Find the commentThreads minted by this run's API (their _id shares bytes 5-9 with {ownerId} and is not older than it), delete them by id, then remove application-writes.json's orphanRisk and run down again");
        return 7;
    }

    if (!manifest.Value.GetProperty("complete").GetBoolean() && owner is not null && owner.GetValue("application", BsonNull.Value).IsBsonDocument)
    {
        return Refuse("the account has an application but the ownership manifest never recorded its ids");
    }

    var since = new ObjectId(ownerId.ToByteArray().Take(4).Concat(new byte[8]).ToArray());
    var minted = (await Collection("commentThreads").Find(filter.Gte("_id", since)).Project(Builders<BsonDocument>.Projection.Include("_id")).ToListAsync())
        .Select(x => x["_id"].AsObjectId).Where(x => x.ToByteArray().Skip(4).Take(5).SequenceEqual(ownerId.ToByteArray().Skip(4).Take(5))).ToHashSet();
    var recordedThreads = Ids(manifest, "commentThreads").ToHashSet();
    var application = owner?.GetValue("application", BsonNull.Value);
    var applicationThreads = application is { IsBsonDocument: true }
        ? new[] { "recruiterCommentThread", "applicationCommentThread" }.Select(x => application.AsBsonDocument.GetValue(x, BsonNull.Value)).Where(x => !x.IsBsonNull).Select(x => ObjectId.Parse(x.ToString()!)).ToHashSet()
        : null;
    if (applicationThreads is not null && !recordedThreads.SetEquals(applicationThreads))
    {
        return Refuse($"the manifest records threads [{string.Join(",", recordedThreads)}] but the account's application holds [{string.Join(",", applicationThreads)}]");
    }

    if (!minted.IsSubsetOf(recordedThreads))
    {
        return Refuse($"this run's API minted comment threads [{string.Join(",", minted.Except(recordedThreads))}] that the manifest does not record");
    }

    if (Ids(manifest, "units").Count > 0)
    {
        return Refuse("the manifest records unit memberships, which this cleanup does not reverse");
    }

    unitMembersTotalBefore = manifest.Value.GetProperty("unitMembersTotal").GetInt64();
    var threads = filter.In("_id", recordedThreads);
    var accountNotifications = filter.Or(filter.Eq("owner", ownerId), filter.Eq("link", $"/recruitment/{ownerId}"));
    deletions.Add(("commentThreads", Collection("commentThreads"), threads));
    deletions.Add(("notifications", Collection("notifications"), accountNotifications));
    remainingChecks["commentThreads"] = (Collection("commentThreads"), filter.Or(threads, filter.In("_id", minted)));
    remainingChecks["notifications"] = (Collection("notifications"), accountNotifications);
    remainingChecks["unitsHoldingAccount"] = (Collection("units"), filter.AnyEq("members", ownerId));
}

if (kinds.Contains("funnel"))
{
    var visitor = filter.Eq("visitorId", visitorId);
    deletions.Add(("applicationFunnelEvents", Collection("applicationFunnelEvents"), filter.And(filter.In("_id", Ids(accountWrites, "funnelEvents")), visitor)));
    remainingChecks["applicationFunnelEvents"] = (Collection("applicationFunnelEvents"), visitor);
}

if (kinds.Contains("account"))
{
    var recordedCodes = Ids(accountWrites, "confirmationCodes");
    var codeJobs = recordedCodes.Select(x => JsonSerializer.Serialize(new object[] { x.ToString() })).ToList();
    var expiryJobs = filter.And(filter.Eq("action", "ActionDeleteExpiredConfirmationCode"), filter.In("actionParameters", codeJobs));
    deletions.Add(("confirmationCodes", Collection("confirmationCodes"), filter.And(filter.In("_id", recordedCodes), filter.Eq("value", email))));
    deletions.Add(("scheduledJobs", Collection("scheduledJobs"), expiryJobs));
    remainingChecks["confirmationCodes"] = (Collection("confirmationCodes"), filter.Eq("value", email));
    remainingChecks["scheduledJobs"] = (Collection("scheduledJobs"), expiryJobs);
}

if (kinds.Contains("mission"))
{
    deletions.Add(("missionSessions", Collection("missionSessions"), filter.Eq("sessionId", sessionId)));
    remainingChecks["missionSessions"] = (Collection("missionSessions"), filter.Eq("sessionId", sessionId));
    foreach (var name in new[] { "playerMissionStats", "missionStats", "missionStatsEventsLifecycle", "missionStatsEventsCombat", "missionStatsEventsSampler" })
    {
        deletions.Add((name, Collection(name), filter.Eq("missionSessionId", sessionId)));
        remainingChecks[name] = (Collection(name), filter.Eq("missionSessionId", sessionId));
    }
}

var accountFilter = accountId is { } pinnedId ? filter.And(filter.Eq("_id", pinnedId), filter.Eq("email", email)) : null;
var counts = new Dictionary<string, long>();
foreach (var (name, collection, deletion) in deletions)
{
    counts[name] = dryRun ? await collection.CountDocumentsAsync(deletion) : (await collection.DeleteManyAsync(deletion)).DeletedCount;
}

if (dryRun)
{
    if (kinds.Contains("account")) counts["accounts"] = accountFilter is null ? 0 : await accounts.CountDocumentsAsync(accountFilter);
    Console.WriteLine(JsonSerializer.Serialize(new { runId, dryRun = true, wouldRemove = counts }));
    return 0;
}

var remaining = new Dictionary<string, long>();
foreach (var (name, (collection, check)) in remainingChecks)
{
    remaining[name] = await collection.CountDocumentsAsync(check);
}

var unitMembers = unitMembersTotalBefore is null ? (object?)null : new { before = unitMembersTotalBefore, now = await UnitMembersTotal() };
if (remaining.Values.Any(x => x > 0))
{
    Console.WriteLine(JsonSerializer.Serialize(new { runId, removed = counts, remaining, unitMembersTotal = unitMembers, account = "kept until every child record is gone" }));
    return 6;
}

if (kinds.Contains("account"))
{
    counts["accounts"] = accountFilter is null ? 0 : (await accounts.DeleteManyAsync(accountFilter)).DeletedCount;
    remaining["accounts"] = await accounts.CountDocumentsAsync(accountId is { } gone ? filter.Or(filter.Eq("_id", gone), filter.Eq("email", email)) : filter.Eq("email", email));
}

Console.WriteLine(JsonSerializer.Serialize(new { runId, removed = counts, remaining, unitMembersTotal = unitMembers }));
return remaining.Values.All(x => x == 0) ? 0 : 6;
