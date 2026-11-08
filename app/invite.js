// Page personnelle d'un invité (lien invite.html?e=<événement>&g=<jeton>) : ses cérémonies et ses réponses,
// puis selon les options payées : pass d'entrée QR, infos de voyage, direct, mur photo, livre d'or.
import { auth, db, storage, $, esc, dateLongue, heure, majuscule, LOCAL, PRET, bandeau } from './commun.js';
import { signInAnonymously, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';

if (LOCAL) bandeau('Mode local · émulateurs Firebase, données de test');
const vue = $('#vue'), p = new URLSearchParams(location.search), E = p.get('e'), T = p.get('g');
let evt, inv, live = '', photos = [], mots = [];
const a = o => evt?.options?.includes(o);

if (!PRET) vue.innerHTML = '<p class="app-note">Le serveur n\'est pas encore branché pour la version en ligne.</p>';
else if (!E || !T) vue.innerHTML = '<p class="app-note">Ce lien d\'invitation est incomplet. Ouvrez le lien reçu en entier.</p>';
else demarrer().catch(() => vue.innerHTML = '<p class="app-note">Cette invitation est introuvable. Vérifiez le lien reçu.</p>');

// Connexion anonyme, puis rattachement du téléphone à la fiche de l'invité (une fois pour toutes).
async function rattacher() {
  const u = auth.currentUser || (await signInAnonymously(auth)).user;
  const m = doc(db, `events/${E}/membres/${u.uid}`), s = await getDoc(m);
  if (!s.exists()) return setDoc(m, { token: T });
  if (s.data().token !== T) { await signOut(auth); await signInAnonymously(auth); return rattacher(); }   // téléphone déjà relié à une autre invitation
}

async function demarrer() {
  await new Promise(r => { const f = onAuthStateChanged(auth, () => { f(); r(); }); });
  await rattacher();
  evt = (await getDoc(doc(db, 'events', E))).data();
  onSnapshot(doc(db, `events/${E}/invites/${T}`), s => { inv = s.data(); rendre(); });
  if (a('direct')) live = (await getDoc(doc(db, `events/${E}/prive/config`))).data()?.live || '';
  if (a('murphoto')) onSnapshot(query(collection(db, `events/${E}/photos`), where('visible', '==', true)), s => { photos = s.docs.map(d => d.data()).sort((x, y) => (y.creeLe?.seconds || 0) - (x.creeLe?.seconds || 0)); rendreGalerie(); });
  if (a('livredor')) onSnapshot(query(collection(db, `events/${E}/livre`), where('visible', '==', true)), s => { mots = s.docs.map(d => d.data()).sort((x, y) => (y.creeLe?.seconds || 0) - (x.creeLe?.seconds || 0)); rendreMots(); });
}

const lienPerso = () => new URL(`invite.html?e=${encodeURIComponent(E)}&g=${encodeURIComponent(T)}`, location.href).href;
const embed = u => { const m = u.match(/(?:youtu\.be\/|v=|embed\/|live\/)([\w-]{11})/); return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : u; };

function rendre() {
  if (!inv || !evt) return;
  if (document.activeElement?.closest('#f-reponse, #f-voyage, #f-mot')) return;   // ne pas effacer une saisie en cours
  const mesC = (evt.ceremonies || []).filter(c => inv.ceremonies?.includes(c.cle));
  const prenom = inv.nom.split(' ')[0];
  vue.innerHTML = `<div style="text-align:center;margin:20px 0 30px"><span class="etq">Votre invitation</span><h1 class="serif">${esc(evt.titre)}</h1>
      <p class="app-note">${esc(majuscule(dateLongue(evt.date)))}</p>
      ${evt.modele ? `<a class="btn clair" style="margin-top:18px" href="../${esc(evt.modele)}/index.html">Ouvrir le faire-part</a>` : ''}</div>
    <form class="app-carte" id="f-reponse"><h2>Bonjour ${esc(prenom)}</h2><p class="app-note">${mesC.length > 1 ? 'Vous êtes invité(e) aux moments suivants. Merci de répondre pour chacun.' : 'Merci de nous dire si vous serez présent(e).'}</p>
      ${mesC.map(c => `<div class="ceremonie"><div><h3>${esc(c.nom)}</h3><p>${esc(majuscule(dateLongue(c.date)))} à ${heure(c.date)}<br>${esc(c.lieu)} · <a class="lien-or" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.lieu)}">plan</a></p></div>
        <div class="choix-rep" data-cer="${esc(c.cle)}"><button type="button" data-r="oui" class="${inv.reponses?.[c.cle] === 'oui' ? 'choisi' : ''}">Je serai là</button><button type="button" data-r="non" class="${inv.reponses?.[c.cle] === 'non' ? 'choisi' : ''}">Je ne pourrai pas</button></div></div>`).join('')}
      <div class="app-grille" style="margin-top:16px">
        ${inv.max ? `<label>Accompagnants<select name="accompagnants">${Array.from({ length: inv.max + 1 }, (_, k) => `<option ${k === (inv.accompagnants || 0) ? 'selected' : ''}>${k}</option>`).join('')}</select></label>` : ''}
        <label>Régime, allergies<input name="regime" maxlength="120" value="${esc(inv.regime || '')}"></label></div>
      <label>Un mot pour les mariés<textarea name="message" rows="2" maxlength="500">${esc(inv.message || '')}</textarea></label>
      <button class="btn" style="margin-top:14px">Envoyer ma réponse</button><p class="ok-msg" id="m-rep">${inv.reponduLe ? 'Réponse bien reçue, merci. Vous pouvez la modifier à tout moment.' : ''}</p></form>
    ${a('etranger') ? `<form class="app-carte" id="f-voyage"><h2>Vous venez de loin ?</h2><p class="app-note" style="margin-bottom:12px">Dites-nous quand vous arrivez : nous organisons l'accueil, les navettes et, si besoin, la lettre d'invitation pour le visa.</p>
      <div class="app-grille"><label>Date d'arrivée<input name="date" type="date" value="${esc(inv.arrivee?.date || '')}"></label><label>Vol ou train<input name="vol" maxlength="40" value="${esc(inv.arrivee?.vol || '')}"></label></div>
      <div class="coches"><label><input type="checkbox" name="hebergement" ${inv.arrivee?.hebergement ? 'checked' : ''}>J'ai besoin d'un hébergement</label><label><input type="checkbox" name="visa" ${inv.arrivee?.visa ? 'checked' : ''}>J'ai besoin d'une lettre pour le visa</label></div>
      <button class="btn clair">Enregistrer</button><p class="ok-msg" id="m-voyage"></p></form>` : ''}
    ${a('qr') ? `<div class="app-carte qr"><h2>Votre pass d'entrée</h2><div id="qr"></div><p class="app-note">Présentez ce code à l'entrée. Il est personnel${inv.max ? ` et vaut pour vous et ${inv.max} accompagnant${inv.max > 1 ? 's' : ''}` : ''}.</p>${inv.entree ? `<p class="ok-msg">Entrée validée à ${heure(inv.entree.toDate())}. Bonne fête !</p>` : ''}</div>` : ''}
    ${a('direct') && live ? `<div class="app-carte"><h2>Le direct</h2><p class="app-note" style="margin-bottom:12px">Vous ne pouvez pas venir ? Suivez la cérémonie ici, en direct.</p><div class="video"><iframe src="${esc(embed(live))}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Direct"></iframe></div></div>` : ''}
    ${a('murphoto') ? `<div class="app-carte"><h2>Le mur photo</h2><p class="app-note" style="margin-bottom:12px">Partagez vos photos de la fête : elles s'affichent sur le mur.</p>
      <label class="btn clair" style="display:inline-block;cursor:pointer">Ajouter des photos<input type="file" accept="image/*" multiple id="i-photo" hidden></label><p class="ok-msg" id="m-photo"></p><div class="galerie" id="galerie" style="margin-top:14px"></div></div>` : ''}
    ${a('livredor') ? `<form class="app-carte" id="f-mot"><h2>Le livre d'or</h2><label>Votre prénom<input name="de" maxlength="60" required value="${esc(prenom)}"></label>
      <label style="margin-top:10px">Votre message<textarea name="texte" rows="3" maxlength="1000" required></textarea></label><button class="btn clair" style="margin-top:12px">Signer le livre d'or</button><div id="mots" style="margin-top:14px"></div></form>` : ''}`;
  // Le pass contient le lien personnel : l'appareil photo de n'importe quel téléphone l'ouvre, et le scanner de l'entrée le reconnaît.
  if (a('qr') && window.qrcode) { const q = qrcode(0, 'M'); q.addData(lienPerso()); q.make(); $('#qr').innerHTML = q.createImgTag(5, 8, "Pass d'entrée"); }
  else if (a('qr')) $('#qr').innerHTML = '<p class="app-erreur">Le pass n\'a pas pu s\'afficher. Rechargez la page.</p>';
  rendreGalerie(); rendreMots();
}
function rendreGalerie() { const g = $('#galerie'); if (g) g.innerHTML = photos.map(x => `<figure><img src="${esc(x.url)}" alt="" loading="lazy"><figcaption>${esc(x.auteur)}</figcaption></figure>`).join(''); }
function rendreMots() { const m = $('#mots'); if (m) m.innerHTML = mots.map(x => `<div class="mot"><p>« ${esc(x.texte)} »</p><span>${esc(x.de)}</span></div>`).join(''); }

// Réduit une photo à 1600 px de côté avant l'envoi (moins de données pour les invités en 4G).
async function reduire(fichier) {
  const img = await createImageBitmap(fichier), k = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
}

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-r]'); if (!b) return;
  b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('choisi', x === b));
});
document.addEventListener('submit', async ev => {
  ev.preventDefault(); const f = new FormData(ev.target);
  if (ev.target.id === 'f-reponse') {
    const reponses = { ...(inv.reponses || {}) };
    ev.target.querySelectorAll('[data-cer]').forEach(g => { const c = g.querySelector('.choisi'); if (c) reponses[g.dataset.cer] = c.dataset.r; });
    const maj = { reponses, regime: f.get('regime') || '', message: f.get('message') || '', reponduLe: serverTimestamp() };
    if (f.has('accompagnants')) maj.accompagnants = +f.get('accompagnants');
    document.activeElement?.blur();
    await updateDoc(doc(db, `events/${E}/invites/${T}`), maj);
  }
  if (ev.target.id === 'f-voyage') {
    document.activeElement?.blur();
    await updateDoc(doc(db, `events/${E}/invites/${T}`), { arrivee: { date: f.get('date') || '', vol: f.get('vol') || '', hebergement: f.has('hebergement'), visa: f.has('visa') } });
    $('#m-voyage') && ($('#m-voyage').textContent = 'Enregistré, merci.');
  }
  if (ev.target.id === 'f-mot') {
    await addDoc(collection(db, `events/${E}/livre`), { token: T, de: f.get('de'), texte: f.get('texte'), creeLe: serverTimestamp(), visible: true });
    ev.target.texte.value = ''; document.activeElement?.blur();
  }
});
document.addEventListener('change', async ev => {
  if (ev.target.id !== 'i-photo') return;
  const fichiers = [...ev.target.files], msg = $('#m-photo'), uid = auth.currentUser.uid;
  for (const [k, fi] of fichiers.entries()) {
    msg.textContent = `Envoi ${k + 1} sur ${fichiers.length}…`;
    const chemin = `events/${E}/photos/${uid}/${Date.now()}-${k}.jpg`, r = ref(storage, chemin);
    await uploadBytes(r, await reduire(fi), { contentType: 'image/jpeg' });
    await addDoc(collection(db, `events/${E}/photos`), { token: T, auteur: inv.nom.split(' ')[0], chemin, url: await getDownloadURL(r), creeLe: serverTimestamp(), visible: true });
  }
  msg.textContent = fichiers.length > 1 ? 'Photos partagées, merci !' : 'Photo partagée, merci !';
  ev.target.value = '';
});
