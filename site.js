(() => {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const eur = n => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  const toastEl = document.getElementById('toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); toast('Kopiert: ' + text.split('\n')[0]); }
    catch (e) {
      const target = btn.closest('.item, .result').querySelector('b, pre');
      const r = document.createRange(); r.selectNodeContents(target);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      toast('Markiert. Mit Strg+C kopieren.');
    }
  }
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => copy(b.dataset.copy, b)));

  /* ---------- Open Night: simulated upcoming Fridays ---------- */
  const CAP = 20, MIN = 10;
  const fills = [17, 11, 6, 2];
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const nightsEl = document.getElementById('nights');
  const d0 = new Date(); d0.setHours(12, 0, 0, 0);
  const toFri = (5 - d0.getDay() + 7) % 7 || 7;
  const nights = fills.map((f, i) => { const d = new Date(d0); d.setDate(d0.getDate() + toFri + i * 7); return { d, f, mine: false }; });
  function renderNights() {
    nightsEl.innerHTML = '';
    nights.forEach((n, i) => {
      const left = MIN - n.f;
      const status = n.f >= CAP ? 'Ausgebucht' : left <= 0 ? `Findet statt · noch ${CAP - n.f} Plätze` : `Noch ${left} bis zur Spielgarantie`;
      const el = document.createElement('div'); el.className = 'night';
      el.innerHTML = `<div class="d">${pad(n.d.getDate())}.${pad(n.d.getMonth() + 1)}.<small>${days[n.d.getDay()]} · 19 Uhr</small></div>
        <div class="bar" role="img" aria-label="${n.f} von ${CAP} Plätzen vergeben"><i style="width:${n.f / CAP * 100}%"></i><span class="min" style="left:${MIN / CAP * 100}%"></span></div>
        <div class="status ${left <= 0 ? 'go' : ''}">${n.f}/${CAP} · ${status}</div>
        <button type="button" ${n.mine || n.f >= CAP ? 'disabled' : ''} data-i="${i}">${n.mine ? 'Dein Platz ✓' : 'Platz sichern'}</button>`;
      nightsEl.appendChild(el);
    });
  }
  nightsEl.addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    const n = nights[+b.dataset.i]; n.f++; n.mine = true; renderNights();
    toast(n.f === MIN ? 'Spielgarantie erreicht. Diese Open Night findet statt.' : 'Konzept-Demo: Hier würde die Ticketbuchung starten.');
  });
  renderNights();

  /* ---------- price calculator (prices as published by Shootex) ---------- */
  const pl = document.getElementById('players'), plOut = document.getElementById('players-out');
  const disc = document.getElementById('discount');
  const segBtns = document.querySelectorAll('.seg button');
  let hours = 1;
  function calc() {
    const n = +pl.value; plOut.textContent = n;
    const sum = document.getElementById('sum'), per = document.getElementById('per'), hint = document.getElementById('hint'), lbl = document.getElementById('sum-label');
    hint.hidden = true;
    if (n < 12) {
      lbl.textContent = 'Gesamt';
      sum.textContent = 'Auf Anfrage';
      per.textContent = 'Für Gruppen unter 12 Spielern';
      hint.textContent = 'Tipp: Mit „Lobby öffnen“ oder über die Open Night füllt ihr eure Runde auf.'; hint.hidden = false;
      return;
    }
    const rate = n >= 18 ? 16.5 : 17.5;
    const f = disc.checked ? .9 : 1;
    const total = rate * n * hours * f;
    lbl.textContent = hours === 3 ? 'Gesamt, höchstens' : 'Gesamt';
    sum.textContent = eur(total);
    per.textContent = eur(rate * f) + ' pro Person und Stunde' + (hours > 1 ? ' · ' + eur(total / n) + ' pro Person gesamt' : '');
    if (hours === 3) { hint.textContent = 'Ab der 3. Stunde gibt es Rabatt. Den genauen Preis bekommst du mit der Bestätigung.'; hint.hidden = false; }
  }
  pl.addEventListener('input', calc); disc.addEventListener('change', calc);
  segBtns.forEach(b => b.addEventListener('click', () => { hours = +b.dataset.h; segBtns.forEach(x => x.setAttribute('aria-pressed', x === b)); calc(); }));
  calc();

  /* ---------- booking request ---------- */
  const form = document.getElementById('book-form');
  const fDate = document.getElementById('f-date');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  fDate.min = iso(new Date());
  const nf = new Date(d0); nf.setDate(d0.getDate() + toFri); fDate.value = iso(nf);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = id => document.getElementById(id).value.trim();
    const d = v('f-date') ? new Date(v('f-date') + 'T12:00') : null;
    const text = [
      'Hallo Shootex-Team,',
      '',
      'ich möchte eine Runde Lasertag anfragen:',
      `Datum: ${d ? d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'flexibel'}`,
      `Spieler: ${v('f-players') || '?'}`,
      `Dauer: ${v('f-hours')} Std.`,
      `Anlass: ${v('f-occ')}`,
      '',
      `Name: ${v('f-name') || '–'}`,
      `Kontakt: ${v('f-contact') || '–'}`
    ].join('\n');
    document.getElementById('result-text').textContent = text;
    document.getElementById('mail-req').href = 'mailto:info@shootex.eu?subject=' + encodeURIComponent('Lasertag-Anfrage') + '&body=' + encodeURIComponent(text);
    document.getElementById('result').hidden = false;
    toast('Anfrage erstellt. Jetzt per E-Mail oder WhatsApp senden.');
  });
  document.getElementById('copy-req').addEventListener('click', e => copy(document.getElementById('result-text').textContent, e.currentTarget));
})();
