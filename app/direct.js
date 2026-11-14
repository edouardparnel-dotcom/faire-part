// Direct filmé par les invités : le lecteur (page invité, régie) et le choix de la caméra.
// Chaque téléphone qui filme envoie un morceau de vidéo autonome toutes les 4 secondes (filmer.html) :
// events/{e}/cameras/{cam}/segments/{n} → Storage events/{e}/direct/{cam}/{n}.mp4. Le lecteur les joue à la suite,
// avec deux balises vidéo qui se relaient (la suivante se charge pendant que l'autre joue), environ 15 secondes après le direct.
// Sans personne qui filme, il rejoue tout depuis le début : la rediffusion.
import { db, storage } from './commun.js?v=4';
import { collection, doc, query, orderBy, limit, onSnapshot, getDocs } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { ref, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';

export const DUREE = 4;          // secondes par morceau
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
    <p class="direct-etat" style="position:absolute;left:10px;top:10px;margin:0;padding:4px 10px;border-radius:20px;background:rgba(0,0,0,.6);color:#fff;font:600 12px/1.4 system-ui,sans-serif"></p>
    ${muet ? '' : `<button type="button" class="direct-son" style="position:absolute;inset:0;margin:auto;width:max-content;height:max-content;padding:12px 20px;border:0;border-radius:30px;background:rgba(255,255,255,.92);font:600 15px system-ui,sans-serif;cursor:pointer">${t('Lancer le direct')}</button>`}
  </div>`;
  const [A, B] = conteneur.querySelectorAll('video'), etatEl = conteneur.querySelector('.direct-etat'), son = conteneur.querySelector('.direct-son');
  let devant = A, derriere = B, cameras = [], etat = {}, cam = null, depuis = 0, prochain = null, segs = [], arret = () => {}, mode = 'attente', fileRediff = [], pret = muet, rediffVue = false, chargeRediff = false;
  const afficher = x => { etatEl.textContent = x; };
  // L'affiche de l'invitation : première image qui existe, aux prénoms et à la date du couple
  const aff = conteneur.querySelector('.direct-affiche');
  if (aff) {
    aff.querySelector('p').textContent = affiche.titre || '';
    aff.querySelector('.direct-affiche-date').textContent = affiche.date || '';
    const essai = l => { if (!l.length) return; const i = new Image(); i.onload = () => { aff.style.backgroundImage = `url("${l[0]}")`; }; i.onerror = () => essai(l.slice(1)); i.src = l[0]; };
    essai(affiche.images || []);
  }
  const montrerAffiche = (oui, msg = '') => { if (!aff) return; aff.hidden = !oui; aff.querySelector('.direct-affiche-msg').textContent = msg; etatEl.hidden = oui; };
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
    if (mode === 'direct') { afficher(`● ${t('En direct')}${c?.nom ? ' · ' + c.nom : ''}`); if (!pret) montrerAffiche(true, '● ' + t('En direct')); }
  }

  // Rediffusion : tous les morceaux, dans l'ordre du temps ; à chaque instant la caméra la plus stable.
  async function rediffusion() {
    if (mode === 'rediffusion' || rediffVue || !cameras.length) return;
    mode = 'rediffusion'; rediffVue = true; chargeRediff = true;
    const tous = (await Promise.all(cameras.map(c => getDocs(query(collection(db, `events/${E}/cameras/${c.id}/segments`), orderBy('n')))
      .then(s => s.docs.map(d => ({ cam: c.id, ...d.data() })))))).flat().sort((a, b) => a.t - b.t);
    chargeRediff = false;
    if (mode !== 'rediffusion') return;   // une caméra a repris pendant le chargement : le direct passe avant
    fileRediff = [];
    for (const s of tous) {   // un morceau par tranche de 4 s : le plus stable de ceux qui se chevauchent
      const der = fileRediff.at(-1);
      if (der && s.t < der.t + DUREE * 1000 * 0.75) { if (s.stab > der.stab + 0.2) fileRediff[fileRediff.length - 1] = s; } else fileRediff.push(s);
    }
    if (!fileRediff.length) { mode = 'attente'; montrerAffiche(true, t('Le direct commencera bientôt')); return; }
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
    if (mode === 'rediffusion') return fileRediff.shift() || null;
    return null;
  }

  // Charger le morceau suivant dans la vidéo de derrière ; la passer devant quand celle de devant finit.
  let charge = null;
  async function preparer() {
    if (charge) return;
    const s = await suivant();
    if (!s) { setTimeout(preparer, 1000); return; }
    charge = s;
    derriere.src = await url(s.chemin);
    derriere.load();
  }
  async function permuter() {
    if (!charge) {
      await preparer();
      if (!charge) {
        // fin de la rediffusion : l'affiche revient, avec de quoi la revoir
        if (mode === 'rediffusion' && !chargeRediff && !fileRediff.length) { mode = 'attente'; finRediff(); return; }
        setTimeout(permuter, 500); return;
      }
    }
    [devant, derriere] = [derriere, devant];
    devant.style.visibility = 'visible'; derriere.style.visibility = 'hidden';
    if (devant.videoWidth) cadre.style.aspectRatio = `${devant.videoWidth}/${devant.videoHeight}`;
    charge = null;
    try { await devant.play(); montrerAffiche(false); } catch { if (son) son.hidden = false; }
    derriere.pause();
    preparer();
  }
  // Le cadre prend la forme de la vidéo (téléphone tenu en largeur ou en hauteur)
  const cadre = conteneur.querySelector('.direct-lecteur');
  A.onloadedmetadata = B.onloadedmetadata = e => { if (e.target === devant || !devant.videoWidth) { const v = e.target; if (v.videoWidth) cadre.style.aspectRatio = `${v.videoWidth}/${v.videoHeight}`; } };
  A.onended = B.onended = e => { if (e.target === devant) permuter(); };
  A.onerror = B.onerror = e => { if (e.target === devant) permuter(); else { charge = null; preparer(); } };
  function lancer() { pret = true; if (son) son.hidden = true; if (!devant.src || devant.ended) permuter(); }
  function finRediff() {
    devant.pause(); devant.style.visibility = 'hidden';
    montrerAffiche(true, t('Rediffusion terminée'));
    if (son) { son.textContent = t('Revoir la rediffusion'); son.hidden = false; son.onclick = () => { son.onclick = lancer; son.hidden = true; rediffVue = false; devant.removeAttribute('src'); rediffusion(); }; }
  }
  if (son) son.onclick = lancer;
  if (muet) setTimeout(lancer, 500);
  return { camera: () => cam };
}
