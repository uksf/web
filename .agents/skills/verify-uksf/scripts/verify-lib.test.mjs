import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { dotnetEnv } from "./verify-lib.mjs";

const root = realpathSync(mkdtempSync(join(tmpdir(), "verify-lib-test-")));
after(() => rmSync(root, { recursive: true, force: true }));
const linuxOnly = { skip: process.platform !== "linux" };

test("keeps an XDG_RUNTIME_DIR that is already set", () => {
  const env = { HOME: root, XDG_RUNTIME_DIR: "/run/user/1" };
  assert.equal(dotnetEnv(env), env);
});

test("creates a private absolute runtime dir under UKSF_VERIFY_HOME", linuxOnly, () => {
  const home = join(root, "home-a");
  const env = dotnetEnv({ HOME: root, UKSF_VERIFY_HOME: home });
  assert.equal(env.XDG_RUNTIME_DIR, join(home, "xdg-runtime"));
  assert.equal(statSync(env.XDG_RUNTIME_DIR).mode & 0o777, 0o700);
});

test("an empty UKSF_VERIFY_HOME means the default home", linuxOnly, () => {
  assert.equal(dotnetEnv({ HOME: root, UKSF_VERIFY_HOME: "" }).XDG_RUNTIME_DIR, join(root, ".uksf-verify", "xdg-runtime"));
});

test("tightens an existing runtime dir to mode 700", linuxOnly, () => {
  const home = join(root, "home-b");
  mkdirSync(join(home, "xdg-runtime"), { recursive: true });
  chmodSync(join(home, "xdg-runtime"), 0o777);
  dotnetEnv({ HOME: root, UKSF_VERIFY_HOME: home });
  assert.equal(statSync(join(home, "xdg-runtime")).mode & 0o777, 0o700);
});

test("refuses a runtime dir that is a symlink and leaves its target alone", linuxOnly, () => {
  const home = join(root, "home-c");
  const target = join(root, "target");
  mkdirSync(home, { recursive: true });
  mkdirSync(target, { mode: 0o755 });
  chmodSync(target, 0o755);
  symlinkSync(target, join(home, "xdg-runtime"));
  assert.throws(() => dotnetEnv({ HOME: root, UKSF_VERIFY_HOME: home }), /refusing: .* is not a directory this user owns/);
  assert.equal(statSync(target).mode & 0o777, 0o755);
});
