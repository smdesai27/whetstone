#!/usr/bin/env node
// Version-consistency check for the two update channels.
//
// Copied installs compare SKILL.md's frontmatter `version`; plugin installs
// compare .claude-plugin/plugin.json's `version`. Both channels only deliver
// an update when their string bumps, so the two must always agree — and
// marketplace.json must NOT set one (plugin.json would silently win).
//
//   node test/version.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (detail ? '  ⟶ ' + detail : '')); console.log('  ✗ ' + name + (detail ? '  ⟶ ' + detail : '')); }
}

const skill = readFileSync(join(ROOT, 'SKILL.md'), 'utf8');
const plugin = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
const market = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));

const fm = skill.match(/^---\n([\s\S]*?)\n---/);
ok('SKILL.md has frontmatter', !!fm);
const skillVersion = fm && (fm[1].match(/^version:\s*(\S+)\s*$/m) || [])[1];
const skillName = fm && (fm[1].match(/^name:\s*(\S+)\s*$/m) || [])[1];

ok('SKILL.md frontmatter has a version', !!skillVersion);
ok('SKILL.md version looks like semver', /^\d+\.\d+\.\d+$/.test(skillVersion || ''), skillVersion);
ok('plugin.json version matches SKILL.md version', plugin.version === skillVersion,
  `plugin.json ${plugin.version} vs SKILL.md ${skillVersion}`);
ok('plugin.json name matches SKILL.md name', plugin.name === skillName,
  `plugin.json ${plugin.name} vs SKILL.md ${skillName}`);

const entry = (market.plugins || []).find(p => p.name === plugin.name);
ok('marketplace.json lists the plugin', !!entry);
ok('marketplace entry does not set a version (plugin.json is the single source)',
  entry && !('version' in entry));

// The self-update path in SKILL.md must point at the same raw URL the installers use.
const installSh = readFileSync(join(ROOT, 'install.sh'), 'utf8');
const rawUrl = (installSh.match(/REPO_RAW="([^"]+)"/) || [])[1];
ok('install.sh declares REPO_RAW', !!rawUrl);
ok('SKILL.md update mode fetches from REPO_RAW', !!rawUrl && skill.includes(`${rawUrl}/SKILL.md`));

console.log(`\nversion consistency: ${pass} passed, ${fail} failed`);
if (fail) { console.log(fails.map(f => '  ✗ ' + f).join('\n')); process.exit(1); }
