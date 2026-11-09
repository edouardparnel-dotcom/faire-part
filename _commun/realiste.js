// Collection réaliste : ouverture de l'enveloppe (rabat 3D, carte qui sort), musique au premier geste, apparitions au défilement.
// ?ouvert : page déjà ouverte (aperçus) · ?sections : sans la couverture · ?f=std : save-the-date.
(function () {
  const q = new URLSearchParams(location.search);
  const ouv = document.getElementById('ouverture');
  const audio = document.getElementById('audio');
  const bouton = document.getElementById('musique');
  // Invitation au prénom de l'invité (?pour=Prénom ; dans l'espace, le lien personnel le fait tout seul).
  const pour = (q.get('pour') || '').trim().slice(0, 30);
  if (pour) {
    const propre = pour.replace(/[<>&"]/g, '');
    document.querySelectorAll('.suite-couv .chapeau, .env-carte small:first-child, .derriere small:first-child').forEach((el, i) => {
      const p = document.createElement(i ? 'small' : 'p'); p.className = 'pour-invite'; p.textContent = i ? propre : 'Chère ' + propre + ',';
      el.parentNode.insertBefore(p, el);
    });
  }
  if (q.get('f') === 'std') { document.body.classList.add('std'); if (document.body.dataset.titreStd) document.title = document.body.dataset.titreStd; }

  let musique = function (jouer) {
    if (!audio) return;
    if (jouer) { audio.volume = 0.6; audio.play().then(() => bouton.classList.remove('coupe')).catch(() => bouton.classList.add('coupe')); }
    else { audio.pause(); bouton.classList.add('coupe'); }
  };
  function ouvrir() {
    if (ouv.classList.contains('ouvert')) return;
    ouv.classList.add('ouvert');
    // Musique coupée par défaut : l’invité la lance depuis le bouton.
    if (bouton) bouton.classList.add('coupe');
    if (bouton) bouton.classList.add('visible');
    setTimeout(() => document.body.classList.remove('ferme'), 3200);
  }
  ouv.addEventListener('click', ouvrir);
  if (q.has('auto')) setTimeout(ouvrir, 300);
  // Choix de la musique : celle de la collection, une autre de la bibliothèque, la sienne (fichier MP3) ou aucune.
  const PISTES = [['Grand Hôtel', 'grand-hotel'], ['Héritage', 'heritage'], ['Lakou', 'lakay'], ['Madras', 'madras'], ['Kente', 'kente'], ['Owambe', 'owambe'],
    ['Toghu', 'toghu'], ['Teranga', 'teranga'], ['Bogolan', 'bogolan'], ['Kita', 'kita'], ['Sape', 'sape'], ['Tibeb', 'tibeb'], ['Classique', 'classique'],
    ['Bohème', 'boheme'], ['Champêtre', 'champetre'], ['Gatsby', 'gatsby'], ['Versailles', 'versailles'], ['Opéra', 'opera']];
  const cle = 'mv-musique-' + location.pathname.split('/').slice(-2, -1)[0];
  let choix = null;
  try { choix = localStorage.getItem(cle); } catch (e) {}
  if (audio && choix !== null) { if (choix) audio.src = choix; else audio.removeAttribute('src'); }
  const sansMusique = () => audio && !audio.getAttribute('src');
  const _musique = musique;
  musique = j => { if (j && sansMusique()) { bouton.classList.add('coupe'); return; } _musique(j); };
  if (bouton && audio) {
    const panneau = document.createElement('div');
    panneau.className = 'choix-musique';
    const ici = location.pathname.split('/').slice(-2, -1)[0];
    const items = [['Sans musique', '']].concat(PISTES.map(([n, d]) => [n + (d === ici ? ' · la musique de la collection' : ''), '../' + d + '/musique.mp3']));
    items.sort((a, b) => (b[0].includes('collection') - a[0].includes('collection')) || (a[1] === '' ? -1 : 0));
    panneau.innerHTML = '<h3>Musique</h3>' + items.map(([n, src]) => `<button type="button" data-piste="${src}">${n}</button>`).join('')
      + '<label>＋ Votre musique (fichier MP3)<input type="file" accept="audio/*"></label><p>Les mariés choisissent la musique de leur invitation, ou n’en mettent aucune.</p>';
    document.body.appendChild(panneau);
    const marque = () => panneau.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.piste ? new URL(x.dataset.piste, location.href).href === audio.src : !audio.getAttribute('src'))));
    marque();
    bouton.addEventListener('click', e => { e.stopPropagation(); panneau.classList.toggle('ouvert'); });
    document.addEventListener('click', e => { if (!panneau.contains(e.target)) panneau.classList.remove('ouvert'); });
    panneau.addEventListener('click', e => {
      const x = e.target.closest('button'); if (!x) return;
      const src = x.dataset.piste;
      try { localStorage.setItem(cle, src); } catch (er) {}
      if (src) { audio.src = src; _musique(true); } else { audio.pause(); audio.removeAttribute('src'); bouton.classList.add('coupe'); }
      marque();
    });
    panneau.querySelector('input').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      audio.src = URL.createObjectURL(f); _musique(true); marque();
    });
  }
  // Animations, profondeur et particules (chargées aussi sur les faire-part écrits à la main).
  if (!document.querySelector('script[src*="vivant.js"]')) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '../_commun/vivant.css?v=6'; document.head.appendChild(l);
    const sc = document.createElement('script'); sc.src = '../_commun/vivant.js?v=8'; document.body.appendChild(sc);
  }
  if (q.has('sections')) document.querySelector('.carte').style.display = 'none';
  if (q.has('ouvert')) {
    ouv.style.transition = 'none'; ouv.classList.add('ouvert'); document.body.classList.remove('ferme');
    if (bouton) { bouton.style.transition = 'none'; bouton.classList.add('visible', 'coupe'); }
  }

  // Save-the-date : la date se découvre en grattant une couche dorée.
  if (q.get('f') === 'std' && !q.has('ouvert')) {
    const cible = document.querySelector('.suite-couv .date');
    if (cible) setTimeout(() => {
      const r = cible.getBoundingClientRect(), cv = document.createElement('canvas'), dpr = devicePixelRatio || 1;
      cible.style.position = 'relative'; cv.className = 'grattage';
      cv.width = (r.width + 24) * dpr; cv.height = (r.height + 16) * dpr;
      cv.style.cssText = `position:absolute;left:-12px;top:-8px;width:${r.width + 24}px;height:${r.height + 16}px;touch-action:none;cursor:grab;z-index:5;border-radius:8px`;
      const x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, cv.width, cv.height);
      g.addColorStop(0, '#9c7a33'); g.addColorStop(.35, '#f2dc8c'); g.addColorStop(.6, '#c9a13e'); g.addColorStop(1, '#8c6a1f');
      x.fillStyle = g; x.fillRect(0, 0, cv.width, cv.height);
      x.fillStyle = 'rgba(60,40,10,.75)'; x.font = `${13 * dpr}px system-ui`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('Grattez pour découvrir la date', cv.width / 2, cv.height / 2);
      cible.appendChild(cv); x.globalCompositeOperation = 'destination-out';
      let actif = false, n = 0;
      const gratte = e => { if (!actif) return; const b = cv.getBoundingClientRect(); x.beginPath(); x.arc((e.clientX - b.left) * dpr, (e.clientY - b.top) * dpr, 18 * dpr, 0, 7); x.fill();
        if (++n % 12 === 0) { const d = x.getImageData(0, 0, cv.width, cv.height).data; let v = 0; for (let i = 3; i < d.length; i += 16) if (!d[i]) v++; if (v / (d.length / 16) > .5) { cv.style.transition = 'opacity .6s'; cv.style.opacity = 0; setTimeout(() => cv.remove(), 700); } } };
      cv.addEventListener('pointerdown', e => { actif = true; cv.setPointerCapture(e.pointerId); gratte(e); });
      cv.addEventListener('pointermove', gratte);
      cv.addEventListener('pointerup', () => actif = false);
    }, 3400);
  }

  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('vu')), { threshold: .15 });
  document.querySelectorAll('.apparait').forEach(el => { io.observe(el); if (el.getBoundingClientRect().top < innerHeight) el.classList.add('vu'); });

  const d = document.body.dataset;
  if (d.date) {
    const cible = new Date(d.date);
    const tic = () => { const r = Math.max(0, cible - Date.now()); j.textContent = Math.floor(r / 864e5); h.textContent = Math.floor(r / 36e5) % 24; m.textContent = Math.floor(r / 6e4) % 60; };
    tic(); setInterval(tic, 30000);
    const z = x => x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const ag = document.getElementById('agenda');
    if (ag) { ag.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(d.evenement) + '&dates=' + z(cible) + '/' + z(new Date(+cible + 12 * 36e5)) + '&location=' + encodeURIComponent(d.ville || ''); ag.target = '_blank'; }
  }
  document.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); document.getElementById('demo').style.display = 'block'; }));
})();
