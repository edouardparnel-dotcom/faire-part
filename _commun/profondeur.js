// Décor en profondeur : des objets rendus en 3D, répartis sur trois calques (loin, milieu, devant), qui montent
// lentement et glissent à des vitesses différentes au défilement. Téléphone comme ordinateur : nombre d'objets
// selon la largeur, et sur grand écran le premier plan reste dans les marges pour ne jamais couvrir le texte.
//   <body data-profondeur="decor-3d/lanterne-3d" data-profondeur-n="5">
//   images attendues : <base>-1.webp … <base>-N.webp (nettes) et <base>-1-flou.webp … (premier plan)
(function () {
  const b = document.body, base = b.dataset.profondeur;
  if (!base || window.__profondeur) return; window.__profondeur = true;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nb = parseInt(b.dataset.profondeurN, 10) || 1;

  const st = document.createElement('style');
  st.textContent = `.prof{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:-1;contain:strict}
.prof-devant{z-index:39}
.prof img{position:absolute;left:0;top:0;max-width:none;will-change:transform;user-select:none}
.prof-loin img{opacity:.5;filter:blur(1px)}
.prof-milieu img{opacity:.92;filter:drop-shadow(0 0 18px rgba(255,140,40,.45))}
.prof-devant img{opacity:.85}`;
  document.head.appendChild(st);

  const hasard = (a, z) => a + Math.random() * (z - a);
  // k : glissement au défilement (0 = immobile, 1 = suit la page) ; v : montée en px/s
  const CALQUES = [
    { nom: 'loin',   tel: 7, ordi: 14, taille: [22, 40], v: [5, 9],   k: .05, amp: 6 },
    { nom: 'milieu', tel: 4, ordi: 8,  taille: [62, 96], v: [12, 20], k: .2,  amp: 12 },
    { nom: 'devant', tel: 2, ordi: 3,  taille: [190, 250], v: [26, 36], k: .55, amp: 18, flou: true },
  ];
  const calques = CALQUES.map(c => { const d = document.createElement('div'); d.className = 'prof prof-' + c.nom; d.setAttribute('aria-hidden', 'true'); b.appendChild(d); return { ...c, el: d, objets: [] }; });

  let W = 0, H = 0;
  function place() {
    W = innerWidth; H = innerHeight;
    const large = W >= 900, echelle = large ? 1.25 : 1;
    // largeur du texte : le premier plan passe à côté sur grand écran, à demi hors de l'écran sur téléphone
    const main = document.querySelector('.suite-main');
    const col = main ? Math.min(main.getBoundingClientRect().width || W, W) : W;
    const marge = (W - col) / 2;
    let i = 0;
    for (const c of calques) {
      c.el.textContent = ''; c.objets = [];
      const n = large ? c.ordi : c.tel;
      for (let j = 0; j < n; j++, i++) {
        const t = hasard(c.taille[0], c.taille[1]) * echelle;
        const im = new Image();
        im.alt = ''; im.decoding = 'async';
        im.src = `${base}-${1 + (i % nb)}${c.flou ? '-flou' : ''}.webp`;
        im.style.width = t + 'px';
        // loin : partout ; milieu : dans les marges dès qu'elles sont assez larges ; devant : marges ou à demi hors de l'écran
        let x;
        if (c.nom === 'loin' || (!c.flou && marge < t * 1.2)) x = hasard(-.05, .95) * W;
        else if (marge > t * .7) x = j % 2 ? hasard(W - marge + 10, W - t * .75) : hasard(t * -.25, marge - t * 1.1);
        else x = j % 2 ? W - t * hasard(.35, .55) : -t * hasard(.45, .65);
        c.objets.push({ im, t, x, y0: hasard(0, H + t * 2), v: hasard(c.v[0], c.v[1]) * echelle, ph: hasard(0, 6.28), rot: hasard(-6, 6) });
        c.el.appendChild(im);
      }
    }
  }

  let px = 0;
  function rendu(temps) {
    const s = temps / 1000, sy = scrollY;
    for (const c of calques) for (const o of c.objets) {
      const tour = H + o.t * 2.4;
      const y = (((o.y0 - s * o.v - sy * c.k) % tour) + tour) % tour - o.t * 1.4;
      const x = o.x + Math.sin(s * .25 + o.ph) * c.amp + px * c.k * 40;
      const r = o.rot + Math.sin(s * .4 + o.ph) * 2.5;
      o.im.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${r.toFixed(2)}deg)`;
    }
  }

  place();
  let largeur = W;
  addEventListener('resize', () => { if (Math.abs(innerWidth - largeur) > 40 || innerHeight > H + 150) { largeur = innerWidth; place(); if (reduit) rendu(0); } });
  if (reduit) { rendu(0); return; }
  addEventListener('pointermove', e => { px = e.clientX / innerWidth - .5; }, { passive: true });
  let visible = true;
  document.addEventListener('visibilitychange', () => visible = !document.hidden);
  const boucle = t => { if (visible) rendu(t); requestAnimationFrame(boucle); };
  requestAnimationFrame(boucle);
})();
