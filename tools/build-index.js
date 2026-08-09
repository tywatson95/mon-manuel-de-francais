#!/usr/bin/env node
/*
 * build-index.js — regenerates the two files the site needs to know what exists:
 *
 *   content/manifest.json      the navigation (lesson + vocab listings)
 *   content/search-index.json  the search corpus
 *
 * The lesson, vocab, recap and verb JSON files are the source of truth. This script
 * only reads them. Run it after adding or renaming content:
 *
 *   node tools/build-index.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const C = (...p) => path.join(ROOT, 'content', ...p);

const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const listJSON = dir => fs.existsSync(dir)
  ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()
  : [];

/* Strip the site's inline markup so search matches plain words. */
const plain = s => String(s == null ? '' : s)
  .replace(/\[fr\]|\[\/fr\]/g, '')
  .replace(/\{\{(.+?)\}\}/g, '')
  .replace(/\(\((.+?)\)\)/g, '$1')
  .replace(/\*\*/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const problems = [];
const docs = [];

/* ---------------- lessons ---------------- */
const lessons = listJSON(C('lessons')).map(f => {
  const d = readJSON(C('lessons', f));
  const id = path.basename(f, '.json');
  if (d.id !== id) problems.push(`${f}: "id" is "${d.id}" but the filename says "${id}"`);
  ['title', 'group', 'level', 'order'].forEach(k => {
    if (d[k] === undefined) problems.push(`${f}: missing "${k}"`);
  });
  if (!d.essentiel || !d.essentiel.length) problems.push(`${f}: no "L'essentiel" box (required by §3.2)`);
  if (!d.exercices || !d.exercices.length) problems.push(`${f}: no exercises (required by §3.2)`);

  const body = [
    plain(d.summary), plain(d.regle),
    (d.essentiel || []).map(plain).join(' '),
    (d.exemples || []).map(e => plain(e.fr) + ' ' + (e.en || '')).join(' '),
    d.dialogue ? d.dialogue.lines.map(l => l.fr).join(' ') : '',
    d.culture ? plain(d.culture.text) : ''
  ].join(' ').replace(/\s+/g, ' ').trim();

  docs.push({
    kind: 'lesson', href: '#/l/' + id, title: plain(d.title),
    level: d.level, sub: plain(d.summary), body
  });

  return { id, title: d.title, summary: d.summary || '', group: d.group, level: d.level, order: d.order };
});

/* ---------------- vocabulary ---------------- */
const vocab = listJSON(C('vocab')).map(f => {
  const d = readJSON(C('vocab', f));
  const id = path.basename(f, '.json');
  if (d.id !== id) problems.push(`${f}: "id" is "${d.id}" but the filename says "${id}"`);
  if (!d.items || !d.items.length) problems.push(`${f}: no vocabulary items`);

  (d.items || []).forEach(it => {
    docs.push({
      kind: 'vocab', href: '#/v/' + id, title: it.fr,
      level: d.level, sub: it.en + ' · ' + d.title, body: (it.ex || '')
    });
  });

  return { id, title: d.title, level: d.level, order: d.order || 0, count: (d.items || []).length };
});
vocab.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'fr'));

/* ---------------- verbs ---------------- */
const verbs = readJSON(C('verbes', 'verbs.json'));
const slug = v => (v.refl ? 'se-' : '') +
  v.inf.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

const seenSlug = new Set();
verbs.forEach(v => {
  const s = slug(v);
  if (seenSlug.has(s)) problems.push(`verbs.json: duplicate id "${s}"`);
  seenSlug.add(s);
  docs.push({
    kind: 'verb', href: '#/verbe/' + s,
    title: (v.refl ? 'se ' : '') + v.inf,
    level: v.lvl, sub: v.en, body: ''
  });
});

/* ---------------- recaps ---------------- */
const GROUPS = ['prononciation', 'noms-adjectifs', 'pronoms', 'temps-modes',
                'phrase', 'connecteurs', 'vocabulaire', 'communication'];
GROUPS.forEach(g => {
  const f = C('recaps', g + '.json');
  if (!fs.existsSync(f)) { problems.push(`recaps/${g}.json is missing (§3.3 requires one per group)`); return; }
  const d = readJSON(f);
  docs.push({
    kind: 'lesson', href: '#/recap/' + g, title: plain(d.title),
    level: d.level || 'B1', sub: plain(d.summary),
    body: (d.blocks || []).map(b => plain(b.title) + ' ' + (b.points || []).map(plain).join(' ')).join(' ')
  });
});

/* orphan check: a lesson in a group with no nav entry is unreachable */
lessons.forEach(l => {
  if (!GROUPS.includes(l.group)) problems.push(`${l.id}: unknown group "${l.group}"`);
});

/* ---------------- write ---------------- */
const manifest = {
  generated: 'run `node tools/build-index.js` to refresh',
  lessons: lessons.sort((a, b) => a.order - b.order),
  vocab,
  verbCount: verbs.length
};

fs.writeFileSync(C('manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(C('search-index.json'), JSON.stringify({ docs }));

const byLevel = lessons.reduce((a, l) => (a[l.level] = (a[l.level] || 0) + 1, a), {});
const byGroup = lessons.reduce((a, l) => (a[l.group] = (a[l.group] || 0) + 1, a), {});

console.log(`lessons  ${lessons.length}   ${JSON.stringify(byLevel)}`);
console.log(`         ${JSON.stringify(byGroup)}`);
console.log(`vocab    ${vocab.length} themes, ${vocab.reduce((n, v) => n + v.count, 0)} words`);
console.log(`verbs    ${verbs.length}`);
console.log(`search   ${docs.length} entries`);

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s):');
  problems.forEach(p => console.log('  · ' + p));
  process.exitCode = 1;
} else {
  console.log('\nno problems found.');
}
