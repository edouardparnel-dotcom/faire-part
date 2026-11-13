// Décor en profondeur : des objets rendus en 3D, répartis sur trois calques (loin, milieu, devant), qui montent
// lentement et glissent à des vitesses différentes au défilement. Téléphone comme ordinateur : nombre d'objets
// selon la largeur, répartis sur toute la largeur ; le premier plan flou passe aussi devant le texte.
//   <body data-profondeur="decor-3d/lanterne-3d" data-profondeur-n="5">
//   images attendues : <base>-1.webp … <base>-N.webp (nettes) et <base>-1-flou.webp … (premier plan)
// Avec data-profondeur-sequence="decor-3d/lanterne-seq" : bandes de vues 3D (<seq>.webp, <seq>-flou.webp) ; chaque objet
// prend la vue de sa hauteur à l'écran : vu d'au-dessus en bas, de face au milieu, d'en dessous en haut.
// Avec data-profondeur-mouvement="vol" (mouettes de Marine) : les objets traversent l'écran à l'horizontale, dans les
// deux sens, en ondulant ; la bande de vues est un cycle (battement d'ailes) joué en continu.
(function () {
  const b = document.body, base = b.dataset.profondeur;
  if (!base || window.__profondeur) return; window.__profondeur = true;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nb = parseInt(b.dataset.profondeurN, 10) || 1;
  const seq = b.dataset.profondeurSequence;
  const vol = b.dataset.profondeurMouvement === 'vol';
  // data-profondeur-mouvement="chute" (pétales, plumes) : les objets descendent en tournoyant et en se balançant, plus petits
  const chute = b.dataset.profondeurMouvement === 'chute';
  const bandes = {};   // nette / floue : { url, n (nombre de vues), ratio (hauteur / largeur d'une vue) }

  const st = document.createElement('style');
  st.textContent = `.prof{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:-1;contain:strict}
.prof-devant{z-index:39}
.prof img,.prof i{position:absolute;left:0;top:0;max-width:none;will-change:transform;user-select:none;background-repeat:no-repeat}
.prof-loin :is(img,i){opacity:.5;filter:blur(1px)}
.prof-milieu :is(img,i){opacity:.92;filter:drop-shadow(0 0 18px rgba(255,140,40,.45))}
.prof-devant :is(img,i){opacity:.78}` + (vol ? `
.prof-loin :is(img,i){opacity:.6;filter:blur(.6px)}
.prof-milieu :is(img,i){opacity:.95;filter:drop-shadow(0 6px 8px rgba(30,50,80,.18))}` : '') + (chute ? `
.prof-loin :is(img,i){opacity:.55;filter:blur(.8px)}
.prof-milieu :is(img,i){opacity:.95;filter:drop-shadow(0 5px 6px rgba(40,30,20,.16))}
.prof-devant :is(img,i){opacity:.85}` : '');
  document.head.appendChild(st);

  const hasard = (a, z) => a + Math.random() * (z - a);
  // k : glissement au défilement (0 = immobile, 1 = suit la page) ; v : montée en px/s
  const CALQUES = [
    { nom: 'loin',   tel: 7, ordi: 14, taille: [22, 40], v: [5, 9],   k: .05, amp: 6 },
    { nom: 'milieu', tel: 4, ordi: 8,  taille: [62, 96], v: [12, 20], k: .2,  amp: 12 },
    { nom: 'devant', tel: 2, ordi: 3,  taille: [190, 250], v: [26, 36], k: .55, amp: 18, flou: true },
  ];
  if (chute) {   // pétales : plus petits, un peu plus nombreux, chute douce
    CALQUES[0].taille = [14, 26]; CALQUES[0].tel = 8; CALQUES[0].ordi = 16;
    CALQUES[1].taille = [34, 56]; CALQUES[1].tel = 5; CALQUES[1].ordi = 10;
    CALQUES[2].taille = [110, 150];
  }
  const calques = CALQUES.map(c => { const d = document.createElement('div'); d.className = 'prof prof-' + c.nom; d.setAttribute('aria-hidden', 'true'); b.appendChild(d); return { ...c, el: d, objets: [] }; });

  let W = 0, H = 0;
  function place() {
    W = innerWidth; H = innerHeight;
    const large = W >= 900, echelle = (large ? 1.25 : 1) * (parseFloat(b.dataset.profondeurEchelle) || 1);   // data-profondeur-echelle : objets plus petits (jasmin de Kanchipuram)
    let i = 0;
    for (const c of calques) {
      c.el.textContent = ''; c.objets = [];
      const n = large ? c.ordi : c.tel;
      for (let j = 0; j < n; j++, i++) {
        const t = hasard(c.taille[0], c.taille[1]) * echelle;
        const bd = seq && bandes[c.flou ? 'floue' : 'nette'];
        let im;
        if (bd) {
          im = document.createElement('i');
          im.style.cssText = `width:${t}px;height:${(t * bd.ratio).toFixed(1)}px;background-image:url(${bd.url});background-size:${bd.n * 100}% 100%`;
        } else {
          im = new Image();
          im.alt = ''; im.decoding = 'async';
          im.src = `${base}-${1 + (i % nb)}${c.flou ? '-flou' : ''}.webp`;
          im.style.width = t + 'px';
        }
        // tous les calques sur toute la largeur, réparties par tranches pour ne pas s'agglutiner ;
        // le premier plan passe aussi devant le texte (flou et légèrement transparent, il reste lisible)
        const x = (j / n + hasard(0, 1 / n)) * (W + t * .6) - t * .8;
        const o = { im, t, x, y0: hasard(0, H + t * 2), v: hasard(c.v[0], c.v[1]) * echelle, ph: hasard(0, 6.28), rot: bd ? 0 : hasard(-6, 6), bd, vue: -1 };
        if (vol) {
          // en vol : une hauteur par tranche d'écran, un sens au hasard, trois à quatre fois plus vite qu'une lanterne
          o.y0 = (j / n + hasard(.1, .9) / n) * H * .85;
          o.sens = Math.random() < .5 ? 1 : -1;
          o.v *= 3.5;
          o.x = hasard(0, W);
        }
        c.objets.push(o);
        c.el.appendChild(im);
      }
    }
  }

  let px = 0;
  function rendu(temps) {
    const s = temps / 1000, sy = scrollY;
    for (const c of calques) for (const o of c.objets) {
      if (vol) {
        const large = W + o.t * 2;
        const x = (((o.x + s * o.v * o.sens) % large) + large) % large - o.t;
        const hy = H + o.t * 2;
        const y = (((o.y0 - sy * c.k + Math.sin(s * .7 + o.ph) * c.amp * 1.5) % hy) + hy) % hy - o.t;
        o.im.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scaleX(${o.sens})`;
        if (o.bd) {
          // battement d'ailes : la bande est un cycle, ~12 vues par seconde (plus lent au loin)
          const vue = Math.floor(s * (c.nom === 'loin' ? 9 : 12) + o.ph * 4) % o.bd.n;
          if (vue !== o.vue) { o.vue = vue; o.im.style.backgroundPosition = `${(vue / (o.bd.n - 1) * 100).toFixed(3)}% 0`; }
        }
        continue;
      }
      const tour = H + o.t * 2.4;
      if (chute) {
        // descend, se balance de gauche à droite et tournoie lentement sur lui-même
        const y = (((o.y0 + s * o.v * .8 - sy * c.k) % tour) + tour) % tour - o.t * 1.4;
        const x = o.x + Math.sin(s * .6 + o.ph) * c.amp * 2.2 + px * c.k * 40;
        const r = o.rot * 6 + s * (12 + o.ph * 3) * (o.ph > 3.14 ? 1 : -1) + Math.sin(s * .9 + o.ph) * 14;
        o.im.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${r.toFixed(1)}deg) scaleY(${(.75 + .25 * Math.sin(s * 1.3 + o.ph)).toFixed(3)})`;
        continue;
      }
      const y = (((o.y0 - s * o.v - sy * c.k) % tour) + tour) % tour - o.t * 1.4;
      const x = o.x + Math.sin(s * .25 + o.ph) * c.amp + px * c.k * 40;
      const r = o.rot + Math.sin(s * .4 + o.ph) * (o.bd ? 1.2 : 2.5);
      o.im.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${r.toFixed(2)}deg)`;
      if (o.bd) {
        // bas de l'écran -> vue 0 (d'au-dessus) ; haut -> dernière vue (d'en dessous)
        const p = Math.min(1, Math.max(0, 1 - (y + o.t * .6) / H));
        const vue = Math.round(p * (o.bd.n - 1));
        if (vue !== o.vue) { o.vue = vue; o.im.style.backgroundPosition = `${(vue / (o.bd.n - 1) * 100).toFixed(3)}% 0`; }
      }
    }
  }

  // les bandes de vues sont chargées avant de placer les objets (il faut leurs proportions)
  function charge(nom, url, n) {
    return new Promise(ok => {
      const im = new Image();
      im.onload = () => { bandes[nom] = { url, n, ratio: im.naturalHeight / (im.naturalWidth / n) }; ok(); };
      im.onerror = ok;
      im.src = url;
    });
  }
  if (seq) Promise.all([charge('nette', seq + '.webp', parseInt(b.dataset.profondeurVues, 10) || 48),
                        charge('floue', seq + '-flou.webp', parseInt(b.dataset.profondeurVuesFlou, 10) || 24)]).then(demarre);
  else demarre();
  function demarre() {
  place();
  let largeur = W;
  addEventListener('resize', () => { if (Math.abs(innerWidth - largeur) > 40 || innerHeight > H + 150) { largeur = innerWidth; place(); if (reduit) rendu(0); } });
  if (reduit) { rendu(0); return; }
  addEventListener('pointermove', e => { px = e.clientX / innerWidth - .5; }, { passive: true });
  let visible = true;
  document.addEventListener('visibilitychange', () => visible = !document.hidden);
  const boucle = t => { if (visible) rendu(t); requestAnimationFrame(boucle); };
  requestAnimationFrame(boucle);
  }
})();
