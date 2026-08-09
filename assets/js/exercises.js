/* exercises.js — the four exercise types (§3.4). Everything is session-only:
   no score, streak or answer ever leaves memory, and reloading wipes the lot. */
(function (w) {
  'use strict';
  var U = w.U, el = U.el;

  var ACCENTS = ['é', 'è', 'ê', 'ë', 'à', 'â', 'ç', 'î', 'ï', 'ô', 'û', 'ù', 'ü', 'œ'];
  var PRAISE = ['Bravo !', 'Parfait !', 'Exact !', 'Très bien !', 'Oui, c’est ça !'];
  var NUDGE  = ['Presque !', 'Pas tout à fait…', 'Raté, mais on y retourne !'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function shell(kind, consigne, body, foot) {
    return el('section', { class: 'exo' }, [
      el('header', { class: 'exo-head' }, [
        el('span', { class: 'exo-kind', text: kind }),
        el('span', { class: 'exo-consigne', lang: 'fr', html: U.inline(consigne || '') })
      ]),
      body,
      foot
    ]);
  }

  function feedback(kind, headline, why) {
    var glyph = kind === 'ok' ? '✅' : kind === 'near' ? '💡' : '↩️';
    return el('div', { class: 'feedback ' + kind, role: 'status' }, [
      el('span', { class: 'fb-icon', text: glyph, 'aria-hidden': 'true' }),
      el('div', {}, [
        el('strong', { text: headline }),
        why ? el('span', { class: 'fb-why', lang: 'fr', html: U.inline(why) }) : null
      ])
    ]);
  }

  /* ===================== 1. QCM ===================== */
  function qcm(ex) {
    var items = U.shuffle(ex.items).slice(0, ex.max || ex.items.length);
    var i = 0, score = 0, locked = false;

    var body = el('div', { class: 'exo-body' });
    var progress = el('span', { class: 'exo-progress' });
    var scoreEl = el('span', { class: 'exo-score' });
    var nextBtn = el('button', { class: 'btn btn-sm', type: 'button', text: 'Suivant', onclick: next });
    var againBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Recommencer', hidden: true, onclick: restart });
    var foot = el('footer', { class: 'exo-foot' }, [progress, againBtn, scoreEl]);
    nextBtn.hidden = true;
    foot.insertBefore(nextBtn, scoreEl);

    function restart() { items = U.shuffle(ex.items).slice(0, ex.max || ex.items.length); i = 0; score = 0; againBtn.hidden = true; draw(); }
    function next() { i++; draw(); }

    function draw() {
      body.innerHTML = '';
      locked = false;
      nextBtn.hidden = true;
      scoreEl.textContent = '';

      if (i >= items.length) {
        progress.textContent = '';
        againBtn.hidden = false;
        var pct = Math.round(score / items.length * 100);
        body.appendChild(el('div', { class: 'fc-done' }, [
          el('div', { class: 'big', text: pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪' }),
          el('h3', { text: score + ' / ' + items.length }),
          el('p', { class: 'exo-progress', text: pct >= 80 ? 'Excellent — cette règle est acquise.' : pct >= 50 ? 'Bon travail. Une deuxième série ?' : 'Relis « L’essentiel », puis recommence.' })
        ]));
        U.announce('Série terminée : ' + score + ' sur ' + items.length);
        return;
      }

      var it = items[i];
      progress.textContent = 'Question ' + (i + 1) + ' / ' + items.length;
      body.appendChild(el('p', { class: 'q-text', lang: 'fr', html: U.inline(it.q) }));

      var order = U.shuffle(it.options.map(function (o, k) { return { text: o, k: k }; }));
      var opts = el('div', { class: 'opts', role: 'group', 'aria-label': 'Réponses possibles' });
      order.forEach(function (o, n) {
        var b = el('button', { class: 'opt', type: 'button', lang: 'fr' }, [
          el('span', { class: 'opt-key', text: String.fromCharCode(65 + n), 'aria-hidden': 'true' }),
          el('span', { html: U.inline(o.text) })
        ]);
        b.addEventListener('click', function () {
          if (locked) return;
          locked = true;
          var right = o.k === it.answer;
          if (right) score++;
          U.$$('.opt', opts).forEach(function (btn, idx) {
            btn.disabled = true;
            if (order[idx].k === it.answer) btn.classList.add('is-right');
            else if (btn === b) btn.classList.add('is-wrong');
          });
          body.appendChild(feedback(right ? 'ok' : 'no', right ? pick(PRAISE) : pick(NUDGE), it.why));
          U.announce(right ? 'Correct.' : 'Incorrect. ' + (it.why || ''));
          nextBtn.hidden = false;
          nextBtn.textContent = (i === items.length - 1) ? 'Voir le score' : 'Suivant';
          nextBtn.focus();
        });
        opts.appendChild(b);
      });
      body.appendChild(opts);
    }

    draw();
    return shell('Choix multiple', ex.consigne || 'Choisis la bonne réponse.', body, foot);
  }

  /* ===================== 2. Fill in the blank ===================== */
  function trou(ex) {
    var items = ex.shuffle === false ? ex.items.slice() : U.shuffle(ex.items);
    var i = 0, score = 0;

    var body = el('div', { class: 'exo-body' });
    var progress = el('span', { class: 'exo-progress' });
    var scoreEl = el('span', { class: 'exo-score' });
    var againBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Recommencer', hidden: true, onclick: restart });
    var foot = el('footer', { class: 'exo-foot' }, [progress, againBtn, scoreEl]);

    function restart() { items = U.shuffle(ex.items); i = 0; score = 0; againBtn.hidden = true; draw(); }

    function draw() {
      body.innerHTML = '';
      scoreEl.textContent = '';

      if (i >= items.length) {
        progress.textContent = '';
        againBtn.hidden = false;
        body.appendChild(el('div', { class: 'fc-done' }, [
          el('div', { class: 'big', text: score === items.length ? '🎉' : '👍' }),
          el('h3', { text: score + ' / ' + items.length })
        ]));
        U.announce('Série terminée : ' + score + ' sur ' + items.length);
        return;
      }

      var it = items[i];
      progress.textContent = 'Phrase ' + (i + 1) + ' / ' + items.length;

      var q = el('p', { class: 'q-text', lang: 'fr' });
      q.appendChild(el('span', { html: U.inline(it.before || '') }));
      q.appendChild(el('span', { class: 'blank', text: '…' }));
      q.appendChild(el('span', { html: U.inline(it.after || '') }));
      body.appendChild(q);
      if (it.hint) body.appendChild(el('p', { class: 'exo-progress', lang: 'fr', html: U.inline('Indice : ' + it.hint) }));

      var input = el('input', {
        class: 'trou-input', type: 'text', lang: 'fr',
        autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false',
        'aria-label': 'Ta réponse'
      });
      var go = el('button', { class: 'btn', type: 'button', text: 'Vérifier' });
      var row = el('div', { class: 'trou-row' }, [input, go]);
      body.appendChild(row);

      var bar = el('div', { class: 'accent-bar', role: 'group', 'aria-label': 'Lettres accentuées' });
      ACCENTS.forEach(function (ch) {
        bar.appendChild(el('button', {
          class: 'accent-key', type: 'button', text: ch, 'aria-label': 'Insérer ' + ch,
          onclick: function () {
            var s = input.selectionStart || input.value.length;
            var e = input.selectionEnd || s;
            input.value = input.value.slice(0, s) + ch + input.value.slice(e);
            input.focus();
            input.setSelectionRange(s + 1, s + 1);
          }
        }));
      });
      body.appendChild(bar);

      var done = false;
      function check() {
        if (done) return;
        var typed = input.value.trim();
        if (!typed) { input.focus(); return; }
        done = true;
        input.readOnly = true;
        go.textContent = (i === items.length - 1) ? 'Voir le score' : 'Suivant';
        go.onclick = function () { i++; draw(); };

        var answers = [it.answer].concat(it.alt || []);
        var exact = answers.some(function (a) { return U.normAnswer(a) === U.normAnswer(typed); });
        var loose = answers.some(function (a) { return U.sameIgnoringAccents(a, typed); });

        if (exact) {
          score++;
          input.style.borderColor = 'var(--ok-line)';
          body.insertBefore(feedback('ok', pick(PRAISE), it.why), bar);
          U.announce('Correct.');
        } else if (loose && !it.strict) {
          // §3.4 — accepted, but the accent is shown so it is learned.
          score++;
          input.style.borderColor = 'var(--near-line)';
          body.insertBefore(feedback('near', 'Juste — attention à l’accent :', '**' + it.answer + '**' + (it.why ? ' · ' + it.why : '')), bar);
          U.announce('Correct, avec une correction d’accent : ' + it.answer);
        } else {
          input.style.borderColor = 'var(--no-line)';
          var why = it.why || '';
          if (loose && it.strict) why = why || 'Ici l’accent change le mot : ce n’est pas le même sens.';
          body.insertBefore(feedback('no', pick(NUDGE) + ' On écrit : ' + it.answer, why), bar);
          U.announce('Incorrect. La réponse est ' + it.answer);
        }
        go.focus();
      }

      go.addEventListener('click', function () { if (done) return; check(); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); done ? go.click() : check(); }
      });
      input.focus({ preventScroll: true });
    }

    draw();
    return shell('Texte à trous', ex.consigne || 'Complète la phrase.', body, foot);
  }

  /* ===================== 3. Matching ===================== */
  function paires(ex) {
    var pairs = U.shuffle(ex.pairs).slice(0, ex.max || ex.pairs.length);
    var body = el('div', { class: 'exo-body' });
    var progress = el('span', { class: 'exo-progress' });
    var againBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Recommencer', onclick: restart });
    var foot = el('footer', { class: 'exo-foot' }, [progress, againBtn]);

    function restart() { pairs = U.shuffle(ex.pairs).slice(0, ex.max || ex.pairs.length); draw(); }

    function draw() {
      body.innerHTML = '';
      var left = U.shuffle(pairs.map(function (p, k) { return { t: p[0], k: k }; }));
      var right = U.shuffle(pairs.map(function (p, k) { return { t: p[1], k: k }; }));
      var sel = null, matched = 0;
      progress.textContent = '0 / ' + pairs.length + ' associées';

      var colL = el('div', { class: 'match-col' }, [el('h4', { text: ex.labelLeft || 'Français' })]);
      var colR = el('div', { class: 'match-col' }, [el('h4', { text: ex.labelRight || 'Sens' })]);

      function make(item, side) {
        var b = el('button', {
          class: 'match-item ' + (side === 'L' ? 'side-fr' : ''),
          type: 'button', lang: side === 'L' ? 'fr' : null, html: U.inline(item.t)
        });
        b.dataset.k = item.k; b.dataset.side = side;
        b.addEventListener('click', function () {
          if (b.classList.contains('is-done')) return;
          if (sel && sel.el === b) { b.classList.remove('is-sel'); sel = null; return; }
          if (!sel || sel.side === side) {
            if (sel) sel.el.classList.remove('is-sel');
            b.classList.add('is-sel');
            sel = { el: b, side: side, k: item.k };
            return;
          }
          if (sel.k === item.k) {
            sel.el.classList.remove('is-sel');
            sel.el.classList.add('is-done'); b.classList.add('is-done');
            sel.el.disabled = true; b.disabled = true;
            sel = null; matched++;
            progress.textContent = matched + ' / ' + pairs.length + ' associées';
            if (matched === pairs.length) {
              body.appendChild(feedback('ok', 'Tout est associé — bravo !', ex.why));
              U.announce('Toutes les paires sont associées.');
            }
          } else {
            var bad = sel.el;
            b.classList.add('is-miss'); bad.classList.add('is-miss');
            setTimeout(function () {
              b.classList.remove('is-miss');
              bad.classList.remove('is-miss', 'is-sel');
            }, 360);
            sel = null;
            U.announce('Ce n’est pas la bonne paire.');
          }
        });
        return b;
      }

      left.forEach(function (it) { colL.appendChild(make(it, 'L')); });
      right.forEach(function (it) { colR.appendChild(make(it, 'R')); });
      body.appendChild(el('div', { class: 'match-grid' }, [colL, colR]));
    }

    draw();
    return shell('Associer', ex.consigne || 'Associe chaque élément à sa paire.', body, foot);
  }

  /* ===================== 4. Ordering ===================== */
  function ordre(ex) {
    var items = U.shuffle(ex.items);
    var i = 0, score = 0;

    var body = el('div', { class: 'exo-body' });
    var progress = el('span', { class: 'exo-progress' });
    var scoreEl = el('span', { class: 'exo-score' });
    var againBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Recommencer', hidden: true, onclick: restart });
    var foot = el('footer', { class: 'exo-foot' }, [progress, againBtn, scoreEl]);

    function restart() { items = U.shuffle(ex.items); i = 0; score = 0; againBtn.hidden = true; draw(); }

    function draw() {
      body.innerHTML = '';
      scoreEl.textContent = '';
      if (i >= items.length) {
        progress.textContent = '';
        againBtn.hidden = false;
        body.appendChild(el('div', { class: 'fc-done' }, [
          el('div', { class: 'big', text: score === items.length ? '🎉' : '👍' }),
          el('h3', { text: score + ' / ' + items.length })
        ]));
        return;
      }

      var it = items[i];
      progress.textContent = 'Phrase ' + (i + 1) + ' / ' + items.length;
      if (it.prompt) body.appendChild(el('p', { class: 'q-text', lang: 'fr', html: U.inline(it.prompt) }));

      var slot = el('div', { class: 'ord-slot', 'aria-label': 'Ta phrase' });
      var tray = el('div', { class: 'ord-tray', 'aria-label': 'Mots à placer' });
      var done = false;

      function tok(word) {
        var t = el('button', { class: 'tok', type: 'button', lang: 'fr', text: word, draggable: 'true' });
        t.addEventListener('click', function () {
          if (done) return;
          (t.parentNode === tray ? slot : tray).appendChild(t);
        });
        t.addEventListener('dragstart', function (e) {
          if (done) { e.preventDefault(); return; }
          dragged = t; t.classList.add('is-drag');
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', word); } catch (err) {}
        });
        t.addEventListener('dragend', function () { t.classList.remove('is-drag'); dragged = null; });
        return t;
      }
      var dragged = null;

      [slot, tray].forEach(function (zone) {
        zone.addEventListener('dragover', function (e) { if (dragged && !done) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } });
        zone.addEventListener('drop', function (e) {
          if (!dragged || done) return;
          e.preventDefault();
          var after = null;
          U.$$('.tok', zone).forEach(function (t) {
            var r = t.getBoundingClientRect();
            if (e.clientX > r.left + r.width / 2 || e.clientY > r.bottom) after = t;
          });
          if (after && after.nextSibling) zone.insertBefore(dragged, after.nextSibling);
          else if (after) zone.appendChild(dragged);
          else zone.insertBefore(dragged, zone.firstChild);
        });
      });

      U.shuffle(it.tokens).forEach(function (word) { tray.appendChild(tok(word)); });

      body.appendChild(el('p', { class: 'exo-progress', text: 'Clique un mot pour le placer, ou fais-le glisser.' }));
      body.appendChild(slot);
      body.appendChild(tray);

      var go = el('button', { class: 'btn', type: 'button', text: 'Vérifier' });
      body.appendChild(el('div', { class: 'trou-row', style: 'margin-top:16px' }, [go]));

      go.addEventListener('click', function () {
        if (done) { i++; draw(); return; }
        var built = U.$$('.tok', slot).map(function (t) { return t.textContent; }).join(' ');
        var target = (it.answer || it.tokens.join(' '));
        var right = U.normAnswer(built.replace(/\s+([,.!?;:])/g, '$1').replace(/'\s+/g, "'"))
                 === U.normAnswer(target.replace(/\s+([,.!?;:])/g, '$1').replace(/'\s+/g, "'"));
        done = true;
        U.$$('.tok', body).forEach(function (t) { t.draggable = false; });
        slot.classList.add(right ? 'is-right' : 'is-wrong');
        if (right) score++;
        body.appendChild(feedback(right ? 'ok' : 'no',
          right ? pick(PRAISE) : pick(NUDGE) + ' L’ordre correct : ' + target, it.why));
        U.announce(right ? 'Correct.' : 'Incorrect. ' + target);
        go.textContent = (i === items.length - 1) ? 'Voir le score' : 'Suivant';
        go.focus();
      });
    }

    draw();
    return shell('Remettre en ordre', ex.consigne || 'Remets les mots dans l’ordre.', body, foot);
  }

  /* ===================== dispatcher ===================== */
  function build(ex) {
    switch (ex.type) {
      case 'qcm':    return qcm(ex);
      case 'trou':   return trou(ex);
      case 'paires': return paires(ex);
      case 'ordre':  return ordre(ex);
      default:       return el('div', { class: 'empty', text: 'Type d’exercice inconnu : ' + ex.type });
    }
  }

  w.Exo = { build: build, ACCENTS: ACCENTS };
})(window);
