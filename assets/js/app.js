/* app.js — hash router + chrome wiring. Hash routing so every URL survives
   static hosting on GitHub Pages with no server rules (§6.3). */
(function (w) {
  'use strict';
  var U = w.U, el = U.el;
  var view = document.getElementById('view');
  var manifest = null;
  var verbCache = null;

  function show(node, title, route, group) {
    view.innerHTML = '';
    view.appendChild(node);
    document.title = (title ? title + ' · ' : '') + 'Mon Manuel de Français';
    w.Nav.sync(route, group);
    w.TTS.stop();
    closeNav();
    if (!w.__firstPaint) { w.__firstPaint = true; }
    else { document.getElementById('main').scrollIntoView({ block: 'start' }); window.scrollTo(0, 0); }
  }

  function fail(e) {
    show(w.Render.oops(e && e.message ? e.message : ''), 'Introuvable', '');
  }

  function parse() {
    var h = location.hash.replace(/^#/, '') || '/';
    var qi = h.indexOf('?');
    var qs = '';
    if (qi > -1) { qs = h.slice(qi + 1); h = h.slice(0, qi); }
    var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    return { parts: parts, qs: new URLSearchParams(qs), raw: '#' + h };
  }

  function route() {
    var r = parse();
    var p = r.parts;

    w.Store.manifest().then(function (m) {
      manifest = m;
      if (!w.__navBuilt) { w.Nav.build(m); w.__navBuilt = true; }

      if (!p.length) return show(w.Render.home(m), '', '#/');

      switch (p[0]) {
        case 'g':
          if (!U.GROUP_META[p[1]]) return fail({ message: 'Thème inconnu.' });
          return show(w.Render.group(m, p[1]), U.GROUP_META[p[1]].label, '#/g/' + p[1], p[1]);

        case 'l':
          var meta = m.byId[p[1]];
          if (!meta) return fail({ message: 'Cette leçon n’existe pas (encore).' });
          show(w.Render.loading(), meta.title, '#/l/' + p[1], meta.group);
          return w.Store.lesson(p[1]).then(function (data) {
            show(w.Render.lesson(data, m), data.title, '#/l/' + p[1], data.group);
          }).catch(fail);

        case 'v':
          var vm = m.vocabById[p[1]];
          if (!vm) return fail({ message: 'Ce thème de vocabulaire n’existe pas.' });
          show(w.Render.loading(), vm.title, '#/v/' + p[1], 'vocabulaire');
          return w.Store.vocab(p[1]).then(function (t) {
            show(w.Render.vocabTheme(t), t.title, '#/v/' + p[1], 'vocabulaire');
          }).catch(fail);

        case 'recap':
          if (!U.GROUP_META[p[1]]) return fail({ message: 'Thème inconnu.' });
          show(w.Render.loading(), 'Récap', '#/recap/' + p[1], p[1]);
          return w.Store.recap(p[1]).then(function (d) {
            show(w.Render.recap(d, p[1]), d.title, '#/recap/' + p[1], p[1]);
          }).catch(fail);

        case 'conjugueur':
          return w.Store.verbs().then(function (vs) {
            verbCache = vs;
            show(w.Render.conjIndex(vs, r.qs.get('q') || ''), 'Conjugueur', '#/conjugueur');
          }).catch(fail);

        case 'verbe':
          return w.Store.verbs().then(function (vs) {
            verbCache = vs;
            var key = (p[1] || '').toLowerCase();
            var v = vs.filter(function (x) { return w.Verbs.slug(x) === key; })[0]
                 || vs.filter(function (x) { return U.fold(x.inf) === U.fold(key); })[0];
            if (!v) return fail({ message: 'Verbe absent du conjugueur.' });
            show(w.Render.verbPage(v), (v.refl ? 'se ' : '') + v.inf, '#/conjugueur');
          }).catch(fail);

        case 'recherche':
          var q = r.qs.get('q') || '';
          var input = document.getElementById('searchInput');
          if (input && input.value !== q) input.value = q;
          if (!q) return show(w.Render.oops('Tape quelque chose dans la barre de recherche.'), 'Recherche', '');
          show(w.Render.loading(), 'Recherche', '');
          return w.Search.query(q).then(function (g) {
            show(w.Render.results(q, g), 'Recherche : ' + q, '');
          }).catch(fail);

        default:
          return fail({ message: 'Adresse inconnue.' });
      }
    }).catch(function (e) {
      view.innerHTML = '';
      view.appendChild(el('div', { class: 'empty' }, [
        el('div', { class: 'big', text: '📦' }),
        el('h3', { text: 'Le contenu ne se charge pas' }),
        el('p', { text: 'Ouvre le site via un petit serveur local (voir le README) plutôt qu’en double-cliquant le fichier.' }),
        el('p', { class: 'ipa', text: String(e && e.message || e) })
      ]));
    });
  }

  /* ---------- chrome ---------- */
  function closeNav() {
    var sb = document.getElementById('sidebar');
    var sc = document.getElementById('scrim');
    var tg = document.getElementById('navToggle');
    sb.classList.remove('is-open'); sc.hidden = true; tg.setAttribute('aria-expanded', 'false');
  }
  document.getElementById('navToggle').addEventListener('click', function () {
    var sb = document.getElementById('sidebar');
    var open = sb.classList.toggle('is-open');
    document.getElementById('scrim').hidden = !open;
    this.setAttribute('aria-expanded', String(open));
  });
  document.getElementById('scrim').addEventListener('click', closeNav);

  document.getElementById('themeBtn').addEventListener('click', function () {
    var t = w.Theme.toggle();
    this.setAttribute('aria-label', t === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre');
    U.announce(t === 'dark' ? 'Thème sombre' : 'Thème clair');
  });

  var searchInput = document.getElementById('searchInput');
  var searchTimer = null;
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);
    var q = this.value.trim();
    searchTimer = setTimeout(function () {
      if (q.length >= 2) location.hash = '#/recherche?q=' + encodeURIComponent(q);
      else if (location.hash.indexOf('#/recherche') === 0) location.hash = '#/';
    }, 260);
  });
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { this.value = ''; this.blur(); }
    if (e.key === 'Enter') {
      clearTimeout(searchTimer);
      var q = this.value.trim();
      if (q) location.hash = '#/recherche?q=' + encodeURIComponent(q);
    }
  });
  searchInput.addEventListener('focus', function () { w.Search.warm(); });

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '');
    if (e.key === '/' && !typing) { e.preventDefault(); searchInput.focus(); searchInput.select(); }
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); searchInput.focus(); searchInput.select(); }
    if (e.key === 'Escape') closeNav();
  });

  // If no French voice exists at all, say so once rather than leaving dead buttons.
  document.addEventListener('tts:ready', function (e) {
    if (e.detail.ok || document.getElementById('ttsWarn')) return;
    var warn = el('div', { class: 'tts-warn', id: 'ttsWarn' }, [
      el('span', { text: '🔇', 'aria-hidden': 'true' }),
      el('span', { text: 'Audio indisponible : ce navigateur n’a pas de voix française installée. Tout le reste fonctionne.' })
    ]);
    var pane = document.getElementById('view');
    if (pane && pane.firstChild) pane.insertBefore(warn, pane.firstChild);
  });

  w.addEventListener('hashchange', route);
  route();
})(window);
