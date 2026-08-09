/* tts.js — French text-to-speech via the Web Speech API (§3.7).
   Degrades to a disabled button with "audio indisponible" if no fr voice exists. */
(function (w) {
  'use strict';
  var U = w.U;

  var synth = w.speechSynthesis || null;
  var voice = null;
  var ready = false;
  var current = null;

  function pickVoice() {
    if (!synth) return null;
    var voices = synth.getVoices() || [];
    if (!voices.length) return null;
    var fr = voices.filter(function (v) { return /^fr(-|_|$)/i.test(v.lang || ''); });
    if (!fr.length) return null;
    // Prefer fr-FR, then a local (offline) voice, then anything French.
    return fr.filter(function (v) { return /^fr[-_]FR/i.test(v.lang); })[0]
        || fr.filter(function (v) { return v.localService; })[0]
        || fr[0];
  }

  function refresh() {
    voice = pickVoice();
    ready = !!voice;
    document.documentElement.classList.toggle('no-tts', !ready);
    document.dispatchEvent(new CustomEvent('tts:ready', { detail: { ok: ready } }));
  }

  if (synth) {
    refresh();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', refresh);
    else synth.onvoiceschanged = refresh;
    // Safari sometimes populates voices late and never fires the event.
    setTimeout(refresh, 350);
    setTimeout(refresh, 1200);
  }

  function available() { return !!(synth && (ready || pickVoice())); }

  function speak(text, btn) {
    if (!synth) return false;
    if (!voice) voice = pickVoice();
    if (!voice) return false;

    synth.cancel();
    if (current && current.btn) current.btn.classList.remove('is-speaking');

    var u = new SpeechSynthesisUtterance(String(text));
    u.voice = voice;
    u.lang = voice.lang || 'fr-FR';
    u.rate = 0.92;   // a touch slower than default — this is a study tool
    u.pitch = 1;

    if (btn) {
      btn.classList.add('is-speaking');
      var clear = function () { btn.classList.remove('is-speaking'); current = null; };
      u.onend = clear; u.onerror = clear;
    }
    current = { btn: btn };
    synth.speak(u);
    return true;
  }

  function stop() {
    if (synth) synth.cancel();
    if (current && current.btn) current.btn.classList.remove('is-speaking');
    current = null;
  }

  /* A speaker button bound to one French string. */
  function button(text, label) {
    var ok = available();
    var b = U.el('button', {
      class: 'speak',
      type: 'button',
      'aria-label': (label || 'Écouter') + (ok ? '' : ' — audio indisponible'),
      title: ok ? 'Écouter' : 'Audio indisponible sur ce navigateur'
    }, [U.icon(ok ? U.ICONS.speaker : U.ICONS.speakerMute)]);
    if (!ok) { b.disabled = true; return b; }
    b.addEventListener('click', function (e) {
      e.stopPropagation(); e.preventDefault();
      if (!speak(text, b)) { b.disabled = true; b.title = 'Audio indisponible'; }
    });
    return b;
  }

  w.TTS = { speak: speak, stop: stop, available: available, button: button };
})(window);
