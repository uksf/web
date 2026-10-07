#:package MongoDB.Driver@3.6.0
#:property PublishAot=false

using System.Text.Json;
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;

const string RequiredDatabase = "devLocal";

if (args.Length < 2 || (args[1] != "doctor" && args.Length < 3))
{
    Console.Error.WriteLine("usage: verify-data <api-checkout> doctor|account <email>|mission <session-id>|gameserver-port <port>|cleanup <run-id> account|mission...");
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
var missionSessions = database.GetCollection<BsonDocument>("missionSessions");
var playerMissionStats = database.GetCollection<BsonDocument>("playerMissionStats");

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
            Console.WriteLine("{\"found\":false}");
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
            Console.WriteLine("{\"found\":false}");
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

    case "cleanup":
        var runId = args[2];
        if (!Regex.IsMatch(runId, "^v[0-9]{14}-[0-9a-f]{4}$"))
        {
            Console.Error.WriteLine($"refusing: '{runId}' is not a verify run id");
            return 4;
        }

        var email = $"verify+{runId}@uksf-verify.invalid";
        var kinds = args.Skip(3).ToHashSet();
        var unknownKinds = kinds.Except(["account", "mission"]).ToList();
        if (kinds.Count == 0 || unknownKinds.Count > 0)
        {
            Console.Error.WriteLine($"refusing: cleanup needs record kinds 'account' or 'mission' from the run's manifest, got '{string.Join(" ", args.Skip(3))}'");
            return 4;
        }

        var sessionId = $"verify-{runId}";
        var removed = new Dictionary<string, long>();
        if (kinds.Contains("account"))
        {
            removed["accounts"] = (await accounts.DeleteManyAsync(Builders<BsonDocument>.Filter.Eq("email", email))).DeletedCount;
            removed["confirmationCodes"] = (await codes.DeleteManyAsync(Builders<BsonDocument>.Filter.Eq("value", email))).DeletedCount;
        }

        if (kinds.Contains("mission"))
        {
            removed["missionSessions"] = (await missionSessions.DeleteManyAsync(Builders<BsonDocument>.Filter.Eq("sessionId", sessionId))).DeletedCount;
            removed["playerMissionStats"] = (await playerMissionStats.DeleteManyAsync(Builders<BsonDocument>.Filter.Eq("missionSessionId", sessionId))).DeletedCount;
        }

        Console.WriteLine(JsonSerializer.Serialize(new { runId, removed }));
        return 0;

    default:
        Console.Error.WriteLine($"unknown command '{args[1]}'");
        return 2;
}
