import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { webRoutes } from "./surface-lib.mjs";

const ts = createRequire(fileURLToPath(new URL("../../../../package.json", import.meta.url)))("typescript");

function routes(files) {
  const read = (file) => {
    if (!(file in files)) throw new Error(`no fixture ${file}`);
    return files[file];
  };
  return [...webRoutes(ts, "/app", read)].sort();
}

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
