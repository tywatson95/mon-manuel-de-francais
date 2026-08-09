/* flashcards.js — session-only deck (§3.4). Known/unknown lives in this closure and
   dies with the page: no localStorage, no spaced repetition, nothing remembered. */
(function (w) {
  'use strict';
  var U = w.U, el = U.el;

  function build(theme) {
    var all = theme.items.slice();
    var dir = 'fr-en';          // or 'en-fr'
    var onlyUnknown = false;
    var deck = [], pos = 0, flipped = false;
    var unknown = Object.create(null);   // index -> true, for THIS session only

    var root = el('div', {});
    var bar = el('div', { class: 'fc-bar' });
    var stage = el('div', { class: 'fc-stage' });
    var actions = el('div', { class: 'fc-actions' });
    root.appendChild(bar); root.appendChild(stage); root.appendChild(actions);

    var stat = el('span', { class: 'fc-stat' });

    var dirBtn = el('button', {
      class: 'btn btn-ghost btn-sm', type: 'button',
      onclick: function () { dir = dir === 'fr-en' ? 'en-fr' : 'fr-en'; syncBar(); flipped = false; render(); }
    });
    var shuffleBtn = el('button', {
      class: 'btn btn-ghost btn-sm', type: 'button', text: '🔀 Mélanger',
      onclick: function () { deck = U.shuffle(deck); pos = 0; flipped = false; render(); }
    });
    var filterBtn = el('button', {
      class: 'btn btn-ghost btn-sm', type: 'button', 'aria-pressed': 'false',
      onclick: function () { onlyUnknown = !onlyUnknown; reset(true); }
    });
    var resetBtn = el('button', {
      class: 'btn btn-ghost btn-sm', type: 'button', text: '↺ Tout revoir',
      onclick: function () { unknown = Object.create(null); onlyUnknown = false; reset(false); }
    });
    bar.appendChild(dirBtn); bar.appendChild(shuffleBtn); bar.appendChild(filterBtn); bar.appendChild(resetBtn); bar.appendChild(stat);

    function syncBar() {
      dirBtn.textContent = dir === 'fr-en' ? '🇫🇷 → 🇬🇧' : '🇬🇧 → 🇫🇷';
      dirBtn.setAttribute('aria-label', dir === 'fr-en' ? 'Sens : français vers anglais. Changer.' : 'Sens : anglais vers français. Changer.');
      var n = Object.keys(unknown).length;
      filterBtn.textContent = onlyUnknown ? '★ À revoir (' + n + ')' : 'Voir « à revoir » (' + n + ')';
      filterBtn.setAttribute('aria-pressed', String(onlyUnknown));
      filterBtn.disabled = n === 0 && !onlyUnknown;
    }

    function reset(keepFilter) {
      var pool = all.map(function (it, k) { return { it: it, k: k }; });
      if (onlyUnknown) pool = pool.filter(function (p) { return unknown[p.k]; });
      deck = U.shuffle(pool);
      pos = 0; flipped = false;
      syncBar();
      render();
    }

    function mark(known) {
      var cur = deck[pos];
      if (!cur) return;
      if (known) delete unknown[cur.k]; else unknown[cur.k] = true;
      pos++; flipped = false;
      syncBar();
      render();
    }

    function render() {
      stage.innerHTML = ''; actions.innerHTML = '';

      if (!deck.length) {
        stage.appendChild(el('div', { class: 'empty' }, [
          el('div', { class: 'big', text: '✨' }),
          el('p', { text: onlyUnknown ? 'Rien à revoir — tout est marqué « je sais ».' : 'Ce paquet est vide.' })
        ]));
        stat.textContent = '';
        return;
      }

      if (pos >= deck.length) {
        var left = Object.keys(unknown).length;
        stage.appendChild(el('div', { class: 'fc-done' }, [
          el('div', { class: 'big', text: left ? '👍' : '🎉' }),
          el('h3', { text: 'Paquet terminé' }),
          el('p', { class: 'fc-stat', text: left ? left + ' carte(s) à revoir.' : 'Tu as marqué toutes les cartes « je sais ».' })
        ]));
        actions.appendChild(el('button', { class: 'btn', type: 'button', text: '↺ Recommencer', onclick: function () { deck = U.shuffle(deck); pos = 0; flipped = false; render(); } }));
        if (left) actions.appendChild(el('button', { class: 'btn btn-ghost', type: 'button', text: '★ Revoir les difficiles', onclick: function () { onlyUnknown = true; reset(true); } }));
        stat.textContent = '';
        U.announce('Paquet terminé.');
        return;
      }

      var cur = deck[pos].it;
      stat.textContent = (pos + 1) + ' / ' + deck.length;

      var frontIsFr = dir === 'fr-en';
      var frontText = frontIsFr ? cur.fr : cur.en;
      var backText  = frontIsFr ? cur.en : cur.fr;

      var card = el('button', {
        class: 'fc-card' + (flipped ? ' is-flipped' : ''),
        type: 'button',
        'aria-label': 'Carte ' + (pos + 1) + ' sur ' + deck.length + '. ' + frontText + '. Retourner la carte.'
      });

      var front = el('div', { class: 'fc-face' }, [
        el('div', { class: 'fc-word', lang: frontIsFr ? 'fr' : 'en', text: frontText }),
        frontIsFr && cur.ipa ? el('div', { class: 'ipa', text: '/' + cur.ipa + '/' }) : null,
        el('span', { class: 'fc-hint', text: 'Clic ou Espace pour retourner' })
      ]);
      var back = el('div', { class: 'fc-face back' }, [
        el('div', { class: 'fc-word', lang: frontIsFr ? 'en' : 'fr', text: backText }),
        !frontIsFr && cur.ipa ? el('div', { class: 'ipa', text: '/' + cur.ipa + '/' }) : null,
        cur.ex ? el('div', { class: 'fc-ex', lang: 'fr', text: cur.ex }) : null,
        el('span', { class: 'fc-hint', text: 'Tu savais ?' })
      ]);
      card.appendChild(front); card.appendChild(back);
      card.addEventListener('click', function () { flipped = !flipped; card.classList.toggle('is-flipped', flipped); });
      stage.appendChild(card);

      // TTS floats outside the flip so it never ends up mirrored.
      var speakWrap = el('div', { style: 'display:flex;justify-content:center;margin-top:16px;gap:8px;align-items:center' }, [
        w.TTS.button(cur.ex || cur.fr, 'Écouter ' + cur.fr),
        el('span', { class: 'fc-stat', text: 'écouter le français' })
      ]);
      stage.appendChild(speakWrap);

      actions.appendChild(el('button', { class: 'btn btn-unknown', type: 'button', text: '★ À revoir', onclick: function () { mark(false); } }));
      actions.appendChild(el('button', { class: 'btn btn-known', type: 'button', text: '✓ Je sais', onclick: function () { mark(true); } }));
    }

    function onKey(e) {
      if (!root.isConnected) { document.removeEventListener('keydown', onKey); return; }
      if (/^(INPUT|TEXTAREA)$/.test((e.target.tagName || ''))) return;
      if (e.key === ' ' || e.key === 'Enter') {
        var c = U.$('.fc-card', stage);
        if (c) { e.preventDefault(); c.click(); }
      } else if (e.key === 'ArrowRight') { e.preventDefault(); mark(true); }
      else if (e.key === 'ArrowLeft')    { e.preventDefault(); mark(false); }
    }
    document.addEventListener('keydown', onKey);

    syncBar();
    reset(false);
    return root;
  }

  w.Flash = { build: build };
})(window);
