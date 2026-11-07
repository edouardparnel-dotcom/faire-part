// Noyau commun des faire-part : ouverture, compte à rebours, ajout à l'agenda, réponses de démonstration.
// Chaque page déclare avant ce script :
//   window.FAIREPART = { debut:'2027-06-19T15:00:00', fin:'20270619T233000', titre:'…', lieu:'…', fichier:'…',
//                        jour:'C\'est le grand jour', duree:1500 }
//   l'écran d'ouverture porte data-ouverture ; ce qui doit disparaître avec lui porte data-avec-ouverture.
(() => {
  const c = window.FAIREPART || {}, $ = id => document.getElementById(id);

  const ouv = document.querySelector('[data-ouverture]');
  if (ouv) ouv.addEventListener('click', () => {
    const aussi = document.querySelectorAll('[data-avec-ouverture]');
    ouv.classList.add('ouvert');
    aussi.forEach(e => { e.style.transition = 'opacity .4s'; e.style.opacity = 0; });
    setTimeout(() => {
      document.body.classList.remove('ferme');
      ouv.remove(); aussi.forEach(e => e.remove());
      document.dispatchEvent(new Event('faire-part:ouvert'));
    }, c.duree || 1500);
  });

  if (c.debut && $('rebours')) {
    const cible = new Date(c.debut).getTime(), d2 = n => String(n).padStart(2, '0');
    const tic = () => {
      let t = cible - Date.now();
      if (t < 0) { $('rebours').innerHTML = `<div style="grid-column:1/-1"><b>${c.jour || '♥'}</b></div>`; return; }
      const j = Math.floor(t / 864e5); t -= j * 864e5;
      const h = Math.floor(t / 36e5); t -= h * 36e5;
      const m = Math.floor(t / 6e4); t -= m * 6e4;
      $('j').textContent = j; $('h').textContent = d2(h); $('m').textContent = d2(m); $('s').textContent = d2(Math.floor(t / 1e3));
    };
    tic(); setInterval(tic, 1000);
  }

  $('agenda')?.addEventListener('click', e => {
    e.preventDefault();
    const dt = c.debut.replace(/[-:]/g, '').slice(0, 15);
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Demo//Faire-part//FR', 'BEGIN:VEVENT', `UID:${c.fichier}@faire-part`,
      'DTSTAMP:20270101T000000Z', `DTSTART:${dt}`, `DTEND:${c.fin}`, `SUMMARY:${c.titre}`, `LOCATION:${c.lieu.replace(/,/g, '\\,')}`,
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: `${c.fichier}.ics` }).click();
  });

  document.querySelectorAll('.reponse').forEach(b => b.addEventListener('click', e => { e.preventDefault(); $('demo').style.display = 'block'; }));
})();
