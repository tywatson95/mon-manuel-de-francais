/* store.js — content loading + theme.
   The ONLY thing that ever touches localStorage is the theme (§1 constraint 2).
   Lesson/vocab/verb data is fetched on demand and cached in memory for the tab's life. */
(function (w) {
  'use strict';

  var BASE = (function () {
    // Works at the domain root, in a /repo-name/ project page, and from a file:// folder.
    var p = location.pathname;
    return p.slice(0, p.lastIndexOf('/') + 1);
  })();

  var cache = Object.create(null);
  var manifest = null;

  function getJSON(path) {
    if (cache[path]) return cache[path];
    cache[path] = fetch(BASE + path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' → HTTP ' + r.status);
      return r.json();
    }).catch(function (err) {
      delete cache[path];
      throw err;
    });
    return cache[path];
  }

  function loadManifest() {
    if (manifest) return manifest;
    manifest = getJSON('content/manifest.json').then(function (m) {
      m.byId = Object.create(null);
      m.lessons.forEach(function (l) { m.byId[l.id] = l; });
      m.vocabById = Object.create(null);
      m.vocab.forEach(function (v) { m.vocabById[v.id] = v; });
      // Lessons in a group, already in curriculum order (A1 → B2).
      m.inGroup = function (g) {
        return m.lessons.filter(function (l) { return l.group === g; })
                        .sort(function (a, b) { return a.order - b.order; });
      };
      return m;
    });
    return manifest;
  }

  var api = {
    base: BASE,
    manifest: loadManifest,
    lesson: function (id) { return getJSON('content/lessons/' + id + '.json'); },
    vocab:  function (id) { return getJSON('content/vocab/' + id + '.json'); },
    recap:  function (g)  { return getJSON('content/recaps/' + g + '.json'); },
    verbs:  function ()   { return getJSON('content/verbes/verbs.json'); },
    index:  function ()   { return getJSON('content/search-index.json'); }
  };

  /* ---------- theme ---------- */
  function currentTheme() {
    var set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function toggleTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('mmf-theme', next); } catch (e) {}
    return next;
  }

  w.Store = api;
  w.Theme = { current: currentTheme, toggle: toggleTheme };
})(window);
