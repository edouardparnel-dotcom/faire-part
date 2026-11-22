// Collection personnalisée : ouverte depuis l'espace (?e=<événement>), la page de démonstration prend les prénoms, la date, le lieu,
// le programme, les textes, les photos, les couleurs et la musique du couple. Sans ?e=, rien ne change (démonstration).
// L'aperçu de l'espace appelle window.persoAppliquer(événement) à chaque frappe : tout se met à jour en direct, sans enregistrer.
const E = new URLSearchParams(location.search).get('e');
const ORIG = new Map();   // textes et images de la collection, pour y revenir quand le couple vide une case
if (E) {
  document.documentElement.classList.add('perso-attente');
  document.head.insertAdjacentHTML('beforeend', `<style>
    .perso-attente .noms,.perso-attente .suite-couv .date,.perso-attente .suite-couv .lieu{visibility:hidden}
    .perso-bandeau{position:fixed;left:0;right:0;top:0;z-index:999;background:#1E1B18;color:#F7F3EC;font:13px/1.4 Inter,system-ui,sans-serif;text-align:center;padding:8px 12px}
    .perso-mention{position:absolute;left:12px;right:12px;bottom:56px;z-index:5;margin:0;background:rgba(20,16,12,.72);color:#F7F3EC;font:12px/1.4 Inter,system-ui,sans-serif;text-align:center;padding:7px 10px;border-radius:4px}
  </style>`);
  try {
    const { db, auth, esc, dateLongue, heure, majuscule } = await import('../app/commun.js?v=5');
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');
    await new Promise(r => { const f = onAuthStateChanged(auth, () => { f(); r(); }); });
    const s = await getDoc(doc(db, 'events', E)), u = auth.currentUser;
    if (s.exists()) await codeAcces(E, s.data(), u);
    // Invitation pas encore publiée : seuls les organisateurs (connectés avec un compte) la voient à leurs prénoms.
    if (s.exists() && (s.data().formule !== 'essai' || (u && !u.isAnonymous))) {
      const outils = { esc, dateLongue, heure, majuscule, nuanciers: await fetch('../_commun/nuanciers.json?v=3').then(r => r.json()).catch(() => ({})) };
      window.persoAppliquer = ev => appliquer(ev, outils);
      appliquer(s.data(), outils);
      await programmeInvite(s.data(), outils, { db, auth, doc, getDoc, u });
      // Aperçu de l'organisateur « vu par un invité de telle cérémonie » (?cer=<clé>, depuis son espace)
      const k = new URLSearchParams(location.search).get('cer'), C = s.data().ceremonies || [];
      if (k && C.length > 1 && C.some(c => c.cle === k)) appliquer(pourCeremonies(s.data(), C.filter(c => c.cle === k)), outils);
    }
  } catch (err) { console.warn('Personnalisation', err); }
  document.documentElement.classList.remove('perso-attente');
}

// Code d'accès choisi par le couple : faire-part, save-the-date, site, mur photo, livre d'or et plan de table ne s'ouvrent
// qu'avec le code (une fois par téléphone). Les liens personnels des invités (?g=) et les organisateurs connectés passent directement.
async function codeAcces(E, evt, u) {
  const G = new URLSearchParams(location.search).get('g');
  if (!evt.codeAcces || !(evt.options || []).includes('code') || G || (u && !u.isAnonymous)) return;
  try { if (localStorage.getItem('mv-code-' + E) === evt.codeAcces) return; } catch {}
  document.documentElement.classList.remove('perso-attente');
  const voile = document.createElement('form');
  voile.style.cssText = 'position:fixed;inset:0;z-index:10000;display:grid;place-items:center;text-align:center;padding:30px;background:#f7f2e8;color:#3b3226;font-family:Georgia,serif';
  voile.innerHTML = `<div style="max-width:340px"><p style="letter-spacing:.3em;text-transform:uppercase;font-size:12px;margin:0 0 14px">Invitation privée</p>
    <p style="font-size:22px;margin:0 0 18px">Entrez le code reçu avec l'invitation</p>
    <input name="c" autocomplete="off" autocapitalize="characters" required style="width:100%;box-sizing:border-box;padding:12px;font-size:18px;text-align:center;border:1px solid #c9b99a;border-radius:6px;background:#fff">
    <button style="margin-top:14px;width:100%;padding:12px;font-size:16px;border:0;border-radius:6px;background:#3b3226;color:#f7f2e8;cursor:pointer">Ouvrir</button>
    <p id="m-code" style="min-height:1.4em;margin-top:12px;color:#9a3b2e"></p></div>`;
  document.body.appendChild(voile);
  document.body.style.overflow = 'hidden';
  await new Promise(fini => voile.addEventListener('submit', async ev => {
    ev.preventDefault();
    const o = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(E + ':' + voile.c.value.trim().toUpperCase()));
    const h = [...new Uint8Array(o)].map(x => x.toString(16).padStart(2, '0')).join('');
    if (h !== evt.codeAcces) { voile.querySelector('#m-code').textContent = 'Ce code ne correspond pas.'; return; }
    try { localStorage.setItem('mv-code-' + E, h); } catch {}
    voile.remove(); document.body.style.overflow = ''; fini();
  }));
  document.documentElement.classList.add('perso-attente');
}

// Lien personnel d'un invité, quand il y a plusieurs cérémonies : le programme ne montre que celles où il est convié
// (le déroulé détaillé seulement s'il est convié à toutes). Le téléphone est relié à la fiche comme sur la page de réponse.
async function programmeInvite(evt, outils, { db, auth, doc, getDoc, u }) {
  const G = new URLSearchParams(location.search).get('g'), C = evt.ceremonies || [];
  if (!G || C.length < 2) return;
  try {
    if (!u || u.isAnonymous) {
      const { signInAnonymously, signOut } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');
      const { setDoc } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
      let moi = auth.currentUser || (await signInAnonymously(auth)).user, m = await getDoc(doc(db, `events/${E}/membres/${moi.uid}`));
      if (m.exists() && m.data().token !== G) { await signOut(auth); moi = (await signInAnonymously(auth)).user; m = await getDoc(doc(db, `events/${E}/membres/${moi.uid}`)); }
      if (!m.exists()) await setDoc(doc(db, `events/${E}/membres/${moi.uid}`), { token: G });
    }
    const inv = (await getDoc(doc(db, `events/${E}/invites/${G}`))).data();
    if (!inv?.ceremonies?.length) return;
    const miennes = C.filter(c => inv.ceremonies.includes(c.cle));
    if (miennes.length === C.length) return;
    // la date et le lieu de couverture : ceux de sa première cérémonie
    appliquer(pourCeremonies(evt, miennes), outils);
  } catch (err) { console.warn('Programme de l’invité', err); }
}

// L'invitation telle que la voit un invité de ces cérémonies : leurs dates, leur lieu, et le déroulé de ces cérémonies seulement
// (un moment sans cérémonie appartient à la première, comme dans l'espace)
function pourCeremonies(evt, miennes) {
  const C = evt.ceremonies || [], cles = miennes.map(c => c.cle), de = d => C.some(c => c.cle === d.cer) ? d.cer : C[0]?.cle;
  const c0 = miennes[0] || {}, P = { ...(evt.perso || {}) };
  if (c0.photoLieu) P.photoLieu = c0.photoLieu;
  if (c0.tenueCouleurs) P.tenueCouleurs = c0.tenueCouleurs;
  if (c0.tenueTitre) P.tenueTitre = c0.tenueTitre;
  if (c0.tenue) P.tenue = c0.tenue;
  if (c0.cle !== C[0]?.cle) P.reponse = c0.reponse || '';   // une autre cérémonie : sa date de réponse, sinon un mois avant elle
  return { ...evt, perso: P, ceremonies: miennes, deroulePublic: (evt.deroulePublic || []).filter(d => cles.includes(de(d))), date: c0.date || evt.date, lieu: c0.lieu || evt.lieu };
}

// Texte d'un élément : celui du couple, ou celui de la collection si la case est vide
function texte(sel, v) {
  document.querySelectorAll(sel).forEach(x => {
    if (!ORIG.has(x)) ORIG.set(x, x.textContent);
    x.textContent = v || ORIG.get(x);
  });
}
function image(sel, url, sinon) {
  document.querySelectorAll(sel).forEach(i => {
    if (!ORIG.has(i)) ORIG.set(i, i.getAttribute('src'));
    i.src = url || sinon || ORIG.get(i); i.loading = 'eager';
  });
}

function appliquer(evt, { esc, dateLongue, heure, majuscule, nuanciers }) {
  const slug = location.pathname.split('/').slice(-2)[0], racine = document.documentElement;
  const [a, b] = (evt.titre || '').split(/\s+(?:&|et)\s+/i).map(x => x.trim());
  const noms = b ? `${esc(a)}<i class="or">&amp;</i>${esc(b)}` : esc(a);
  const script = b ? `${esc(a)} <span class="esp">&amp;</span> ${esc(b)}` : esc(a);
  document.querySelectorAll('h1.noms').forEach(h => h.innerHTML = noms);
  document.querySelectorAll('.inter-couple figcaption.script, .suite-pied .script, .inter-citation cite').forEach(p => p.innerHTML = script);
  document.querySelectorAll('.inter-couple img').forEach(i => i.alt = b ? `${a} et ${b}` : a);
  document.title = `${evt.titre} · votre faire-part`;
  const d = evt.date ? new Date(evt.date) : null, lieu = evt.lieu || '';
  if (d && !isNaN(d)) {
    const z = n => String(n).padStart(2, '0');
    document.querySelectorAll('.suite-couv .date').forEach(p => p.textContent = `${z(d.getDate())} · ${z(d.getMonth() + 1)} · ${d.getFullYear()}`);
    document.body.dataset.date = evt.date; document.body.dataset.evenement = evt.titre; document.body.dataset.ville = lieu;
    const r = Math.max(0, d - Date.now()), mets = (id, v) => { const x = document.getElementById(id); if (x) x.textContent = v; };
    mets('j', Math.floor(r / 864e5)); mets('h', Math.floor(r / 36e5) % 24); mets('m', Math.floor(r / 6e4) % 60);
    const ag = document.getElementById('agenda'), iso = x => x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    if (ag) ag.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(evt.titre) + '&dates=' + iso(d) + '/' + iso(new Date(+d + 12 * 36e5)) + '&location=' + encodeURIComponent(lieu);
  }
  document.querySelectorAll('.suite-couv .lieu:not(.std-seul)').forEach(p => p.textContent = lieu);
  const med = document.querySelector('.medaillons');
  if (med) {
    let autres = document.getElementById('autres-decomptes');
    const liste = (evt.ceremonies || []).filter(c => c.date && c.date !== evt.date);
    if (liste.length) {
      if (!autres) { autres = document.createElement('p'); autres.id = 'autres-decomptes'; autres.style.cssText = 'margin:14px 0 0;font-size:15px;line-height:1.7'; med.after(autres); }
      autres.innerHTML = liste.map(c => { const n = Math.ceil((new Date(c.date) - Date.now()) / 864e5);
        return `${esc(c.nom)} : ${n > 1 ? `dans ${n} jours` : n === 1 ? 'demain' : n === 0 ? "aujourd'hui" : 'passé'} · ${esc(majuscule(dateLongue(c.date)))}`; }).join('<br>');
    } else autres?.remove();
  }
  const blocLieu = document.getElementById('lieu');
  if (blocLieu) {
    const p = blocLieu.querySelector('p'); if (p) p.textContent = lieu;
    const l = blocLieu.querySelector('a.bouton'); if (l) l.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(lieu);
  }
  // Programme : les moments « invités » du déroulé, sinon les cérémonies, avec les pictogrammes de la collection
  const frise = document.querySelector('.frise'), C = (evt.ceremonies || []).filter(c => c.date), D = evt.deroulePublic || [];
  if (frise) {
    if (!ORIG.has(frise)) ORIG.set(frise, [...frise.querySelectorAll('img')].map(i => i.getAttribute('src')));
    const icones = ORIG.get(frise), ico = k => icones.length ? `<img src="${icones[k % icones.length]}" alt="" loading="lazy">` : '';
    if (D.length) frise.innerHTML = D.map((x, k) => `<li class="apparait vu">${ico(k)}<div><b>${esc((x.heure || '').replace(':', ' h '))}</b><span>${esc(x.titre)}${x.lieu ? ` · ${esc(x.lieu)}` : ''}</span></div></li>`).join('');
    else if (C.length) frise.innerHTML = C.map((c, k) => `<li class="apparait vu">${ico(k)}<div><b>${heure(c.date).replace(':', ' h ')}</b><span>${esc(c.nom)}${c.lieu && c.lieu !== lieu ? ` · ${esc(c.lieu)}` : ''}</span></div></li>`).join('');
    const sous = frise.closest('section')?.querySelector('.sous'); if (sous && evt.date) sous.textContent = majuscule(dateLongue(evt.date));
  }
  // Textes choisis dans « Mon faire-part » (case vide = texte de la collection)
  const P = evt.perso || {};
  texte('.chapeau .fp-seul', P.chapeau);
  texte('#tenue .titre-tenue', P.tenueTitre); texte('.inter-matiere figcaption', P.tenueTitre);
  texte('#tenue .titre-tenue + p', P.tenue);
  // Couleurs de tenue choisies par le couple (Messieurs, Mesdames : trois pastilles chacun) ; case vide = couleur de la collection
  document.querySelectorAll('.nuancier-tenue > div').forEach((bloc, i) => bloc.querySelectorAll('span').forEach((s, j) => {
    if (!ORIG.has(s)) ORIG.set(s, s.style.background);
    const c = (i ? P.tenueCouleurs?.f : P.tenueCouleurs?.h)?.[j];
    s.style.background = /^#[0-9a-f]{6}$/i.test(c || '') ? c : ORIG.get(s);
  }));
  texte('.suite-pied p:not(.script)', P.merci);
  const avant = P.reponse ? new Date(P.reponse + 'T12:00') : d ? new Date(+d - 30 * 864e5) : null;
  if (avant && !isNaN(avant)) document.querySelectorAll('#reponse > p:not([id])').forEach(p => p.textContent = `Merci de répondre avant le ${avant.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`);
  // Citation : la phrase du couple ; sans phrase, on n'affiche pas celle du couple fictif
  document.querySelectorAll('.inter-citation').forEach(q => { q.hidden = !P.citation; const p = q.querySelector('p'); if (p && P.citation) p.textContent = P.citation; });
  // Photos : jamais la photo d'un autre couple. Celle du couple partout où le couple apparaît (couverture ou intermède) ;
  // sans photo, l'intermède disparaît et la couverture prend une photo de la fête.
  const COUPLE = '.arche img, .edito-une img, .affiche-portrait, .polaroid img, .plein-photo';
  image('.inter-couple img', P.photo);
  document.querySelectorAll('.inter-couple').forEach(f => f.hidden = !P.photo);
  image(COUPLE, P.photo, 'photo.jpg');
  image('.medaillon-surprise img', P.photoSurprise);
  image('.photo-galerie', P.photoGalerie);
  image('#lieu img.illus', P.photoLieu);
  image('#tenue img.illus', P.photoTenue);   // l'image de la tenue : celle du couple (ses tissus, une inspiration) à la place des invités dessinés
  if (P.photoPos) racine.style.setProperty('--photo-pos', `${+P.photoPos.x}% ${+P.photoPos.y}%`);
  // Couleurs : le nuancier choisi (seules les couleurs du code changent, jamais les images)
  const nuance = (nuanciers[slug] || []).find(x => x.id === P.nuancier);
  [...racine.style].filter(k => k.startsWith('--') && k !== '--photo-pos').forEach(k => racine.style.removeProperty(k));
  Object.entries(nuance?.c || {}).forEach(([k, v]) => racine.style.setProperty('--' + k, v));
  // Musique : celle de la collection, une autre de la bibliothèque, son morceau ou aucune ; coupée au départ ou lancée à l'ouverture
  const M = P.musique || {}, audio = document.getElementById('audio'), hp = document.getElementById('musique');
  if (audio) {
    if (!ORIG.has(audio)) ORIG.set(audio, audio.getAttribute('src'));
    if (M.source === 'aucune') { audio.pause(); audio.removeAttribute('src'); if (hp) hp.hidden = true; }
    else { const src = M.url || ORIG.get(audio); if (audio.getAttribute('src') !== src) audio.src = src; if (hp) hp.hidden = false; }
    window.__departMusique = M.depart;
    if (!audio.dataset.perso) {
      audio.dataset.perso = '1';
      document.getElementById('ouverture')?.addEventListener('click', () => {
        if (window.__departMusique !== 'ouverte' || !audio.getAttribute('src')) return;
        audio.volume = 0.6; audio.play().then(() => hp?.classList.remove('coupe')).catch(() => {});
      }, { once: true });
    }
  }
  // Textes de démonstration propres au couple fictif : masqués plutôt que faux
  document.getElementById('histoire')?.setAttribute('hidden', '');
  // Vidéo d'ouverture dorée à leurs prénoms (fonction dorerVideo) ; sinon, on prévient que la démo porte d'autres prénoms
  const film = document.querySelector('.ouv-film-cadre'), v = film?.querySelector('video.ouv-film');
  if (v && P.video?.url) { if (v.getAttribute('src') !== P.video.url) { v.src = P.video.url; v.removeAttribute('poster'); v.load(); } film.querySelector('.perso-mention')?.remove(); }
  else if (film && !film.querySelector('.perso-mention')) {
    const m = document.createElement('p'); m.className = 'perso-mention';
    m.textContent = 'Aperçu : vos prénoms seront dorés sur la carte de cette ouverture à la validation de votre formule.';
    film.appendChild(m);
  }
  // Lien personnel de l'invité : la réponse part dans l'espace des mariés
  const G = new URLSearchParams(location.search).get('g'), rep = document.getElementById('reponse');
  if (G && rep && !rep.querySelector('.repondre-invite')) {
    rep.querySelectorAll('[data-demo], br, #demo').forEach(x => x.remove());
    rep.insertAdjacentHTML('beforeend', `<a class="bouton plein repondre-invite" href="../app/invite.html?e=${encodeURIComponent(E)}&g=${encodeURIComponent(G)}">Répondre à l'invitation</a>`);
  }
  // Pied de page : plus de « démonstration · couple et lieu fictifs »
  // Parrainage (mariage payé) : les invités qui se marient aussi ont -10 % avec le code du mariage (créé par le webhook Stripe).
  const code = evt.type === 'mariage' && /^MV-[A-Z0-9]{5}$/.test(evt.parrainage || '') ? evt.parrainage : '';
  // Wedding planner du couple (payé avec son code partenaire) : sa signature, sauf si le couple l'a masquée.
  const orga = evt.organisePar?.nom && !evt.organiseParMasque ? { nom: evt.organisePar.nom, site: /^https:\/\//.test(evt.organisePar.site || '') ? evt.organisePar.site : '' } : null;
  const lienMV = `https://maisonvivat.com/?utm_source=invitation${code ? '&partenaire=' + code : ''}`;
  document.querySelectorAll('.suite-pied small').forEach(s => s.innerHTML = `Faire-part <a href="${lienMV}">Maison Vivat</a>`
    + (orga ? `<br>Mariage organisé par ${orga.site ? `<a href="${esc(orga.site)}" target="_blank" rel="noopener">${esc(orga.nom)}</a>` : esc(orga.nom)}` : '')
    + (code ? `<br><a class="perso-parrainage" href="${lienMV}">Vous vous mariez aussi ? -10 % avec le code ${code}</a>` : ''));
  if (location.pathname.endsWith('site.html')) siteDuCouple(evt, P, esc, G);
  if (G) return;
  const bd = document.querySelector('.perso-bandeau') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'perso-bandeau' }));
  bd.textContent = evt.formule === 'essai' ? 'Aperçu de votre faire-part · visible par vous seuls tant que la formule n\'est pas validée' : 'Votre faire-part';
}

// Le site du mariage d'un vrai couple : la page « site » de sa collection, avec SES informations (Mon faire-part, cagnotte, réponses) ;
// tout ce qui n'existe que pour la démonstration est masqué (menu de la collection, hôtels, liste et formulaire fictifs).
function siteDuCouple(evt, P, esc, G) {
  const lien = G ? `../app/invite.html?e=${encodeURIComponent(E)}&g=${encodeURIComponent(G)}` : '';
  const montrer = (sel, oui) => document.querySelectorAll(sel).forEach(x => x.hidden = !oui);
  montrer('.suite-nav', false);
  // images d'autres collections (galeries de démonstration) : jamais sur le site d'un couple
  document.querySelectorAll('img[src^="../"]:not([src^="../_commun"])').forEach(i => (i.closest('figure, .galerie, li') || i).hidden = true);
  // Notre histoire
  const h = document.getElementById('histoire');
  if (h) { h.hidden = !P.histoire; const p = h.querySelector('p'); if (p && P.histoire) p.textContent = P.histoire; }
  // Hébergement : une adresse par ligne, « Nom — détail »
  const hb = document.getElementById('hebergement');
  if (hb) {
    const lignes = (P.hebergement || '').split('\n').map(l => l.trim()).filter(Boolean);
    hb.hidden = !lignes.length;
    const box = hb.querySelector('.hotels');
    if (box && lignes.length) box.innerHTML = lignes.map(l => { const [n, ...d] = l.split(/\s+[—–-]\s+/); return `<div class="hotel"><b>${esc(n)}</b>${d.length ? `<span>${esc(d.join(' — '))}</span>` : ''}</div>`; }).join('');
  }
  // Votre place : la table de l'invité est sur sa page personnelle
  document.querySelectorAll('a[href="plan-de-table.html"]').forEach(a => { const s = a.closest('section'); if (s) s.hidden = !(G && evt.tablesVisibles); a.href = lien + '#table'; a.textContent = 'Voir ma table'; });
  // Liste et cagnotte : la cagnotte du couple, sa liste sur la page de l'invité
  const c = document.getElementById('cadeaux'), cg = evt.cagnotte || {};
  if (c) {
    const aCagnotte = /^https:\/\//.test(cg.lien || '');
    c.hidden = !aCagnotte && !G;
    c.querySelectorAll('ul, [data-demo-cagnotte], .bouton, .note-cadeaux').forEach(x => x.remove());
    const p = c.querySelector('p'); if (p && cg.texte) p.textContent = cg.texte;
    if (aCagnotte) c.insertAdjacentHTML('beforeend', `<a class="bouton plein" href="${esc(cg.lien)}" target="_blank" rel="noopener">${esc(cg.libelle || 'Participer à la cagnotte')}</a>`);
    if (G) c.insertAdjacentHTML('beforeend', `<a class="bouton" href="${lien}#cadeaux">Voir la liste et réserver un cadeau</a>`);
  }
  // Votre réponse : sur la page personnelle de l'invité (le formulaire de la démonstration n'envoie rien)
  const r = document.getElementById('reponse');
  if (r) {
    r.querySelectorAll('form, #demo').forEach(x => x.remove());
    if (!r.querySelector('.repondre-site')) r.insertAdjacentHTML('beforeend', G
      ? `<a class="bouton plein repondre-site" href="${lien}">Répondre à l'invitation</a>`
      : `<p class="repondre-site">Vos invités répondent depuis leur lien personnel.</p>`);
  }
  // Sommaire : seulement les parties affichées
  document.querySelectorAll('.sommaire a[href^="#"]').forEach(a => { const s = document.querySelector(a.getAttribute('href')); a.hidden = !s || s.hidden; });
}
