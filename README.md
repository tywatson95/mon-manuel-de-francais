# Mon Manuel de Français

An interactive French textbook, **A1 → B2**, browsable by topic. Grammar lessons, vocabulary
flashcards, a searchable conjugator for 254 verbs, four kinds of exercise, text-to-speech, and
accent-insensitive global search.

**Static site.** No backend, no database, no accounts, no analytics, no build step.
**Stateless.** Nothing is remembered between visits except your light/dark theme choice.

---

## Running it locally

The site loads its content with `fetch`, so it needs to be served over HTTP — opening
`index.html` by double-clicking will show a "content won't load" message. Any tiny static
server works:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

---

## What's in here

```
index.html              the only page — everything else is routed with #/hashes
assets/css/app.css      all styling, including both themes
assets/js/              util · tts · store · verbs · exercises · flashcards · render · search · nav · app
content/lessons/*.json  one file per lesson
content/vocab/*.json    one file per vocabulary theme
content/recaps/*.json   one "Récap express" per topic group
content/verbes/verbs.json   the verb dataset
content/manifest.json       generated — the navigation
content/search-index.json   generated — the search corpus
tools/build-index.js    regenerates the two generated files and validates the content
```

The eight topic groups are fixed in `assets/js/util.js` (`GROUP_META`):
`prononciation · noms-adjectifs · pronoms · temps-modes · phrase · connecteurs · vocabulaire · communication`.

---

## Adding a lesson

Create `content/lessons/<id>.json` with `id` (matching the filename), `title`, `group` (one of the
eight above), `level` (`A1`–`B2`), `order` (a number — lessons sort by it inside a group, so A1
lessons use 1xx, A2 2xx, B1 3xx, B2 4xx), `summary`, an `essentiel` array of 1–3 bullets, and an
`exercices` array; then optionally `regle`, `exemples`, `tableaux`, `dialogue` and `culture`, which
render in the fixed order of the lesson template. Run `node tools/build-index.js` to refresh the
navigation and the search index — that script also checks every lesson has an id matching its
filename, an "L'essentiel" box and at least one exercise, and tells you what's missing. You never
touch layout code to add content.

### Writing conventions inside the text

| You write | You get |
|---|---|
| `[fr]…[/fr]` | a French run, styled distinctly from explanation text |
| `((…))` | an English gloss in grey italics |
| `{{ɑ̃}}` | IPA between slashes |
| `**bold**` `*italic*` | bold / italic |
| blank line | new paragraph; lines starting `- ` become a list |

### The four exercise types

```jsonc
{ "type": "qcm",    "consigne": "…", "items": [ { "q": "…", "options": ["…"], "answer": 0, "why": "…" } ] }
{ "type": "trou",   "consigne": "…", "items": [ { "before": "…", "after": "…", "answer": "…",
                                                  "alt": ["…"], "hint": "…", "why": "…",
                                                  "strict": true } ] }
{ "type": "paires", "consigne": "…", "pairs": [ ["français", "sens"] ] }
{ "type": "ordre",  "consigne": "…", "items": [ { "tokens": ["…"], "answer": "…" } ] }
```

Typed answers are **accent-tolerant**: `ecole` is accepted and gently corrected to `école`. Set
`"strict": true` when the accent *is* the answer (`a`/`à`, `ou`/`où`, `sur`/`sûr`, `du`/`dû`,
`la`/`là`) — then the unaccented form is marked wrong.

## Adding a vocabulary theme

Create `content/vocab/<id>.json` with `id`, `title`, `level`, `order`, `summary` and an `items`
array of `{ fr, ipa, en, ex }`. It appears automatically in group 7 with its flashcard deck.
Rerun `node tools/build-index.js`.

## Adding a verb

Add a record to `content/verbes/verbs.json`. Regular and spelling-change verbs only need
`inf`, `en`, `lvl`, `fam` and `aux` — every tense is generated:

```jsonc
{ "inf": "parler", "en": "to speak", "lvl": "A1", "fam": "er", "aux": "avoir" }
```

`fam` is one of `er · ger · cer · eler · eter · ete · ere · yer · ir · re · irr`. Irregulars
(`"fam": "irr"`) add only what can't be derived: `pres` (6 forms), `fut` (future stem), `pp`,
and optionally `impf`, `subj`, `ps`, `ppr`, `impr`. Extra flags: `refl` (pronominal),
`impers` (only *il*), `impr: false` (no imperative), `noagree` (no participle agreement).

---

## Deploying to GitHub Pages

Serve from the branch root — there is no build step:

1. Push this folder to a public repo (suggested name `mon-manuel-de-francais`).
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.

Routing uses hashes (`#/l/tm-a2-imparfait`), so every URL survives static hosting without
redirect rules, and the site works from a project subpath (`/mon-manuel-de-francais/`) as well as
from a domain root. `.nojekyll` stops GitHub from running Jekyll over the files.

## Browser notes

Text-to-speech uses the Web Speech API with a `fr-FR` voice. Chrome and Safari have one by
default; Firefox needs a system voice installed. If none is found, the speaker buttons disable
themselves and a one-line "audio indisponible" notice appears — everything else keeps working.
