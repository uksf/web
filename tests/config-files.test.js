const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workspaceRoot = path.resolve(__dirname, '..');

test('package.json parses and includes expected scripts and deps', () => {
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    const contents = fs.readFileSync(packageJsonPath, 'utf8');
    const parsed = JSON.parse(contents);

    assert.ok(parsed.scripts, 'scripts missing');
    assert.ok(parsed.scripts.build, 'scripts.build missing');
    assert.ok(parsed.scripts.start, 'scripts.start missing');

    assert.ok(parsed.dependencies, 'dependencies missing');
    assert.ok(parsed.dependencies['@angular/core'], '@angular/core missing');
});

test('build.yml exists and contains expected steps', () => {
    const buildYamlPath = path.join(workspaceRoot, 'build.yml');
    const contents = fs.readFileSync(buildYamlPath, 'utf8');

    assert.ok(contents.includes('NodeTool@0'), 'NodeTool task missing');
    assert.ok(contents.includes('bun install'), 'bun install step missing');
    assert.ok(contents.includes('ng build'), 'ng build step missing');
});
