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
    if (bouton) bouton.classList.toggle('coupe', !audio || audio.paused);   // déjà lancée par le couple (« à l'ouverture ») : non barrée
    if (bouton) bouton.classList.add('visible');
    // enveloppe animée en CSS : on attend la fin de son animation ; vidéo 3D : la page apparaît aussitôt (la vidéo a déjà tout montré)
    setTimeout(() => document.body.classList.remove('ferme'), ouv.querySelector('video.ouv-film') ? 250 : 3200);
  }
  // Ouverture en vidéo 3D (Lanternes) : le geste lance la vidéo, la page apparaît à la fin. Sans lecture possible, on ouvre aussitôt.
  const film = ouv.querySelector('video.ouv-film');
  // La carte de la vidéo est vierge : les prénoms et la date du couple s'y posent quand elle s'immobilise face à l'invité.
  // data-cadre = gauche, haut, droite, bas de la carte dans l'image de la vidéo (0 à 1) ; data-des = seconde où elle est immobile.
  const texte = ouv.querySelector('.ouv-carte');
  if (film && texte) {
    const [g, h, d, b] = texte.dataset.cadre.split(',').map(Number);
    const cale = () => {
      const vw = film.videoWidth || 720, vh = film.videoHeight || 1280;
      const r = film.getBoundingClientRect();
      const k = (getComputedStyle(film).objectFit === 'contain' ? Math.min : Math.max)(r.width / vw, r.height / vh);
      const x0 = r.left + (r.width - vw * k) / 2, y0 = r.top + (r.height - vh * k) / 2;
      Object.assign(texte.style, { left: x0 + g * vw * k + 'px', top: y0 + h * vh * k + 'px', width: (d - g) * vw * k + 'px', height: (b - h) * vh * k + 'px' });
      // prénom long : on réduit pour qu'il tienne dans la carte
      texte.querySelectorAll('b').forEach(el => {
        el.style.fontSize = '';
        const max = texte.clientWidth * .86;
        if (el.scrollWidth > max) el.style.fontSize = parseFloat(getComputedStyle(el).fontSize) * max / el.scrollWidth + 'px';
      });
    };
    cale(); film.addEventListener('loadedmetadata', cale); addEventListener('resize', cale);
    const des = parseFloat(texte.dataset.des) || 7.2;
    film.addEventListener('timeupdate', () => { if (film.currentTime >= des) { cale(); texte.classList.add('visible'); } });
  }
  function lancer() {
    if (!film) return ouvrir();
    if (film.dataset.lance) return;
    film.dataset.lance = '1';
    ouv.classList.add('en-cours');
    let fini = false;
    const fin = () => { if (!fini) { fini = true; ouvrir(); } };
    film.addEventListener('ended', fin);
    film.addEventListener('error', fin);
    // la fin de la vidéo est une carte immobile : on n'attend pas qu'elle se termine (remarque de Parnel : la page arrivait en retard)
    film.addEventListener('timeupdate', () => { if (film.duration && film.currentTime >= film.duration - 0.4) fin(); });
    film.play().then(() => setTimeout(fin, ((film.duration || 8) + 1.5) * 1000), fin);
  }
  ouv.addEventListener('click', lancer);
  if (q.has('auto')) setTimeout(lancer, 300);
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
  if (bouton) {
    // Haut-parleur classique : barré quand le son est coupé, pour que l'invité sache qu'il peut l'activer.
    bouton.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/><path class="ondes" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/><path class="barre" d="M15.5 9.5l5 5M20.5 9.5l-5 5"/></svg>';
    bouton.setAttribute('aria-label', 'Activer ou couper la musique');
    if (audio) bouton.addEventListener('click', e => { e.stopPropagation(); musique(audio.paused); });
  }
  // Démonstration seulement : choisir une autre musique (sur l'invitation d'un couple, c'est réglé dans son espace).
  if (bouton && audio && !q.has('e')) {
    const choisir = document.createElement('button'); choisir.type = 'button'; choisir.className = 'choisir-musique'; choisir.textContent = 'Changer la musique';
    document.body.appendChild(choisir);
    new MutationObserver(() => choisir.classList.toggle('visible', bouton.classList.contains('visible'))).observe(bouton, { attributes: true });
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
    choisir.addEventListener('click', e => { e.stopPropagation(); panneau.classList.toggle('ouvert'); });
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
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '../_commun/vivant.css?v=9'; document.head.appendChild(l);
    const sc = document.createElement('script'); sc.src = '../_commun/vivant.js?v=13'; document.body.appendChild(sc);
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

  // Une surprise : la photo des mariés se découvre en grattant le médaillon, recouvert de la matière de la collection.
  document.querySelectorAll('.medaillon-surprise').forEach(md => {
    const cv = md.querySelector('canvas'), x = cv.getContext('2d'), dpr = devicePixelRatio || 1;
    const prepare = () => {
      const r = md.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr;
      const peint = img => {
        x.globalCompositeOperation = 'source-over';
        if (img) { const s = Math.max(cv.width / img.width, cv.height / img.height); x.drawImage(img, (cv.width - img.width * s) / 2, (cv.height - img.height * s) / 2, img.width * s, img.height * s); }
        else { x.fillStyle = getComputedStyle(md).getPropertyValue('--or1') || '#b8904a'; x.fillRect(0, 0, cv.width, cv.height); }
        const g = x.createLinearGradient(0, 0, cv.width, cv.height);
        g.addColorStop(0, 'rgba(255,240,200,.10)'); g.addColorStop(.5, 'rgba(255,255,255,.38)'); g.addColorStop(1, 'rgba(120,90,40,.18)');
        x.fillStyle = g; x.fillRect(0, 0, cv.width, cv.height);
        x.fillStyle = 'rgba(40,30,20,.72)'; x.font = `600 ${12 * dpr}px system-ui`; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('GRATTEZ ICI', cv.width / 2, cv.height / 2);
        x.globalCompositeOperation = 'destination-out';
      };
      const im = new Image(); im.onload = () => peint(im); im.onerror = () => peint(null); im.src = 'fond.jpg';
    };
    prepare();
    let actif = false, n = 0;
    const gratte = e => { if (!actif) return; const b = cv.getBoundingClientRect(); x.beginPath(); x.arc((e.clientX - b.left) * dpr, (e.clientY - b.top) * dpr, 22 * dpr, 0, 7); x.fill();
      if (++n % 10 === 0) { const d = x.getImageData(0, 0, cv.width, cv.height).data; let v = 0; for (let i = 3; i < d.length; i += 16) if (!d[i]) v++;
        if (v / (d.length / 16) > .45) { cv.style.transition = 'opacity .8s'; cv.style.opacity = 0; md.classList.add('decouvert'); setTimeout(() => cv.remove(), 900); } } };
    cv.addEventListener('pointerdown', e => { actif = true; cv.setPointerCapture(e.pointerId); gratte(e); });
    cv.addEventListener('pointermove', gratte);
    cv.addEventListener('pointerup', () => actif = false);
  });

  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('vu')), { threshold: .15 });
  document.querySelectorAll('.apparait').forEach(el => { io.observe(el); if (el.getBoundingClientRect().top < innerHeight) el.classList.add('vu'); });

  const d = document.body.dataset;
  if (d.date) {
    const cible = new Date(d.date);
    const tic = () => { const r = Math.max(0, new Date(d.date) - Date.now()); j.textContent = Math.floor(r / 864e5); h.textContent = Math.floor(r / 36e5) % 24; m.textContent = Math.floor(r / 6e4) % 60; };
    tic(); setInterval(tic, 30000);
    const z = x => x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const ag = document.getElementById('agenda');
    if (ag) { ag.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(d.evenement) + '&dates=' + z(cible) + '/' + z(new Date(+cible + 12 * 36e5)) + '&location=' + encodeURIComponent(d.ville || ''); ag.target = '_blank'; }
  }
  document.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); document.getElementById('demo').style.display = 'block'; }));
})();
