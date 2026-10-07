#:package MongoDB.Driver@3.6.0
#:property PublishAot=false

using System.Text.Json;
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;

const string RequiredDatabase = "devLocal";

if (args.Length < 2 || (args[1] != "doctor" && args.Length < 3))
{
    Console.Error.WriteLine("usage: verify-data <api-checkout> doctor|account <email>|mission <session-id>|cleanup <run-id>");
    return 2;
}

var settingsPath = Path.Combine(args[0], "UKSF.Api", "appsettings.Development.json");
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
var auditLogs = database.GetCollection<BsonDocument>("auditLogs");
var missionSessions = database.GetCollection<BsonDocument>("missionSessions");
var playerMissionStats = database.GetCollection<BsonDocument>("playerMissionStats");

switch (args[1])
{
    case "doctor":
        await database.RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1));
        var server = MongoUrl.Create(connectionString).Server;
        Console.WriteLine($"database={databaseName} port={server.Port} reachable");
        return 0;

    case "account":
        var account = await accounts.Find(Builders<BsonDocument>.Filter.Eq("email", args[2])).FirstOrDefaultAsync();
        if (account is null)
        {
            Console.WriteLine("{\"found\":false}");
            return 1;
        }

        var state = account.GetValue("membershipState", BsonNull.Value);
        string[] membershipStates = ["Unconfirmed", "Confirmed", "Member", "Discharged", "Server", "Empty"];
        var stateName = state.IsInt32 && state.AsInt32 < membershipStates.Length ? membershipStates[state.AsInt32] : state.ToString();
        Console.WriteLine(JsonSerializer.Serialize(new { found = true, id = account["_id"].ToString(), email = args[2], membershipState = stateName }));
        return 0;

    case "mission":
        var session = await missionSessions.Find(Builders<BsonDocument>.Filter.Eq("sessionId", args[2])).FirstOrDefaultAsync();
        if (session is null)
        {
            Console.WriteLine("{\"found\":false}");
            return 1;
        }

        var presence = session.GetValue("playerPresence", new BsonArray()).AsBsonArray;
        Console.WriteLine(JsonSerializer.Serialize(new
        {
            found = true,
            sessionId = args[2],
            mission = session.GetValue("mission", BsonNull.Value).ToString(),
            map = session.GetValue("map", BsonNull.Value).ToString(),
            missionStarted = session.GetValue("missionStarted", BsonNull.Value).ToString(),
            missionEnded = session.GetValue("missionEnded", BsonNull.Value).ToString(),
            durationSeconds = session.GetValue("durationSeconds", BsonNull.Value).ToString(),
            players = presence.Select(x => x.AsBsonDocument.GetValue("uid", BsonNull.Value).ToString()).ToArray()
        }));
        return 0;

    case "cleanup":
        var runId = args[2];
        if (!Regex.IsMatch(runId, "^v[0-9]{14}$"))
        {
            Console.Error.WriteLine($"refusing: '{runId}' is not a verify run id");
            return 4;
        }

        var email = $"verify+{runId}@uksf-verify.invalid";
        var runAccounts = await accounts.Find(Builders<BsonDocument>.Filter.Eq("email", email)).ToListAsync();
        var accountIds = runAccounts.Select(x => x["_id"].ToString()!).ToList();
        var removedAccounts = await accounts.DeleteManyAsync(Builders<BsonDocument>.Filter.Eq("email", email));
        var removedCodes = await codes.DeleteManyAsync(Builders<BsonDocument>.Filter.Eq("value", email));
        var auditFilter = Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Regex("message", new BsonRegularExpression(Regex.Escape(email))),
            Builders<BsonDocument>.Filter.In("who", accountIds),
            Builders<BsonDocument>.Filter.In("message", accountIds.Select(id => new BsonRegularExpression(Regex.Escape(id))))
        );
        var removedAudit = await auditLogs.DeleteManyAsync(auditFilter);
        var sessionFilter = Builders<BsonDocument>.Filter.Eq("sessionId", $"verify-{runId}");
        var removedSessions = await missionSessions.DeleteManyAsync(sessionFilter);
        var removedPlayerStats = await playerMissionStats.DeleteManyAsync(sessionFilter);
        Console.WriteLine(JsonSerializer.Serialize(new
        {
            runId,
            email,
            accounts = removedAccounts.DeletedCount,
            confirmationCodes = removedCodes.DeletedCount,
            auditLogs = removedAudit.DeletedCount,
            missionSessions = removedSessions.DeletedCount,
            playerMissionStats = removedPlayerStats.DeletedCount
        }));
        return 0;

    default:
        Console.Error.WriteLine($"unknown command '{args[1]}'");
        return 2;
}
