/* util.js — tiny helpers shared by every module. No dependencies. */
(function (w) {
  'use strict';

  /* --- DOM --- */
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'dataset') { for (var d in v) n.dataset[d] = v[d]; }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else if (v === true) n.setAttribute(k, '');
        else n.setAttribute(k, v);
      }
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function frag(children) {
    var f = document.createDocumentFragment();
    (children || []).forEach(function (c) { if (c) f.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return f;
  }
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* --- text --- */
  // Strip accents for tolerant matching / search. Keeps œ→oe, æ→ae.
  function fold(s) {
    return String(s == null ? '' : s)
      .replace(/œ/gi, 'oe').replace(/æ/gi, 'ae')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
  // Normalise a learner's typed answer: fold case, collapse spaces, drop end punctuation,
  // and unify the apostrophes people actually type.
  function normAnswer(s) {
    return String(s == null ? '' : s)
      .replace(/[’‘`´]/g, "'")
      .replace(/\s+/g, ' ')
      .replace(/[.!?;:]+$/, '')
      .trim().toLowerCase();
  }
  function sameIgnoringAccents(a, b) { return fold(normAnswer(a)) === fold(normAnswer(b)); }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Very small inline-markup renderer used by lesson prose.
     Supported: **bold**  *italic*  `code`  [fr]…[/fr] (French run)  (( gloss ))  /ipa/ */
  function inline(s) {
    var out = esc(s);
    out = out.replace(/\[fr\]([\s\S]+?)\[\/fr\]/g, '<span class="fr" lang="fr">$1</span>');
    out = out.replace(/\(\((.+?)\)\)/g, '<span class="gloss">($1)</span>');
    out = out.replace(/\{\{(.+?)\}\}/g, '<span class="ipa">/$1/</span>');
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[\s(])\*([^*]+?)\*(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
    out = out.replace(/`(.+?)`/g, '<code>$1</code>');
    return out;
  }
  // Block renderer: blank-line separated paragraphs, "- " lists.
  function prose(src) {
    var box = el('div', { class: 'prose' });
    String(src || '').split(/\n{2,}/).forEach(function (blk) {
      blk = blk.trim();
      if (!blk) return;
      var lines = blk.split('\n');
      if (lines.every(function (l) { return /^[-•]\s/.test(l.trim()); })) {
        box.appendChild(el('ul', {}, lines.map(function (l) {
          return el('li', { html: inline(l.trim().replace(/^[-•]\s/, '')) });
        })));
      } else if (lines.every(function (l) { return /^\d+[.)]\s/.test(l.trim()); })) {
        box.appendChild(el('ol', {}, lines.map(function (l) {
          return el('li', { html: inline(l.trim().replace(/^\d+[.)]\s/, '')) });
        })));
      } else {
        box.appendChild(el('p', { html: inline(blk.replace(/\n/g, ' ')) }));
      }
    });
    return box;
  }

  function levelTag(level, big) {
    return el('span', { class: 'tag tag-' + level + (big ? ' tag-lg' : ''), text: level });
  }

  function icon(path, cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    if (cls) s.setAttribute('class', cls);
    s.innerHTML = path;
    return s;
  }
  var ICONS = {
    chevronRight: '<path d="M9 5l7 7-7 7"/>',
    arrowRight:   '<path d="M5 12h14M13 5l7 7-7 7"/>',
    book:         '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    grid:         '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    cards:        '<rect x="3" y="6" width="13" height="14" rx="2"/><path d="M8 3h10a2 2 0 0 1 2 2v11"/>',
    speaker:      '<path d="M11 5L6.5 9H3v6h3.5L11 19z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    speakerMute:  '<path d="M11 5L6.5 9H3v6h3.5L11 19z"/><path d="M16 9l5 6M21 9l-5 6"/>',
    star:         '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.9 6.7 19.6l1.1-5.8L3.5 9.7l5.9-.8z"/>',
  };

  function announce(msg) {
    var lr = document.getElementById('liveRegion');
    if (lr) { lr.textContent = ''; setTimeout(function () { lr.textContent = msg; }, 40); }
  }

  var GROUP_META = {
    'prononciation':  { n: 1, label: 'Prononciation & orthographe' },
    'noms-adjectifs': { n: 2, label: 'Noms, articles & adjectifs' },
    'pronoms':        { n: 3, label: 'Pronoms' },
    'temps-modes':    { n: 4, label: 'Temps & modes' },
    'phrase':         { n: 5, label: 'La phrase' },
    'connecteurs':    { n: 6, label: 'Connecteurs & discours' },
    'vocabulaire':    { n: 7, label: 'Vocabulaire' },
    'communication':  { n: 8, label: 'Communication & culture' }
  };
  var LEVELS = ['A1', 'A2', 'B1', 'B2'];
  var PRONOUNS = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'];

  w.U = {
    el: el, frag: frag, $: $, $$: $$, esc: esc,
    fold: fold, normAnswer: normAnswer, sameIgnoringAccents: sameIgnoringAccents,
    shuffle: shuffle, inline: inline, prose: prose, levelTag: levelTag,
    icon: icon, ICONS: ICONS, announce: announce,
    GROUP_META: GROUP_META, LEVELS: LEVELS, PRONOUNS: PRONOUNS
  };
})(window);
