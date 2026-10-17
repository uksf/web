import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { apiEndpoints, gameEvents, webRoutes } from "./surface-lib.mjs";

const ts = createRequire(fileURLToPath(new URL("../../../../package.json", import.meta.url)))("typescript");

function routes(files) {
  const read = (file) => {
    if (!(file in files)) throw new Error(`no fixture ${file}`);
    return files[file];
  };
  return [...webRoutes(ts, "/app", read)].sort();
}

const api = (text) => [...apiEndpoints(new Map([["Probe.cs", text]]))].sort();
const events = (text) => [...gameEvents(new Map([["x/GameServerEventHandler.cs", text]]))].sort();

test("web routes follow children, lazy routes, quoted keys, and redirects", () => {
  const app = `export const appRoutes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { 'path': 'home', component: C },
    { path: 'admin', loadChildren: () => import('./admin.routes').then(m => m.ADMIN_ROUTES) },
    { path: 'old', redirectTo: '/home' },
    { path: '**', redirectTo: 'home' }
  ];`;
  const admin = `export const ADMIN_ROUTES = [{ path: '', component: P, children: [{ path: '', redirectTo: 'logs', pathMatch: 'full' }, { path: 'logs', component: L }] }];`;
  assert.deepEqual(routes({ "/app/app.routes.ts": app, "/app/admin.routes.ts": admin }), ["web:/", "web:/**", "web:/admin", "web:/admin/logs", "web:/home", "web:/old"]);
});

test("web routes refuse shapes the parser cannot enumerate", () => {
  const refuse = (body, message) => assert.throws(() => routes({ "/app/app.routes.ts": `const childRoutes = [{ path: 'x', component: C }]; const p = 'probe'; export const appRoutes = [${body}];` }), message);
  refuse("{ path: p, component: C }", /route path is not a string literal/);
  refuse("{ path: 'home', component: C, children: childRoutes }", /children is not an array literal/);
  refuse("...childRoutes", /route is not an object literal/);
  refuse("{ matcher: m, component: C }", /unsupported route property/);
  refuse("{ path: 'a', loadChildren: loader }", /cannot read loadChildren/);
  refuse("{ path: 'chat', outlet: 'aux', component: C }", /unsupported route property/);
});

test("web routes list a parent route that has a component and children", () => {
  assert.deepEqual(routes({ "/app/app.routes.ts": "export const appRoutes = [{ path: 'parent', component: P, children: [{ path: 'child', component: C }] }];" }), ["web:/parent", "web:/parent/child"]);
});

test("web routes read only the exported route array", () => {
  assert.deepEqual(routes({ "/app/app.routes.ts": "export const appRoutes = [{ path: 'new', component: C }]; function f() { const appRoutes = []; }" }), ["web:/new"]);
  assert.throws(() => routes({ "/app/app.routes.ts": "const appRoutes = [{ path: 'new', component: C }];" }), /expected one exported array literal appRoutes, found 0/);
});

test("api endpoints cover verbs, absolute templates, and every class route", () => {
  const text = `[Route("probe")]
[Route("alias")]
public class ProbeController : ControllerBase {
    [HttpGet] public void A() {}
    [HttpHead("new")] public void B() {}
    [HttpGet("/absolute")] public void C() {}
    [HttpGet("~/tilde/{id}")] public void D() {}
    [HttpPost("{id}", Name = "x")] public void E() {}
}`;
  assert.deepEqual(api(text), ["api:GET /absolute", "api:GET /alias", "api:GET /probe", "api:GET /tilde/{id}", "api:HEAD /alias/new", "api:HEAD /probe/new", "api:POST /alias/{id}", "api:POST /probe/{id}"]);
  assert.deepEqual(api(`[Route("[controller]")]\npublic class ServiceRecordsController : Controller;`), []);
  assert.deepEqual(api(`[Route("[controller]")]\npublic class WidgetsController : ControllerBase { [HttpGet("{id}")] public void A() {} }`), ["api:GET /widgets/{id}"]);
});

test("api endpoints refuse routing attributes the parser cannot read", () => {
  const refuse = (body, message) => assert.throws(() => api(`[Route("probe")]\npublic class ProbeController : ControllerBase {\n    ${body} public void A() {}\n}`), message);
  refuse(`[HttpGet, Route("new")]`, /routing declarations, but the parser read/);
  refuse(`[Route("new")]`, /routing declarations, but the parser read/);
  refuse(`[AcceptVerbs("GET")]`, /routing declarations, but the parser read/);
  refuse(`[Microsoft.AspNetCore.Mvc.HttpGet("new")]`, /routing declarations, but the parser read/);
  refuse(`[HttpGet("new"), ProducesResponseType(typeof(string[]), 200)]`, /routing declarations, but the parser read/);
  assert.throws(() => api(`public class ProbeController : ControllerBase { [HttpGet] public void A() {} }`), /outside a class with a class-level/);
  assert.throws(() => api(`[Route("two")]\npublic partial class ProbeController {\n    [HttpGet("new")] public void A() {}\n}`), /partial controller ProbeController/);
});

test("api endpoints tie each action to its own controller and read spaced hubs", () => {
  const text = `[Route("[controller]")]
public class AlphaController : ControllerBase {
    [HttpGet("a")] public string A() => "}";
}
public class Dto { public string Name { get; set; } }
[Route("[controller]")]
public class BetaController : ControllerBase {
    [HttpGet("b")] public void B() {}
}`;
  assert.deepEqual(api(text), ["api:GET /alpha/a", "api:GET /beta/b"]);
  assert.deepEqual(api(`app.MapHub< ProbeHub >("/probe");`), ["hub:ProbeHub"]);
});

test("game events read every string case and refuse other shapes", () => {
  assert.deepEqual(events(`switch (gameServerEvent.Type) { case "npc_v2": break; case "npc_ack": break; default: break; }`), ["game:npc_ack", "game:npc_v2"]);
  assert.throws(() => events(`switch (gameServerEvent.Type) { case Events.Probe: break; default: break; }`), /not a string literal/);
  assert.throws(() => events(`switch (other) { case "x": break; default: break; }`), /exactly one switch/);
  assert.deepEqual(events(`switch (gameServerEvent.Type) { case "existing": break; default: break; case "new_v2": break; }`), ["game:existing", "game:new_v2"]);
  assert.throws(() => events(`switch (gameServerEvent.Type) { case "a": switch (x) { case 1: break; } break; }`), /nested switch/);
});
