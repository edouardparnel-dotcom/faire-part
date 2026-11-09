// Collection réaliste : ouverture de l'enveloppe (rabat 3D, carte qui sort), musique au premier geste, apparitions au défilement.
// ?ouvert : page déjà ouverte (aperçus) · ?sections : sans la couverture · ?f=std : save-the-date.
(function () {
  const q = new URLSearchParams(location.search);
  const ouv = document.getElementById('ouverture');
  const audio = document.getElementById('audio');
  const bouton = document.getElementById('musique');
  if (q.get('f') === 'std') { document.body.classList.add('std'); if (document.body.dataset.titreStd) document.title = document.body.dataset.titreStd; }

  function musique(jouer) {
    if (!audio) return;
    if (jouer) { audio.volume = 0.6; audio.play().then(() => bouton.classList.remove('coupe')).catch(() => bouton.classList.add('coupe')); }
    else { audio.pause(); bouton.classList.add('coupe'); }
  }
  function ouvrir() {
    if (ouv.classList.contains('ouvert')) return;
    ouv.classList.add('ouvert');
    musique(true);
    if (bouton) bouton.classList.add('visible');
    setTimeout(() => document.body.classList.remove('ferme'), 3200);
  }
  ouv.addEventListener('click', ouvrir);
  if (q.has('auto')) setTimeout(ouvrir, 300);
  if (bouton) bouton.addEventListener('click', () => musique(audio.paused));
  if (q.has('sections')) document.querySelector('.carte').style.display = 'none';
  if (q.has('ouvert')) {
    ouv.style.transition = 'none'; ouv.classList.add('ouvert'); document.body.classList.remove('ferme');
    if (bouton) { bouton.style.transition = 'none'; bouton.classList.add('visible', 'coupe'); }
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
