/* nav.js — the persistent sidebar: eight topic groups, then the conjugator (§3.3). */
(function (w) {
  'use strict';
  var U = w.U, el = U.el, GM = U.GROUP_META;

  function build(m) {
    var root = document.getElementById('sidebarInner');
    root.innerHTML = '';
    root.appendChild(el('div', { class: 'nav-eyebrow', text: 'Les huit thèmes' }));

    Object.keys(GM).forEach(function (g) {
      var meta = GM[g];
      var items = (g === 'vocabulaire')
        ? m.vocab.map(function (v) { return { id: v.id, title: v.title, level: v.level, href: '#/v/' + v.id }; })
        : m.inGroup(g).map(function (l) { return { id: l.id, title: l.title, level: l.level, href: '#/l/' + l.id }; });

      var listId = 'navlist-' + g;
      var list = el('ul', { class: 'nav-list', id: listId, hidden: true });

      list.appendChild(el('li', {}, [
        el('a', { class: 'nav-link', href: '#/g/' + g, dataset: { route: '#/g/' + g } }, [
          el('span', { class: 'nav-link-text', text: g === 'vocabulaire' ? 'Tous les thèmes' : 'Vue d’ensemble' })
        ])
      ]));

      items.forEach(function (it) {
        list.appendChild(el('li', {}, [
          el('a', { class: 'nav-link', href: it.href, dataset: { route: it.href } }, [
            el('span', { class: 'nav-link-text', lang: 'fr', text: it.title }),
            U.levelTag(it.level)
          ])
        ]));
      });

      list.appendChild(el('li', {}, [
        el('a', { class: 'nav-link', href: '#/recap/' + g, dataset: { route: '#/recap/' + g } }, [
          el('span', { class: 'nav-link-text', text: '📋 Récap express' })
        ])
      ]));

      var btn = el('button', {
        class: 'nav-group-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': listId
      }, [
        U.icon(U.ICONS.chevronRight, 'chev'),
        el('span', { class: 'nav-group-num', text: String(meta.n) }),
        el('span', { class: 'nav-group-label', lang: 'fr', text: meta.label })
      ]);
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        list.hidden = open;
      });

      root.appendChild(el('div', { class: 'nav-group', dataset: { group: g } }, [btn, list]));
    });

    root.appendChild(el('div', { class: 'nav-eyebrow', text: 'Outils' }));
    root.appendChild(el('a', { class: 'nav-solo', href: '#/conjugueur', dataset: { route: '#/conjugueur' } }, [
      U.icon(U.ICONS.grid), el('span', { text: 'Conjugueur' })
    ]));
    root.appendChild(el('a', { class: 'nav-solo', href: '#/g/vocabulaire', dataset: { route: '#/g/vocabulaire' } }, [
      U.icon(U.ICONS.cards), el('span', { text: 'Cartes de vocabulaire' })
    ]));
  }

  /* Highlight the current page and open the group that contains it. */
  function sync(route, group) {
    U.$$('#sidebarInner [data-route]').forEach(function (a) {
      a.classList.toggle('is-active', a.dataset.route === route);
    });
    if (!group) return;
    U.$$('#sidebarInner .nav-group').forEach(function (gEl) {
      if (gEl.dataset.group !== group) return;
      var btn = U.$('.nav-group-btn', gEl), list = U.$('.nav-list', gEl);
      btn.setAttribute('aria-expanded', 'true');
      list.hidden = false;
      var active = U.$('.nav-link.is-active', list);
      if (active) {
        var box = document.getElementById('sidebar');
        var top = active.offsetTop - box.clientHeight / 2;
        if (top > 0) box.scrollTop = top;
      }
    });
  }

  w.Nav = { build: build, sync: sync };
})(window);
