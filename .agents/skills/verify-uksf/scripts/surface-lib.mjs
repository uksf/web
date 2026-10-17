import { dirname, join, resolve } from "node:path";

const routeKeys = new Set(["path", "component", "loadComponent", "children", "loadChildren", "redirectTo", "pathMatch", "canActivate", "canActivateChild", "canMatch", "canDeactivate", "data", "providers", "resolve", "title", "outlet", "runGuardsAndResolvers"]);

export function webRoutes(ts, appDir, read) {
  const parse = (file) => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
  const fail = (file, node, message) => {
    throw new Error(`${file}: ${message}: ${node.getText().slice(0, 80)}`);
  };
  const keyOf = (entry) => (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name) ? entry.name.text : undefined);

  function exportedArray(source, name) {
    let found;
    source.forEachChild(function visit(node) {
      if (ts.isVariableDeclaration(node) && node.name.getText() === name && node.initializer) found = node.initializer;
      node.forEachChild(visit);
    });
    if (!found || !ts.isArrayLiteralExpression(found)) throw new Error(`${source.fileName}: ${name} is not an array literal`);
    return found;
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
      if (route.children) walk(file, route.children, full, out);
      else if (route.loadChildren) {
        const target = lazyTarget(file, route.loadChildren);
        walk(target.file, exportedArray(parse(target.file), target.name), full, out);
      } else out.add(`web:${full}`);
    }
  }

  const out = new Set();
  const root = join(appDir, "app.routes.ts");
  walk(root, exportedArray(parse(root), "appRoutes"), "", out);
  return out;
}

const attribute = /\[((?:[^[\]"]|"[^"]*")*)\]/g;
const routing = /(^|,\s*)(Http[A-Z]\w*|Route|AcceptVerbs)\b/;
const classRoute = /^Route\("([^"]*)"\)$/;
const action = /^Http(Get|Post|Put|Patch|Delete|Head|Options)(?:\(\s*"([^"]*)"\s*(?:,[^)]*)?\))?$/;

export function apiEndpoints(sources) {
  const out = new Set();
  for (const [name, text] of sources) {
    const bases = [];
    const actions = [];
    for (const match of text.matchAll(attribute)) {
      const body = match[1].trim();
      if (!routing.test(body)) continue;
      const atLineStart = match.index === 0 || text[match.index - 1] === "\n";
      const route = classRoute.exec(body);
      const verb = action.exec(body);
      if (route && atLineStart) bases.push(route[1]);
      else if (verb) actions.push({ verb: verb[1].toUpperCase(), template: verb[2] ?? "" });
      else throw new Error(`${name}: cannot read routing attribute [${body}]`);
    }
    if (!actions.length && !bases.length) continue;
    if (actions.length && !bases.length) throw new Error(`${name}: actions without a class-level [Route]`);
    const className = /\bclass (\w+?)(?:Controller)?\b/.exec(text.slice(text.indexOf(`[Route("${bases.at(-1)}")]`)));
    if (!className) throw new Error(`${name}: no class after [Route]`);
    for (const base of bases.map((template) => template.replace("[controller]", className[1].toLowerCase()))) {
      for (const { verb, template } of actions) {
        const absolute = template.startsWith("~/") || template.startsWith("/");
        const path = absolute ? `/${template.replace(/^~?\//, "")}` : template ? `/${base}/${template}` : `/${base}`;
        out.add(`api:${verb} ${path}`);
      }
    }
  }
  for (const text of sources.values()) for (const hub of text.matchAll(/MapHub<(\w+)>/g)) out.add(`hub:${hub[1]}`);
  return out;
}

export function gameEvents(sources) {
  const handlers = [...sources].filter(([name]) => name.endsWith("GameServerEventHandler.cs"));
  if (handlers.length !== 1) throw new Error(`expected one GameServerEventHandler.cs, found ${handlers.length}`);
  const text = handlers[0][1];
  const start = text.indexOf("switch (gameServerEvent.Type)");
  const end = text.indexOf("default:", start);
  if (start < 0 || end < 0) throw new Error("GameServerEventHandler.cs has no switch (gameServerEvent.Type) with a default");
  const block = text.slice(start, end);
  const cases = [...block.matchAll(/\bcase\s+([^:]+):/g)].map((match) => match[1].trim());
  const bad = cases.find((value) => !/^"[^"]+"$/.test(value));
  if (bad) throw new Error(`GameServerEventHandler.cs: case ${bad} is not a string literal`);
  if (!cases.length) throw new Error("GameServerEventHandler.cs: the event switch has no cases");
  return new Set(cases.map((value) => `game:${value.slice(1, -1)}`));
}
