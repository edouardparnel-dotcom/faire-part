// Animations communes aux faire-part : parallaxe au défilement et apparitions des sections.
//   data-parallaxe="0.2"        l'élément se décale verticalement (positif = plus lent que la page)
//   data-rotation="0.05"        ...et tourne doucement en même temps (degrés par pixel)
//   data-fond-parallaxe="0.25"  l'image de fond glisse dans son cadre (data-base = position verticale de départ, en %)
//   class="apparait" + data-effet="zoom|gauche|droite|fondu"   apparition quand la section entre à l'écran
(() => {
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const style = document.createElement('style');
  style.textContent = `
    .apparait{opacity:0;transition:opacity 1s ease,transform 1s cubic-bezier(.2,.7,.2,1)}
    .apparait:not([data-effet]){transform:translateY(28px)}
    .apparait[data-effet="zoom"]{transform:scale(.92)}
    .apparait[data-effet="gauche"]{transform:translateX(-40px)}
    .apparait[data-effet="droite"]{transform:translateX(40px)}
    .apparait.vu{opacity:1;transform:none}
    [data-parallaxe],[data-fond-parallaxe]{will-change:transform,background-position}
    .bande-photo{position:relative;height:62vh;min-height:320px;overflow:hidden;display:grid;place-items:center;text-align:center;margin:10px 0}
    .bande-photo .bp-fond{position:absolute;left:0;right:0;top:-20%;bottom:-20%;background-size:cover;background-position:center}
    .bande-photo .bp-voile{position:absolute;inset:0}
    .bande-photo .bp-texte{position:relative;padding:0 24px;max-width:520px}
    .motif{position:absolute;pointer-events:none;z-index:0;opacity:.9}
    .decor{position:relative;height:min(118vw,640px);margin:46px 0 58px}
    .decor .d-ens{position:absolute;left:0;top:0;width:80%;height:76%;overflow:hidden;background-color:rgba(0,0,0,.08);box-shadow:0 30px 50px -34px rgba(0,0,0,.55)}
    .decor .d-img{position:absolute;left:0;right:0;top:-16%;bottom:-16%;background:center/cover}
    .decor .d-det{position:absolute;right:0;bottom:0;width:50%;height:54%;background:center/cover;border:7px solid var(--decor-bord,#fff);box-shadow:0 24px 40px -24px rgba(0,0,0,.6)}
    .decor .d-leg{position:absolute;left:0;bottom:2%;width:46%;font-size:11px;letter-spacing:.24em;text-transform:uppercase;text-align:left;opacity:.75;line-height:1.5}
    @media (prefers-reduced-motion:reduce){.apparait{opacity:1!important;transform:none!important}}
  `;
  document.head.appendChild(style);

  // Apparitions
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }), { threshold: .14 });
  const observer = () => document.querySelectorAll('.apparait:not(.vu)').forEach(el => io.observe(el));

  // Parallaxe
  let couches = [], fonds = [], attente = false;
  const recenser = () => {
    couches = [...document.querySelectorAll('[data-parallaxe]')];
    fonds = [...document.querySelectorAll('[data-fond-parallaxe]')];
  };
  function maj() {
    attente = false;
    const mi = innerHeight / 2;
    for (const el of couches) {
      const r = (el.offsetParent || el.parentElement).getBoundingClientRect();
      const d = r.top + r.height / 2 - mi;                 // distance au centre de l'écran
      const y = -d * parseFloat(el.dataset.parallaxe);
      const rot = el.dataset.rotation ? ` rotate(${(d * parseFloat(el.dataset.rotation)).toFixed(2)}deg)` : '';
      el.style.transform = `translate3d(0,${y.toFixed(1)}px,0)${rot}`;
    }
    for (const el of fonds) {
      const r = el.getBoundingClientRect();
      const d = r.top + r.height / 2 - mi;
      const base = parseFloat(el.dataset.base ?? 50);
      el.style.backgroundPosition = `center calc(${base}% + ${(d * parseFloat(el.dataset.fondParallaxe)).toFixed(1)}px)`;
    }
  }
  const demander = () => { if (!attente) { attente = true; requestAnimationFrame(maj); } };

  function demarrer() {
    observer();
    if (reduit) return;
    recenser();
    fonds.forEach(el => { if (!el.style.backgroundSize) el.style.backgroundSize = el.dataset.zoom || 'auto 130%'; });
    addEventListener('scroll', demander, { passive: true });
    addEventListener('resize', demander);
    maj();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', demarrer) : demarrer();
})();
