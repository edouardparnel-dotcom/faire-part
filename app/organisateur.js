// Espace de l'organisateur : ses événements, ses invités (par cérémonie), les réponses en direct,
// les entrées, la modération des photos et du livre d'or, le lien du direct.
import { auth, db, storage, $, esc, dateLongue, heure, majuscule, jeton, NOMS_OPTIONS, LOCAL, bandeau, exigerOrganisateur, deconnecter } from './commun.js';
import { collection, doc, query, where, getDocs, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { ref, deleteObject } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';

if (LOCAL) bandeau('Mode local · émulateurs Firebase, données de test');
const vue = $('#vue');
const TYPES = { mariage: 'Mariage', anniversaire: 'Anniversaire', bapteme: 'Baptême', gender: 'Gender reveal' };
let user, E = null, evt = null, invites = [], photos = [], livre = [], onglet = 'invites', abonnements = [];

// Le lien partagé ouvre le faire-part personnel (fp.html) ; son bouton « Répondre » mène à la page invité.
const lienInvite = t => new URL(`fp.html?e=${encodeURIComponent(E)}&g=${encodeURIComponent(t)}`, location.href).href;
const a = o => evt?.options?.includes(o);

exigerOrganisateur(vue, u => {
  user = u; $('#b-sortir').hidden = false;
  const id = new URLSearchParams(location.search).get('e');
  id ? ouvrir(id) : liste();
});
$('#b-sortir').addEventListener('click', ev => { ev.preventDefault(); deconnecter(); location.href = 'organisateur.html'; });

// ── Liste des événements et création ────────────────────────────────────────
async function liste() {
  abonnements.forEach(f => f()); abonnements = []; E = null;
  const snap = await getDocs(query(collection(db, 'events'), where('owner', '==', user.uid)));
  vue.innerHTML = `<div class="app-haut"><div><span class="etq">Bonjour</span><h1 class="serif">Vos événements</h1></div></div>
    ${snap.docs.map(d => `<a class="app-carte" style="display:block;text-decoration:none" href="?e=${d.id}"><span class="etq">${esc(TYPES[d.data().type])} · formule ${esc(d.data().formule)}</span>
      <h2 style="margin-top:6px">${esc(d.data().titre)}</h2><p class="app-note">${esc(majuscule(dateLongue(d.data().date)))}</p></a>`).join('') || '<p class="app-note">Aucun événement pour l\'instant.</p>'}
    <form class="app-carte" id="f-evt"><h2>Créer un événement</h2>
      <div class="app-grille">
        <label>Type<select name="type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
        <label>Prénoms ou titre<input name="titre" required maxlength="120" placeholder="Awa et Thomas"></label>
        <label>Date et heure<input name="date" type="datetime-local" required></label>
        <label>Lieu<input name="lieu" required placeholder="Domaine des Tilleuls"></label>
      </div><button class="btn">Créer</button></form>`;
  $('#f-evt').addEventListener('submit', async ev => {
    ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target));
    const r = await addDoc(collection(db, 'events'), { owner: user.uid, type: f.type, titre: f.titre, date: f.date, lieu: f.lieu, modele: '',
      formule: 'essai', options: [], ceremonies: [{ cle: 'principale', nom: f.type === 'mariage' ? 'Cérémonie' : 'La fête', date: f.date, lieu: f.lieu }], creeLe: serverTimestamp() });
    location.href = `?e=${r.id}`;
  });
}

// ── Un événement : abonnements en direct ────────────────────────────────────
function ouvrir(id) {
  E = id;
  abonnements.push(onSnapshot(doc(db, 'events', E), s => { evt = s.data(); if (!evt || evt.owner !== user.uid) { vue.innerHTML = '<p class="app-note">Événement introuvable.</p>'; return; } rendre(); }));
  abonnements.push(onSnapshot(collection(db, `events/${E}/invites`), s => { invites = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => x.nom.localeCompare(y.nom)); rendre(); }));
  abonnements.push(onSnapshot(collection(db, `events/${E}/photos`), s => { photos = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => (y.creeLe?.seconds || 0) - (x.creeLe?.seconds || 0)); rendre(); }));
  abonnements.push(onSnapshot(collection(db, `events/${E}/livre`), s => { livre = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => (y.creeLe?.seconds || 0) - (x.creeLe?.seconds || 0)); rendre(); }));
}

function rendre() {
  if (!evt) return;
  const garde = document.activeElement?.closest('form')?.id;   // ne pas effacer un formulaire en cours de saisie
  if (garde && ['f-invite', 'f-cer', 'f-reglages'].includes(garde) && document.activeElement.value) return;
  const C = evt.ceremonies || [], oui = c => invites.filter(i => i.reponses?.[c.cle] === 'oui').reduce((s, i) => s + 1 + (i.accompagnants || 0), 0);
  const entrees = invites.filter(i => i.entree).length, repondu = invites.filter(i => i.reponduLe).length;
  const onglets = { invites: 'Invités', ceremonies: C.length > 1 ? 'Cérémonies' : 'Programme', souvenirs: "Photos et livre d'or", reglages: 'Réglages' };
  vue.innerHTML = `<div class="app-haut"><div><a class="app-note" href="organisateur.html">← Vos événements</a>
      <span class="etq" style="display:block;margin-top:12px">${esc(TYPES[evt.type])} · formule ${esc(evt.formule)}</span><h1 class="serif">${esc(evt.titre)}</h1>
      <p class="app-note">${esc(majuscule(dateLongue(evt.date)))} · ${esc(evt.lieu)}</p></div>
    <div class="puces"><a class="btn petit" href="editeur.html?e=${E}">Personnaliser le faire-part</a>${a('qr') ? `<a class="btn petit clair" href="entree.html?e=${E}">Contrôle d'entrée</a>` : ''}${a('murphoto') ? `<a class="btn petit clair" href="mur.html?e=${E}" target="_blank">Mur photo</a>` : ''}</div></div>
    <div class="app-carte"><span class="etq">Vos options</span><div class="puces" style="margin-top:10px">${Object.entries(NOMS_OPTIONS).map(([k, v]) => `<span class="puce-o ${a(k) ? '' : 'off'}">${esc(v)}</span>`).join('')}</div>
      ${evt.formule === 'essai' ? `<p class="app-note" style="margin-top:12px">Formule d'essai : les options s'activent après le paiement. <a class="lien-or" href="../creer/?evt=${evt.type}">Choisir ma formule</a></p>` : ''}</div>
    <div class="app-grille">
      <div class="app-stat"><b>${invites.length}</b><span>Invitations</span></div>
      <div class="app-stat"><b>${repondu}</b><span>Ont répondu</span></div>
      ${C.map(c => `<div class="app-stat"><b>${oui(c)}</b><span>${esc(c.nom)} : présents</span></div>`).join('')}
      ${a('qr') ? `<div class="app-stat"><b>${entrees}</b><span>Entrées validées</span></div>` : ''}
    </div>
    <div class="app-onglets">${Object.entries(onglets).map(([k, v]) => `<button data-onglet="${k}" class="${k === onglet ? 'actif' : ''}">${v}</button>`).join('')}</div>
    <div id="contenu">${VUES[onglet]()}</div>`;
}

const rep = (i, c) => { const r = i.reponses?.[c.cle]; return !i.ceremonies?.includes(c.cle) ? '' : r === 'oui' ? '<span class="ok">Oui</span>' : r === 'non' ? '<span class="non">Non</span>' : '<span class="attente">…</span>'; };
const VUES = {
  invites() {
    const C = evt.ceremonies || [];
    return `<form class="app-carte" id="f-invite"><h2>Ajouter un invité</h2>
      <div class="form-ligne"><label>Nom<input name="nom" required maxlength="80"></label><label>Accompagnants autorisés<input name="max" type="number" min="0" max="10" value="0"></label><button class="btn">Ajouter</button></div>
      ${C.length > 1 ? `<div class="coches">${a('ceremonies') ? C.map(c => `<label><input type="checkbox" name="c_${esc(c.cle)}" checked>${esc(c.nom)}</label>`).join('') : '<span class="app-note">Invité à toutes les cérémonies. Avec l\'option « Invitations par cérémonie », vous choisissez pour chacun.</span>'}</div>` : ''}
    </form>
    <div class="app-carte table-defile"><table class="app-table"><thead><tr><th>Invité</th>${C.map(c => `<th>${esc(c.nom)}</th>`).join('')}<th>Accomp.</th><th>Régime, message</th>${a('etranger') ? '<th>Arrivée</th>' : ''}${a('qr') ? '<th>Entrée</th>' : ''}<th></th></tr></thead><tbody>
      ${invites.map(i => `<tr><td><b>${esc(i.nom)}</b></td>${C.map(c => `<td>${rep(i, c)}</td>`).join('')}<td>${i.accompagnants ?? 0} / ${i.max}</td>
        <td>${esc(i.regime || '')}${i.message ? `<br><span class="app-note">« ${esc(i.message)} »</span>` : ''}</td>
        ${a('etranger') ? `<td>${i.arrivee ? esc([i.arrivee.date, i.arrivee.vol, i.arrivee.hebergement ? 'hébergement demandé' : ''].filter(Boolean).join(' · ')) : ''}</td>` : ''}
        ${a('qr') ? `<td>${i.entree ? `<span class="ok">${heure(i.entree.toDate())}</span>` : ''}</td>` : ''}
        <td style="white-space:nowrap"><button class="btn petit clair" data-copier="${i.id}">Copier le lien</button> <a class="btn petit clair" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`${evt.titre} : votre invitation personnelle → ${lienInvite(i.id)}`)}">WhatsApp</a> <button class="btn petit clair" data-suppr-invite="${i.id}" title="Supprimer">✕</button></td></tr>`).join('')}
    </tbody></table>${invites.length ? '' : '<p class="app-note">Ajoutez vos premiers invités : chacun reçoit un lien personnel.</p>'}<p class="ok-msg" id="m-copie"></p></div>`;
  },
  ceremonies() {
    const C = evt.ceremonies || [];
    return `<div class="app-carte">${C.map((c, k) => `<div class="ceremonie"><div><h3>${esc(c.nom)}</h3><p>${esc(majuscule(dateLongue(c.date)))} à ${heure(c.date)} · ${esc(c.lieu)}</p></div>${C.length > 1 ? `<button class="btn petit clair" data-suppr-cer="${k}">Retirer</button>` : ''}</div>`).join('')}</div>
      <form class="app-carte" id="f-cer"><h2>Ajouter une cérémonie</h2><p class="app-note" style="margin-bottom:12px">Coutumier ou dot, mairie, église, soirée : chaque invité sera invité aux cérémonies que vous choisissez.</p>
        <div class="app-grille"><label>Nom<input name="nom" required placeholder="Cérémonie coutumière"></label><label>Date et heure<input name="date" type="datetime-local" required></label><label>Lieu<input name="lieu" required></label></div>
        <button class="btn">Ajouter</button></form>`;
  },
  souvenirs() {
    return `<div class="app-carte"><h2>Photos des invités</h2>${a('murphoto') ? '' : '<p class="app-note">Option « Mur photo » non activée.</p>'}
      <div class="galerie">${photos.map(p => `<figure class="${p.visible ? '' : 'masquee'}"><img src="${esc(p.url)}" alt="" loading="lazy"><figcaption>${esc(p.auteur)} · <a href="#" data-visible-photo="${p.id}">${p.visible ? 'masquer' : 'afficher'}</a> · <a href="#" data-suppr-photo="${p.id}">supprimer</a></figcaption></figure>`).join('')}</div></div>
      <div class="app-carte"><h2>Livre d'or</h2>${a('livredor') ? '' : '<p class="app-note">Option « Livre d\'or » non activée.</p>'}
      ${livre.map(m => `<div class="mot" style="${m.visible ? '' : 'opacity:.4'}"><p>« ${esc(m.texte)} »</p><span>${esc(m.de)} · <a href="#" data-visible-mot="${m.id}">${m.visible ? 'masquer' : 'afficher'}</a> · <a href="#" data-suppr-mot="${m.id}">supprimer</a></span></div>`).join('')}</div>`;
  },
  reglages() {
    return `<form class="app-carte" id="f-reglages"><h2>Informations</h2><div class="app-grille">
        <label>Prénoms ou titre<input name="titre" value="${esc(evt.titre)}" required maxlength="120"></label>
        <label>Date et heure<input name="date" type="datetime-local" value="${esc(evt.date)}" required></label>
        <label>Lieu<input name="lieu" value="${esc(evt.lieu)}" required></label>
        <label>Collection du faire-part<input name="modele" value="${esc(evt.modele || '')}" placeholder="lakay"></label></div>
        ${a('direct') ? `<label style="margin-top:12px">Lien du direct (YouTube non répertorié, par exemple)<input name="live" id="i-live" placeholder="https://www.youtube.com/watch?v=…"></label>` : ''}
        <button class="btn" style="margin-top:14px">Enregistrer</button><p class="ok-msg" id="m-reglages"></p></form>`;
  },
};

// ── Actions ─────────────────────────────────────────────────────────────────
document.addEventListener('click', async ev => {
  const t = ev.target.closest('button, a'); if (!t || !E) return;
  if (t.dataset.onglet) { onglet = t.dataset.onglet; rendre(); if (onglet === 'reglages' && a('direct')) { const c = await getDoc(doc(db, `events/${E}/prive/config`)); if ($('#i-live')) $('#i-live').value = c.data()?.live || ''; } return; }
  if (t.dataset.copier) { await navigator.clipboard?.writeText(lienInvite(t.dataset.copier)).catch(() => {}); $('#m-copie').textContent = 'Lien copié : ' + lienInvite(t.dataset.copier); return; }
  if (t.dataset.supprInvite) return deleteDoc(doc(db, `events/${E}/invites/${t.dataset.supprInvite}`));
  if (t.dataset.supprCer) { const C = [...evt.ceremonies]; C.splice(+t.dataset.supprCer, 1); return updateDoc(doc(db, 'events', E), { ceremonies: C }); }
  if (t.dataset.visiblePhoto) { ev.preventDefault(); const p = photos.find(x => x.id === t.dataset.visiblePhoto); return updateDoc(doc(db, `events/${E}/photos/${p.id}`), { visible: !p.visible }); }
  if (t.dataset.supprPhoto) { ev.preventDefault(); const p = photos.find(x => x.id === t.dataset.supprPhoto); await deleteObject(ref(storage, p.chemin)).catch(() => {}); return deleteDoc(doc(db, `events/${E}/photos/${p.id}`)); }
  if (t.dataset.visibleMot) { ev.preventDefault(); const m = livre.find(x => x.id === t.dataset.visibleMot); return updateDoc(doc(db, `events/${E}/livre/${m.id}`), { visible: !m.visible }); }
  if (t.dataset.supprMot) { ev.preventDefault(); return deleteDoc(doc(db, `events/${E}/livre/${t.dataset.supprMot}`)); }
});
document.addEventListener('submit', async ev => {
  if (!E) return; ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target)), C = evt.ceremonies || [];
  if (ev.target.id === 'f-invite') {
    const choisies = C.length > 1 && a('ceremonies') ? C.filter(c => f['c_' + c.cle]).map(c => c.cle) : C.map(c => c.cle);
    ev.target.reset();
    await setDoc(doc(db, `events/${E}/invites/${jeton()}`), { nom: f.nom, max: Math.max(0, +f.max || 0), ceremonies: choisies, reponses: {}, creeLe: serverTimestamp() });
  }
  if (ev.target.id === 'f-cer') {
    const cle = f.nom.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ceremonie';
    ev.target.reset();
    await updateDoc(doc(db, 'events', E), { ceremonies: [...C, { cle: C.some(c => c.cle === cle) ? cle + '-' + C.length : cle, nom: f.nom, date: f.date, lieu: f.lieu }] });
  }
  if (ev.target.id === 'f-reglages') {
    await updateDoc(doc(db, 'events', E), { titre: f.titre, date: f.date, lieu: f.lieu, modele: f.modele.trim() });
    if ('live' in f) await setDoc(doc(db, `events/${E}/prive/config`), { live: f.live.trim() }, { merge: true });
    if ($('#m-reglages')) $('#m-reglages').textContent = 'Enregistré.';
  }
});
