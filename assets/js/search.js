/* search.js — accent-insensitive client-side search over lessons, vocab and verbs (§3.6).
   The index is a small prebuilt JSON file (tools/build-index.js); no library needed. */
(function (w) {
  'use strict';
  var U = w.U;
  var idx = null;

  function ready() {
    if (idx) return idx;
    idx = w.Store.index().then(function (raw) {
      raw.docs.forEach(function (d) {
        d._t = U.fold(d.title);
        d._b = U.fold(d.body || '');
        d._s = U.fold(d.sub || '');
      });
      return raw;
    });
    return idx;
  }

  function highlight(text, needle) {
    if (!text) return '';
    var f = U.fold(text), n = U.fold(needle);
    var at = f.indexOf(n);
    if (at < 0 || !n) return U.esc(text);
    return U.esc(text.slice(0, at)) + '<mark>' + U.esc(text.slice(at, at + needle.length)) + '</mark>' + U.esc(text.slice(at + needle.length));
  }

  function snippet(body, needle) {
    if (!body) return '';
    var f = U.fold(body), n = U.fold(needle);
    var at = f.indexOf(n);
    if (at < 0) return U.esc(body.slice(0, 110)) + '…';
    var s = Math.max(0, at - 45);
    var chunk = body.slice(s, at + needle.length + 65);
    return (s ? '…' : '') + highlight(chunk, needle) + '…';
  }

  function query(q) {
    return ready().then(function (raw) {
      var n = U.fold(q.trim());
      var out = { lessons: [], vocab: [], verbs: [], total: 0 };
      if (n.length < 2) return out;

      var scored = [];
      raw.docs.forEach(function (d) {
        var score = 0;
        if (d._t === n) score = 100;
        else if (d._t.indexOf(n) === 0) score = 80;
        else if (d._t.indexOf(n) > -1) score = 60;
        else if (d._s.indexOf(n) > -1) score = 40;
        else if (d._b.indexOf(n) > -1) score = 20;
        if (score) scored.push({ d: d, score: score });
      });
      scored.sort(function (a, b) { return b.score - a.score || a.d.title.localeCompare(b.d.title, 'fr'); });

      scored.slice(0, 60).forEach(function (s) {
        var d = s.d;
        var row = {
          level: d.level,
          href: d.href,
          title: highlight(d.title, q.trim()),
          sub: d.sub ? highlight(d.sub, q.trim()) : snippet(d.body, q.trim())
        };
        if (d.kind === 'lesson') out.lessons.push(row);
        else if (d.kind === 'vocab') out.vocab.push(row);
        else out.verbs.push(row);
      });
      out.total = out.lessons.length + out.vocab.length + out.verbs.length;
      return out;
    });
  }

  w.Search = { query: query, warm: ready };
})(window);
