// Direct filmé par les invités : le lecteur (page invité, régie) et le choix de la caméra.
// Chaque téléphone qui filme envoie un morceau de vidéo autonome toutes les 4 secondes (filmer.html) :
// events/{e}/cameras/{cam}/segments/{n} → Storage events/{e}/direct/{cam}/{n}.mp4. Le lecteur les joue à la suite,
// avec deux balises vidéo qui se relaient (la suivante se charge pendant que l'autre joue), environ 15 secondes après le direct.
// Sans personne qui filme, il rejoue tout depuis le début : la rediffusion.
import { auth, db, storage } from './commun.js?v=4';
import { collection, doc, query, orderBy, limit, onSnapshot, getDocs, getDoc, writeBatch, serverTimestamp, increment } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { ref, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';

export const DUREE = 4;          // secondes par morceau
export const PLACES = 100, HEURES = 2;   // inclus : 100 connexions (appareils) et 2 heures de direct par mariage
const VIVANTE = 20e3;            // une caméra qui n'a rien envoyé depuis 20 s n'est plus en direct
const RETARD = 2;                // on démarre deux morceaux avant le dernier reçu : de la marge si le réseau hésite

const ms = t => t?.toMillis ? t.toMillis() : t || 0;
export const enDirect = c => c && Date.now() - ms(c.dernier) < VIVANTE;
// Note d'une caméra : stabilité de l'image (capteur de mouvement du téléphone) et régularité de ses envois.
export const note = c => 0.6 * (c.stab ?? 0.5) + 0.4 * (c.reseau ?? 0.5);

// Caméra à montrer : celle de la régie en mode manuel (si elle filme), sinon la mieux notée.
// On ne change en automatique que si une autre est nettement meilleure, et pas plus d'une fois toutes les 20 secondes.
export function choisir(cameras, etat, actuelle, depuis) {
  const vivantes = cameras.filter(enDirect);
  if (!vivantes.length) return null;
  if (etat?.mode === 'manuel') { const c = vivantes.find(x => x.id === etat.antenne); if (c) return c.id; }
  const meilleure = vivantes.reduce((a, b) => (note(b) > note(a) ? b : a));
  const cour = vivantes.find(x => x.id === actuelle);
  if (cour && (Date.now() - depuis < 20e3 || note(meilleure) - note(cour) < 0.15)) return cour.id;
  return meilleure.id;
}

const urls = new Map();
const url = chemin => urls.get(chemin) || urls.set(chemin, getDownloadURL(ref(storage, chemin))).get(chemin);

const BTN = 'border:0;border-radius:16px;padding:6px 10px;background:rgba(255,255,255,.2);color:#fff;font:600 13px system-ui,sans-serif;cursor:pointer';

// Lecteur : conteneur → deux vidéos qui se relaient, un bandeau d'état, un bouton son.
// affiche : { images: [chemins à essayer dans l'ordre], titre, date } = l'invitation du mariage, montrée tant que rien ne joue.
export function lecteur(conteneur, E, { muet = false, camFixe = null, t = x => x, affiche = null } = {}) {
  conteneur.innerHTML = `<div class="direct-lecteur" style="position:relative;background:#000;aspect-ratio:9/16;max-height:70vh;margin:auto;border-radius:10px;overflow:hidden">
    <video playsinline ${muet ? 'muted' : ''} style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain"></video>
    <video playsinline ${muet ? 'muted' : ''} style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;visibility:hidden"></video>
    ${affiche ? `<div class="direct-affiche" style="position:absolute;inset:0;background:#1e1b18 center/cover no-repeat;display:flex;flex-direction:column;justify-content:flex-end;text-align:center;color:#fff;padding:24px 16px 70px">
      <div style="position:absolute;inset:0;background:linear-gradient(transparent 40%,rgba(0,0,0,.75))"></div>
      <p style="position:relative;margin:0;font:500 30px/1.15 'Cormorant Garamond',Georgia,serif"></p>
      <p class="direct-affiche-date" style="position:relative;margin:6px 0 0;font:400 14px system-ui,sans-serif;opacity:.9"></p>
      <p class="direct-affiche-msg" style="position:relative;margin:10px 0 0;font:600 13px system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase"></p></div>` : ''}
    <p class="direct-st" style="position:absolute;left:8%;right:8%;bottom:58px;margin:0;text-align:center;pointer-events:none;display:none"><span style="background:rgba(0,0,0,.72);color:#fff;font:500 15px/1.45 system-ui,sans-serif;padding:3px 8px;border-radius:4px;box-decoration-break:clone;-webkit-box-decoration-break:clone"></span></p>
    <p class="direct-etat" style="position:absolute;left:10px;top:10px;margin:0;padding:4px 10px;border-radius:20px;background:rgba(0,0,0,.6);color:#fff;font:600 12px/1.4 system-ui,sans-serif"></p>
    ${muet ? '' : `<div class="direct-cmd" style="position:absolute;left:0;right:0;bottom:0;display:none;gap:6px;align-items:center;padding:16px 10px 8px;background:linear-gradient(transparent,rgba(0,0,0,.75));color:#fff;font:600 12px system-ui,sans-serif">
      <button type="button" data-c="-10" class="rd" title="${t('Reculer de 10 secondes')}" style="${BTN}">−10</button><button type="button" data-c="pp" class="rd" title="${t('Lecture ou pause')}" style="${BTN}">❚❚</button><button type="button" data-c="10" class="rd" title="${t('Avancer de 10 secondes')}" style="${BTN}">+10</button>
      <input type="range" data-c="pos" class="rd" min="0" max="1" step="0.5" value="0" style="flex:1;min-width:40px;accent-color:#fff">
      <span class="rd direct-temps" style="white-space:nowrap">0:00</span>
      <button type="button" data-c="st" title="${t('Sous-titres')}" style="${BTN};margin-left:auto">CC</button><button type="button" data-c="son" title="${t('Couper ou remettre le son')}" style="${BTN}">🔊</button></div>`}
    ${muet ? '' : `<button type="button" class="direct-son" style="position:absolute;inset:0;margin:auto;width:max-content;height:max-content;padding:12px 20px;border:0;border-radius:30px;background:rgba(255,255,255,.92);font:600 15px system-ui,sans-serif;cursor:pointer">${t('Lancer le direct')}</button>`}
  </div>`;
  const [A, B] = conteneur.querySelectorAll('video'), etatEl = conteneur.querySelector('.direct-etat'), son = conteneur.querySelector('.direct-son'), cmd = conteneur.querySelector('.direct-cmd');
  let devant = A, derriere = B, cameras = [], etat = {}, cam = null, depuis = 0, prochain = null, segs = [], arret = () => {}, mode = 'attente', pret = muet, rediffVue = false, chargeRediff = false;
  // Rediffusion : la liste complète, le rang du prochain morceau à charger, le début de chaque morceau (secondes) et la durée totale
  let rediff = [], kSuivant = 0, debuts = [], total = 0, enCours = null, gen = 0;
  // Sous-titres : le texte transcrit du morceau qui joue (champ st, ajouté par le serveur quelques secondes après l'envoi)
  const stEl = conteneur.querySelector('.direct-st');
  let stOn = !muet;
  try { if (localStorage.getItem('mv-st') === '0') stOn = false; } catch {}
  function sousTitre() {
    if (!stEl) return;
    const s = enCours && (segs.find(x => x.n === enCours.n && x.chemin === enCours.chemin) || enCours);
    const txt = stOn && s?.st && devant.style.visibility !== 'hidden' ? s.st : '';
    stEl.style.display = txt ? '' : 'none';
    stEl.firstElementChild.textContent = txt;
  }
  const afficher = x => { etatEl.textContent = x; };
  // L'affiche de l'invitation : première image qui existe, aux prénoms et à la date du couple
  const aff = conteneur.querySelector('.direct-affiche');
  if (aff) {
    aff.querySelector('p').textContent = affiche.titre || '';
    aff.querySelector('.direct-affiche-date').textContent = affiche.date || '';
    const essai = l => { if (!l.length) return; const i = new Image(); i.onload = () => { aff.style.backgroundImage = `url("${l[0]}")`; }; i.onerror = () => essai(l.slice(1)); i.src = l[0]; };
    essai(affiche.images || []);
  }
  const montrerAffiche = (oui, msg = '') => { if (!aff) return; aff.style.display = oui ? 'flex' : 'none'; aff.querySelector('.direct-affiche-msg').textContent = msg; etatEl.hidden = oui; };
  montrerAffiche(true, t('Le direct commencera bientôt'));

  onSnapshot(collection(db, `events/${E}/cameras`), s => { cameras = s.docs.map(d => ({ id: d.id, ...d.data() })); regler(); }, () => afficher(t('Direct indisponible')));
  if (!camFixe) onSnapshot(doc(db, `events/${E}/direct/etat`), s => { etat = s.data() || {}; regler(); }, () => {});
  setInterval(regler, 5000);

  // Quelle caméra suivre ; on s'abonne à ses derniers morceaux.
  function regler() {
    const choix = camFixe ? (enDirect(cameras.find(c => c.id === camFixe)) ? camFixe : null) : choisir(cameras, etat, cam, depuis);
    if (choix && choix !== cam) {
      cam = choix; depuis = Date.now(); arret();
      arret = onSnapshot(query(collection(db, `events/${E}/cameras/${cam}/segments`), orderBy('n', 'desc'), limit(8)), s => {
        segs = s.docs.map(d => d.data()).sort((a, b) => a.n - b.n);
        if (!segs.length) return;
        if (prochain === null || prochain > segs.at(-1).n + 1 || prochain < segs[0].n) prochain = segs.length > RETARD ? segs.at(-1 - RETARD).n : segs[0]?.n ?? null;
        if (mode !== 'direct') { mode = 'direct'; if (pret) lancer(); }
      });
    }
    if (!choix && mode === 'direct' && !cameras.some(enDirect)) { mode = 'attente'; cam = null; prochain = null; arret(); rediffVue = false; setTimeout(() => { if (!cameras.some(enDirect)) rediffusion(); }, 6000); }
    if (!choix && mode === 'attente' && !rediffVue) rediffusion();
    const c = cameras.find(x => x.id === cam);
    if (mode === 'direct') { if (cmd && cmd.style.display === 'flex') commandes(); afficher(`● ${t('En direct')}${c?.nom ? ' · ' + c.nom : ''}`); if (!pret) montrerAffiche(true, '● ' + t('En direct')); }
  }

  // Rediffusion : tous les morceaux, dans l'ordre du temps ; à chaque instant la caméra la plus stable.
  async function rediffusion() {
    if (mode === 'rediffusion' || rediffVue || !cameras.length) return;
    mode = 'rediffusion'; rediffVue = true; chargeRediff = true;
    const tous = (await Promise.all(cameras.map(c => getDocs(query(collection(db, `events/${E}/cameras/${c.id}/segments`), orderBy('n')))
      .then(s => s.docs.map(d => ({ cam: c.id, ...d.data() })))))).flat().sort((a, b) => a.t - b.t);
    chargeRediff = false;
    if (mode !== 'rediffusion') return;   // une caméra a repris pendant le chargement : le direct passe avant
    rediff = [];
    for (const s of tous) {   // un morceau par tranche de 4 s : le plus stable de ceux qui se chevauchent
      const der = rediff.at(-1);
      if (der && s.t < der.t + DUREE * 1000 * 0.75) { if (s.stab > der.stab + 0.2) rediff[rediff.length - 1] = s; } else rediff.push(s);
    }
    rediff.forEach((s, k) => { s.k = k; });
    debuts = []; total = 0; for (const s of rediff) { debuts.push(total); total += s.d || DUREE; }
    kSuivant = 0;
    if (cmd) { const pos = cmd.querySelector('[data-c=pos]'); pos.max = Math.max(1, total); pos.value = 0; }
    if (!rediff.length) { mode = 'attente'; montrerAffiche(true, t('Le direct commencera bientôt')); return; }
    afficher(t('Rediffusion'));
    montrerAffiche(!pret, t('Rediffusion'));
    if (pret) lancer();
  }

  async function suivant() {
    if (mode === 'direct') {
      // un trou (nouvelle prise, morceau perdu) : on passe au morceau suivant disponible
      const s = segs.find(x => x.n === prochain) || segs.find(x => x.n > prochain + 1);
      if (!s) return null;
      prochain = s.n + 1;
      return s;
    }
    if (mode === 'rediffusion') return kSuivant < rediff.length ? rediff[kSuivant++] : null;
    return null;
  }

  // Charger le morceau suivant dans la vidéo de derrière ; la passer devant quand celle de devant finit.
  let charge = null;
  async function preparer() {
    if (charge) return;
    const g = gen, s = await suivant();
    if (!s) { setTimeout(() => g === gen && preparer(), 1000); return; }
    const u = await url(s.chemin);
    if (g !== gen) return;   // on a sauté ailleurs entre-temps
    charge = s;
    derriere.src = u;
    derriere.load();
  }
  async function permuter() {
    if (!charge) {
      await preparer();
      if (!charge) {
        // fin de la rediffusion : l'affiche revient, avec de quoi la revoir
        if (mode === 'rediffusion' && !chargeRediff && kSuivant >= rediff.length) { mode = 'attente'; finRediff(); return; }
        setTimeout(permuter, 500); return;
      }
    }
    [devant, derriere] = [derriere, devant];
    devant.style.visibility = 'visible'; derriere.style.visibility = 'hidden';
    if (devant.videoWidth) cadre.style.aspectRatio = `${devant.videoWidth}/${devant.videoHeight}`;
    enCours = charge; charge = null;
    try { await devant.play(); montrerAffiche(false); commandes(); } catch { if (son) son.hidden = false; }
    derriere.pause();
    preparer();
  }
  // Le cadre prend la forme de la vidéo (téléphone tenu en largeur ou en hauteur)
  const cadre = conteneur.querySelector('.direct-lecteur');
  A.onloadedmetadata = B.onloadedmetadata = e => { if (e.target === devant || !devant.videoWidth) { const v = e.target; if (v.videoWidth) cadre.style.aspectRatio = `${v.videoWidth}/${v.videoHeight}`; } };
  A.onended = B.onended = e => { if (e.target === devant) permuter(); };
  A.onerror = B.onerror = e => { if (e.target === devant) permuter(); else { charge = null; preparer(); } };
  // Commandes : visibles quand une vidéo joue ; lecture, avance, recul et position seulement en rediffusion
  const mmss = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
  function commandes() {
    if (!cmd) return;
    cmd.style.display = 'flex';
    cmd.querySelectorAll('.rd').forEach(el => { el.style.display = mode === 'rediffusion' ? '' : 'none'; });
    cmd.querySelector('[data-c=pp]').textContent = devant.paused ? '▶' : '❚❚';
    cmd.querySelector('[data-c=son]').textContent = A.muted ? '🔇' : '🔊';
    cmd.querySelector('[data-c=st]').style.opacity = stOn ? '1' : '.45';
  }
  function temps() {
    if (!cmd || mode !== 'rediffusion' || enCours?.k === undefined) return;
    const x = debuts[enCours.k] + devant.currentTime, pos = cmd.querySelector('[data-c=pos]');
    if (document.activeElement !== pos) pos.value = x;
    cmd.querySelector('.direct-temps').textContent = `${mmss(x)} / ${mmss(total)}`;
  }
  A.ontimeupdate = B.ontimeupdate = e => { if (e.target === devant) { temps(); sousTitre(); } };
  A.onplay = B.onplay = A.onpause = B.onpause = e => { if (e.target === devant) commandes(); };
  // Aller à un instant de la rediffusion : le bon morceau directement devant, au bon endroit, puis la suite derrière
  async function aller(x) {
    if (mode !== 'rediffusion' || !rediff.length) return;
    x = Math.max(0, Math.min(total - 0.5, x));
    let k = debuts.findIndex((d, i) => x < d + (rediff[i].d || DUREE)); if (k < 0) k = rediff.length - 1;
    gen++; charge = null; kSuivant = k + 1; enCours = rediff[k];
    const enPause = devant.paused, v = devant;
    v.src = await url(rediff[k].chemin);
    v.addEventListener('loadedmetadata', () => { v.currentTime = x - debuts[k]; if (!enPause) v.play().catch(() => {}); temps(); }, { once: true });
    preparer();
  }
  if (cmd) cmd.addEventListener('click', e => {
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (c === 'son') { A.muted = B.muted = !A.muted; commandes(); }
    if (c === 'st') { stOn = !stOn; try { localStorage.setItem('mv-st', stOn ? '1' : '0'); } catch {} commandes(); sousTitre(); }
    if (c === 'pp') { if (devant.paused) devant.play().catch(() => {}); else devant.pause(); }
    if (c === '-10' || c === '10') aller(debuts[enCours?.k ?? 0] + devant.currentTime + Number(c));
  });
  if (cmd) cmd.querySelector('[data-c=pos]').addEventListener('change', e => aller(Number(e.target.value)));

  // Une place parmi les 100 : réservée une fois par appareil, au premier lancement (la régie, muette, ne compte pas)
  let place = muet;
  async function reserver() {
    const uid = auth.currentUser?.uid; if (!uid) return false;
    const mienne = doc(db, `events/${E}/spectateurs/${uid}`);
    if ((await getDoc(mienne).catch(() => null))?.exists()) return true;
    const lot = writeBatch(db);
    lot.set(mienne, { le: serverTimestamp() });
    lot.set(doc(db, `events/${E}/direct/stats`), { spectateurs: increment(1) }, { merge: true });
    return lot.commit().then(() => true, () => false);
  }

  async function lancer() {
    if (!place) {
      if (son) son.disabled = true;
      place = await reserver();
      if (son) son.disabled = false;
      if (!place) { montrerAffiche(true, t('Le direct a atteint ses 100 connexions')); if (son) son.hidden = true; return; }
    }
    pret = true; if (son) son.hidden = true; if (!devant.src || devant.ended) permuter(); }
  function finRediff() {
    devant.pause(); devant.style.visibility = 'hidden';
    if (cmd) cmd.style.display = 'none';
    if (stEl) stEl.style.display = 'none';
    montrerAffiche(true, t('Rediffusion terminée'));
    if (son) { son.textContent = t('Revoir la rediffusion'); son.hidden = false; son.onclick = () => { son.onclick = lancer; son.hidden = true; rediffVue = false; devant.removeAttribute('src'); rediffusion(); }; }
  }
  if (son) son.onclick = lancer;
  if (muet) setTimeout(lancer, 500);
  return { camera: () => cam };
}
