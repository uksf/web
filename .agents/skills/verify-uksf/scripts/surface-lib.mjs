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
