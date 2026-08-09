/* verbs.js — conjugation engine.
   Regular and spelling-change verbs are generated from the infinitive alone;
   true irregulars carry only the parts that cannot be derived (§3.5). Imparfait,
   conditionnel, every compound tense, impératif and gérondif are always computed,
   so the data file stays small and consistent.

   Verb record:
     { inf, en, lvl, fam, aux:'avoir'|'être', refl:true?,
       pres:[6]?, impf:'stem'?, fut:'stem'?, subj:[6]?, ps:'3e pers. sing.'?,
       pp:'…'?, ppr:'…'?, impr:[3]?, ipa:'…'?, note:'…'? }

   Families (fam):
     er   parler        ger  manger        cer  commencer
     eler appeler       eter jeter         ete  acheter (e → è)
     ere  préférer      yer  payer/nettoyer
     ir   finir (-iss-) re   vendre        irr  everything else
*/
(function (w) {
  'use strict';

  var P = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'];

  var END = {
    impf: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
    fut:  ['ai', 'as', 'a', 'ons', 'ez', 'ont'],
    cond: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
    er:   ['e', 'es', 'e', 'ons', 'ez', 'ent'],
    ir:   ['is', 'is', 'it', 'issons', 'issez', 'issent'],
    re:   ['s', 's', '', 'ons', 'ez', 'ent']
  };

  var AUX = {
    'avoir': {
      pres: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
      impf: ['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient'],
      fut:  ['aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront'],
      cond: ['aurais', 'aurais', 'aurait', 'aurions', 'auriez', 'auraient'],
      subj: ['aie', 'aies', 'ait', 'ayons', 'ayez', 'aient']
    },
    'être': {
      pres: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
      impf: ['étais', 'étais', 'était', 'étions', 'étiez', 'étaient'],
      fut:  ['serai', 'seras', 'sera', 'serons', 'serez', 'seront'],
      cond: ['serais', 'serais', 'serait', 'serions', 'seriez', 'seraient'],
      subj: ['sois', 'sois', 'soit', 'soyons', 'soyez', 'soient']
    }
  };

  var ALLER_PRES = ['vais', 'vas', 'va', 'allons', 'allez', 'vont'];
  var REFL = ['me', 'te', 'se', 'nous', 'vous', 'se'];
  var REFL_INF = ['me', 'te', 'se', 'nous', 'vous', 'se'];
  var VOWEL = /^[aeiouyâàéèêëîïôöûùüh]/i;

  function elide(pron, next) {
    if ((pron === 'me' || pron === 'te' || pron === 'se') && VOWEL.test(next)) return pron.charAt(0) + "'";
    return pron + ' ';
  }
  function subj(i, next) {
    if (i === 0) return VOWEL.test(next) ? "j'" : 'je ';
    return P[i] + ' ';
  }

  var stemOf   = function (inf) { return inf.slice(0, -2); };
  var toGrave  = function (s) { return s.replace(/e([^e]*)$/, 'è$1'); };   // achet → achèt
  var aiguToGrave = function (s) { return s.replace(/é([^é]*)$/, 'è$1'); }; // préfér → préfèr
  var yToI     = function (s) { return s.replace(/y$/, 'i'); };            // pay → pai

  /* ---------- présent ---------- */
  function presentOf(v) {
    if (v.pres) return v.pres.slice();
    var s = stemOf(v.inf), d, g;
    switch (v.fam) {
      case 'ir':  return END.ir.map(function (e) { return s + e; });
      case 're':  return END.re.map(function (e) { return s + e; });
      case 'ger': return [s + 'e', s + 'es', s + 'e', s + 'eons', s + 'ez', s + 'ent'];
      case 'cer':
        var c = s.slice(0, -1) + 'ç';
        return [s + 'e', s + 'es', s + 'e', c + 'ons', s + 'ez', s + 'ent'];
      case 'eler': case 'eter':
        d = s + s.charAt(s.length - 1);
        return [d + 'e', d + 'es', d + 'e', s + 'ons', s + 'ez', d + 'ent'];
      case 'ete':
        g = toGrave(s);
        return [g + 'e', g + 'es', g + 'e', s + 'ons', s + 'ez', g + 'ent'];
      case 'ere':
        g = aiguToGrave(s);
        return [g + 'e', g + 'es', g + 'e', s + 'ons', s + 'ez', g + 'ent'];
      case 'yer':
        g = yToI(s);
        return [g + 'e', g + 'es', g + 'e', s + 'ons', s + 'ez', g + 'ent'];
      default:    return END.er.map(function (e) { return s + e; });
    }
  }

  /* ---------- imparfait ----------
     -ger and -cer keep the soft spelling only before a/o, so nous/vous differ. */
  function imparfaitParts(v, pres) {
    var hard = v.impf || (/ons$/.test(pres[3]) ? pres[3].slice(0, -3) : stemOf(v.inf));
    var soft = hard;
    if (!v.impf && (v.fam === 'ger' || v.fam === 'cer')) soft = stemOf(v.inf);
    return { hard: hard, soft: soft };
  }
  function imparfaitOf(v, pres) {
    var st = imparfaitParts(v, pres);
    return [
      st.hard + 'ais', st.hard + 'ais', st.hard + 'ait',
      st.soft + 'ions', st.soft + 'iez', st.hard + 'aient'
    ];
  }

  /* ---------- futur / conditionnel stem ---------- */
  function futurStem(v) {
    if (v.fut) return v.fut;
    var s = stemOf(v.inf);
    switch (v.fam) {
      case 'eler': case 'eter': return s + s.charAt(s.length - 1) + 'er';
      case 'ete':  return toGrave(s) + 'er';
      case 'yer':  return yToI(s) + 'er';
      case 're':   return v.inf.slice(0, -1);
      default:     return v.inf;
    }
  }

  /* ---------- subjonctif ---------- */
  function subjonctifOf(v, pres, impf) {
    if (v.subj) return v.subj.slice();
    var ils = pres[5];
    var base = /ent$/.test(ils) ? ils.slice(0, -3) : stemOf(v.inf);
    return [base + 'e', base + 'es', base + 'e', impf.soft + 'ions', impf.soft + 'iez', base + 'ent'];
  }

  /* ---------- participes ---------- */
  function participePasse(v) {
    if (v.pp) return v.pp;
    var s = stemOf(v.inf);
    if (v.fam === 'ir') return s + 'i';
    if (v.fam === 're') return s + 'u';
    return s + 'é';
  }

  /* ---------- passé simple ---------- */
  function passeSimpleOf(v, impf) {
    var third = v.ps;
    if (!third) {
      if (v.fam === 'ir' || v.fam === 're') third = stemOf(v.inf) + 'it';
      else third = impf.hard + 'a';           // mangea, commença, parla
    }
    var st, e;
    if (/int$/.test(third))     { st = third.slice(0, -3); e = ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent']; }
    else if (/ut$/.test(third)) { st = third.slice(0, -2); e = ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent']; }
    else if (/it$/.test(third)) { st = third.slice(0, -2); e = ['is', 'is', 'it', 'îmes', 'îtes', 'irent']; }
    else                        { st = third.slice(0, -1); e = ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent']; }
    return e.map(function (end) { return st + end; });
  }

  /* ---------- assembly ---------- */
  function simple(v, forms) {
    return forms.map(function (f, i) {
      var body = v.refl ? elide(REFL[i], f) + f : f;
      return { pron: P[i], form: subj(i, body) + body, say: subj(i, body) + body };
    });
  }

  // Agreement shown for être-compounds: je suis allé(e) · nous sommes allé(e)s …
  var AGREE = ['(e)', '(e)', '(e)', '(e)s', '(e)(s)', '(e)s'];

  function compound(v, auxForms, pp) {
    var isEtre = (v.aux === 'être' || v.refl) && !v.noagree;
    return auxForms.map(function (a, i) {
      var tail = pp + (isEtre ? AGREE[i] : '');
      var core = a + ' ' + tail;
      var body = v.refl ? elide(REFL[i], a) + core : core;
      var spoken = v.refl ? elide(REFL[i], a) + a + ' ' + pp : a + ' ' + pp;
      return { pron: P[i], form: subj(i, body) + body, say: subj(i, spoken) + spoken };
    });
  }

  function imperatif(v, pres) {
    var who = ['(tu)', '(nous)', '(vous)'];
    var out;
    if (v.impr === false || v.impers) return [];
    if (v.impr) {
      out = v.impr.slice();
    } else {
      var tu = pres[1], nous = pres[3], vous = pres[4];
      if (/es$/.test(tu) || tu === 'vas') tu = tu.slice(0, -1);  // -er verbs drop the final -s
      out = v.refl ? [tu + '-toi', nous + '-nous', vous + '-vous'] : [tu, nous, vous];
    }
    return out.map(function (f, i) { return { pron: who[i], form: f, say: f }; });
  }

  function futurProche(v) {
    return ALLER_PRES.map(function (a, i) {
      var tail = v.refl ? REFL_INF[i] + ' ' + v.inf : v.inf;
      var body = a + ' ' + tail;
      return { pron: P[i], form: subj(i, body) + body, say: subj(i, body) + body };
    });
  }

  /* Display order; `core:true` = above the fold (§3.5). Levels come from §4.5. */
  var TENSES = [
    { key: 'present',   name: 'Présent',              lvl: 'A1', core: true },
    { key: 'futproche', name: 'Futur proche',         lvl: 'A1', core: true, note: 'aller + infinitif' },
    { key: 'passecomp', name: 'Passé composé',        lvl: 'A2', core: true },
    { key: 'imparfait', name: 'Imparfait',            lvl: 'A2', core: true },
    { key: 'futur',     name: 'Futur simple',         lvl: 'A2', core: true },
    { key: 'condpres',  name: 'Conditionnel présent', lvl: 'B1', core: true },
    { key: 'subjpres',  name: 'Subjonctif présent',   lvl: 'B1', core: true },
    { key: 'imperatif', name: 'Impératif',            lvl: 'A1', core: true },
    { key: 'pqp',       name: 'Plus-que-parfait',     lvl: 'B1' },
    { key: 'condpasse', name: 'Conditionnel passé',   lvl: 'B1' },
    { key: 'futant',    name: 'Futur antérieur',      lvl: 'B2' },
    { key: 'subjpasse', name: 'Subjonctif passé',     lvl: 'B2' },
    { key: 'passesimp', name: 'Passé simple',         lvl: 'B2', note: 'reconnaissance — usage littéraire' }
  ];

  function conjugate(v) {
    var pres = presentOf(v);
    var impf = imparfaitParts(v, pres);
    var fut  = futurStem(v);
    var sj   = subjonctifOf(v, pres, impf);
    var pp   = participePasse(v);
    var ppr  = v.ppr || (impf.hard + 'ant');
    var a    = AUX[(v.refl || v.aux === 'être') ? 'être' : 'avoir'];
    var que  = function (rows) {
      return rows.map(function (r) { return { pron: r.pron, form: 'que ' + r.form, say: 'que ' + r.say }; });
    };

    var only3 = function (rows) {
      if (!v.impers) return rows;
      var r = rows[2];
      if (!r) return [];
      var fix = function (t) { return t.replace('il/elle ', 'il ').replace(/^que il /, "qu'il "); };
      return [{ pron: 'il', form: fix(r.form), say: fix(r.say) }];
    };

    var out = {
      present:   simple(v, pres),
      futproche: futurProche(v),
      imparfait: simple(v, imparfaitOf(v, pres)),
      futur:     simple(v, END.fut.map(function (e) { return fut + e; })),
      condpres:  simple(v, END.cond.map(function (e) { return fut + e; })),
      subjpres:  que(simple(v, sj)),
      imperatif: imperatif(v, pres),
      passecomp: compound(v, a.pres, pp),
      pqp:       compound(v, a.impf, pp),
      condpasse: compound(v, a.cond, pp),
      futant:    compound(v, a.fut, pp),
      subjpasse: que(compound(v, a.subj, pp)),
      passesimp: simple(v, passeSimpleOf(v, impf)),
      _parts0: {
        inf: (v.refl ? 'se ' : '') + v.inf,
        infpasse: ((v.refl || v.aux === 'être') ? 'être ' : 'avoir ') + pp,
        pp: pp,
        ppr: ppr,
        ger: 'en ' + (v.refl ? 'se ' : '') + ppr
      }
    };

    Object.keys(out).forEach(function (k) { if (k !== '_parts0') out[k] = only3(out[k]); });
    out._parts = out._parts0; delete out._parts0;
    return out;
  }

  /* Stable, URL-safe id — two verbs can share an infinitive (lever / se lever). */
  function slug(v) {
    var base = v.inf.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
    return (v.refl ? 'se-' : '') + base;
  }

  function familyLabel(v) {
    switch (v.fam) {
      case 'er': case 'ger': case 'cer': case 'eler': case 'eter': case 'ete': case 'ere': case 'yer':
        return '1er groupe (-er)';
      case 'ir': return '2e groupe (-ir, -iss-)';
      case 're': return '3e groupe (-re)';
      default:   return '3e groupe — irrégulier';
    }
  }

  w.Verbs = { conjugate: conjugate, TENSES: TENSES, familyLabel: familyLabel, slug: slug, pronouns: P };
})(window);
