#!/usr/bin/env node
// Whetstone hub stress-test harness.
//
// Runs the *real* JavaScript from hub/index.html inside a Node `vm` context with a
// minimal DOM shim, then exercises the parsing/render path against malformed,
// edge-case and adversarial (XSS) inputs. No external dependencies.
//
//   node test/hub.test.mjs
//
// The goal is to prove: (1) nothing throws or mis-renders, (2) every field value
// reaches the DOM through esc() so no render path is an injection vector, and
// (3) the scheduling ladder is internally consistent (partial never stalls,
// nothing auto-retires) and agrees across FORMAT.md / SKILL.md / the hub.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HUB = readFileSync(join(ROOT, 'hub', 'index.html'), 'utf8');

// ---------------------------------------------------------------------------
// test runner
// ---------------------------------------------------------------------------
let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (detail ? '  ⟶ ' + detail : '')); console.log('  ✗ ' + name + (detail ? '  ⟶ ' + detail : '')); }
}
function section(t) { console.log('\n── ' + t); }

// ---------------------------------------------------------------------------
// minimal DOM shim
// ---------------------------------------------------------------------------
function makeEl(tag) {
  const cl = {
    _s: new Set(),
    add(...c) { c.forEach(x => this._s.add(x)); },
    remove(...c) { c.forEach(x => this._s.delete(x)); },
    toggle(c, f) { if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else { f ? this._s.add(c) : this._s.delete(c); } },
    contains(c) { return this._s.has(c); },
  };
  return {
    tagName: (tag || 'div').toUpperCase(), _children: [],
    _innerHTML: '', textContent: '', className: '',
    onclick: null, onkeydown: null, tabIndex: -1, disabled: false,
    style: {}, dataset: {}, classList: cl,
    set innerHTML(v) { this._innerHTML = String(v); this._children = []; },
    get innerHTML() { return this._innerHTML; },
    setAttribute(k, v) { this['attr_' + k] = String(v); if (k === 'tabindex') this.tabIndex = v; },
    getAttribute(k) { return this['attr_' + k]; },
    appendChild(c) { this._children.push(c); return c; },
  };
}
function makeDocument() {
  const byId = {};
  return {
    _byId: byId,
    getElementById(id) { return byId[id] || (byId[id] = makeEl('div')); },
    createElement(tag) { return makeEl(tag); },
    addEventListener() {}, removeEventListener() {},
    body: makeEl('body'),
  };
}

// collect every innerHTML string produced anywhere under an element (recursively)
function collectHtml(el, out = []) {
  if (!el) return out;
  if (el._innerHTML) out.push(el._innerHTML);
  (el._children || []).forEach(c => collectHtml(c, out));
  return out;
}

// ---------------------------------------------------------------------------
// build a fresh hub context (real script, DOM shim, hooks exposed)
// ---------------------------------------------------------------------------
function loadHub() {
  const m = HUB.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('could not find <script> in hub/index.html');
  let code = m[1];
  const hooks = `
    ;globalThis.__hooks = {
      parseConcepts, renderDeck, renderHome, renderLog, renderSide, renderProfile,
      renderSettings, isDue, classify, dueOf, esc, today, loadFolder, setScope,
      setState(d,l,p){ if(d!==undefined)decks=d; if(l!==undefined)logLines=l; if(p!==undefined)profileText=p; },
      setRoot(r){ rootDir=r; },
      getSessionText(){ return sessionText; },
      getDecks(){ return decks; }, getLogLines(){ return logLines; }
    };`;
  // neutralise the bootstrap picker call; expose internals instead
  code = code.replace(/\brestore\(\);\s*$/, hooks);
  if (!code.includes('__hooks')) throw new Error('failed to inject hooks (restore() not found)');

  const doc = makeDocument();
  const sandbox = {
    console,
    document: doc,
    localStorage: { _s: {}, getItem(k) { return this._s[k] ?? null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    indexedDB: { open() { return { onupgradeneeded: null, onsuccess: null, onerror: null }; } },
    // showDirectoryPicker intentionally undefined -> restore() short-circuits (we removed it anyway)
    setTimeout, clearTimeout, Promise, Date, JSON, Math, RegExp, String, Number, Array, Object,
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'hub/index.html' });
  return { h: sandbox.__hooks, doc, sandbox };
}

// Injection means user data introduced either (a) an unescaped '<tag' that no
// template emits, or (b) an unescaped quote that broke out of an attribute into a
// new event handler. esc() turns '<'->'&lt;' and '"'->'&quot;', so neither can
// survive if every value is escaped. (Templates set handlers via .onclick, never
// as inline on*= markup, so DANGER_ATTR has no legitimate matches.)
const DANGER_TAG = /<\s*\/?\s*(script|img|svg|iframe|object|embed|link|style|meta|base|body|form|input|template)\b/i;
const DANGER_ATTR = /["']\s+on\w+\s*=/i;
function assertClean(name, htmls) {
  const bad = htmls.find(s => DANGER_TAG.test(s) || DANGER_ATTR.test(s));
  ok(name, !bad, bad ? 'unescaped markup reached DOM: ' + bad.slice(0, 120) : '');
}

// ---------------------------------------------------------------------------
// dates relative to real "today" (hub uses new Date())
// ---------------------------------------------------------------------------
function isoOffset(days) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const YESTERDAY = isoOffset(-1), TOMORROW = isoOffset(1), NEXTYEAR = isoOffset(365);

// ===========================================================================
// 1. parseConcepts — malformed & edge inputs (must never throw)
// ===========================================================================
section('parseConcepts — malformed & edge inputs never throw');
{
  const { h } = loadHub();
  const P = h.parseConcepts;
  const cases = {
    'undefined body': undefined,
    'null body': null,
    'empty string': '',
    'whitespace only': '   \n\n  ',
    'no frontmatter / no concepts': '# just a heading\n\nsome prose\n',
    'README-like content': '## Install\n\n- Copy `SKILL.md`\n\n### The pieces\n\nprose only\n',
    'concept, no fields': '### C1 A title with no fields\n',
    'concept, blank field values': '### C1 Title\n- tier:\n- model:\n- due:\n- stage:\n- status:\n',
    'concept, missing header title': '### C1\n- tier: core\n',
    'concept, no id (empty head)': '### \n- tier: core\n',
    'multi-line model value': '### C1 Title\n- model: line one\n  continues on line two\n  and three\n- tier: core\n',
    'unicode / emoji / CJK': '### C1 概念 🧠 café — naïve\n- model: 强化学习 is fun 😄 — αβγ\n- tier: core\n- probes: 导出 | 為什麼\n',
    'CRLF line endings': '### C1 Title\r\n- tier: core\r\n- due: ' + TOMORROW + '\r\n- stage: 2\r\n',
    'duplicate ids': '### C1 First\n- tier: core\n### C1 Second\n- tier: gist\n',
    'weird stage values': '### C1 T\n- stage: not-a-number\n### C2 T\n- stage: 999\n### C3 T\n- stage: -5\n### C4 T\n- stage: 3abc\n',
    'malformed due': '### C1 T\n- due: not-a-date\n### C2 T\n- due: 2026-13-99\n### C3 T\n- due:\n',
    'field key casing / spacing': '### C1 T\n-   Tier:   Core  \n-  Weak-On:  something\n- STATUS: Active\n',
    'model containing ### mid-text': '### C1 T\n- model: consider the case ### where things break\n- tier: core\n',
  };
  for (const [name, body] of Object.entries(cases)) {
    let items, threw = null;
    try { items = P(body); } catch (e) { threw = e; }
    ok('parse: ' + name, !threw && Array.isArray(items), threw ? String(threw) : 'not an array');
  }

  // specific behaviour assertions
  const dup = P('### C1 First\n- tier: core\n### C1 Second\n- tier: gist\n');
  ok('duplicate ids both parsed', dup.length === 2 && dup[0].id === 'C1' && dup[1].id === 'C1');
  const stg = P('### C1 T\n- stage: not-a-number\n### C2 T\n- stage: 999\n### C3 T\n- stage: -5\n');
  ok('stage is always numeric', stg.every(i => typeof i.stage === 'number' && !Number.isNaN(i.stage)));
  const cas = P('### C1 T\n-   Tier:   Core  \n- STATUS: Active\n');
  ok('field keys lowercased & values trimmed', cas[0].tier === 'core' && cas[0].status === 'active');
  const ml = P('### C1 T\n- model: line one\n  continues\n- tier: core\n');
  ok('multi-line value keeps first line (no crash)', ml[0].fields.model === 'line one');
  const big = '### header\n' + Array.from({ length: 250 }, (_, i) => `### C${i} Concept ${i}\n- tier: ${i % 2 ? 'gist' : 'core'}\n- stage: ${i % 8}\n- due: ${TOMORROW}\n- model: m${i}\n`).join('');
  let bigItems, bigThrew = null;
  try { bigItems = P(big); } catch (e) { bigThrew = e; }
  ok('250+ concepts parse without crash', !bigThrew && bigItems.length === 251, bigThrew ? String(bigThrew) : 'count=' + (bigItems && bigItems.length));
}

// ===========================================================================
// 2. XSS — payloads in EVERY field must be neutralised on every render path
// ===========================================================================
section('XSS — every field value reaches the DOM through esc()');
{
  const PAYLOADS = {
    imgOnerror: '<img src=x onerror=alert(1)>',
    scriptTag: '"><script>alert(1)</script>',
    attrBreakout: 'x"><svg/onload=alert(1)>',
    attrHandler: 'x" onmouseover="alert(1)',   // pure attribute breakout, no <tag
    jsUri: '<a href="javascript:alert(1)">x</a>',
    quotes: 'a"b\'c<d>e&f',
  };
  for (const [pname, XSS] of Object.entries(PAYLOADS)) {
    const { h, doc } = loadHub();
    const body =
      `---\ntitle: ${XSS}\n---\n` +
      `### ${XSS} ${XSS}\n` +
      `- tier: ${XSS}\n` +
      `- stage: ${XSS}\n` +
      `- due: ${YESTERDAY}\n` +          // make it due so it also appears on home
      `- status: active\n` +
      `- model: ${XSS}\n` +
      `- probes: ${XSS}\n` +
      `- anchor: ${XSS}\n` +
      `- weak-on: ${XSS}\n` +
      `- history: ${XSS}\n`;
    const items = h.parseConcepts(body);
    const deck = { name: XSS + '.md', slug: 'x', title: XSS, items };
    h.setState([deck], ['- ' + YESTERDAY + ' [x] ' + XSS + ' · why: ' + XSS + ' · ' + XSS], XSS + '\nprofile line');

    let threw = null;
    try { h.renderDeck(0); h.renderHome(); h.renderSide(); h.renderLog(); h.renderProfile(); } catch (e) { threw = e; }
    ok('render with payload [' + pname + '] does not throw', !threw, threw ? String(threw) : '');

    assertClean('deck concepts clean [' + pname + ']', collectHtml(doc.getElementById('deck-concepts')));
    assertClean('home due-list clean [' + pname + ']', collectHtml(doc.getElementById('due-list')));
    assertClean('sidebar decks clean [' + pname + ']', collectHtml(doc.getElementById('side-decks')));
    assertClean('log body clean [' + pname + ']', collectHtml(doc.getElementById('log-body')));
    // profile uses textContent (never innerHTML) -> inherently safe, assert it stayed literal
    ok('profile rendered as text [' + pname + ']', doc.getElementById('profile-body').textContent.includes(XSS));

    // prove the value actually reached the (escaped) output, not silently dropped
    const escd = XSS.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const deckHtml = collectHtml(doc.getElementById('deck-concepts')).join('');
    ok('payload present but escaped in deck [' + pname + ']', deckHtml.includes(escd) || pname === 'quotes');
  }
}

// ===========================================================================
// 3. loadFolder — folder-shaped edge cases (mock File System Access handles)
// ===========================================================================
section('loadFolder — folder-shaped edge cases');
function fileHandle(name, text) { return { kind: 'file', name, async getFile() { return { async text() { return text; } }; } }; }
function dirHandle(name, files, subdirs = {}) {
  return {
    kind: 'directory', name,
    async getDirectoryHandle(n) { if (subdirs[n]) return subdirs[n]; const e = new Error('no dir ' + n); e.name = 'NotFoundError'; throw e; },
    async getFileHandle(n) { const f = files.find(x => x.name === n); if (!f) { const e = new Error('no file ' + n); e.name = 'NotFoundError'; throw e; } return f; },
    async *entries() { for (const f of files) yield [f.name, f]; for (const [k, v] of Object.entries(subdirs)) yield [k, v]; },
  };
}
async function runLoad(root) { const { h } = loadHub(); h.setRoot(root); await h.loadFolder(); return h; }

{
  // empty folder: no files at all
  const h = await runLoad(dirHandle('empty', []));
  ok('empty folder -> 0 decks, no throw', h.getDecks().length === 0);

  // no decks/ subdir: decks live at root
  const rootDeck = fileHandle('a.md', '### C1 T\n- tier: core\n- due: ' + TOMORROW + '\n- model: m\n');
  const h2 = await runLoad(dirHandle('flat', [rootDeck, fileHandle('LOG.md', '# log\n- 2026-07-14 [x] hi · why: y · http://z')]));
  ok('no decks/ subdir -> reads .md at root', h2.getDecks().length === 1 && h2.getLogLines().length === 1);

  // decks/ subdir present, plus README/SKILL that must be ignored
  const decksSub = dirHandle('decks', [
    fileHandle('real.md', '---\ntitle: "Real Deck"\n---\n### C1 T\n- tier: core\n- due: ' + TOMORROW + '\n- model: m\n'),
    fileHandle('README.md', '# Readme\n### Not a concept\nprose'),
    fileHandle('notes.txt', 'ignored, not markdown'),
    fileHandle('empty.md', 'no concepts here\n'),
  ]);
  const h3 = await runLoad(dirHandle('proj', [fileHandle('whetstone.json', '{"session":{"minutes":20,"max_concepts":6}}')], { decks: decksSub }));
  ok('decks/ subdir: only real deck kept, README/txt/empty skipped', h3.getDecks().length === 1 && h3.getDecks()[0].title === 'Real Deck');
  ok('whetstone.json session parsed for display', h3.getSessionText() === '20 min · 6 concepts');

  // invalid whetstone.json must not break loading
  const h4 = await runLoad(dirHandle('proj2', [fileHandle('whetstone.json', '{ not valid json ]'), rootDeck]));
  ok('invalid whetstone.json -> no throw, decks still load', h4.getDecks().length === 1);

  // a .md that is actually the SKILL/README doc (frontmatter-less, has ### headings)
  const skillLike = fileHandle('SKILLish.md', '# Whetstone\n\n## Dispatch\n\n### Setup mode\n\nAsk, in one round: things.\n\n### Ingest mode\n\nprose bullets\n- not a field just prose\n');
  const h5 = await runLoad(dirHandle('proj3', [skillLike]));
  ok('README/SKILL-shaped .md yields 0 decks (no junk concepts)', h5.getDecks().length === 0);

  // folder that only has non-deck files
  const h6 = await runLoad(dirHandle('proj4', [fileHandle('profile.md', '## patterns'), fileHandle('LOG.md', '# log\n')]));
  ok('folder with only profile/LOG -> 0 decks, no throw', h6.getDecks().length === 0);
}

// ===========================================================================
// 4. render empty states never throw
// ===========================================================================
section('empty states render without throwing');
{
  const { h } = loadHub();
  h.setState([], [], '');
  let threw = null;
  try { h.renderHome(); h.renderSide(); h.renderLog(); h.renderProfile(); h.setScope(-1); h.setScope('log'); h.setScope('profile'); h.setScope('settings'); } catch (e) { threw = e; }
  ok('all empty -> every pane renders', !threw, threw ? String(threw) : '');
}

// ===========================================================================
// 5. derived state: due/sharp/archived classification
// ===========================================================================
section('classification & due logic');
{
  const { h } = loadHub();
  const mk = (o) => h.parseConcepts(`### C1 T\n- tier: ${o.tier || 'core'}\n- stage: ${o.stage ?? 0}\n- due: ${o.due || ''}\n- status: ${o.status || 'active'}\n`)[0];
  ok('due yesterday + active => due', h.isDue(mk({ due: YESTERDAY })));
  ok('due today => due', h.isDue(mk({ due: h.today() })));
  ok('due tomorrow => not due', !h.isDue(mk({ due: TOMORROW })));
  ok('no due date => not due', !h.isDue(mk({ due: '' })));
  ok('archived + past due => not due', !h.isDue(mk({ due: YESTERDAY, status: 'archived' })));
  ok('archived classifies archived', h.classify(mk({ status: 'archived', due: YESTERDAY })) === 'archived');
  ok('stage>=5 classifies sharp', h.classify(mk({ stage: 6, due: NEXTYEAR })) === 'sharp');
  ok('past-due active classifies due', h.classify(mk({ due: YESTERDAY, stage: 6 })) === 'due');
}

// ===========================================================================
// 6. scheduling contract — simulate the ladder
// ===========================================================================
section('scheduling ladder — partial never stalls, nothing auto-retires');
{
  const LADDER = [1, 3, 7, 16, 35, 90, 180, 365];
  const top = { core: LADDER.length - 1, gist: 4 };
  // faithful re-implementation of the FORMAT/SKILL scheduling contract
  function step(s, grade) {
    const t = top[s.tier];
    let stage = s.stage, dueDays, streak = s.streak, status = s.status, rewrites = s.rewrites;
    if (grade === 'pass') { stage = Math.min(stage + 1, t); dueDays = LADDER[stage]; streak = 0; }
    else if (grade === 'partial') { stage = Math.min(stage + 1, t); dueDays = LADDER[Math.max(0, stage - 1)]; streak = 0; }
    else { stage = Math.max(0, stage - 1); dueDays = LADDER[stage]; streak = s.streak + 1; if (streak >= 3) { rewrites++; streak = 0; } }
    return { tier: s.tier, stage, dueDays, streak, status, rewrites };
  }

  for (const tier of ['core', 'gist']) {
    // (a) partial repeatedly: must climb to top and never stall / never retire
    let s = { tier, stage: 0, dueDays: 1, streak: 0, status: 'active', rewrites: 0 };
    let stalled = false, retired = false, prevStage = -1, reachedTop = false;
    for (let i = 0; i < 40; i++) {
      const n = step(s, 'partial');
      if (n.dueDays <= 0) stalled = true;
      if (n.status !== 'active') retired = true;
      // "advance" = stage increases until top; at top it holds (does not regress)
      if (n.stage < s.stage) stalled = true;
      if (n.stage === top[tier]) reachedTop = true;
      s = n; prevStage = n.stage;
    }
    ok(tier + ': partial always has positive interval (never stalls)', !stalled);
    ok(tier + ': partial reaches & holds top without retiring', reachedTop && !retired && s.stage === top[tier]);

    // (b) random mixed sequence: status must never auto-flip to archived
    let s2 = { tier, stage: 0, dueDays: 1, streak: 0, status: 'active', rewrites: 0 };
    const seq = ['fail', 'fail', 'partial', 'fail', 'pass', 'fail', 'fail', 'fail', 'partial', 'pass', 'fail', 'fail', 'fail'];
    let autoRetired = false;
    for (const g of seq) { s2 = step(s2, g); if (s2.status !== 'active') autoRetired = true; }
    ok(tier + ': nothing auto-retires on pass/partial/fail', !autoRetired);
    ok(tier + ': 3 consecutive fails trigger a rewrite (not archive)', s2.rewrites >= 2);
  }

  // (c) a single partial from every stage strictly advances stage (mid-ladder)
  let stallAt = null;
  for (let st = 0; st < LADDER.length - 1; st++) {
    const n = step({ tier: 'core', stage: st, dueDays: LADDER[st], streak: 0, status: 'active', rewrites: 0 }, 'partial');
    if (n.stage <= st) stallAt = st;
  }
  ok('core: partial advances stage from every mid-ladder position', stallAt === null, stallAt !== null ? 'stalled at stage ' + stallAt : '');
}

// ===========================================================================
// 7. cross-file scheduling consistency (FORMAT.md / SKILL.md / hub)
// ===========================================================================
section('ladder is identical across FORMAT.md, SKILL.md, and the hub');
{
  const fmt = readFileSync(join(ROOT, 'FORMAT.md'), 'utf8');
  const skill = readFileSync(join(ROOT, 'SKILL.md'), 'utf8');
  ok('FORMAT.md ladder = [1, 3, 7, 16, 35, 90, 180, 365]', fmt.includes('[1, 3, 7, 16, 35, 90, 180, 365]'));
  ok('SKILL.md ladder = [1, 3, 7, 16, 35, 90, 180, 365]', skill.includes('[1, 3, 7, 16, 35, 90, 180, 365]'));
  ok('hub IVALS = [1,3,7,16,35,90,180,365]', HUB.includes('[1,3,7,16,35,90,180,365]'));
  ok('FORMAT.md documents partial "never stall"', /partial[\s\S]*never stall|never stall/i.test(fmt));
  ok('SKILL.md documents partial "never stall"', /never stall/i.test(skill));
  ok('FORMAT.md: nothing retires automatically', /Nothing retires automatically|never auto-created/i.test(fmt));
  ok('SKILL.md: nothing retires on success', /Nothing retires on success/i.test(skill));
  ok('FORMAT.md & SKILL.md: 3 fails -> rewrite', /3 consecutive fails/i.test(fmt) && /3 consecutive fails/i.test(skill));
}

// ---------------------------------------------------------------------------
console.log('\n' + '─'.repeat(60));
console.log(`  ${pass} passed, ${fail} failed`);
if (fail) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  • ' + f)); process.exit(1); }
console.log('  ✓ all green');
