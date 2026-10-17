import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const reader = fileURLToPath(new URL("./surface-api.cs", import.meta.url));
const dotnetRoot = process.env.DOTNET_ROOT ?? join(process.env.HOME, ".dotnet");
const env = { ...process.env, DOTNET_ROOT: dotnetRoot, PATH: `${dotnetRoot}:${process.env.PATH}` };
const events = `switch (gameServerEvent.Type) { case "fixture": break; }`;

function read(files) {
  return new Promise((done) => {
    const child = execFile("dotnet", ["run", reader], { env }, (error, stdout, stderr) => done(error ? { error: stderr.trim() || error.message } : { ids: stdout.split("\n").filter(Boolean) }));
    child.stdin.end(JSON.stringify(files));
  });
}

const api = async (text, extra = {}) => {
  const result = await read({ "GameServerEventHandler.cs": events, "Probe.cs": text, ...extra });
  return result.error ? result : { ids: result.ids.filter((id) => !id.startsWith("game:")) };
};
const game = (text) => read({ "GameServerEventHandler.cs": text });
const controller = (route, body) => `[Route("${route}")]\npublic class ProbeController : ControllerBase {\n    ${body}\n}`;

async function cases(list) {
  const results = await Promise.all(list.map(([, run]) => run()));
  list.forEach(([expected], index) => {
    const result = results[index];
    if (expected instanceof RegExp) assert.match(result.error ?? `accepted: ${JSON.stringify(result.ids)}`, expected);
    else assert.deepEqual(result.ids ?? result.error, expected);
  });
}

test("api endpoints cover verbs, templates, class routes, and spaced hubs", () => cases([
  [["api:GET /absolute", "api:GET /alias", "api:GET /probe", "api:GET /tilde/{id}", "api:HEAD /alias/new", "api:HEAD /probe/new", "api:POST /alias/{id}", "api:POST /probe/{id}"], () => api(`[Route("probe")]
[Route("alias")]
public class ProbeController : ControllerBase {
    [HttpGet] public void A() {}
    [HttpHead("new")] public void B() {}
    [HttpGet("/absolute")] public void C() {}
    [HttpGet("~/tilde/{id}")] public void D() {}
    [HttpPost("{id}", Name = "x")] public void E() {}
}`)],
  [["api:GET /widgets/{id}"], () => api(`namespace X;\n[Route("[controller]")]\npublic class WidgetsController : ControllerBase { [HttpGet("{id}")] public void A() {} }`)],
  [["api:GET /probe/new"], () => api(controller("probe", `[Microsoft.AspNetCore.Mvc.HttpGetAttribute("new"), ProducesResponseType(typeof(string[]), 200)] public string[] A() => [];`))],
  [["api:GET /probe/r", "api:POST /probe/r"], () => api(controller("probe", `[HttpPost("r")] [HttpGet("r")] public void A() {}`))],
  [["api:GET /probe/probe"], () => api(controller("[controller]/[controller]", "[HttpGet] public void A() {}"))],
  [["api:GET /probe"], () => api(controller("/probe", "[HttpGet] public void A() {}"))],
  [["api:GET /probe"], () => api(controller("\\u0070robe", "[HttpGet] public void A() {}"))],
  [["api:GET /probe"], () => api(`namespace Example {\n  [Route("[controller]")]\n  // class WrongController\n  public record class ProbeController {\n    // [HttpGet("ghost")]\n    [HttpGet] public string Get() => "// HttpGet Route( MapHub";\n  }\n}`)],
  [["api:GET /alpha/a", "api:GET /beta/b"], () => api(`[Route("[controller]")]
public class AlphaController : ControllerBase { [HttpGet("a")] public string A() => "}"; }
public class Dto { public string Name { get; set; } }
[Route("[controller]")]
public class BetaController : ControllerBase { [HttpGet("b")] public void B() {} }`)],
  [["hub:ProbeHub"], () => api(`class S { void M() { app.MapHub< Some.ProbeHub >("/probe"); } }`)],
  [[], () => api(`// app.MapHub<GhostHub>("/ghost");`)],
]));

test("api endpoints refuse shapes the reader cannot enumerate", () => cases([
  [/routing attribute outside a controller/, () => api(`public class Dto { [HttpGet] public int X { get; set; } }`)],
  [/actions without a class-level/, () => api(`public class ProbeController : ControllerBase { [HttpGet] public void A() {} }`)],
  [/\[Route\] on an action is not supported/, () => api(controller("probe", `[HttpGet, Route("new")] public void A() {}`))],
  [/\[AcceptVerbs\] on an action/, () => api(controller("probe", `[AcceptVerbs("GET")] public void A() {}`))],
  [/partial controller ProbeController/, () => api(`[Route("one")]\npublic partial\nclass ProbeController {}`, { "B.cs": `[Route("two")]\npublic partial\nclass ProbeController { [HttpGet("new")] public void A() {} }` })],
  [/inherits routed actions from BaseController/, () => api(`[Route("derived")]\npublic class DerivedController : BaseController {}`, { "Base.cs": `[Route("base")]\npublic class BaseController { [HttpGet] public string Get() => "ok"; }` })],
  [/abstract or static routed type/, () => api(`[Route("base")]\npublic abstract class BaseController { [HttpGet] public string Get() => "ok"; }`)],
  [/route token in \/probe\/\[action\]/, () => api(controller("probe/[action]", "[HttpGet] public void A() {}"))],
  [/route template is not one string literal/, () => api(controller("probe", "[HttpGet(Routes.New)] public void A() {}"))],
  [/aliases a routing attribute/, () => api(`using Get = Microsoft.AspNetCore.Mvc.HttpGetAttribute;\n${controller("probe", "[Get] public void A() {}")}`)],
  [/declares a custom routing attribute/, () => api(`public class MyGet : HttpGetAttribute {}`)],
  [/disabled by #if/, () => api(`#if NEVER\n[HttpGet] public void A() {}\n#endif`)],
  [/must be public/, () => api(controller("probe", "[HttpGet] private void A() {}"))],
  [/routed type is not public/, () => api(`[Route("probe")]\ninternal class ProbeController { [HttpGet] public void A() {} }`)],
  [/MapHub without one type argument/, () => api(`class S { void M() { app.MapHub(typeof(H), "/h"); } }`)],
  [/does not parse/, () => api(`public class {`)],
]));

test("game events read string cases anywhere in the switch and refuse other shapes", () => cases([
  [["game:a", "game:b", "game:npc_v2"], () => game(`switch (gameServerEvent.Type) {
  case "a": var x = $"{Identity("}")}"; var y = """ "}" """; var z = @"\\"; Log("switch"); /* case "ghost": */ break;
  default: break;
  case "npc\\u005fv2": case "b": break;
}`)],
  [["game:a:b"], () => game(`switch (gameServerEvent.Type) { case "a:b": switch (x) { case 1: break; } break; }`)],
  [/event case is not a string literal/, () => game(`switch (gameServerEvent.Type) { case Events.Probe: break; }`)],
  [/found 0/, () => game(`switch (other) { case "x": break; }`)],
  [/found 2/, () => game(`switch (gameServerEvent.Type) { case "x": break; } switch (gameServerEvent .Type) { case "y": break; }`)],
]));
