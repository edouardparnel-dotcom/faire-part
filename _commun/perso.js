// Collection personnalisée : ouverte depuis l'espace (?e=<événement>), la page de démonstration prend les prénoms,
// la date, le lieu et le programme du couple. Sans ?e=, rien ne change (démonstration).
const E = new URLSearchParams(location.search).get('e');
if (E) {
  document.documentElement.classList.add('perso-attente');
  document.head.insertAdjacentHTML('beforeend', `<style>
    .perso-attente .noms,.perso-attente .suite-couv .date,.perso-attente .suite-couv .lieu{visibility:hidden}
    .perso-bandeau{position:fixed;left:0;right:0;bottom:0;z-index:999;background:#1E1B18;color:#F7F3EC;font:13px/1.4 Inter,system-ui,sans-serif;text-align:center;padding:8px 12px}
    .perso-mention{position:absolute;left:12px;right:12px;bottom:56px;z-index:5;margin:0;background:rgba(20,16,12,.72);color:#F7F3EC;font:12px/1.4 Inter,system-ui,sans-serif;text-align:center;padding:7px 10px;border-radius:4px}
  </style>`);
  try {
    const { db, auth, esc, dateLongue, heure, majuscule } = await import('../app/commun.js?v=4');
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');
    await new Promise(r => { const f = onAuthStateChanged(auth, () => { f(); r(); }); });
    const s = await getDoc(doc(db, 'events', E)), u = auth.currentUser;
    // Invitation pas encore publiée : seuls les organisateurs (connectés avec un compte) la voient à leurs prénoms.
    if (s.exists() && (s.data().formule !== 'essai' || (u && !u.isAnonymous))) {
      // Nuancier choisi dans « Mon faire-part » : seules les couleurs du code changent, jamais les images.
      const n = s.data().perso?.nuancier, slug = location.pathname.split('/').slice(-2)[0];
      if (n) {
        const l = await fetch('../_commun/nuanciers.json?v=3').then(r => r.json()).catch(() => ({}));
        Object.entries((l[slug] || []).find(x => x.id === n)?.c || {}).forEach(([k, v]) => document.documentElement.style.setProperty('--' + k, v));
      }
      appliquer(s.data(), { esc, dateLongue, heure, majuscule });
    }
  } catch (err) { console.warn('Personnalisation', err); }
  document.documentElement.classList.remove('perso-attente');
}

function appliquer(evt, { esc, dateLongue, heure, majuscule }) {
  const [a, b] = (evt.titre || '').split(/\s+(?:&|et)\s+/i).map(x => x.trim());
  const noms = b ? `${esc(a)}<i class="or">&amp;</i>${esc(b)}` : esc(a);
  const script = b ? `${esc(a)} <span class="esp">&amp;</span> ${esc(b)}` : esc(a);
  document.querySelectorAll('h1.noms').forEach(h => h.innerHTML = noms);
  document.querySelectorAll('.inter-couple figcaption.script, .suite-pied .script').forEach(p => p.innerHTML = script);
  document.querySelectorAll('.inter-couple img, .medaillon-surprise img').forEach(i => i.alt = b ? `${a} et ${b}` : a);
  document.title = `${evt.titre} · votre faire-part`;
  const d = evt.date ? new Date(evt.date) : null, lieu = evt.lieu || '';
  if (d) {
    const z = n => String(n).padStart(2, '0');
    document.querySelectorAll('.suite-couv .date').forEach(p => p.textContent = `${z(d.getDate())} · ${z(d.getMonth() + 1)} · ${d.getFullYear()}`);
    document.body.dataset.date = evt.date;
    document.body.dataset.evenement = evt.titre;
    document.body.dataset.ville = lieu;
    const r = Math.max(0, d - Date.now()), mets = (id, v) => { const x = document.getElementById(id); if (x) x.textContent = v; };
    mets('j', Math.floor(r / 864e5)); mets('h', Math.floor(r / 36e5) % 24); mets('m', Math.floor(r / 6e4) % 60);
    const avant = new Date(+d - 30 * 864e5);
    document.querySelectorAll('#reponse > p:not([id])').forEach(p => p.textContent = `Merci de répondre avant le ${avant.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`);
    const ag = document.getElementById('agenda'), iso = x => x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    if (ag) ag.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(evt.titre) + '&dates=' + iso(d) + '/' + iso(new Date(+d + 12 * 36e5)) + '&location=' + encodeURIComponent(lieu);
  }
  document.querySelectorAll('.suite-couv .lieu:not(.std-seul)').forEach(p => p.textContent = lieu);
  const blocLieu = document.getElementById('lieu');
  if (blocLieu) {
    const p = blocLieu.querySelector('p'); if (p) p.textContent = lieu;
    const l = blocLieu.querySelector('a.bouton'); if (l) l.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(lieu);
  }
  // Programme : les cérémonies saisies dans l'espace, avec les pictogrammes de la collection.
  const frise = document.querySelector('.frise'), C = (evt.ceremonies || []).filter(c => c.date), D = evt.deroulePublic || [];
  if (frise && D.length) {
    const icones = [...frise.querySelectorAll('img')].map(i => i.getAttribute('src'));
    frise.innerHTML = D.map((x, k) => `<li class="apparait vu">${icones.length ? `<img src="${icones[k % icones.length]}" alt="" loading="lazy">` : ''}<div><b>${esc((x.heure || '').replace(':', ' h '))}</b><span>${esc(x.titre)}${x.lieu ? ` · ${esc(x.lieu)}` : ''}</span></div></li>`).join('');
    const sous = frise.closest('section')?.querySelector('.sous'); if (sous && d) sous.textContent = majuscule(dateLongue(evt.date));
  } else if (frise && C.length) {
    const icones = [...frise.querySelectorAll('img')].map(i => i.getAttribute('src'));
    frise.innerHTML = C.map((c, k) => `<li class="apparait vu">${icones.length ? `<img src="${icones[k % icones.length]}" alt="" loading="lazy">` : ''}<div><b>${heure(c.date).replace(':', ' h ')}</b><span>${esc(c.nom)}${c.lieu && c.lieu !== lieu ? ` · ${esc(c.lieu)}` : ''}</span></div></li>`).join('');
    const sous = frise.closest('section')?.querySelector('.sous'); if (sous) sous.textContent = majuscule(dateLongue(C[0].date));
  }
  // Textes et photo choisis dans « Mon faire-part » (vide = texte de la collection).
  const P = evt.perso || {}, txt = (sel, v) => v && document.querySelectorAll(sel).forEach(x => x.textContent = v);
  txt('.chapeau .fp-seul', P.chapeau);
  txt('#tenue .titre-tenue', P.tenueTitre); txt('.inter-matiere figcaption', P.tenueTitre);
  txt('#tenue .titre-tenue + p', P.tenue);
  txt('.suite-pied p:not(.script)', P.merci);
  if (P.reponse) txt('#reponse > p:not([id])', `Merci de répondre avant le ${new Date(P.reponse + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`);
  if (P.photo) document.querySelectorAll('.inter-couple img, .medaillon-surprise img').forEach(i => { i.src = P.photo; i.loading = 'eager'; });
  // Textes de démonstration propres au couple fictif : masqués plutôt que faux.
  document.getElementById('histoire')?.setAttribute('hidden', '');
  // L'ouverture 3D est dorée aux prénoms de la démonstration : on le dit, les vôtres y sont posés à la validation.
  const film = document.querySelector('.ouv-film-cadre');
  if (film) {
    const m = document.createElement('p');
    m.className = 'perso-mention';
    m.textContent = 'Aperçu : vos prénoms seront dorés sur la carte de cette ouverture à la validation de votre formule.';
    film.appendChild(m);
  }
  // Lien personnel de l'invité : la réponse part dans l'espace des mariés.
  const G = new URLSearchParams(location.search).get('g'), rep = document.getElementById('reponse');
  if (G && rep) {
    rep.querySelectorAll('[data-demo], br, #demo').forEach(x => x.remove());
    rep.insertAdjacentHTML('beforeend', `<a class="bouton plein" href="../app/invite.html?e=${encodeURIComponent(E)}&g=${encodeURIComponent(G)}">Répondre à l'invitation</a>`);
  }
  if (G) return;
  const bd = document.createElement('div');
  bd.className = 'perso-bandeau';
  bd.textContent = evt.formule === 'essai' ? 'Aperçu de votre faire-part · visible par vous seuls tant que la formule n\'est pas validée' : 'Votre faire-part';
  document.body.appendChild(bd);
}
