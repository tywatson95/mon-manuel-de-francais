/* render.js — every page view. Each function returns a DOM node; app.js swaps it in. */
(function (w) {
  'use strict';
  var U = w.U, el = U.el, GM = U.GROUP_META;

  var GROUP_BLURB = {
    'prononciation':  'Les sons, les accents, la liaison — et l’alphabet phonétique expliqué une fois pour toutes.',
    'noms-adjectifs': 'Genre, nombre, articles, accord et comparaison : la mécanique du groupe nominal.',
    'pronoms':        'Remplacer sans répéter : sujets, COD/COI, y et en, relatifs, doubles pronoms.',
    'temps-modes':    'Tous les temps et tous les modes, du présent au subjonctif passé.',
    'phrase':         'Questionner, nier, mettre en relief, rapporter, supposer.',
    'connecteurs':    'Relier ses idées : cause, conséquence, opposition, concession, argumentation.',
    'vocabulaire':    'Thèmes de vocabulaire avec cartes mémoire, prononciation et exemples.',
    'communication':  'Se débrouiller pour de vrai : situations, registres et repères culturels.'
  };

  function crumbs(parts) {
    var c = el('nav', { class: 'crumb', 'aria-label': 'Fil d’Ariane' });
    parts.forEach(function (p, i) {
      if (i) c.appendChild(el('span', { text: '›', 'aria-hidden': 'true' }));
      c.appendChild(p.href ? el('a', { href: p.href, text: p.text }) : el('span', { text: p.text }));
    });
    return c;
  }

  function section(title, node) {
    return el('section', { class: 'section' }, [el('h2', { text: title }), node]);
  }

  /* ---------------- home ---------------- */
  function home(m) {
    var counts = {};
    m.lessons.forEach(function (l) { counts[l.group] = (counts[l.group] || 0) + 1; });
    m.vocab.forEach(function (v) { counts['vocabulaire'] = (counts['vocabulaire'] || 0) + 1; });

    var cards = el('div', { class: 'group-grid' });
    Object.keys(GM).forEach(function (g) {
      var levels = {};
      m.lessons.filter(function (l) { return l.group === g; }).forEach(function (l) { levels[l.level] = 1; });
      if (g === 'vocabulaire') m.vocab.forEach(function (v) { levels[v.level] = 1; });
      cards.appendChild(el('a', { class: 'group-card', href: '#/g/' + g }, [
        el('div', { class: 'gc-num', text: String(GM[g].n).padStart(2, '0') }),
        el('h3', { lang: 'fr', text: GM[g].label }),
        el('p', { lang: 'fr', text: GROUP_BLURB[g] }),
        el('div', { class: 'gc-foot' }, U.LEVELS.filter(function (L) { return levels[L]; })
          .map(function (L) { return U.levelTag(L); })
          .concat([el('span', { class: 'gc-count', text: (counts[g] || 0) + (g === 'vocabulaire' ? ' thèmes' : ' leçons') })]))
      ]));
    });

    return el('div', { class: 'stack' }, [
      el('div', { class: 'home-hero' }, [
        el('h1', { lang: 'fr', text: 'Mon Manuel de Français' }),
        el('p', { lang: 'fr', text: 'Toute la grammaire, le vocabulaire et la conjugaison de A1 à B2, rangés par thème. Choisis un domaine et commence.' })
      ]),
      cards,
      el('a', { class: 'home-conj', href: '#/conjugueur' }, [
        el('span', { class: 'hc-icon', text: '⚡', 'aria-hidden': 'true' }),
        el('div', {}, [
          el('h3', { lang: 'fr', text: 'Le conjugueur' }),
          el('p', { lang: 'fr', text: m.verbCount + ' verbes, tous les temps, les plus utiles d’abord.' })
        ]),
        U.icon(U.ICONS.arrowRight, 'hc-go')
      ])
    ]);
  }

  /* ---------------- group index ---------------- */
  function group(m, g) {
    if (g === 'vocabulaire') return vocabIndex(m);
    var lessons = m.inGroup(g);
    var wrap = el('div', {});
    wrap.appendChild(crumbs([{ text: 'Accueil', href: '#/' }, { text: GM[g].label }]));
    wrap.appendChild(el('div', { class: 'home-hero', style: 'padding-top:0' }, [
      el('h1', { lang: 'fr', text: GM[g].label }),
      el('p', { lang: 'fr', text: GROUP_BLURB[g] })
    ]));

    var filters = el('div', { class: 'filters' });
    var active = null;
    var list = el('div', { class: 'les-list' });

    function paint() {
      list.innerHTML = '';
      var shown = lessons.filter(function (l) { return !active || l.level === active; });
      if (!shown.length) { list.appendChild(el('div', { class: 'empty', text: 'Aucune leçon à ce niveau dans ce thème.' })); return; }
      shown.forEach(function (l) {
        list.appendChild(el('a', { class: 'les-row', href: '#/l/' + l.id }, [
          U.levelTag(l.level),
          el('div', { class: 'lr-main' }, [
            el('div', { class: 'lr-title', lang: 'fr', text: l.title }),
            l.summary ? el('div', { class: 'lr-sum', lang: 'fr', text: l.summary }) : null
          ]),
          U.icon(U.ICONS.chevronRight, 'lr-go')
        ]));
      });
    }

    var allChip = el('button', { class: 'chip', type: 'button', text: 'Tous', 'aria-pressed': 'true' });
    var chips = [allChip];
    allChip.addEventListener('click', function () { active = null; sync(); });
    U.LEVELS.forEach(function (L) {
      if (!lessons.some(function (l) { return l.level === L; })) return;
      var c = el('button', { class: 'chip chip-' + L, type: 'button', text: L, 'aria-pressed': 'false' });
      c.addEventListener('click', function () { active = active === L ? null : L; sync(); });
      chips.push(c);
    });
    function sync() {
      chips.forEach(function (c) {
        var isAll = c === allChip;
        c.setAttribute('aria-pressed', String(isAll ? !active : c.textContent === active));
      });
      paint();
    }
    chips.forEach(function (c) { filters.appendChild(c); });
    wrap.appendChild(filters);
    wrap.appendChild(list);
    paint();

    wrap.appendChild(el('div', { style: 'margin-top:32px' }, [
      el('a', { class: 'home-conj', href: '#/recap/' + g }, [
        el('span', { class: 'hc-icon', text: '📋', 'aria-hidden': 'true' }),
        el('div', {}, [
          el('h3', { lang: 'fr', text: 'Récap express' }),
          el('p', { lang: 'fr', text: 'Tout ce thème sur un seul écran — la fiche de révision.' })
        ]),
        U.icon(U.ICONS.arrowRight, 'hc-go')
      ])
    ]));
    return wrap;
  }

  /* ---------------- vocabulary index (group 7 landing) ---------------- */
  function vocabIndex(m) {
    var wrap = el('div', {});
    wrap.appendChild(crumbs([{ text: 'Accueil', href: '#/' }, { text: 'Vocabulaire' }]));
    wrap.appendChild(el('div', { class: 'home-hero', style: 'padding-top:0' }, [
      el('h1', { lang: 'fr', text: 'Vocabulaire' }),
      el('p', { lang: 'fr', text: 'Chaque thème a sa liste et son paquet de cartes mémoire. Rien n’est enregistré : chaque session repart à zéro.' })
    ]));

    var filters = el('div', { class: 'filters' });
    var grid = el('div', { class: 'theme-grid' });
    var active = null;

    function paint() {
      grid.innerHTML = '';
      m.vocab.filter(function (v) { return !active || v.level === active; })
        .forEach(function (v) {
          grid.appendChild(el('a', { class: 'theme-card', href: '#/v/' + v.id }, [
            el('h3', { lang: 'fr', text: v.title }),
            el('div', { class: 'tc-foot' }, [
              U.levelTag(v.level),
              el('span', { class: 'tc-count', text: v.count + ' mots' })
            ])
          ]));
        });
      if (!grid.children.length) grid.appendChild(el('div', { class: 'empty', text: 'Aucun thème à ce niveau.' }));
    }

    var allChip = el('button', { class: 'chip', type: 'button', text: 'Tous', 'aria-pressed': 'true' });
    var chips = [allChip];
    allChip.addEventListener('click', function () { active = null; sync(); });
    U.LEVELS.forEach(function (L) {
      var c = el('button', { class: 'chip chip-' + L, type: 'button', text: L, 'aria-pressed': 'false' });
      c.addEventListener('click', function () { active = active === L ? null : L; sync(); });
      chips.push(c);
    });
    function sync() {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === allChip ? !active : c.textContent === active)); });
      paint();
    }
    chips.forEach(function (c) { filters.appendChild(c); });
    wrap.appendChild(filters); wrap.appendChild(grid); paint();
    return wrap;
  }

  /* ---------------- vocabulary theme ---------------- */
  function vocabTheme(theme) {
    var wrap = el('div', {});
    wrap.appendChild(crumbs([
      { text: 'Accueil', href: '#/' },
      { text: 'Vocabulaire', href: '#/g/vocabulaire' },
      { text: theme.title }
    ]));
    wrap.appendChild(el('div', { class: 'lesson-head' }, [
      el('div', { class: 'gc-foot', style: 'margin-bottom:8px' }, [U.levelTag(theme.level, true)]),
      el('h1', { lang: 'fr', text: theme.title }),
      theme.summary ? el('p', { class: 'lesson-sum', lang: 'fr', text: theme.summary }) : null
    ]));

    wrap.appendChild(section('Cartes mémoire', w.Flash.build(theme)));

    var list = el('div', { class: 'vocab-list' });
    theme.items.forEach(function (it) {
      list.appendChild(el('div', { class: 'vocab-row' }, [
        w.TTS.button(it.ex || it.fr, 'Écouter ' + it.fr),
        el('div', { class: 'vocab-main' }, [
          el('div', {}, [
            el('span', { class: 'vocab-fr', lang: 'fr', text: it.fr }),
            it.ipa ? el('span', { class: 'ipa', text: '  /' + it.ipa + '/' }) : null
          ]),
          el('div', { class: 'vocab-en', text: it.en }),
          it.ex ? el('div', { class: 'vocab-ex', lang: 'fr', text: it.ex }) : null
        ])
      ]));
    });
    wrap.appendChild(section('La liste complète', list));

    if (theme.exercices && theme.exercices.length) {
      var exs = el('div', {});
      theme.exercices.forEach(function (e) { exs.appendChild(w.Exo.build(e)); });
      wrap.appendChild(section('Exercices', exs));
    }
    return wrap;
  }

  /* ---------------- lesson ---------------- */
  function lesson(data, m) {
    var g = data.group;
    var sibs = m.inGroup(g);
    var idx = sibs.findIndex(function (l) { return l.id === data.id; });
    var prev = idx > 0 ? sibs[idx - 1] : null;
    var next = idx >= 0 && idx < sibs.length - 1 ? sibs[idx + 1] : null;

    var wrap = el('article', { class: 'lesson' });
    wrap.appendChild(crumbs([
      { text: 'Accueil', href: '#/' },
      { text: GM[g] ? GM[g].label : g, href: '#/g/' + g },
      { text: data.title }
    ]));

    wrap.appendChild(el('header', { class: 'lesson-head' }, [
      el('div', { class: 'gc-foot', style: 'margin-bottom:10px' }, [U.levelTag(data.level, true)]),
      el('h1', { lang: 'fr', text: data.title }),
      data.summary ? el('p', { class: 'lesson-sum', lang: 'fr', text: data.summary }) : null
    ]));

    // 2 · L'essentiel
    if (data.essentiel && data.essentiel.length) {
      wrap.appendChild(el('section', { class: 'essentiel section', lang: 'fr' }, [
        el('h2', { text: 'L’essentiel' }),
        el('ul', {}, data.essentiel.map(function (b) { return el('li', { html: U.inline(b) }); }))
      ]));
    }

    // 3 · La règle
    if (data.regle) wrap.appendChild(section('La règle', el('div', { lang: 'fr' }, [U.prose(data.regle)])));

    // 4 · Exemples
    if (data.exemples && data.exemples.length) {
      var exl = el('ul', { class: 'ex-list' });
      data.exemples.forEach(function (x) {
        exl.appendChild(el('li', { class: 'ex' }, [
          w.TTS.button(x.fr, 'Écouter la phrase'),
          el('div', { class: 'ex-body' }, [
            el('div', { class: 'ex-fr', lang: 'fr', html: U.inline(x.fr) }),
            x.en ? el('div', { class: 'ex-en', text: x.en }) : null
          ])
        ]));
      });
      wrap.appendChild(section('Exemples', exl));
    }

    // 5 · Tableau(x)
    var tables = data.tableaux || (data.tableau ? [data.tableau] : []);
    if (tables.length) {
      var box = el('div', { class: 'stack' });
      tables.forEach(function (t) { box.appendChild(tableBlock(t)); });
      wrap.appendChild(section(tables.length > 1 ? 'Tableaux' : 'Tableau', box));
    }

    // 6 · Mini-dialogue
    if (data.dialogue) {
      var d = data.dialogue;
      var dlg = el('div', { class: 'dialogue' });
      d.lines.forEach(function (l) {
        dlg.appendChild(el('div', { class: 'dlg-line' }, [
          el('span', { class: 'dlg-who', text: l.who }),
          el('div', { class: 'dlg-body' }, [
            el('div', { class: 'dlg-fr', lang: 'fr', text: l.fr }),
            l.en ? el('div', { class: 'dlg-en', text: l.en }) : null
          ]),
          w.TTS.button(l.fr, 'Écouter la réplique')
        ]));
      });
      var block = el('div', { class: 'stack' }, [dlg]);
      if (d.check) block.appendChild(w.Exo.build({ type: 'qcm', consigne: d.check.consigne || 'Vérifie ta compréhension.', items: [d.check] }));
      wrap.appendChild(section(d.title || 'Mini-dialogue', block));
    }

    // 7 · Note culturelle
    if (data.culture) {
      wrap.appendChild(section('Note culturelle', el('aside', { class: 'culture', lang: 'fr' }, [
        el('span', { class: 'cn-icon', text: data.culture.icon || '🇫🇷', 'aria-hidden': 'true' }),
        el('div', {}, [
          data.culture.title ? el('h3', { text: data.culture.title }) : null,
          el('p', { html: U.inline(data.culture.text) })
        ])
      ])));
    }

    // 8 · Exercices
    if (data.exercices && data.exercices.length) {
      var exs = el('div', {});
      data.exercices.forEach(function (e) { exs.appendChild(w.Exo.build(e)); });
      wrap.appendChild(section('Exercices', exs));
    }

    // 9 · Footer
    var foot = el('nav', { class: 'les-foot', 'aria-label': 'Leçon précédente et suivante' });
    foot.appendChild(prev
      ? el('a', { class: 'foot-link', href: '#/l/' + prev.id }, [
          el('div', { class: 'fl-dir', text: '← Précédent' }),
          el('div', { class: 'fl-title', lang: 'fr', text: prev.title })
        ])
      : el('a', { class: 'foot-link', href: '#/g/' + g }, [
          el('div', { class: 'fl-dir', text: '←' }),
          el('div', { class: 'fl-title', lang: 'fr', text: GM[g] ? GM[g].label : 'Retour' })
        ]));
    foot.appendChild(next
      ? el('a', { class: 'foot-link next', href: '#/l/' + next.id }, [
          el('div', { class: 'fl-dir', text: 'Suivant →' }),
          el('div', { class: 'fl-title', lang: 'fr', text: next.title })
        ])
      : el('a', { class: 'foot-link next', href: '#/recap/' + g }, [
          el('div', { class: 'fl-dir', text: 'Fin du thème →' }),
          el('div', { class: 'fl-title', lang: 'fr', text: 'Récap express' })
        ]));
    wrap.appendChild(foot);

    return wrap;
  }

  function tableBlock(t) {
    var tbl = el('table', { class: 'tbl' });
    if (t.headers) {
      tbl.appendChild(el('thead', {}, [el('tr', {}, t.headers.map(function (h) {
        return el('th', { scope: 'col', lang: 'fr', html: U.inline(h) });
      }))]));
    }
    tbl.appendChild(el('tbody', {}, t.rows.map(function (r) {
      return el('tr', {}, r.map(function (c, i) {
        return el('td', { lang: 'fr', class: i && /^\(/.test(String(c)) ? 'cell-note' : null, html: U.inline(c) });
      }));
    })));
    var scroller = el('div', { class: 'tbl-wrap' }, [tbl]);

    // Progressive disclosure (§2.4): anything long folds away behind a clear label.
    var big = t.collapsed === true || (t.collapsed !== false && t.rows.length > 6);
    if (!big) {
      return el('div', {}, [t.title ? el('div', { class: 'tbl-title', lang: 'fr', text: t.title }) : null, scroller]);
    }
    return el('details', { class: 'fold' }, [
      el('summary', {}, [U.icon(U.ICONS.chevronRight, 'chev'), el('span', { lang: 'fr', text: t.title || 'Voir le tableau complet' })]),
      el('div', { class: 'fold-body' }, [scroller])
    ]);
  }

  /* ---------------- récap ---------------- */
  function recap(data, g) {
    var wrap = el('div', {});
    wrap.appendChild(crumbs([
      { text: 'Accueil', href: '#/' },
      { text: GM[g] ? GM[g].label : g, href: '#/g/' + g },
      { text: 'Récap express' }
    ]));
    var body = el('div', { class: 'recap-body' });
    data.blocks.forEach(function (b) {
      body.appendChild(el('div', { class: 'recap-block' }, [
        el('h3', { lang: 'fr' }, [b.level ? U.levelTag(b.level) : null, el('span', { text: b.title })]),
        el('ul', { lang: 'fr' }, b.points.map(function (p) { return el('li', { html: U.inline(p) }); }))
      ]));
    });
    wrap.appendChild(el('div', { class: 'recap' }, [
      el('header', { class: 'recap-head' }, [
        el('h1', { lang: 'fr', text: data.title }),
        el('p', { lang: 'fr', text: data.summary })
      ]),
      body
    ]));
    return wrap;
  }

  /* ---------------- conjugator ---------------- */
  function conjIndex(verbs, q) {
    var wrap = el('div', {});
    wrap.appendChild(crumbs([{ text: 'Accueil', href: '#/' }, { text: 'Conjugueur' }]));
    wrap.appendChild(el('div', { class: 'home-hero', style: 'padding-top:0' }, [
      el('h1', { lang: 'fr', text: 'Le conjugueur' }),
      el('p', { lang: 'fr', text: verbs.length + ' verbes. Les temps de tous les jours d’abord ; le reste est à un clic.' })
    ]));

    var input = el('input', { type: 'search', lang: 'fr', placeholder: 'Un verbe… (aller, prendre, devoir)', 'aria-label': 'Chercher un verbe', autocomplete: 'off', spellcheck: 'false' });
    wrap.appendChild(el('div', { class: 'conj-search' }, [
      U.icon('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 'search-icon'),
      input
    ]));

    var filters = el('div', { class: 'filters' });
    var lvl = null;
    var hits = el('div', { class: 'verb-hits' });

    function paint() {
      var needle = U.fold(input.value.trim());
      var list = verbs.filter(function (v) {
        if (lvl && v.lvl !== lvl) return false;
        if (!needle) return true;
        return U.fold(v.inf).indexOf(needle) === 0
            || U.fold(v.inf).indexOf(needle) > -1
            || U.fold(v.en || '').indexOf(needle) > -1;
      });
      list.sort(function (a, b) {
        var an = U.fold(a.inf).indexOf(needle) === 0 ? 0 : 1;
        var bn = U.fold(b.inf).indexOf(needle) === 0 ? 0 : 1;
        return an - bn || a.inf.localeCompare(b.inf, 'fr');
      });
      hits.innerHTML = '';
      list.slice(0, 200).forEach(function (v) {
        hits.appendChild(el('a', { class: 'verb-hit', href: '#/verbe/' + w.Verbs.slug(v) }, [
          U.levelTag(v.lvl),
          el('span', { class: 'vh-inf', lang: 'fr', text: (v.refl ? 'se ' : '') + v.inf }),
          el('span', { class: 'vh-en', text: v.en })
        ]));
      });
      if (!list.length) hits.appendChild(el('div', { class: 'empty', text: 'Aucun verbe trouvé.' }));
    }
    input.addEventListener('input', paint);

    var allChip = el('button', { class: 'chip', type: 'button', text: 'Tous', 'aria-pressed': 'true' });
    var chips = [allChip];
    allChip.addEventListener('click', function () { lvl = null; sync(); });
    U.LEVELS.forEach(function (L) {
      var c = el('button', { class: 'chip chip-' + L, type: 'button', text: L, 'aria-pressed': 'false' });
      c.addEventListener('click', function () { lvl = lvl === L ? null : L; sync(); });
      chips.push(c);
    });
    function sync() {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === allChip ? !lvl : c.textContent === lvl)); });
      paint();
    }
    chips.forEach(function (c) { filters.appendChild(c); });
    wrap.appendChild(filters);
    wrap.appendChild(hits);
    if (q) input.value = q;
    paint();
    setTimeout(function () { input.focus({ preventScroll: true }); }, 30);
    return wrap;
  }

  function tenseCard(t, rows, note) {
    var card = el('section', { class: 'tense lv-' + t.lvl });
    card.appendChild(el('header', { class: 'tense-head' }, [
      el('h3', { lang: 'fr', text: t.name }),
      U.levelTag(t.lvl)
    ]));
    if (!rows.length) {
      card.appendChild(el('div', { class: 'conj-note', lang: 'fr', text: note || 'Ce verbe n’a pas ce temps.' }));
      return card;
    }
    var body = el('div', { class: 'conj-rows' });
    rows.forEach(function (r) {
      body.appendChild(el('div', { class: 'conj-row' }, [
        el('span', { class: 'cr-pron', text: r.pron }),
        el('span', { class: 'cr-form', lang: 'fr', text: r.form }),
        w.TTS.button(r.say, 'Écouter')
      ]));
    });
    card.appendChild(body);
    if (note) card.appendChild(el('div', { class: 'conj-note', lang: 'fr', text: note }));
    return card;
  }

  function verbPage(v) {
    var c = w.Verbs.conjugate(v);
    var wrap = el('div', {});
    wrap.appendChild(crumbs([
      { text: 'Accueil', href: '#/' },
      { text: 'Conjugueur', href: '#/conjugueur' },
      { text: (v.refl ? 'se ' : '') + v.inf }
    ]));

    wrap.appendChild(el('div', { class: 'verb-head' }, [
      el('div', {}, [
        el('h1', { lang: 'fr' }, [
          el('span', { text: (v.refl ? 'se ' : '') + v.inf }),
          ' ',
          w.TTS.button((v.refl ? 'se ' : '') + v.inf, 'Écouter l’infinitif')
        ]),
        el('div', { class: 'verb-meta' }, [
          U.levelTag(v.lvl, true),
          el('span', { text: v.en }),
          v.ipa ? el('span', { class: 'ipa', text: '/' + v.ipa + '/' }) : null,
          el('span', { class: 'verb-badge', lang: 'fr', text: w.Verbs.familyLabel(v) }),
          el('span', { class: 'verb-badge', lang: 'fr', text: 'auxiliaire : ' + (v.refl ? 'être' : (v.aux || 'avoir')) })
        ])
      ])
    ]));

    if (v.note) {
      wrap.appendChild(el('aside', { class: 'culture', lang: 'fr', style: 'margin-bottom:24px' }, [
        el('span', { class: 'cn-icon', text: '💡', 'aria-hidden': 'true' }),
        el('div', {}, [el('p', { html: U.inline(v.note) })])
      ]));
    }

    var TS = w.Verbs.TENSES;
    var core = el('div', { class: 'tense-grid' });
    TS.filter(function (t) { return t.core; }).forEach(function (t) { core.appendChild(tenseCard(t, c[t.key], t.note)); });
    wrap.appendChild(section('Les temps de tous les jours', core));

    var rest = el('div', { class: 'tense-grid' });
    TS.filter(function (t) { return !t.core; }).forEach(function (t) { rest.appendChild(tenseCard(t, c[t.key], t.note)); });

    var parts = el('div', { class: 'tbl-wrap' }, [
      el('table', { class: 'tbl' }, [
        el('tbody', {}, [
          ['Infinitif', c._parts.inf], ['Infinitif passé', c._parts.infpasse],
          ['Participe passé', c._parts.pp], ['Participe présent', c._parts.ppr],
          ['Gérondif', c._parts.ger]
        ].map(function (r) {
          return el('tr', {}, [
            el('td', { class: 'cell-note', text: r[0] }),
            el('td', { lang: 'fr', text: r[1] }),
            el('td', {}, [w.TTS.button(r[1], 'Écouter')])
          ]);
        }))
      ])
    ]);

    wrap.appendChild(section('Le reste', el('details', { class: 'fold' }, [
      el('summary', {}, [U.icon(U.ICONS.chevronRight, 'chev'), el('span', { text: 'Voir les autres temps, les participes et le gérondif' })]),
      el('div', { class: 'fold-body', style: 'padding:16px' }, [
        rest,
        el('div', { style: 'margin-top:16px' }, [el('div', { class: 'tbl-title', text: 'Formes impersonnelles' }), parts])
      ])
    ])));

    return wrap;
  }

  /* ---------------- search results ---------------- */
  function results(q, groups) {
    var wrap = el('div', {});
    wrap.appendChild(crumbs([{ text: 'Accueil', href: '#/' }, { text: 'Recherche' }]));
    wrap.appendChild(el('div', { class: 'home-hero', style: 'padding-top:0' }, [
      el('h1', { text: '« ' + q + ' »' }),
      el('p', { text: groups.total + ' résultat' + (groups.total > 1 ? 's' : '') })
    ]));
    if (!groups.total) {
      wrap.appendChild(el('div', { class: 'empty' }, [
        el('div', { class: 'big', text: '🔍' }),
        el('p', { text: 'Rien trouvé. Essaie un mot plus court — la recherche ignore les accents.' })
      ]));
      return wrap;
    }
    [['Leçons', groups.lessons], ['Vocabulaire', groups.vocab], ['Verbes', groups.verbs]].forEach(function (pair) {
      if (!pair[1].length) return;
      var g = el('section', { class: 'res-group' }, [el('h2', { text: pair[0] })]);
      pair[1].forEach(function (r) {
        g.appendChild(el('a', { class: 'res', href: r.href }, [
          U.levelTag(r.level),
          el('div', { class: 'res-main' }, [
            el('div', { class: 'res-title', lang: 'fr', html: r.title }),
            r.sub ? el('div', { class: 'res-sub', lang: 'fr', html: r.sub }) : null
          ])
        ]));
      });
      wrap.appendChild(g);
    });
    return wrap;
  }

  function loading() { return el('div', { class: 'empty', text: 'Chargement…' }); }
  function oops(msg) {
    return el('div', { class: 'empty' }, [
      el('div', { class: 'big', text: '🧭' }),
      el('h3', { text: 'Page introuvable' }),
      el('p', { text: msg || '' }),
      el('p', {}, [el('a', { href: '#/', text: 'Retour à l’accueil' })])
    ]);
  }

  w.Render = {
    home: home, group: group, lesson: lesson, vocabTheme: vocabTheme, recap: recap,
    conjIndex: conjIndex, verbPage: verbPage, results: results,
    loading: loading, oops: oops, section: section
  };
})(window);
