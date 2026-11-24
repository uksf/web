import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const lib = join(dirname(fileURLToPath(import.meta.url)), "uksf-verify-lib.sh");
const root = mkdtempSync(join(tmpdir(), "pin-api-sdk-test-"));
after(() => rmSync(root, { recursive: true, force: true }));

const fakeDotnet = join(root, "fake-dotnet");
mkdirSync(fakeDotnet);
writeFileSync(join(fakeDotnet, "dotnet"), "#!/bin/sh\n[ -f global.json ] && grep -q '\"10.0.100\"' global.json\n");
chmodSync(join(fakeDotnet, "dotnet"), 0o755);

let n = 0;
function pin(project) {
  const dir = join(root, `case-${n++}`);
  mkdirSync(dir);
  if (project !== null) writeFileSync(join(dir, "Api.csproj"), project);
  const run = spawnSync("bash", ["-c", `set -Eeuo pipefail; source "$1"; pin_api_sdk "$2/Api.csproj" "$2"`, "_", lib, dir], {
    env: { ...process.env, PATH: `${fakeDotnet}:${process.env.PATH}`, DOTNET_ROOT: fakeDotnet },
    encoding: "utf8",
  });
  const pinned = join(dir, "global.json");
  return { status: run.status, stderr: run.stderr, globalJson: existsSync(pinned) ? JSON.parse(readFileSync(pinned, "utf8")) : null };
}

const wrap = (body) => `<Project Sdk="Microsoft.NET.Sdk.Web">\n    <PropertyGroup>\n${body}\n    </PropertyGroup>\n</Project>\n`;

test("pins the SDK major of one plain TargetFramework", () => {
  const result = pin(wrap("        <TargetFramework>net10.0</TargetFramework>"));
  assert.equal(result.status, 0);
  assert.deepEqual(result.globalJson, { sdk: { version: "10.0.100", rollForward: "latestFeature" } });
});

test("refuses when no SDK of that major answers", () => {
  const result = pin(wrap("        <TargetFramework>net9.0</TargetFramework>"));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no \.NET 9 SDK/);
});

for (const [name, body] of [
  ["a commented-out TargetFramework before the active one", "        <!-- <TargetFramework>net9.0</TargetFramework> -->\n        <TargetFramework>net10.0</TargetFramework>"],
  ["a conditional TargetFramework", "        <TargetFramework Condition=\"'$(Configuration)' == 'Debug'\">net9.0</TargetFramework>\n        <TargetFramework>net10.0</TargetFramework>"],
  ["a TargetFrameworks list", "        <TargetFrameworks>net10.0;net11.0</TargetFrameworks>"],
  ["no TargetFramework", "        <OutputType>Exe</OutputType>"],
  ["a TargetFramework alone inside a multiline comment", "        <!--\n        <TargetFramework>net10.0</TargetFramework>\n        -->"],
  ["a TargetFramework in a conditional PropertyGroup", null],
  ["a missing project file", undefined],
]) {
  test(`refuses ${name} and writes no global.json`, () => {
    const project =
      body === undefined
        ? null
        : body === null
          ? `<Project Sdk="Microsoft.NET.Sdk.Web">\n    <PropertyGroup Condition="'$(Configuration)' == 'Release'">\n        <TargetFramework>net9.0</TargetFramework>\n    </PropertyGroup>\n</Project>\n`
          : wrap(body);
    const result = pin(project);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /must exist and name TargetFramework once/);
    assert.equal(result.globalJson, null);
  });
}
