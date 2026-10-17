import { dirname, join, resolve } from "node:path";

const routeKeys = new Set(["path", "component", "loadComponent", "children", "loadChildren", "redirectTo", "pathMatch", "canActivate", "canActivateChild", "canMatch", "canDeactivate", "data", "providers", "resolve", "title", "runGuardsAndResolvers"]);

export function webRoutes(ts, appDir, read) {
  const parse = (file) => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
  const fail = (file, node, message) => {
    throw new Error(`${file}: ${message}: ${node.getText().slice(0, 80)}`);
  };
  const keyOf = (entry) => (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name) ? entry.name.text : undefined);

  function exportedArray(source, name) {
    const exported = (statement) => ts.isVariableStatement(statement) && statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    const found = source.statements.filter(exported).flatMap((statement) => statement.declarationList.declarations).filter((declaration) => declaration.name.getText() === name);
    if (found.length !== 1 || !found[0].initializer || !ts.isArrayLiteralExpression(found[0].initializer)) throw new Error(`${source.fileName}: expected one exported array literal ${name}, found ${found.length}`);
    return found[0].initializer;
  }

  function props(file, element) {
    const out = {};
    for (const entry of element.properties) {
      const key = ts.isPropertyAssignment(entry) ? keyOf(entry) : undefined;
      if (!key || !routeKeys.has(key)) fail(file, entry, "unsupported route property");
      out[key] = entry.initializer;
    }
    return out;
  }

  function lazyTarget(file, init) {
    const text = init.getText();
    const target = /^\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)\s*\.then\(\s*\(?(\w+)\)?\s*=>\s*\2\.(\w+)\s*\)$/.exec(text);
    if (!target) fail(file, init, "cannot read loadChildren");
    const base = target[1].startsWith("@app/") ? join(appDir, target[1].slice(5)) : resolve(dirname(file), target[1]);
    return { file: `${base}.ts`, name: target[3] };
  }

  function walk(file, array, prefix, out) {
    for (const element of array.elements) {
      if (!ts.isObjectLiteralExpression(element)) fail(file, element, "route is not an object literal");
      const route = props(file, element);
      if (route.path && !ts.isStringLiteral(route.path) && !ts.isNoSubstitutionTemplateLiteral(route.path)) fail(file, route.path, "route path is not a string literal");
      const path = route.path ? route.path.text : "";
      const full = path ? `${prefix.replace(/\/$/, "")}/${path}` : prefix || "/";
      if (route.children && !ts.isArrayLiteralExpression(route.children)) fail(file, route.children, "children is not an array literal");
      out.add(`web:${full}`);
      if (route.children) walk(file, route.children, full, out);
      else if (route.loadChildren) {
        const target = lazyTarget(file, route.loadChildren);
        walk(target.file, exportedArray(parse(target.file), target.name), full, out);
      }
    }
  }

  const out = new Set();
  const root = join(appDir, "app.routes.ts");
  walk(root, exportedArray(parse(root), "appRoutes"), "", out);
  return out;
}

const attribute = /\[((?:[^[\]"]|"[^"]*")*)\]/g;
const token = /\b(?:\w+\.)*(?:Http(?:Get|Post|Put|Patch|Delete|Head|Options)|AcceptVerbs)\b|\bRoute\s*\(|\bMapHub\b/g;
const classRoute = /^Route\("([^"]*)"\)$/;
const action = /^Http(Get|Post|Put|Patch|Delete|Head|Options)(?:\(\s*"([^"]*)"\s*(?:,[^)]*)?\))?$/;
const hub = /\bMapHub\s*<\s*([\w.]+)\s*>/g;

export function apiEndpoints(sources) {
  const out = new Set();
  for (const [name, text] of sources) {
    const raw = [...text.matchAll(token)].length;
    if (!raw) continue;
    const bases = [];
    const actions = [];
    for (const match of text.matchAll(attribute)) {
      const body = match[1].trim();
      const atLineStart = match.index === 0 || text[match.index - 1] === "\n";
      const route = classRoute.exec(body);
      const verb = action.exec(body);
      if (route && atLineStart) bases.push({ at: match.index, template: route[1] });
      else if (verb) actions.push({ at: match.index, verb: verb[1].toUpperCase(), template: verb[2] ?? "" });
    }
    const hubs = [...text.matchAll(hub)].map((match) => match[1]);
    if (bases.length + actions.length + hubs.length !== raw) throw new Error(`${name}: ${raw} routing declarations, but the parser read ${bases.length + actions.length + hubs.length}`);
    for (const found of hubs) out.add(`hub:${found}`);
    if (!bases.length && !actions.length) continue;
    const controllers = new Map();
    for (const base of bases) {
      const declaration = /(partial )?(?:record|class) (\w+)/.exec(text.slice(base.at));
      if (!declaration) throw new Error(`${name}: no class after [Route("${base.template}")]`);
      if (declaration[1]) throw new Error(`${name}: partial controller ${declaration[2]} is not supported`);
      const at = base.at + declaration.index;
      if (!controllers.has(at)) controllers.set(at, { name: declaration[2], body: block(text, at, name), templates: [] });
      controllers.get(at).templates.push(base.template);
    }
    for (const { verb, template, at } of actions) {
      const owner = [...controllers.values()].find(({ body }) => at > body.start && at < body.end);
      if (!owner) throw new Error(`${name}: [Http${verb[0]}${verb.slice(1).toLowerCase()}] outside a class with a class-level [Route]`);
      owner.actions = [...(owner.actions ?? []), { verb, template }];
    }
    for (const owner of controllers.values()) {
      const controller = owner.name.replace(/Controller$/, "").toLowerCase();
      for (const base of owner.templates.map((template) => template.replace("[controller]", controller))) {
        for (const { verb, template } of owner.actions ?? []) {
          const absolute = template.startsWith("~/") || template.startsWith("/");
          const path = absolute ? `/${template.replace(/^~?\//, "")}` : template ? `/${base}/${template}` : `/${base}`;
          out.add(`api:${verb} ${path}`);
        }
      }
    }
  }
  return out;
}

function block(text, from, name) {
  const open = text.indexOf("{", from);
  const semicolon = text.indexOf(";", from);
  if (semicolon >= 0 && (open < 0 || semicolon < open)) return { start: semicolon, end: semicolon };
  let depth = 0;
  for (let at = open; at < text.length; at++) {
    const char = text[at];
    if (char === "/" && text[at + 1] === "/") at = text.indexOf("\n", at) < 0 ? text.length : text.indexOf("\n", at);
    else if (char === "/" && text[at + 1] === "*") at = text.indexOf("*/", at) + 1;
    else if (char === '"' || char === "'") {
      for (at++; at < text.length && text[at] !== char; at++) if (text[at] === "\\") at++;
    } else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return { start: open, end: at };
  }
  throw new Error(`${name}: unbalanced braces after offset ${from}`);
}

export function gameEvents(sources) {
  const handlers = [...sources].filter(([name]) => name.endsWith("GameServerEventHandler.cs"));
  if (handlers.length !== 1) throw new Error(`expected one GameServerEventHandler.cs, found ${handlers.length}`);
  const text = handlers[0][1];
  const start = text.indexOf("switch (gameServerEvent.Type)");
  if (start < 0 || text.indexOf("switch (gameServerEvent.Type)", start + 1) >= 0) throw new Error("GameServerEventHandler.cs must have exactly one switch (gameServerEvent.Type)");
  const range = block(text, start, "GameServerEventHandler.cs");
  const body = text.slice(range.start + 1, range.end);
  if (/\bswitch\b/.test(body)) throw new Error("GameServerEventHandler.cs: nested switch in the event switch");
  const cases = [...body.matchAll(/\bcase\s+([^:]+):/g)].map((match) => match[1].trim());
  const bad = cases.find((value) => !/^"[^"]+"$/.test(value));
  if (bad) throw new Error(`GameServerEventHandler.cs: case ${bad} is not a string literal`);
  if (!cases.length) throw new Error("GameServerEventHandler.cs: the event switch has no cases");
  return new Set(cases.map((value) => `game:${value.slice(1, -1)}`));
}
