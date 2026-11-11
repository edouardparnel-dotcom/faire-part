// Couche « vivante » des collections réalistes : profondeur au défilement (parallaxe), particules du thème,
// apparitions en cascade, compteurs animés, léger suivi du pointeur. Coupée si l'utilisateur réduit les animations.
(function () {
  if (window.__vivant) return; window.__vivant = true;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const b = document.body;
  const css = getComputedStyle(document.documentElement);
  const v = n => css.getPropertyValue(n).trim();

  // Fond en couche séparée : il glisse plus lentement que la page (le « fixed » de iOS ne bouge pas).
  const fond = document.createElement('div');
  fond.className = 'vivant-fond';
  b.prepend(fond);
  b.classList.add('vivant');

  // Repère « Découvrir » en bas de l'écran : visible après l'ouverture, disparaît dès qu'on défile (sauf Grand Hôtel et Héritage, validés tels quels).
  if (document.querySelector('.suite-couv') && !/^(grand-hotel|heritage)$/.test(b.dataset.collection || '')) {
    const ind = document.createElement('a');
    ind.className = 'indice-defile'; ind.href = '#'; ind.setAttribute('aria-label', 'Faire défiler vers la suite');
    ind.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5"/></svg>';
    ind.addEventListener('click', ev => { ev.preventDefault(); scrollBy({ top: innerHeight * .8, behavior: 'smooth' }); });
    b.appendChild(ind);
    const maj = () => ind.classList.toggle('cache', scrollY > 60);
    addEventListener('scroll', maj, { passive: true }); maj();
  }

  // cale-deborde : l'image « pleine largeur » va pile d'un bord à l'autre de sa carte, quelle que soit sa marge.
  const cale = () => document.querySelectorAll('[data-images=deborde] .bloc > .illus').forEach(im => {
    const s = getComputedStyle(im.parentElement), g = s.paddingLeft, d = s.paddingRight;
    im.style.marginLeft = '-' + g; im.style.marginRight = '-' + d; im.style.width = `calc(100% + ${g} + ${d})`; im.style.maxWidth = 'none';
  });
  cale(); addEventListener('resize', cale);

  const couches = [];
  const ajoute = (sel, k, relatif) => document.querySelectorAll(sel).forEach(el => couches.push({ el, k, relatif }));
  ajoute('.deco-haut', .38); ajoute('.couche.c1', .2); ajoute('.couche.c2', .08); ajoute('.deco-arche', .16); ajoute('.deco-coin', .3); ajoute('.deco-objet', .22); ajoute('.etang .brume', -.08); ajoute('.etang .libellule', .1); ajoute('.hublot-branche', .12);
  const valide = /^(grand-hotel|heritage)$/.test(b.dataset.collection || '');
  ajoute('.suite-couv .noms', valide ? .14 : .04); ajoute('.suite-couv .sur', .2);
  ajoute('.deco-bas', -.1, true); ajoute('.illus', -.07, true); ajoute('.inter:not(.inter-couple) img:not(.bord-haut):not(.bord-bas)', -.05, true); ajoute('.matiere-fond', .12, true); ajoute('.table-visu', -.05, true);

  // Travelling : les calques proches avancent vite, les lointains lentement, le texte recule ; les photos des
  // intermèdes font un léger travelling arrière en traversant l'écran. Grand Hôtel et Héritage restent tels quels.
  const profondeur = [], recul = [];
  const signe = !/^(grand-hotel|heritage)$/.test(b.dataset.collection || '');
  if (signe) {
    const p = (sel, z) => document.querySelectorAll('.suite-couv ' + sel).forEach(el => profondeur.push({ el, z }));
    p('.scene-fond', .2); p('.deco-balcon', .55); p('.deco-haut', .35); p('.deco-arche', .3); p('.coin-hg', .45); p('.coin-bd', .45);
    p('.cartouche', .12); p('.bord-g', .25); p('.couche.c1', .02); p('.couche.c2', .05); p('.couche.c3', .12); p('.volant-h', .18); p('.volant-b', .18); p('.face-g', .14); p('.face-d', .14); p('.suspendu', .25); p('.diag-h', .3); p('.etang .brume', .06); p('.etang .nenuphars', .2); p('.hublot-vue', .35); p('.hublot-branche', .15); p('.toran .guirlande', .12); p('.collier .proteas', .22); p('.pagnes', .1); p('.fleurs-bas', .14); p('.popup .mer', .05); p('.popup .case', .12); p('.drape', .1); p('.diag-b', .2); p('.deco-bas', .28); p('.plein-photo', .18); p('.arche', .1); p('.noms', -.1); p('.chapeau', -.16); p('.date', -.08);
    document.querySelectorAll('.inter-table img, .inter-matiere .matiere-detail:not(.bord-haut):not(.bord-bas)').forEach(el => recul.push(el));
  }

  // Parallaxes de plusieurs genres dans le déroulé : dérive horizontale, zoom, inclinaison 3D (data-paral sur body).
  const genre = b.dataset.paral, mobiles = [];
  if (genre && genre !== 'vertical') document.querySelectorAll(genre === 'incline' ? '.bloc' : '.bloc .illus, .inter:not(.inter-couple) img, .lieu-visu, .bloc img.photo').forEach((el, i) => mobiles.push({ el, sens: i % 2 ? 1 : -1 }));

  let px = 0, py = 0, sy = -1;
  function rendu() {
    const y = scrollY;
    fond.style.transform = `translate3d(${px * -6}px,${-y * .07 + py * -6}px,0) scale(1.06)`;
    const t = Math.min(y / innerHeight, 1.3);
    if (y < innerHeight * 1.5) for (const d of profondeur) d.el.style.scale = (1 + t * d.z).toFixed(3);
    for (const m of mobiles) {
      const r = m.el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > innerHeight + 80) continue;
      const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;   // -1 en haut, 1 en bas
      if (genre === 'derive') m.el.style.translate = `${(k * 34 * m.sens).toFixed(1)}px 0`;
      else if (genre === 'zoom') m.el.style.scale = (1.12 - Math.min(Math.abs(k), 1) * .12).toFixed(3);
      else if (genre === 'incline') m.el.style.rotate = `x ${(k * 9).toFixed(2)}deg`;
    }
    for (const el of recul) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) continue;
      const k = Math.max(0, Math.min(1, (r.top + r.height) / (innerHeight + r.height)));
      el.style.scale = (1 + .14 * k).toFixed(3);
    }
    for (const c of couches) {
      if (c.relatif) {
        const r = c.el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) continue;
        c.el.style.translate = `0 ${((r.top + r.height / 2 - innerHeight / 2) * c.k).toFixed(1)}px`;
      } else if (y < innerHeight * 1.4) {
        c.el.style.translate = `${(px * c.k * 18).toFixed(1)}px ${(y * c.k).toFixed(1)}px`;
      }
    }
  }
  if (!reduit) {
    const boucle = () => { if (scrollY !== sy || boucle.bouge) { sy = scrollY; boucle.bouge = false; rendu(); } requestAnimationFrame(boucle); };
    requestAnimationFrame(boucle);
    addEventListener('pointermove', e => { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; boucle.bouge = true; }, { passive: true });
    addEventListener('deviceorientation', e => { if (e.gamma == null) return; px = Math.max(-.5, Math.min(.5, e.gamma / 40)); py = Math.max(-.5, Math.min(.5, (e.beta - 45) / 60)); boucle.bouge = true; }, { passive: true });
  }

  // Apparitions en cascade : chaque étape du programme arrive à son tour, d'un côté puis de l'autre.
  document.querySelectorAll('.frise li').forEach((li, i) => { li.style.transitionDelay = (i * .12) + 's'; li.classList.add(i % 2 ? 'de-droite' : 'de-gauche'); });
  document.querySelectorAll('.bloc h2').forEach(h => h.classList.add('titre-vivant'));
  const io = new IntersectionObserver(es => es.forEach(x => {
    if (!x.isIntersecting) return;
    x.target.classList.add('vu');
    if (x.target.dataset.compte) compte(x.target);
    io.unobserve(x.target);
  }), { threshold: .2 });
  document.querySelectorAll('.bloc h2, .illus, .medaillons b').forEach(el => io.observe(el));

  // Compteurs (jours, heures, minutes) qui défilent jusqu'à leur valeur.
  document.querySelectorAll('.medaillons b').forEach(el => el.dataset.compte = '1');
  function compte(el) {
    const fin = parseInt(el.textContent, 10);
    if (isNaN(fin) || reduit) return;
    const t0 = performance.now();
    const pas = t => { const p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(pas); };
    requestAnimationFrame(pas);
  }

  // Particules du thème : poussière d'or, pétales, bulles de champagne, plumes.
  if (reduit) return;
  const type = b.dataset.particules || 'or';
  if (type === 'aucune') return;
  const cv = document.createElement('canvas');
  cv.className = 'vivant-particules';
  b.appendChild(cv);
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  let W, H;
  const taille = () => { W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; };
  taille(); addEventListener('resize', taille);
  const coul = { or: [v('--or2') || '#F0D58F', v('--or1') || '#C9A13E'], petales: [v('--accent') || '#C66', v('--or2') || '#F3C'],
                 bulles: ['rgba(255,248,220,.9)', v('--or2') || '#F2DC8C'], plumes: ['rgba(255,255,255,.95)', 'rgba(240,235,225,.9)'] }[type] || ['#E8D49E', '#C2A15A'];
  const N = type === 'or' ? 34 : type === 'bulles' ? 26 : 16;
  const r = (a, z) => a + Math.random() * (z - a);
  const parts = Array.from({ length: N }, () => nouvelle(true));
  function nouvelle(partout) {
    const monte = type === 'bulles' || type === 'or';
    return { x: r(0, W), y: partout ? r(0, H) : (monte ? H + 20 : -20), s: r(.6, 1.6) * dpr, vy: (monte ? -1 : 1) * r(.15, .55) * dpr,
             vx: r(-.15, .15) * dpr, a: r(0, 6.28), va: r(-.02, .02), c: coul[Math.random() < .5 ? 0 : 1], o: r(.35, .9), ph: r(0, 6.28) };
  }
  let derniere = 0, visible = true;
  document.addEventListener('visibilitychange', () => visible = !document.hidden);
  function anime(t) {
    requestAnimationFrame(anime);
    if (!visible || t - derniere < 30) return;
    derniere = t;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.ph += .03; p.x += p.vx + Math.sin(p.ph) * .25 * dpr; p.y += p.vy; p.a += p.va;
      if (p.y < -30 || p.y > H + 30) parts[i] = nouvelle(false);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = p.o * (type === 'or' ? .55 + .45 * Math.sin(p.ph * 2) : 1);
      ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
      if (type === 'or') { ctx.beginPath(); ctx.arc(0, 0, p.s * 1.3, 0, 6.28); ctx.fill(); ctx.globalAlpha *= .35; ctx.beginPath(); ctx.arc(0, 0, p.s * 4, 0, 6.28); ctx.fill(); }
      else if (type === 'petales') { ctx.beginPath(); ctx.ellipse(0, 0, p.s * 6, p.s * 3.4, 0, 0, 6.28); ctx.fill(); }
      else if (type === 'bulles') { ctx.lineWidth = .8 * dpr; ctx.beginPath(); ctx.arc(0, 0, p.s * 3, 0, 6.28); ctx.stroke(); }
      else { ctx.beginPath(); ctx.ellipse(0, 0, p.s * 2.2, p.s * 9, 0, 0, 6.28); ctx.fill(); }
      ctx.restore();
    }
  }
  requestAnimationFrame(anime);
})();
