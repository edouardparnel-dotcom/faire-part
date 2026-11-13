// Espace de l'organisateur : ses événements, ses invités (par cérémonie), les envois et relances, le plan de table,
// le budget, les prestataires, le planning, le déroulé du jour J, l'équipe (co-organisateur, wedding planner),
// les réponses en direct, les entrées, la modération des photos et du livre d'or, le lien du direct, les exports ;
// et les options : jeux (quiz, pronostics, classement), tenues coordonnées, remerciements, album en haute définition.
import { auth, db, storage, fonctions, $, esc, dateLongue, heure, majuscule, jeton, NOMS_OPTIONS, LOCAL, bandeau, exigerOrganisateur, deconnecter } from './commun.js?v=4';
import { collection, doc, query, where, getDocs, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, getDoc, writeBatch, increment } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import { lireCSV, invitesDepuisCSV, telephone, telechargerCSV, personnes, declineTout, prenom, MESSAGES, remplir, planningType, POSTES, METIERS, STATUTS, euros, LIENS, DISTANCE, infractions, proposerPlacement } from './espace.js?v=3';

if (LOCAL) bandeau('Mode local · émulateurs Firebase, données de test');
const vue = $('#vue'), Q = new URLSearchParams(location.search);
const TYPES = { mariage: 'Mariage', anniversaire: 'Anniversaire', bapteme: 'Baptême', gender: 'Gender reveal', naissance: 'Naissance' };
const ROLES = { coorganisateur: 'Co-organisateur', planner: 'Wedding planner' };
let user, E = null, evt = null, proprio = false, onglet = Q.get('onglet') || 'accueil', abonnements = [];
let invites = [], photos = [], livre = [], tables = [], budget = [], prestataires = [], taches = [], equipe = [], acces = [], outils = {};
let album = [], jeuxRep = [], partage = {}, cadeaux = [], photoPour = null, msgOption = '';
let tarifs = null, paiements = [], choixFormule = Q.get('formule') || '', choixOptions = new Set((Q.get('options') || '').split(',').filter(Boolean)), msgPaiement = '', msgPublier = '';
let COLLECTIONS = [], choisirCollection = false;
fetch('collections.json?v=1').then(r => r.json()).then(l => { COLLECTIONS = l; rendre(); }).catch(() => {});
let filtreEnvoi = 'aenvoyer', apercuImport = null, msgImport = '', avantPlacement = null, msgPlacement = '', recherche = '', enAttente = false;

// Le lien partagé ouvre le faire-part personnel (fp.html) ; son bouton « Répondre » mène à la page invité.
const lienInvite = t => new URL(`fp.html?e=${encodeURIComponent(E)}&g=${encodeURIComponent(t)}`, location.href).href;
const lienPage = t => new URL(`invite.html?e=${encodeURIComponent(E)}&g=${encodeURIComponent(t)}`, location.href).href;
const lienEquipe = c => new URL(`organisateur.html?rejoindre=${encodeURIComponent(E)}&code=${encodeURIComponent(c)}`, location.href).href;
const a = o => evt?.options?.includes(o);
// Prix de lancement (formule Faire-part) : affiché ici, décidé par le serveur (date et nombre de places).
const prixF = f => f.lancement && Date.now() < Date.parse(f.lancement.jusqu) ? f.lancement.prix : f.prix;
// Options prises avec une formule au prix de lancement : même remise (premier paiement seulement, comme le serveur).
const prixO = (o, f, actuelle) => !actuelle && prixF(f) < f.prix && f.lancement.options ? Math.ceil(o.prix * f.lancement.options) : o.prix;
// Formule Faire-part : l'invitation, les invités, les envois et les réponses ; le reste de l'espace s'ouvre en passant à une formule complète.
const FAIRE_PART = ['accueil', 'invites', 'envois', 'paiement', 'equipe', 'reglages'];
const jours = d => Math.ceil((new Date(d) - Date.now()) / 864e5);
const aujourdhui = () => new Date().toISOString().slice(0, 10);

exigerOrganisateur(vue, u => {
  user = u; $('#b-sortir').hidden = false;
  if (Q.get('rejoindre')) return rejoindre(Q.get('rejoindre'), Q.get('code'));
  Q.get('e') ? ouvrir(Q.get('e')) : liste();
});
$('#b-sortir').addEventListener('click', ev => { ev.preventDefault(); deconnecter(); location.href = 'organisateur.html'; });

// ── Liste des événements (les siens et ceux où l'on fait partie de l'équipe) et création ──
async function liste() {
  abonnements.forEach(f => f()); abonnements = []; E = null;
  const [miens, autres] = await Promise.all([getDocs(query(collection(db, 'events'), where('owner', '==', user.uid))), getDocs(collection(db, `utilisateurs/${user.uid}/acces`))]);
  const carte = (id, d, role) => `<a class="app-carte" style="display:block;text-decoration:none" href="?e=${id}"><span class="etq">${esc(TYPES[d.type] || '')}${d.formule ? ` · formule ${esc(d.formule)}` : ''}${role ? ` · ${esc(ROLES[role])}` : ''}</span>
      <h2 style="margin-top:6px">${esc(d.titre)}</h2>${d.date ? `<p class="app-note">${esc(majuscule(dateLongue(d.date)))}</p>` : ''}</a>`;
  vue.innerHTML = `<div class="app-haut"><div><span class="etq">Bonjour</span><h1 class="serif">Vos événements</h1></div></div>
    ${miens.docs.map(d => carte(d.id, d.data())).join('')}${autres.docs.map(d => carte(d.id, d.data(), d.data().role)).join('')}
    ${miens.empty && autres.empty ? '<p class="app-note">Aucun événement pour l\'instant.</p>' : ''}
    <form class="app-carte" id="f-evt"><h2>Créer un événement</h2>${Q.get('nouveau') ? '<p class="app-note" style="margin-bottom:12px">Créez votre événement : vous préparez tout gratuitement, vous voyez votre faire-part, puis vous validez votre formule quand il vous plaît.</p>' : ''}
      <div class="app-grille">
        <label>Type<select name="type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${Q.get('nouveau') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label>Prénoms ou titre<input name="titre" required maxlength="120" placeholder="Awa et Thomas"></label>
        <label>Date et heure<input name="date" type="datetime-local" required></label>
        <label>Lieu<input name="lieu" required placeholder="Domaine des Tilleuls"></label>
      </div><button class="btn">Créer</button></form>`;
  $('#f-evt').addEventListener('submit', async ev => {
    ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target));
    const r = await addDoc(collection(db, 'events'), { owner: user.uid, type: f.type, titre: f.titre, date: f.date, lieu: f.lieu, modele: Q.get('modele') || '',
      formule: 'essai', options: [], ceremonies: [{ cle: 'principale', nom: f.type === 'mariage' ? 'Cérémonie' : 'La fête', date: f.date, lieu: f.lieu }], creeLe: serverTimestamp() });
    location.href = `?e=${r.id}` + (Q.get('nouveau') ? `&formule=${encodeURIComponent(Q.get('formule') || '')}&options=${encodeURIComponent(Q.get('options') || '')}` : '');
  });
}

// ── Rejoindre l'équipe d'un événement avec le lien reçu du propriétaire ─────
async function rejoindre(e, code) {
  const msg = t => { vue.innerHTML = `<div class="app-carte app-connexion"><span class="etq">Équipe</span><h1 class="serif">Accès</h1><p class="app-note">${t}</p><a class="btn" href="organisateur.html">Mon espace</a></div>`; };
  try {
    const [ac, ev, deja] = await Promise.all([getDoc(doc(db, `events/${e}/acces/${code}`)), getDoc(doc(db, 'events', e)), getDoc(doc(db, `events/${e}/equipe/${user.uid}`))]);
    if (!ev.exists()) return msg('Cet événement n\'existe plus.');
    if (ev.data().owner === user.uid || deja.exists()) { location.href = `organisateur.html?e=${e}`; return; }
    if (!ac.exists()) return msg('Ce lien d\'accès n\'est plus valable : demandez-en un nouveau aux organisateurs.');
    await setDoc(doc(db, `events/${e}/equipe/${user.uid}`), { code, role: ac.data().role, nom: ac.data().nom, email: user.email || '', rejointLe: serverTimestamp() });
    await setDoc(doc(db, `utilisateurs/${user.uid}/acces/${e}`), { titre: ev.data().titre, date: ev.data().date || '', type: ev.data().type, role: ac.data().role });
    location.href = `organisateur.html?e=${e}`;
  } catch (err) { console.error('Rejoindre', err); msg('L\'accès n\'a pas pu être ouvert. Réessayez, ou demandez un nouveau lien.'); }
}

// ── Un événement : abonnements en direct ────────────────────────────────────
function suivre(chemin, f) { abonnements.push(onSnapshot(collection(db, `events/${E}/${chemin}`), s => { f(s.docs.map(d => ({ id: d.id, ...d.data() }))); rendre(); }, () => {})); }
const recents = l => l.sort((x, y) => (y.creeLe?.seconds || 0) - (x.creeLe?.seconds || 0));
function ouvrir(id) {
  E = id; let premiere = true;
  abonnements.push(onSnapshot(doc(db, 'events', E), s => {
    evt = s.data();
    if (!evt) { vue.innerHTML = '<p class="app-note">Événement introuvable.</p>'; return; }
    proprio = evt.owner === user.uid;
    if (premiere) {
      premiere = false;
      suivre('invites', l => invites = l.sort((x, y) => x.nom.localeCompare(y.nom)));
      suivre('photos', l => photos = recents(l)); suivre('livre', l => livre = recents(l));
      suivre('tables', l => tables = l.sort((x, y) => (x.ordre ?? 0) - (y.ordre ?? 0) || x.nom.localeCompare(y.nom, 'fr', { numeric: true })));
      suivre('budget', l => budget = l.sort((x, y) => POSTES.indexOf(x.poste) - POSTES.indexOf(y.poste)));
      suivre('prestataires', l => prestataires = l.sort((x, y) => METIERS.indexOf(x.metier) - METIERS.indexOf(y.metier)));
      suivre('taches', l => taches = l.sort((x, y) => (x.echeance || '').localeCompare(y.echeance || '') || (x.ordre ?? 0) - (y.ordre ?? 0)));
      suivre('equipe', l => equipe = l);
      suivre('cadeaux', l => cadeaux = recents(l).reverse());
      suivre('album', l => album = recents(l)); suivre('jeuxReponses', l => jeuxRep = l);
      suivre('partage', l => partage = Object.fromEntries(l.map(d => [d.id, d])));
      suivre('outils', l => outils = Object.fromEntries(l.map(d => [d.id, d])));
      if (proprio) suivre('acces', l => acces = recents(l));
      suivre('paiements', l => paiements = recents(l));
      fetch('tarifs.json?v=1').then(r => r.json()).then(t => { tarifs = t; rendre(); }).catch(() => {});
    }
    rendre();
  }, () => { vue.innerHTML = '<p class="app-note">Événement introuvable, ou votre accès a été retiré.</p>'; }));
}

// Ne pas effacer une saisie en cours : on attend que le champ perde le focus.
const enSaisie = () => { const el = document.activeElement; return el?.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select') && el.closest('#vue'); };
document.addEventListener('focusout', () => setTimeout(() => { if (enAttente && !enSaisie()) { enAttente = false; rendre(); } }, 350));

function rendre() {
  if (!evt) return;
  if (enSaisie()) { enAttente = true; return; }
  const C = evt.ceremonies || [], oui = c => invites.filter(i => i.reponses?.[c.cle] === 'oui').reduce((s, i) => s + 1 + (i.accompagnants || 0), 0);
  const entrees = invites.filter(i => i.entree).length, repondu = invites.filter(i => i.reponduLe).length;
  const onglets = { accueil: 'Vue d\'ensemble', invites: 'Invités', envois: 'Envois et relances', table: 'Plan de table', ceremonies: C.length > 1 ? 'Cérémonies et déroulé' : 'Programme et déroulé',
    budget: 'Budget', prestataires: 'Prestataires', planning: 'Planning', cadeaux: 'Liste et cagnotte', souvenirs: a('album') ? "Photos, livre d'or et album" : "Photos et livre d'or",
    ...(voirOption('jeux') ? { jeux: 'Jeux' } : {}), ...(voirOption('tenues') ? { tenues: 'Tenues' } : {}), ...(voirOption('merci') ? { merci: 'Remerciements' } : {}),
    paiement: evt.formule === 'essai' ? 'Valider ma formule' : 'Formule et options', equipe: 'Équipe', reglages: 'Réglages et exports' };
  if (evt.formule === 'faire-part') { const garder = FAIRE_PART; for (const k of Object.keys(onglets)) if (!garder.includes(k)) delete onglets[k]; onglets.paiement = 'Passer à Signature ou Prestige'; if (!onglets[onglet]) onglet = 'accueil'; }
  const y = scrollY;
  vue.innerHTML = `<div class="app-haut"><div><a class="app-note" href="organisateur.html">← Vos événements</a>
      <span class="etq" style="display:block;margin-top:12px">${esc(TYPES[evt.type])} · formule ${esc(evt.formule)}${proprio ? '' : ` · ${esc(ROLES[equipe.find(m => m.id === user.uid)?.role] || 'équipe')}`}</span><h1 class="serif">${esc(evt.titre)}</h1>
      <p class="app-note">${esc(majuscule(dateLongue(evt.date)))} · ${esc(evt.lieu)}</p></div>
    <div class="puces"><button class="btn petit voir" data-apercu="fp">Voir mon faire-part</button><a class="btn petit clair" href="editeur.html?e=${E}">Personnaliser</a><a class="btn petit clair" href="imprimer.html?e=${E}" target="_blank" rel="noopener">Version à imprimer</a><button class="btn petit clair" data-apercu="site">Voir le site</button>${a('qr') ? `<a class="btn petit clair" href="entree.html?e=${E}">Contrôle d'entrée</a>` : ''}${a('murphoto') ? `<a class="btn petit clair" href="mur.html?e=${E}" target="_blank">Mur photo</a>` : ''}</div></div>
    ${onglet === 'invites' ? `<div class="app-grille">
      <div class="app-stat"><b>${invites.length}</b><span>Invitations</span></div>
      <div class="app-stat"><b>${repondu}</b><span>Ont répondu</span></div>
      ${C.map(c => `<div class="app-stat"><b>${oui(c)}</b><span>${esc(c.nom)} : présents</span></div>`).join('')}
      ${a('qr') ? `<div class="app-stat"><b>${entrees}</b><span>Entrées validées</span></div>` : ''}
    </div>` : ''}
    ${Q.get('paiement') === 'ok' ? `<div class="app-carte bandeau-paiement ok">${evt.formule === 'essai' ? 'Paiement reçu, merci. Vos options s\'activent dans quelques secondes ; la facture arrive par courriel.' : `Paiement reçu, merci : formule ${esc(evt.formule)} active. La facture arrive par courriel.`}</div>` : Q.get('paiement') === 'annule' ? '<div class="app-carte bandeau-paiement">Paiement annulé : rien n\'a été débité.</div>' : ''}
    ${navigation(onglets)}
    <div id="contenu" class="rub-${rubriqueDe(onglet)}">${VUES[onglet]()}</div>`;
  appliquerRecherche(); scrollTo(0, y);
}

// Navigation en rubriques : on ne montre que la rubrique ouverte et ses pages (les informations arrivent quand on en a besoin).
const RUBRIQUES = [['accueil', 'Accueil', ['accueil']], ['invites', 'Invités', ['invites', 'envois', 'table']], ['jour', 'Le jour J', ['ceremonies', 'souvenirs', 'jeux']],
  ['organisation', 'Organisation', ['planning', 'budget', 'prestataires', 'cadeaux', 'tenues', 'merci']], ['compte', 'Formule et compte', ['paiement', 'equipe', 'reglages']]];
function navigation(onglets) {
  const rubs = RUBRIQUES.map(([k, nom, pages]) => [k, nom, pages.filter(p => onglets[p])]).filter(([, , p]) => p.length);
  const ici = rubs.find(([, , p]) => p.includes(onglet)) || rubs[0];
  return `<div class="app-onglets rubriques">${rubs.map(([k, nom, p]) => `<button data-onglet="${p[0]}" class="rub-${k} ${k === ici[0] ? 'actif' : ''}">${nom}</button>`).join('')}</div>`
    + (ici[2].length > 1 ? `<div class="app-sous-onglets rub-${ici[0]}">${ici[2].map(p => `<button data-onglet="${p}" class="${p === onglet ? 'actif' : ''}">${onglets[p]}</button>`).join('')}</div>` : '');
}
const rubriqueDe = o => (RUBRIQUES.find(([, , p]) => p.includes(o)) || RUBRIQUES[0])[0];

// Le parcours du couple, du choix de la collection au partage : l'étape en cours est mise en avant, les autres attendent.
function parcours() {
  const etapes = [
    ['Choisir la collection', !!evt.modele, 'Choisir', 'data-changer-collection="1"'],
    ['Personnaliser', !!evt.design, 'Personnaliser', `data-lien="editeur.html?e=${E}"`],
    ['Voir mon faire-part', !!evt.design, 'Voir', 'data-apercu="fp"'],
    ['Valider ma formule', evt.formule !== 'essai', 'Valider', 'data-onglet="paiement"'],
    ['Partager avec un message', invites.some(i => i.envoi), 'Partager', 'data-onglet="envois"'],
  ], ici = etapes.findIndex(e => !e[1]);
  return `<div class="parcours">${etapes.map(([t, fait, b, attr], k) => `<div class="pas ${fait ? 'fait' : k === ici ? 'ici' : ''}"><span class="num">${fait ? '✓' : k + 1}</span><b>${t}</b>
    <button class="btn petit ${k === ici ? '' : 'clair'}" ${attr}>${fait && k !== 2 ? 'Modifier' : b}</button></div>`).join('')}</div>`;
}

// Aperçu de l'invitation dans l'espace, dans un téléphone (hors de #vue : il survit aux mises à jour en direct).
function apercu(f) {
  document.querySelector('.apercu-fond')?.remove();
  const url = `fp.html?e=${E}${f === 'site' ? '&f=site' : ''}`, d = document.createElement('div');
  d.className = 'apercu-fond';
  d.innerHTML = `<div class="apercu-boite"><div class="puces apercu-barre"><button class="btn petit ${f === 'fp' ? '' : 'clair'}" data-ap="fp">Faire-part</button><button class="btn petit ${f === 'site' ? '' : 'clair'}" data-ap="site">Site</button>
    <a class="btn petit clair" href="${url}" target="_blank" rel="noopener">Ouvrir en grand</a><button class="btn petit clair" data-ap="fermer">Fermer</button></div>
    <div class="telephone"><iframe src="${url}" title="Aperçu de votre invitation"></iframe></div>
    <p class="app-note">C'est exactement ce que verront vos invités${evt.formule === 'essai' ? ', une fois votre formule validée' : ''}.</p></div>`;
  d.addEventListener('click', e => { const b = e.target.closest('[data-ap]'); if (e.target === d || b?.dataset.ap === 'fermer') d.remove(); else if (b) apercu(b.dataset.ap); });
  document.body.appendChild(d);
}

// Carte « Votre collection » : la voir, la personnaliser, en changer ou la retirer.
function carteCollection() {
  const c = COLLECTIONS.find(x => x.slug === evt.modele);
  const choix = choisirCollection || !c ? `<div class="choix-collections">${COLLECTIONS.map(x => `<button class="vignette-col ${x.slug === evt.modele ? 'choisie' : ''}" data-collection="${esc(x.slug)}"><img src="${esc(x.img)}" alt="" loading="lazy"><b>${esc(x.nom)}</b><span>${esc(x.culture)}</span></button>`).join('')}</div>` : '';
  if (!COLLECTIONS.length) return '';
  if (!c) return `<div class="app-carte"><h2>Choisissez votre collection</h2><p class="app-note" style="margin-bottom:14px">Elle donne son ouverture, sa musique et sa mise en page à votre invitation ; vous pourrez en changer à tout moment.</p>${choix}</div>`;
  return `<div class="app-carte carte-collection"><img src="${esc(c.img)}" alt=""><div><span class="etq">Votre collection</span><h2>${esc(c.nom)}</h2><p class="app-note">${esc(c.culture)}</p>
    <div class="puces" style="margin-top:12px"><a class="btn petit" href="editeur.html?e=${E}">Personnaliser</a><a class="btn petit clair" href="../${esc(c.slug)}/faire-part.html" target="_blank" rel="noopener">Voir la démonstration</a>
    <button class="btn petit clair" data-changer-collection="1">${choisirCollection ? 'Fermer' : 'Changer de collection'}</button><button class="btn petit clair" data-retirer-collection="1">Retirer</button></div></div></div>${choix ? `<div class="app-carte">${choix}</div>` : ''}`;
}

// Onglet d'une option : visible si elle est active, ou pendant l'essai pour la découvrir.
const voirOption = o => a(o) || evt.formule === 'essai';
const noteOption = o => a(o) ? '' : `<p class="app-note" style="margin-bottom:12px">Option « ${esc(NOMS_OPTIONS[o])} » non activée : vous pouvez tout préparer, vos invités le verront une fois l'option ajoutée.</p>`;
// Format des questions : un bloc par question (ligne vide entre deux), la question puis un choix par ligne ; « * » devant la bonne réponse.
const lireQuestions = texte => (texte || '').split(/\n{2,}/).map(b => b.split('\n').map(x => x.trim()).filter(Boolean)).filter(b => b.length > 2)
  .map(([q, ...choix]) => ({ q, choix: choix.map(c => c.replace(/^\*\s*/, '')), bonne: Math.max(0, choix.findIndex(c => c.startsWith('*'))) }));
const rep = (i, c) => { const r = i.reponses?.[c.cle]; return !i.ceremonies?.includes(c.cle) ? '' : r === 'oui' ? '<span class="ok">Oui</span>' : r === 'non' ? '<span class="non">Non</span>' : '<span class="attente">…</span>'; };
const date = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
const dateTs = t => t?.toDate ? date(t.toDate()) : '';
const barre = (x, total, alerte) => `<div class="barre${alerte ? ' alerte' : ''}"><i style="width:${total ? Math.min(100, Math.round(100 * x / total)) : 0}%"></i></div>`;
const champ = (chemin, v, attrs = '') => `<input data-maj="${chemin}" value="${esc(v ?? '')}" ${attrs}>`;

const VUES = {
  // ── Vue d'ensemble : où en est-on, et quoi faire maintenant ────────────────
  accueil() {
    const j = jours(evt.date), attendus = invites.filter(i => !declineTout(i)), nbAttendus = attendus.reduce((s, i) => s + personnes(i), 0);
    const places = attendus.filter(i => i.table).reduce((s, i) => s + personnes(i), 0);
    const prevu = budget.reduce((s, b) => s + (+b.prevu || 0), 0), paye = budget.reduce((s, b) => s + (+b.paye || 0), 0), cible = +outils.reglages?.budgetCible || 0;
    const restantes = taches.filter(t => !t.fait), retard = restantes.filter(t => t.echeance && t.echeance < aujourdhui());
    const nonEnvoyes = invites.filter(i => !i.envoi).length, sansReponse = invites.filter(i => i.envoi && !i.reponduLe).length;
    const conseils = [
      !invites.length && ['Ajoutez ou importez votre liste d\'invités.', 'invites', 'Mes invités'],
      nonEnvoyes && [`${nonEnvoyes} invitation${nonEnvoyes > 1 ? 's' : ''} pas encore envoyée${nonEnvoyes > 1 ? 's' : ''}.`, 'envois', 'Envoyer'],
      sansReponse && [`${sansReponse} invité${sansReponse > 1 ? 's' : ''} sans réponse.`, 'envois', 'Relancer'],
      retard.length && [`${retard.length} tâche${retard.length > 1 ? 's' : ''} en retard.`, 'planning', 'Planning'],
      !taches.length && ['Créez votre planning : les tâches arrivent avec leurs dates, jusqu\'au jour J.', 'planning', 'Créer'],
      !budget.length && ['Posez votre budget, poste par poste.', 'budget', 'Budget'],
      attendus.length && places < nbAttendus && j < 90 && [`${nbAttendus - places} personne${nbAttendus - places > 1 ? 's' : ''} sans table.`, 'table', 'Plan de table'],
    ].filter(Boolean);
    const stats = [
      `<div class="app-stat"><b>${j > 0 ? 'J-' + j : j === 0 ? 'Jour J' : 'Passé'}</b><span>${esc(dateLongue(evt.date))}</span></div>`,
      invites.length && `<div class="app-stat"><b>${Math.round(100 * invites.filter(i => i.reponduLe).length / invites.length)} %</b><span>Réponses reçues</span>${barre(invites.filter(i => i.reponduLe).length, invites.length)}</div>`,
      invites.length && `<div class="app-stat"><b>${nbAttendus}</b><span>Personnes attendues</span></div>`,
      budget.length && `<div class="app-stat"><b>${euros(paye)}</b><span>Payé sur ${euros(prevu)} prévus${cible ? ` · budget ${euros(cible)}` : ''}</span>${barre(paye, prevu || cible, cible && prevu > cible)}</div>`,
      taches.length && `<div class="app-stat"><b>${taches.length - restantes.length}/${taches.length}</b><span>Tâches faites${retard.length ? ` · ${retard.length} en retard` : ''}</span>${barre(taches.length - restantes.length, taches.length)}</div>`,
      places && `<div class="app-stat"><b>${places}/${nbAttendus}</b><span>Personnes placées</span>${barre(places, nbAttendus)}</div>`,
    ].filter(Boolean);
    const [prochaine, ...autres] = conseils, actives = Object.entries(NOMS_OPTIONS).filter(([k]) => a(k));
    return `${parcours()}${carteCollection()}
      <div class="app-grille stats-couleur">${stats.join('')}</div>
      ${prochaine ? `<div class="app-carte"><span class="etq">Prochaine étape</span><div class="ligne-conseil" style="border:0;padding-top:6px"><span style="font-size:17px">${esc(prochaine[0])}</span><button class="btn petit" data-onglet="${prochaine[1]}">${esc(prochaine[2])}</button></div>
        ${autres.length ? `<details style="margin-top:8px"><summary class="app-note" style="cursor:pointer">Voir ${autres.length} autre${autres.length > 1 ? 's' : ''} étape${autres.length > 1 ? 's' : ''}</summary>${autres.map(([t, o, b]) => `<div class="ligne-conseil"><span>${esc(t)}</span><button class="btn petit clair" data-onglet="${o}">${esc(b)}</button></div>`).join('')}</details>` : ''}</div>` : ''}
      ${restantes.length ? `<div class="app-carte"><h2>Prochaines tâches</h2>${restantes.slice(0, 4).map(ligneTache).join('')}</div>` : ''}
      <div class="app-carte"><span class="etq">Vos options</span><div class="puces" style="margin-top:10px">${actives.map(([, v]) => `<span class="puce-o">${esc(v)}</span>`).join('') || '<span class="app-note">Aucune option pour l\'instant.</span>'}<button class="btn petit clair" data-onglet="paiement">${evt.formule === 'essai' ? 'Valider ma formule' : 'Ajouter une option'}</button></div>
        ${evt.formule === 'essai' ? `<p class="app-note" style="margin-top:12px">Gratuit jusqu'à la publication : préparez tout, l'envoi à vos invités se débloque quand vous publiez.</p>` : ''}</div>`;
  },

  // ── Invités : ajout, import, liste ─────────────────────────────────────────
  invites() {
    const C = evt.ceremonies || [];
    return `<form class="app-carte" id="f-invite"><h2>Ajouter un invité</h2>
      <div class="app-grille" style="margin-bottom:10px"><label>Nom<input name="nom" required maxlength="80"></label><label>Téléphone<input name="tel" type="tel" placeholder="06 12 34 56 78"></label>
        <label>E-mail<input name="email" type="email"></label><label>Groupe<input name="groupe" maxlength="60" placeholder="Famille de Naïka" list="groupes"></label><label>Accompagnants autorisés<input name="max" type="number" min="0" max="10" value="0"></label></div>
      <datalist id="groupes">${[...new Set(invites.map(i => i.groupe).filter(Boolean))].map(g => `<option value="${esc(g)}">`).join('')}</datalist>
      ${C.length > 1 ? `<div class="coches">${a('ceremonies') ? C.map(c => `<label><input type="checkbox" name="c_${esc(c.cle)}" checked>${esc(c.nom)}</label>`).join('') : '<span class="app-note">Invité à toutes les cérémonies. Avec l\'option « Invitations par cérémonie », vous choisissez pour chacun.</span>'}</div>` : ''}
      <button class="btn">Ajouter</button></form>
    <details class="app-carte" ${apercuImport || msgImport ? 'open' : ''}><summary><h2 style="display:inline">Importer une liste</h2></summary>
      <p class="app-note" style="margin:10px 0">Collez les colonnes depuis Excel ou Google Sheets, ou choisissez un fichier .csv. Colonnes reconnues : nom, prénom, téléphone, e-mail, accompagnants, groupe, cérémonies. Sans en-tête : le nom d'abord.</p>
      <form id="f-import"><textarea name="texte" rows="6" placeholder="Nom;Téléphone;E-mail;Accompagnants;Groupe&#10;Rosa Joseph;06 12 34 56 78;rosa@exemple.fr;1;Famille de Naïka"></textarea>
        <div class="puces" style="margin-top:10px"><label class="btn petit clair" style="cursor:pointer">Choisir un fichier<input type="file" accept=".csv,.txt,text/csv" id="i-csv" hidden></label><button class="btn petit">Prévisualiser</button></div></form>
      ${apercuImport ? `<div style="margin-top:14px"><p><b>${apercuImport.length}</b> invité${apercuImport.length > 1 ? 's' : ''} reconnu${apercuImport.length > 1 ? 's' : ''}${apercuImport.length > 8 ? ' (8 premiers ci-dessous)' : ''} :</p>
        <table class="app-table"><thead><tr><th>Nom</th><th>Téléphone</th><th>E-mail</th><th>Accomp.</th><th>Groupe</th></tr></thead><tbody>${apercuImport.slice(0, 8).map(i => `<tr><td>${esc(i.nom)}</td><td>${esc(i.tel)}</td><td>${esc(i.email)}</td><td>${i.max}</td><td>${esc(i.groupe)}</td></tr>`).join('')}</tbody></table>
        <div class="puces" style="margin-top:12px"><button class="btn petit" data-importer="1">Importer ces ${apercuImport.length} invités</button><button class="btn petit clair" data-annuler-import="1">Annuler</button></div></div>` : ''}<p class="${msgImport.startsWith('Aucun') ? 'app-erreur' : 'ok-msg'}" id="m-import">${esc(msgImport)}</p></details>
    <div class="app-carte table-defile"><div class="barre-outils"><input id="recherche" type="search" placeholder="Rechercher un invité, un groupe…" value="${esc(recherche)}"><button class="btn petit clair" data-export="invites">Exporter (Excel)</button></div>
      <table class="app-table"><thead><tr><th>Invité</th>${C.map(c => `<th>${esc(c.nom)}</th>`).join('')}<th>Accomp.</th><th>Table</th><th>Régime, message</th>${a('etranger') ? '<th>Arrivée</th>' : ''}${a('qr') ? '<th>Entrée</th>' : ''}<th></th></tr></thead><tbody>
      ${invites.map(i => `<tr data-texte="${esc([i.nom, i.groupe, i.email, i.tel, i.tableNom].join(' ').toLowerCase())}"><td><b>${esc(i.nom)}</b>${i.groupe ? `<br><span class="app-note">${esc(i.groupe)}</span>` : ''}${i.tel || i.email ? `<br><span class="app-note">${esc([i.tel, i.email].filter(Boolean).join(' · '))}</span>` : ''}</td>
        ${C.map(c => `<td>${rep(i, c)}</td>`).join('')}<td>${i.accompagnants ?? 0} / ${i.max}</td><td>${esc(i.tableNom || '')}</td>
        <td>${esc(i.regime || '')}${i.message ? `<br><span class="app-note">« ${esc(i.message)} »</span>` : ''}</td>
        ${a('etranger') ? `<td>${i.arrivee ? esc([i.arrivee.date, i.arrivee.vol, i.arrivee.hebergement ? 'hébergement demandé' : ''].filter(Boolean).join(' · ')) : ''}</td>` : ''}
        ${a('qr') ? `<td>${i.entree ? `<span class="ok">${heure(i.entree.toDate())}</span>` : ''}</td>` : ''}
        <td style="white-space:nowrap"><button class="btn petit clair" data-copier="${i.id}">Copier le lien</button> <button class="btn petit clair" data-suppr-invite="${i.id}" title="Supprimer">✕</button></td></tr>`).join('')}
    </tbody></table>${invites.length ? '' : '<p class="app-note">Ajoutez vos premiers invités : chacun reçoit un lien personnel.</p>'}<p class="ok-msg" id="m-copie"></p></div>`;
  },

  // ── Envois et relances : un message personnel par invité, WhatsApp, SMS ou e-mail ──
  envois() {
    const m = { ...MESSAGES, ...outils.messages }, relance = filtreEnvoi === 'relance';
    const liste = invites.filter(i => filtreEnvoi === 'aenvoyer' ? !i.envoi : relance ? i.envoi && !i.reponduLe : true);
    const suivant = liste.find(i => i.tel);
    const etat = i => i.reponduLe ? '<span class="ok">A répondu</span>' : i.relance ? `Relancé ${i.relance.n > 1 ? i.relance.n + ' fois, ' : ''}le ${dateTs(i.relance.le)}` : i.envoi ? `Envoyé le ${dateTs(i.envoi.le)} (${esc(i.envoi.canal)})` : '<span class="attente">À envoyer</span>';
    return `<div class="app-carte"><h2>Envoyer les invitations</h2>
        <p class="app-note">Chaque invité reçoit son lien personnel, avec son prénom. Le message part de votre téléphone ou de votre messagerie : vos proches reconnaissent votre numéro, et rien ne finit en indésirable. Chaque envoi est noté ici, pour savoir qui relancer.</p>
        <div class="app-onglets">${Object.entries({ aenvoyer: `À envoyer (${invites.filter(i => !i.envoi).length})`, relance: `Sans réponse (${invites.filter(i => i.envoi && !i.reponduLe).length})`, tous: `Tous (${invites.length})` }).map(([k, v]) => `<button data-filtre-envoi="${k}" class="${k === filtreEnvoi ? 'actif' : ''}">${v}</button>`).join('')}</div>
        ${suivant ? `<div class="envoi-guide"><div><span class="etq">Envoi guidé</span><p>Suivant : <b>${esc(suivant.nom)}</b> · ${liste.filter(i => i.tel).length} avec un numéro</p></div><a class="btn" target="_blank" rel="noopener" data-envoi="${suivant.id}" data-canal="WhatsApp" href="${lienEnvoi(suivant, 'WhatsApp', relance)}">${relance ? 'Relancer' : 'Envoyer'} sur WhatsApp</a></div>` : liste.length ? '' : `<p class="app-note">${relance ? 'Tous les invités relancés ont répondu.' : 'Toutes les invitations sont parties.'}</p>`}
      </div>
      <div class="app-carte table-defile"><table class="app-table"><thead><tr><th>Invité</th><th>État</th><th>Envoyer ${relance ? 'une relance' : 'l\'invitation'}</th></tr></thead><tbody>
        ${liste.map(i => `<tr><td><b>${esc(i.nom)}</b><br><span class="app-note">${esc([i.tel, i.email].filter(Boolean).join(' · ') || 'ni téléphone ni e-mail')}</span></td><td>${etat(i)}</td>
          <td style="white-space:nowrap">${['WhatsApp', 'SMS', 'E-mail'].filter(c => c !== 'SMS' || i.tel).filter(c => c !== 'E-mail' || i.email).map(c => `<a class="btn petit clair" target="_blank" rel="noopener" data-envoi="${i.id}" data-canal="${c}" href="${lienEnvoi(i, c, relance)}">${c}</a>`).join(' ')}
            <button class="btn petit clair" data-copier-message="${i.id}">Copier le message</button></td></tr>`).join('')}
      </tbody></table><p class="ok-msg" id="m-copie"></p></div>
      <form class="app-carte" id="f-messages"><h2>Vos messages</h2><p class="app-note" style="margin-bottom:10px">Repères remplacés pour chacun : {prenom}, {titre}, {date}, {lien}.</p>
        <div class="app-grille"><label>Invitation<textarea name="invitation" rows="8">${esc(m.invitation)}</textarea></label><label>Relance<textarea name="relance" rows="8">${esc(m.relance)}</textarea></label></div>
        <button class="btn">Enregistrer les messages</button><p class="ok-msg" id="m-messages"></p></form>`;
  },

  // ── Plan de table : glisser-déposer, ou choisir la table dans la liste ─────
  table() {
    const attendus = invites.filter(i => !declineTout(i)), sans = attendus.filter(i => !i.table || !tables.some(t => t.id === i.table));
    const total = attendus.reduce((s, i) => s + personnes(i), 0), places = tables.reduce((s, t) => s + (+t.places || 0), 0);
    const options = i => `<select data-placer="${i.id}" aria-label="Table de ${esc(i.nom)}"><option value="">Sans table</option>${tables.map(t => `<option value="${t.id}" ${i.table === t.id ? 'selected' : ''}>${esc(t.nom)}</option>`).join('')}</select>`;
    const liens = outils.placement?.liens || [], fautes = infractions(attendus, tables, liens), fautesDe = id => fautes.filter(f => f.tables.includes(id));
    const choixInvite = n => `<select name="${n}" required><option value="">Choisir…</option>${attendus.map(i => `<option value="${i.id}">${esc(i.nom)}</option>`).join('')}</select>`;
    const nom = id => invites.find(i => i.id === id)?.nom || '…';
    const puce = i => `<div class="convive" draggable="true" data-glisser="${i.id}"><span><b>${esc(i.nom)}</b>${personnes(i) > 1 ? ` +${personnes(i) - 1}` : ''}${i.groupe ? `<small>${esc(i.groupe)}</small>` : ''}${i.regime ? `<small>${esc(i.regime)}</small>` : ''}</span>${options(i)}</div>`;
    return `<div class="app-carte"><div class="barre-outils" style="justify-content:space-between"><p class="app-note">${total} personnes attendues · ${places} places sur ${tables.length} tables · ${sans.reduce((s, i) => s + personnes(i), 0)} sans table. Les invités qui ont décliné n'apparaissent pas.</p>
        <label class="coche"><input type="checkbox" data-tables-visibles ${evt.tablesVisibles ? 'checked' : ''}> Chaque invité voit sa table sur son invitation</label></div>
        <form id="f-table" class="form-ligne" style="grid-template-columns:2fr 1fr auto auto"><label>Nom de la table<input name="nom" required maxlength="40" placeholder="Baobab, Table 1, Famille…"></label><label>Places<input name="places" type="number" min="1" max="40" value="10"></label><button class="btn">Ajouter</button>${tables.length ? '' : '<button class="btn clair" type="button" data-tables-type="1">Créer 10 tables de 10</button>'}</form></div>
      <div class="app-carte"><h2>Qui avec qui</h2>
        <p class="app-note" style="margin-bottom:12px">Indiquez qui doit être ensemble, qui doit être à des tables séparées, et qui doit être éloigné dans la salle (au moins ${DISTANCE} tables d'écart, dans l'ordre des tables). Les invités d'un même groupe sont rapprochés d'eux-mêmes.</p>
        <form id="f-lien" class="form-ligne" style="grid-template-columns:2fr 1.4fr 2fr auto"><label>Invité${choixInvite('a')}</label><label>Doit être<select name="type">${Object.entries(LIENS).map(([k, v]) => `<option value="${k}">${v.toLowerCase()}</option>`).join('')}</select></label><label>de, avec${choixInvite('b')}</label><button class="btn">Ajouter</button></form>
        ${liens.length ? `<div style="margin-top:12px">${liens.map((l, k) => `<div class="ligne-conseil"><span><b>${esc(nom(l.a))}</b> · ${esc(LIENS[l.type].toLowerCase())} · <b>${esc(nom(l.b))}</b></span><button class="icone" data-suppr-lien="${k}" title="Retirer">✕</button></div>`).join('')}</div>` : ''}
        ${fautes.length ? `<div class="alertes">${fautes.map(f => `<p>⚠ ${esc(f.texte)}</p>`).join('')}</div>` : liens.length && attendus.some(i => i.table) ? '<p class="ok-msg" style="margin-top:10px">Toutes les contraintes sont respectées.</p>' : ''}
        <div class="puces" style="margin-top:14px"><button class="btn petit" data-proposer="garder" ${tables.length ? '' : 'disabled'}>Placer les invités sans table</button><button class="btn petit clair" data-proposer="tout" ${tables.length ? '' : 'disabled'}>Tout replacer</button>${avantPlacement ? '<button class="btn petit clair" data-annuler-placement="1">Annuler le placement</button>' : ''}</div>
        ${msgPlacement ? `<p class="${msgPlacement.startsWith('⚠') ? 'app-erreur' : 'ok-msg'}" style="margin-top:10px">${esc(msgPlacement)}</p>` : ''}</div>
      <div class="plan">
        <div class="table-plan sans" data-deposer=""><div class="table-tete"><h3>Sans table</h3><span>${sans.reduce((s, i) => s + personnes(i), 0)}</span></div>${sans.map(puce).join('') || '<p class="app-note">Tout le monde est placé.</p>'}</div>
        ${tables.map(t => { const ici = attendus.filter(i => i.table === t.id), n = ici.reduce((s, i) => s + personnes(i), 0), f = fautesDe(t.id); return `<div class="table-plan${f.length ? ' alerte' : ''}" data-deposer="${t.id}">
          <div class="table-tete"><input class="nom-table" data-renommer-table="${t.id}" value="${esc(t.nom)}" aria-label="Nom de la table"><span class="${n > t.places ? 'non' : ''}">${n}/<input type="number" min="1" max="40" data-maj="tables/${t.id}/places" value="${+t.places || 0}" aria-label="Places"></span><button class="icone" data-suppr-table="${t.id}" title="Supprimer la table">✕</button></div>
          ${f.map(x => `<p class="alerte-table">⚠ ${esc(x.texte)}</p>`).join('')}${ici.map(puce).join('') || '<p class="app-note">Déposez des invités ici.</p>'}</div>`; }).join('')}
      </div>
      <div class="app-carte"><button class="btn petit clair" data-export="plan">Exporter le plan (Excel)</button> <button class="btn petit clair" onclick="print()">Imprimer</button></div>`;
  },

  // ── Cérémonies et déroulé du jour J ────────────────────────────────────────
  ceremonies() {
    const C = evt.ceremonies || [], D = outils.deroule?.items || [];
    return `<div class="app-carte">${C.map((c, k) => `<div class="ceremonie"><div><h3>${esc(c.nom)}</h3><p>${esc(majuscule(dateLongue(c.date)))} à ${heure(c.date)} · ${esc(c.lieu)}</p></div>${C.length > 1 ? `<button class="btn petit clair" data-suppr-cer="${k}">Retirer</button>` : ''}</div>`).join('')}</div>
      <form class="app-carte" id="f-cer"><h2>Ajouter une cérémonie</h2><p class="app-note" style="margin-bottom:12px">Coutumier ou dot, mairie, église, soirée : chaque invité sera invité aux cérémonies que vous choisissez.</p>
        <div class="app-grille"><label>Nom<input name="nom" required placeholder="Cérémonie coutumière"></label><label>Date et heure<input name="date" type="datetime-local" required></label><label>Lieu<input name="lieu" required></label></div>
        <button class="btn">Ajouter</button></form>
      <div class="app-carte table-defile"><h2>Déroulé du jour J</h2><p class="app-note" style="margin-bottom:12px">Heure par heure, avec qui s'en occupe : la feuille de route des témoins et des prestataires. ${a('deroule') ? 'Les moments cochés « invités » s\'affichent sur le téléphone de chacun.' : 'Avec l\'option « Déroulé en direct », les moments choisis s\'affichent aussi chez les invités.'}</p>
        <table class="app-table"><thead><tr><th>Heure</th><th>Moment</th><th>Lieu</th><th>Qui s'en occupe</th><th>Invités</th><th></th></tr></thead><tbody>
        ${D.map((d, k) => `<tr><td><input type="time" data-deroule="${k}:heure" value="${esc(d.heure)}"></td><td><input data-deroule="${k}:titre" value="${esc(d.titre)}"></td><td><input data-deroule="${k}:lieu" value="${esc(d.lieu)}"></td><td><input data-deroule="${k}:qui" value="${esc(d.qui)}"></td>
          <td><input type="checkbox" data-deroule="${k}:public" ${d.public ? 'checked' : ''}></td><td><button class="icone" data-suppr-deroule="${k}">✕</button></td></tr>`).join('')}</tbody></table>
        <form id="f-deroule" class="form-ligne" style="grid-template-columns:110px 2fr 1fr 1fr auto;margin-top:12px"><label>Heure<input name="heure" type="time" required></label><label>Moment<input name="titre" required placeholder="Entrée des mariés"></label><label>Lieu<input name="lieu"></label><label>Qui<input name="qui" placeholder="DJ, témoin…"></label><button class="btn">Ajouter</button></form>
        ${D.length ? '' : '<button class="btn petit clair" data-deroule-type="1" style="margin-top:10px">Partir d\'un déroulé type</button>'}</div>`;
  },

  // ── Budget ─────────────────────────────────────────────────────────────────
  budget() {
    const prevu = budget.reduce((s, b) => s + (+b.prevu || 0), 0), paye = budget.reduce((s, b) => s + (+b.paye || 0), 0), cible = +outils.reglages?.budgetCible || 0;
    const parPoste = POSTES.map(p => [p, budget.filter(b => b.poste === p)]).filter(([, l]) => l.length);
    const aVenir = budget.filter(b => b.echeance && (+b.prevu || 0) > (+b.paye || 0)).sort((x, y) => x.echeance.localeCompare(y.echeance)).slice(0, 5);
    return `<div class="app-grille">
        <div class="app-stat"><label>Budget total<input type="number" min="0" step="100" data-maj="outils/reglages/budgetCible" value="${cible || ''}" placeholder="25000"></label></div>
        <div class="app-stat"><b>${euros(prevu)}</b><span>Prévu${cible ? ` · ${prevu > cible ? `<span class="non">${euros(prevu - cible)} au-dessus</span>` : `${euros(cible - prevu)} de marge`}` : ''}</span>${barre(prevu, cible, cible && prevu > cible)}</div>
        <div class="app-stat"><b>${euros(paye)}</b><span>Payé</span>${barre(paye, prevu)}</div>
        <div class="app-stat"><b>${euros(prevu - paye)}</b><span>Reste à payer</span></div></div>
      ${aVenir.length ? `<div class="app-carte"><h2>Prochaines échéances</h2>${aVenir.map(b => `<div class="ligne-conseil"><span>${esc(date(b.echeance))} · ${esc(b.libelle)}</span><b>${euros((+b.prevu || 0) - (+b.paye || 0))}</b></div>`).join('')}</div>` : ''}
      <div class="app-carte table-defile"><table class="app-table"><thead><tr><th>Poste</th><th>Dépense</th><th>Prévu</th><th>Payé</th><th>Échéance du solde</th><th></th></tr></thead><tbody>
        ${parPoste.map(([p, l]) => `<tr class="sous-total"><td colspan="2"><b>${esc(p)}</b></td><td><b>${euros(l.reduce((s, b) => s + (+b.prevu || 0), 0))}</b></td><td><b>${euros(l.reduce((s, b) => s + (+b.paye || 0), 0))}</b></td><td colspan="2"></td></tr>
          ${l.map(b => `<tr><td><select data-maj="budget/${b.id}/poste">${POSTES.map(x => `<option ${x === b.poste ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></td><td>${champ(`budget/${b.id}/libelle`, b.libelle)}</td>
            <td>${champ(`budget/${b.id}/prevu`, b.prevu, 'type="number" min="0" step="10"')}</td><td>${champ(`budget/${b.id}/paye`, b.paye, 'type="number" min="0" step="10"')}</td><td>${champ(`budget/${b.id}/echeance`, b.echeance, 'type="date"')}</td><td><button class="icone" data-suppr="budget/${b.id}">✕</button></td></tr>`).join('')}`).join('')}
      </tbody></table>${budget.length ? '' : '<p class="app-note">Aucune dépense pour l\'instant.</p>'}
        <form id="f-budget" class="form-ligne" style="grid-template-columns:1.4fr 2fr 1fr auto;margin-top:14px"><label>Poste<select name="poste">${POSTES.map(x => `<option>${esc(x)}</option>`).join('')}</select></label><label>Dépense<input name="libelle" required placeholder="Acompte traiteur"></label><label>Prévu<input name="prevu" type="number" min="0" step="10"></label><button class="btn">Ajouter</button></form>
        <div class="puces" style="margin-top:12px">${budget.length ? '' : '<button class="btn petit clair" data-budget-type="1">Créer les postes habituels</button>'}<button class="btn petit clair" data-export="budget">Exporter (Excel)</button></div></div>`;
  },

  // ── Prestataires : contacts, devis, réservations, acomptes ─────────────────
  prestataires() {
    const reserves = prestataires.filter(p => p.statut === 'reserve');
    return `<div class="app-grille"><div class="app-stat"><b>${reserves.length}/${prestataires.length}</b><span>Réservés</span></div><div class="app-stat"><b>${euros(reserves.reduce((s, p) => s + (+p.montant || 0), 0))}</b><span>Engagés</span></div>
        <div class="app-stat"><b>${euros(reserves.reduce((s, p) => s + (+p.montant || 0) - (+p.verse || 0), 0))}</b><span>Reste à verser</span></div></div>
      <form class="app-carte" id="f-presta"><h2>Ajouter un prestataire</h2><div class="app-grille"><label>Métier<select name="metier">${METIERS.map(m => `<option>${esc(m)}</option>`).join('')}</select></label><label>Nom<input name="nom" required maxlength="80"></label>
        <label>Téléphone<input name="tel" type="tel"></label><label>E-mail<input name="email" type="email"></label><label>Montant du devis<input name="montant" type="number" min="0" step="10"></label></div><button class="btn">Ajouter</button></form>
      <div class="prestas">${prestataires.map(p => `<div class="app-carte presta ${esc(p.statut)}"><div class="table-tete"><div><span class="etq">${esc(p.metier)}</span><h3>${esc(p.nom)}</h3></div><button class="icone" data-suppr="prestataires/${p.id}">✕</button></div>
        <div class="app-grille"><label>Statut<select data-maj="prestataires/${p.id}/statut">${Object.entries(STATUTS).map(([k, v]) => `<option value="${k}" ${k === p.statut ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label>Montant${champ(`prestataires/${p.id}/montant`, p.montant, 'type="number" min="0" step="10"')}</label><label>Déjà versé${champ(`prestataires/${p.id}/verse`, p.verse, 'type="number" min="0" step="10"')}</label></div>
        <label>Notes (horaires, contact le jour J, ce qui est compris)<textarea data-maj="prestataires/${p.id}/notes" rows="2">${esc(p.notes || '')}</textarea></label>
        <div class="puces" style="margin-top:10px">${p.tel ? `<a class="btn petit clair" href="tel:${esc(telephone(p.tel))}">${esc(p.tel)}</a><a class="btn petit clair" target="_blank" rel="noopener" href="https://wa.me/${esc(telephone(p.tel).replace('+', ''))}">WhatsApp</a>` : ''}${p.email ? `<a class="btn petit clair" href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : ''}${p.statut === 'reserve' && !budget.some(b => b.presta === p.id) ? `<button class="btn petit clair" data-presta-budget="${p.id}">Ajouter au budget</button>` : ''}</div></div>`).join('') || '<p class="app-note">Notez ici vos pistes, devis et réservations.</p>'}</div>
      <div class="app-carte"><button class="btn petit clair" data-export="prestataires">Exporter (Excel)</button></div>`;
  },

  // ── Planning ───────────────────────────────────────────────────────────────
  planning() {
    const auj = aujourdhui(), mois = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), faites = taches.filter(t => t.fait);
    const groupes = [['En retard', taches.filter(t => !t.fait && t.echeance && t.echeance < auj)], ['Dans les 30 jours', taches.filter(t => !t.fait && (!t.echeance || (t.echeance >= auj && t.echeance <= mois)))],
      ['Plus tard', taches.filter(t => !t.fait && t.echeance > mois)], ['Faites', faites]].filter(([, l]) => l.length);
    return `<div class="app-carte"><div class="barre-outils" style="justify-content:space-between"><p><b>${faites.length}</b> tâche${faites.length > 1 ? 's' : ''} faite${faites.length > 1 ? 's' : ''} sur ${taches.length}</p>${taches.length ? '' : '<button class="btn petit" data-planning-type="1">Créer le planning type</button>'}</div>${barre(faites.length, taches.length)}
        <form id="f-tache" class="form-ligne" style="grid-template-columns:2fr 1fr auto;margin-top:14px"><label>Nouvelle tâche<input name="titre" required maxlength="120"></label><label>Pour le<input name="echeance" type="date"></label><button class="btn">Ajouter</button></form></div>
      ${groupes.map(([g, l]) => `<div class="app-carte"><h2>${g}</h2>${l.map(ligneTache).join('')}</div>`).join('')}
      <div class="app-carte"><button class="btn petit clair" data-export="planning">Exporter (Excel)</button></div>`;
  },

  souvenirs() {
    return `<div class="app-carte"><h2>Photos des invités</h2>${a('murphoto') ? '<p class="app-note" style="margin-bottom:10px">« Masquer » retire la photo du mur et de la galerie des invités, réversible ; « Supprimer » l\'efface définitivement.</p>' : '<p class="app-note">Option « Mur photo » non activée.</p>'}
      <div class="galerie">${photos.map(p => `<figure class="${p.visible ? '' : 'masquee'}"><img src="${esc(p.url)}" alt="" loading="lazy"><figcaption>${esc(p.auteur)}${p.visible ? '' : ' · masquée'}<span class="puces" style="margin-top:4px"><button class="btn petit clair" data-visible-photo="${p.id}">${p.visible ? 'Masquer' : 'Afficher'}</button><button class="btn petit clair" data-suppr-photo="${p.id}">Supprimer</button></span></figcaption></figure>`).join('')}</div></div>
      <div class="app-carte"><h2>Livre d'or</h2>${a('livredor') ? '' : '<p class="app-note">Option « Livre d\'or » non activée.</p>'}
      ${livre.map(m => `<div class="mot" style="${m.visible ? '' : 'opacity:.4'}">${m.media ? (m.media.type === 'video' ? `<video src="${esc(m.media.url)}" controls playsinline preload="metadata"></video>` : `<audio src="${esc(m.media.url)}" controls preload="metadata"></audio>`) : ''}${m.texte ? `<p>« ${esc(m.texte)} »</p>` : ''}<span>${esc(m.de)} · <a href="#" data-visible-mot="${m.id}">${m.visible ? 'masquer' : 'afficher'}</a> · <a href="#" data-suppr-mot="${m.id}">supprimer</a></span></div>`).join('')}</div>
      ${voirOption('album') ? `<div class="app-carte"><h2>Album en haute définition</h2>${noteOption('album')}<p class="app-note" style="margin-bottom:12px">Les photos du photographe et celles que vos invités ajoutent en qualité originale. Vous pouvez tout télécharger d'un coup.</p>
        <div class="puces"><label class="btn petit" style="cursor:pointer">Ajouter les photos du photographe<input type="file" accept="image/*" multiple id="i-album-photographe" hidden></label>${album.length ? `<button class="btn petit clair" data-zip="1">Tout télécharger (${album.length} photos, .zip)</button>` : ''}</div><p class="ok-msg" id="m-album">${esc(msgOption)}</p>
        <div class="galerie" style="margin-top:12px">${album.map(p => `<figure class="${p.visible ? '' : 'masquee'}"><img src="${esc(p.url)}" alt="" loading="lazy"><figcaption>${esc(p.photographe ? 'Photographe' : p.auteur)}<span class="puces" style="margin-top:4px"><button class="btn petit clair" data-visible-album="${p.id}">${p.visible ? 'Masquer' : 'Afficher'}</button><button class="btn petit clair" data-suppr-album="${p.id}">Supprimer</button></span></figcaption></figure>`).join('')}</div></div>` : ''}`;
  },

  // ── Jeux : quiz sur les mariés et pronostics, ouverture, révélation, classement ──
  jeux() {
    const q = partage.quiz || {}, brouillon = outils.quiz || {}, Q = lireQuestions(brouillon.quiz ?? MODELE_QUIZ), P = lireQuestions((brouillon.pronos ?? MODELE_PRONOS).replace(/^(?!\*)/gm, '')).map(x => ({ ...x, bonne: undefined }));
    const scores = jeuxRep.map(r => ({ prenom: r.prenom, score: (q.questions || Q).filter((x, i) => r.quiz?.[i] === x.bonne).length })).sort((x, y) => y.score - x.score);
    return `<div class="app-carte"><h2>Jeux des invités</h2>${noteOption('jeux')}
        <p class="app-note" style="margin-bottom:12px">Un quiz sur vous (avec les bonnes réponses) et des pronostics (sans bonne réponse : l'heure du premier slow, le prénom du premier enfant…). Ouvrez les jeux quand vous voulez ; les invités répondent depuis leur page, puis vous révélez les réponses et le classement.</p>
        <p><b>État :</b> ${q.revele ? 'réponses révélées' : q.ouvert ? 'ouverts aux invités' : 'pas encore ouverts'} · ${jeuxRep.length} invité${jeuxRep.length > 1 ? 's ont' : ' a'} joué</p>
        <div class="puces" style="margin-top:12px">${!q.ouvert && !q.revele ? '<button class="btn petit" data-jeux="ouvrir">Ouvrir les jeux</button>' : ''}${q.ouvert && !q.revele ? '<button class="btn petit" data-jeux="reveler">Révéler les réponses et le classement</button><button class="btn petit clair" data-jeux="fermer">Fermer sans révéler</button>' : ''}${q.revele ? '<button class="btn petit clair" data-jeux="rouvrir">Rouvrir (efface la révélation)</button>' : ''}</div>
        <p class="ok-msg">${esc(msgOption)}</p></div>
      <form class="app-carte" id="f-jeux"><h2>Les questions</h2><p class="app-note" style="margin-bottom:10px">Une question par bloc (ligne vide entre deux) : la question, puis un choix par ligne ; mettez « * » devant la bonne réponse du quiz.</p>
        <div class="app-grille"><label>Quiz (${Q.length} questions)<textarea name="quiz" rows="14">${esc(brouillon.quiz ?? MODELE_QUIZ)}</textarea></label><label>Pronostics (${P.length})<textarea name="pronos" rows="14">${esc(brouillon.pronos ?? MODELE_PRONOS)}</textarea></label></div>
        <button class="btn">Enregistrer les questions</button>${q.ouvert ? '<p class="app-note" style="margin-top:8px">Les jeux sont ouverts : enregistrer met aussi à jour les questions vues par les invités.</p>' : ''}</form>
      ${scores.length ? `<div class="app-carte"><h2>Classement provisoire</h2><ol class="classement">${scores.slice(0, 15).map(x => `<li><span>${esc(x.prenom)}</span><b>${x.score} / ${(q.questions || Q).length}</b></li>`).join('')}</ol></div>` : ''}`;
  },

  // ── Tenues coordonnées : tissus, commandes, règlements ─────────────────────
  tenues() {
    const c = partage.tenues || { tissus: [], tailles: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }, prix = id => +(c.tissus.find(x => x.id === id)?.prix || 0);
    const cmd = invites.filter(i => i.tenue?.tissu), total = cmd.reduce((s, i) => s + prix(i.tenue.tissu) * (i.tenue.qte || 1), 0), encaisse = cmd.filter(i => i.tenue.paye).reduce((s, i) => s + prix(i.tenue.tissu) * (i.tenue.qte || 1), 0);
    return `<div class="app-grille"><div class="app-stat"><b>${cmd.length}</b><span>Commandes</span></div><div class="app-stat"><b>${euros(total)}</b><span>Commandé</span></div><div class="app-stat"><b>${euros(encaisse)}</b><span>Réglé</span></div><div class="app-stat"><b>${euros(total - encaisse)}</b><span>Reste à régler</span></div></div>
      <div class="app-carte"><h2>Les tissus</h2>${noteOption('tenues')}
        ${c.tissus.map((x, k) => `<div class="ligne-conseil"><span><i class="pastille" style="background:${esc(x.couleur)}"></i><b>${esc(x.nom)}</b> · ${euros(x.prix)} / ${esc(x.unite)}${x.description ? ` · ${esc(x.description)}` : ''} · ${cmd.filter(i => i.tenue.tissu === x.id).reduce((s, i) => s + (i.tenue.qte || 1), 0)} ${esc(x.unite)}(s) commandé(s)</span><button class="icone" data-suppr-tissu="${k}">✕</button></div>`).join('') || '<p class="app-note">Ajoutez le ou les tissus de la famille (aso ebi, pagne).</p>'}
        <form id="f-tissu" class="form-ligne" style="grid-template-columns:1.6fr 70px 1fr 1fr 1.6fr auto;margin-top:12px"><label>Tissu<input name="nom" required maxlength="60" placeholder="Pagne or, famille de la mariée"></label><label>Couleur<input name="couleur" type="color" value="#C9A04A"></label><label>Prix<input name="prix" type="number" min="0" step="0.5" required></label><label>Par<select name="unite"><option>pièce</option><option>yard</option><option>mètre</option><option>tenue</option></select></label><label>Précision<input name="description" maxlength="100" placeholder="6 yards, cousu ou non"></label><button class="btn">Ajouter</button></form></div>
      <form class="app-carte" id="f-tenues-reglages"><h2>Consignes aux invités</h2><div class="app-grille">
        <label>Tailles proposées (séparées par des virgules)<input name="tailles" value="${esc((c.tailles || []).join(', '))}"></label><label>Commander avant le<input name="dateLimite" type="date" value="${esc(c.dateLimite || '')}"></label></div>
        <label>Mot d'introduction<input name="consigne" maxlength="200" value="${esc(c.consigne || '')}" placeholder="Toute la famille porte le même pagne pour la dot."></label>
        <label>Comment régler<input name="paiement" maxlength="200" value="${esc(c.paiement || '')}" placeholder="Virement à Marie (IBAN sur demande) ou espèces à Tata Rose"></label>
        <button class="btn" style="margin-top:12px">Enregistrer</button></form>
      <div class="app-carte table-defile"><h2>Les commandes</h2><table class="app-table"><thead><tr><th>Invité</th><th>Tissu</th><th>Qté</th><th>Taille</th><th>Précisions</th><th>Montant</th><th>Réglé</th></tr></thead><tbody>
        ${cmd.map(i => `<tr><td>${esc(i.nom)}</td><td>${esc(c.tissus.find(x => x.id === i.tenue.tissu)?.nom || '?')}</td><td>${i.tenue.qte || 1}</td><td>${esc(i.tenue.taille || '')}</td><td>${esc(i.tenue.note || '')}</td><td>${euros(prix(i.tenue.tissu) * (i.tenue.qte || 1))}</td><td><input type="checkbox" data-paye="${i.id}" ${i.tenue.paye ? 'checked' : ''}></td></tr>`).join('')}
      </tbody></table>${cmd.length ? '' : '<p class="app-note">Les commandes de vos invités arrivent ici.</p>'}<button class="btn petit clair" data-export="tenues" style="margin-top:12px">Exporter (Excel)</button></div>`;
  },

  // ── Remerciements : une carte par invité, avec une photo choisie et un mot ─
  merci() {
    const m = evt.merci || {}, galerie = [...album, ...photos].filter(p => p.visible !== false), presents = invites.filter(i => !declineTout(i));
    const mess = i => `Merci ${prenom(i.nom)} ! Votre carte de remerciement vous attend : ${lienPage(i.id)}`;
    return `<form class="app-carte" id="f-merci"><h2>La carte de remerciement</h2>${noteOption('merci')}
        <p class="app-note" style="margin-bottom:10px">Après la fête, chaque invité trouve en haut de sa page une carte à son prénom, avec la photo que vous choisissez pour lui et, si vous le souhaitez, un mot personnel.</p>
        <label>Votre message à tous<textarea name="texte" rows="5" maxlength="1500">${esc(m.texte || 'Merci d\'avoir été là, d\'avoir dansé, ri et partagé ce jour avec nous. Votre présence en a fait un souvenir inoubliable.')}</textarea></label>
        <label class="coche" style="margin-top:10px"><input type="checkbox" name="actif" ${m.actif ? 'checked' : ''}> Afficher la carte sur la page de chaque invité</label>
        <button class="btn" style="margin-top:12px">Enregistrer</button></form>
      <div class="app-carte table-defile"><h2>Carte par invité</h2>${galerie.length ? '' : '<p class="app-note">Les photos du mur et de l\'album apparaîtront ici pour choisir celle de chaque invité.</p>'}
        <table class="app-table"><thead><tr><th>Invité</th><th>Photo</th><th>Mot personnel</th><th>Envoyer</th></tr></thead><tbody>
        ${presents.map(i => `<tr><td><b>${esc(i.nom)}</b></td><td>${i.merci?.photo ? `<img class="vignette-merci" src="${esc(i.merci.photo)}" alt="">` : ''}${galerie.length ? `<button class="btn petit clair" data-choisir-photo="${i.id}">${i.merci?.photo ? 'Changer' : 'Choisir'}</button>` : ''}
          ${photoPour === i.id ? `<div class="choix-photos">${galerie.map(p => `<img src="${esc(p.url)}" alt="" data-photo-merci="${esc(p.url)}" loading="lazy">`).join('')}</div>` : ''}</td>
          <td><input data-mot-merci="${i.id}" value="${esc(i.merci?.mot || '')}" maxlength="300" placeholder="Merci pour ton discours, Tonton !"></td>
          <td style="white-space:nowrap">${i.tel ? `<a class="btn petit clair" target="_blank" rel="noopener" data-merci-envoye="${i.id}" href="https://wa.me/${esc(i.tel.replace('+', ''))}?text=${encodeURIComponent(mess(i))}">WhatsApp</a>` : ''}${i.email ? ` <a class="btn petit clair" data-merci-envoye="${i.id}" href="mailto:${encodeURIComponent(i.email)}?subject=${encodeURIComponent('Merci')}&body=${encodeURIComponent(mess(i))}">E-mail</a>` : ''}${i.merciEnvoye ? ' <span class="ok">envoyé</span>' : ''}</td></tr>`).join('')}
        </tbody></table></div>`;
  },

  // ── Formule et paiement : Stripe Checkout, le montant est recalculé par le serveur ──
  paiement() {
    if (!tarifs) return '<div class="app-carte"><p class="app-note">Chargement des tarifs…</p></div>';
    const g = evt.type === 'mariage' ? tarifs.mariage : tarifs.evenement, actuelle = evt.formule !== 'essai' ? evt.formule : null;
    const cible = choixFormule && g.formules[choixFormule] && (!actuelle || g.formules[choixFormule].prix >= g.formules[actuelle].prix) ? choixFormule : actuelle || 'signature';
    const acquises = new Set([...(evt.options || []), ...g.formules[cible].inclus]);
    const nouvelles = [...choixOptions].filter(o => g.options[o] && !acquises.has(o));
    const total = (actuelle ? g.formules[cible].prix - g.formules[actuelle].prix : prixF(g.formules[cible])) + nouvelles.reduce((s, o) => s + prixO(g.options[o], g.formules[cible], actuelle), 0);
    const payes = paiements.filter(p => p.etat === 'paye');
    const codeP = window.codePartenaire ? window.codePartenaire() : '', remise = codeP ? Math.round(Math.max(0, total) * 0.1) : 0;
    return `${msgPublier && !actuelle ? `<div class="app-carte bandeau-paiement ok">${esc(msgPublier)}</div>` : ''}<div class="app-carte"><h2>${actuelle ? `Votre formule : ${esc(g.formules[actuelle].nom)}` : 'Validez votre formule'}</h2>
        <p class="app-note" style="margin-bottom:14px">${actuelle ? 'Vous pouvez passer à une formule supérieure (vous ne payez que la différence) ou ajouter des options.' : 'Tout est gratuit tant que vous préparez : invitation, site, invités, plan de table, budget. Vous validez votre formule quand votre invitation vous plaît : le lien part alors à vos invités, avec votre message.'}</p>
        <div class="choix-formules">${Object.entries(g.formules).map(([k, f]) => { const bloquee = actuelle && f.prix < g.formules[actuelle].prix; return `<label class="formule-paie ${k === cible ? 'choisie' : ''} ${bloquee ? 'bloquee' : ''}"><input type="radio" name="formule" value="${k}" data-choix-formule="${k}" ${k === cible ? 'checked' : ''} ${bloquee ? 'disabled' : ''}><b>${esc(f.nom)}</b><span>${euros(actuelle ? f.prix : prixF(f))}</span>${!actuelle && prixF(f) < f.prix ? `<small>Prix de lancement, puis ${euros(f.prix)}</small>` : ''}<small>${k === actuelle ? 'Votre formule' : actuelle && !bloquee ? `+ ${euros(f.prix - g.formules[actuelle].prix)}` : `${f.inclus.length} option${f.inclus.length > 1 ? 's' : ''} incluse${f.inclus.length > 1 ? 's' : ''}`}</small></label>`; }).join('')}</div></div>
      <div class="app-carte"><h2>Options à l'unité</h2><div class="options-paie">${Object.entries(g.options).map(([k, o]) => { const deja = acquises.has(k); return `<label class="coche ${deja ? 'deja' : ''}"><input type="checkbox" data-choix-option="${k}" ${deja || choixOptions.has(k) ? 'checked' : ''} ${deja ? 'disabled' : ''}><span>${esc(o.nom)}</span><em>${deja ? ((evt.options || []).includes(k) ? 'Active' : 'Incluse') : '+ ' + euros(prixO(o, g.formules[cible], actuelle)) + (prixO(o, g.formules[cible], actuelle) < o.prix ? ` <small>puis ${euros(o.prix)}</small>` : '')}</em></label>`; }).join('')}</div></div>
      <div class="app-carte total-paie">${remise ? `<div class="ligne-conseil"><span>Remise partenaire ${esc(codeP)}</span><b>− ${euros(remise)}</b></div>` : ''}<div class="ligne-conseil"><span>Total à payer</span><b>${euros(Math.max(0, total) - remise)}</b></div>
        ${proprio ? `<label class="coche"><input type="checkbox" id="c-cgv-paie"> J'accepte les <a href="../cgv/index.html" target="_blank" rel="noopener">conditions générales de vente</a>.</label>
        <label class="coche"><input type="checkbox" id="c-debut-paie"> Je demande que la réalisation commence tout de suite ; je sais que je perdrai mon droit de rétractation une fois l'invitation validée par moi et mise en ligne.</label>
        <button class="btn" data-payer="1" ${total > 0 ? '' : 'disabled'} style="margin-top:12px">Payer ${euros(Math.max(0, total) - remise)} par carte</button><p class="app-note" style="margin-top:8px">Paiement sécurisé par Stripe : Maison Vivat ne voit jamais votre carte. Facture envoyée par courriel.</p>` : '<p class="app-note">Seul le propriétaire de l\'événement peut payer.</p>'}
        <p class="app-erreur" id="m-paiement">${esc(msgPaiement)}</p></div>
      ${payes.length ? `<div class="app-carte"><h2>Vos paiements</h2>${payes.map(p => `<div class="ligne-conseil"><span>${esc(p.payeLe?.toDate ? p.payeLe.toDate().toLocaleDateString('fr-FR') : '')} · ${esc((p.lignes || []).map(l => l.nom).join(', '))}</span><b>${euros((p.montantPaye ?? p.total) / 100)}</b></div>`).join('')}</div>` : ''}`;
  },

  // ── Équipe : co-organisateur, wedding planner, famille qui aide ────────────
  equipe() {
    const membres = equipe.map(m => `<div class="ligne-conseil"><span><b>${esc(m.nom)}</b> · ${esc(ROLES[m.role])}${m.email ? ` · ${esc(m.email)}` : ''}</span>${proprio || m.id === user.uid ? `<button class="btn petit clair" data-retirer-membre="${m.id}">${m.id === user.uid ? 'Quitter' : 'Retirer l\'accès'}</button>` : ''}</div>`).join('');
    if (!proprio) return `<div class="app-carte"><h2>L'équipe</h2>${membres}</div>`;
    return `<div class="app-carte"><h2>L'équipe</h2><p class="app-note" style="margin-bottom:12px">Donnez accès à votre espace à un co-organisateur, à votre wedding planner ou à un proche qui vous aide. Il voit et modifie les invités, le plan de table, le budget, les prestataires et le planning, mais ne peut ni gérer l'équipe ni supprimer l'événement.</p>
        ${membres || '<p class="app-note">Vous êtes seul pour l\'instant.</p>'}</div>
      <form class="app-carte" id="f-acces"><h2>Inviter dans l'équipe</h2><div class="form-ligne" style="grid-template-columns:2fr 1fr auto"><label>Pour qui<input name="nom" required maxlength="80" placeholder="Agence Lys, Maman, Marc (témoin)…"></label>
        <label>Rôle<select name="role">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label><button class="btn">Créer le lien</button></div>
        <p class="app-note" style="margin-top:10px">Le lien demande de se connecter ou de créer un compte avec une adresse e-mail. Envoyez-le à la personne concernée seulement ; retirez-le une fois utilisé.</p></form>
      ${acces.length ? `<div class="app-carte"><h2>Liens d'accès actifs</h2>${acces.map(c => `<div class="ligne-conseil"><span><b>${esc(c.nom)}</b> · ${esc(ROLES[c.role])}${equipe.some(m => m.code === c.id) ? ' · utilisé' : ''}</span><span class="puces"><button class="btn petit clair" data-copier-acces="${c.id}">Copier le lien</button><button class="btn petit clair" data-suppr="acces/${c.id}">Retirer</button></span></div>`).join('')}<p class="ok-msg" id="m-copie"></p></div>` : ''}`;
  },

  // ── Liste de cadeaux et cagnotte : Maison Vivat ne touche jamais l'argent ──
  cadeaux() {
    const cg = evt.cagnotte || {}, sur = u => /^https:\/\//.test(u || '');
    return `<form class="app-carte" id="f-cagnotte"><h2>La cagnotte</h2>
        <p class="app-note" style="margin-bottom:12px">Collez le lien de votre cagnotte (Lydia, Leetchi, PayPal…). Vos invités y participent directement : Maison Vivat ne prélève rien et ne touche jamais l'argent.</p>
        <div class="app-grille"><label>Lien de la cagnotte<input name="lien" type="url" value="${esc(cg.lien || '')}" placeholder="https://…"></label>
        <label>Texte du bouton<input name="libelle" maxlength="60" value="${esc(cg.libelle || 'Participer à la cagnotte')}"></label></div>
        <label style="margin-top:10px">Un mot pour vos invités<textarea name="texte" rows="2" maxlength="300">${esc(cg.texte || 'Votre présence est notre plus beau cadeau. Pour ceux qui le souhaitent :')}</textarea></label>
        <button class="btn" style="margin-top:12px">Enregistrer</button><p class="ok-msg" id="m-cagnotte"></p></form>
      <div class="app-carte"><h2>La liste de cadeaux</h2>
        <p class="app-note">Ajoutez les cadeaux qui vous feraient plaisir. Un invité réserve celui qu'il offre : les autres le voient pris, il n'y a pas de doublon. Il l'achète où il veut, ou dans la boutique que vous indiquez.</p>
        <form id="f-cadeau" class="app-grille" style="margin-top:12px"><label>Cadeau<input name="nom" required maxlength="80" placeholder="Service à thé"></label>
          <label>Prix indicatif (€)<input name="prix" type="number" min="0" step="1"></label>
          <label>Lien vers la boutique (facultatif)<input name="lien" type="url" placeholder="https://…"></label><button class="btn" style="align-self:end">Ajouter</button></form>
        ${cadeaux.length ? `<table class="app-table" style="margin-top:14px"><thead><tr><th>Cadeau</th><th>Prix</th><th>Offert par</th><th></th></tr></thead><tbody>${cadeaux.map(c => `<tr>
          <td>${sur(c.lien) ? `<a class="lien-or" href="${esc(c.lien)}" target="_blank" rel="noopener">${esc(c.nom)}</a>` : esc(c.nom)}</td><td>${c.prix ? euros(c.prix) : ''}</td>
          <td>${c.reservePar ? esc(c.reserveNom || 'Un invité') : '<span class="app-note">Disponible</span>'}</td><td><button class="icone" data-suppr="cadeaux/${c.id}" title="Supprimer">✕</button></td></tr>`).join('')}</tbody></table>`
          : '<p class="app-note" style="margin-top:12px">Aucun cadeau pour l\'instant.</p>'}</div>`;
  },

  reglages() {
    return `<form class="app-carte" id="f-reglages"><h2>Informations</h2><div class="app-grille">
        <label>Prénoms ou titre<input name="titre" value="${esc(evt.titre)}" required maxlength="120"></label>
        <label>Date et heure<input name="date" type="datetime-local" value="${esc(evt.date)}" required></label>
        <label>Lieu<input name="lieu" value="${esc(evt.lieu)}" required></label>
        <label>Collection du faire-part<input name="modele" value="${esc(evt.modele || '')}" placeholder="lakay"></label>
        <label>Date limite de réponse<input name="dateLimiteReponse" type="date" value="${esc(evt.dateLimiteReponse || '')}"></label></div>
        <label style="margin-top:6px">Code d'accès du site (facultatif)<input name="code" maxlength="20" autocomplete="off" placeholder="${evt.codeAcces ? 'Un code est en place : tapez-en un nouveau, ou « aucun » pour le retirer' : 'Par exemple : NAIKA2027'}"></label>
        <p class="app-note">Avec un code, la page générale de l'invitation n'est visible qu'aux personnes qui le connaissent. Les liens personnels envoyés à vos invités s'ouvrent toujours directement.</p>
        <label class="coche" style="margin-top:6px"><input type="checkbox" name="notifReponses" ${evt.notifReponses === false ? '' : 'checked'}> Recevoir un courriel à chaque réponse d'invité</label>
        <p class="app-note">Les invités dont vous avez l'adresse e-mail reçoivent un rappel 7 jours puis 1 jour avant la date limite s'ils n'ont pas répondu, et la veille de l'événement s'ils viennent.</p>
        ${a('direct') ? `<label style="margin-top:12px">Lien du direct (YouTube non répertorié, par exemple)<input name="live" id="i-live" placeholder="https://www.youtube.com/watch?v=…"></label>` : ''}
        <button class="btn" style="margin-top:14px">Enregistrer</button><p class="ok-msg" id="m-reglages"></p></form>
      <div class="app-carte"><h2>Exporter vos données</h2><p class="app-note" style="margin-bottom:12px">Des fichiers qui s'ouvrent dans Excel, Numbers ou Google Sheets : pour le traiteur, le lieu, le wedding planner, ou vos archives.</p>
        <div class="puces">${Object.entries({ invites: 'Invités et réponses', plan: 'Plan de table', budget: 'Budget', prestataires: 'Prestataires', planning: 'Planning' }).map(([k, v]) => `<button class="btn petit clair" data-export="${k}">${v}</button>`).join('')}</div></div>`;
  },
};

const ligneTache = t => `<div class="tache ${t.fait ? 'faite' : ''} ${!t.fait && t.echeance && t.echeance < aujourdhui() ? 'retard' : ''}"><label class="coche"><input type="checkbox" data-fait="${t.id}" ${t.fait ? 'checked' : ''}><span>${esc(t.titre)}</span></label>
  <input type="date" data-maj="taches/${t.id}/echeance" value="${esc(t.echeance || '')}" aria-label="Échéance"><button class="icone" data-suppr="taches/${t.id}" title="Supprimer">✕</button></div>`;

// Empreinte du code d'accès : le code lui-même n'est jamais enregistré.
async function empreinte(e, code) {
  const o = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(e + ':' + code.trim().toUpperCase()));
  return [...new Uint8Array(o)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function lienEnvoi(i, canal, relance) {
  const m = { ...MESSAGES, ...outils.messages }, texte = remplir(relance ? m.relance : m.invitation, { prenom: prenom(i.nom), titre: evt.titre, date: dateLongue(evt.date), lien: lienInvite(i.id) });
  if (canal === 'WhatsApp') return `https://wa.me/${(i.tel || '').replace('+', '')}?text=${encodeURIComponent(texte)}`;
  if (canal === 'SMS') return `sms:${i.tel}?&body=${encodeURIComponent(texte)}`;
  return `mailto:${encodeURIComponent(i.email || '')}?subject=${encodeURIComponent(evt.titre)}&body=${encodeURIComponent(texte)}`;
}

function appliquerRecherche() {
  const r = recherche.trim().toLowerCase();
  document.querySelectorAll('tr[data-texte]').forEach(tr => { tr.hidden = !!r && !tr.dataset.texte.includes(r); });
}

// ── Exports ─────────────────────────────────────────────────────────────────
function exporter(quoi) {
  const C = evt.ceremonies || [], nom = s => `${evt.titre.replace(/[^\p{L}\d]+/gu, '-')}-${s}.csv`;
  if (quoi === 'invites') telechargerCSV(nom('invites'), [['Nom', 'Groupe', 'Téléphone', 'E-mail', ...C.map(c => c.nom), 'Accompagnants', 'Maximum', 'Table', 'Régime', 'Message', 'Envoyé le', 'Lien personnel'],
    ...invites.map(i => [i.nom, i.groupe, i.tel, i.email, ...C.map(c => !i.ceremonies?.includes(c.cle) ? '' : ({ oui: 'Oui', non: 'Non' })[i.reponses?.[c.cle]] || 'Sans réponse'), i.accompagnants ?? '', i.max, i.tableNom, i.regime, i.message, dateTs(i.envoi?.le), lienInvite(i.id)])]);
  if (quoi === 'plan') telechargerCSV(nom('plan-de-table'), [['Table', 'Invité', 'Personnes', 'Régime'], ...tables.flatMap(t => invites.filter(i => i.table === t.id && !declineTout(i)).map(i => [t.nom, i.nom, personnes(i), i.regime])),
    ...invites.filter(i => !declineTout(i) && !tables.some(t => t.id === i.table)).map(i => ['Sans table', i.nom, personnes(i), i.regime])]);
  if (quoi === 'budget') telechargerCSV(nom('budget'), [['Poste', 'Dépense', 'Prévu', 'Payé', 'Reste', 'Échéance'], ...budget.map(b => [b.poste, b.libelle, +b.prevu || 0, +b.paye || 0, (+b.prevu || 0) - (+b.paye || 0), b.echeance])]);
  if (quoi === 'prestataires') telechargerCSV(nom('prestataires'), [['Métier', 'Nom', 'Statut', 'Téléphone', 'E-mail', 'Montant', 'Versé', 'Notes'], ...prestataires.map(p => [p.metier, p.nom, STATUTS[p.statut], p.tel, p.email, p.montant, p.verse, p.notes])]);
  if (quoi === 'tenues') { const c = partage.tenues || { tissus: [] }; telechargerCSV(nom('tenues'), [['Invité', 'Tissu', 'Quantité', 'Taille', 'Précisions', 'Montant', 'Réglé'], ...invites.filter(i => i.tenue?.tissu).map(i => { const x = c.tissus.find(y => y.id === i.tenue.tissu); return [i.nom, x?.nom, i.tenue.qte || 1, i.tenue.taille, i.tenue.note, (+x?.prix || 0) * (i.tenue.qte || 1), i.tenue.paye ? 'Oui' : 'Non']; })]); }
  if (quoi === 'planning') telechargerCSV(nom('planning'), [['Tâche', 'Échéance', 'Faite'], ...taches.map(t => [t.titre, t.echeance, t.fait ? 'Oui' : 'Non'])]);
}

// ── Album : dépôt des photos du photographe (originales) et téléchargement de tout l'album en .zip ──
async function deposerAlbum(fichiers) {
  const uid = user.uid;
  try {
    for (const [k, fi] of fichiers.entries()) {
      msgOption = `Envoi ${k + 1} sur ${fichiers.length}…`; if ($('#m-album')) $('#m-album').textContent = msgOption;
      const chemin = `events/${E}/album/${uid}/${Date.now()}-${k}.${(fi.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')}`, r = ref(storage, chemin);
      await uploadBytes(r, fi, { contentType: fi.type || 'image/jpeg' });
      await addDoc(collection(db, `events/${E}/album`), { auteur: 'Photographe', photographe: true, chemin, url: await getDownloadURL(r), nom: fi.name.slice(0, 120), creeLe: serverTimestamp(), visible: true });
    }
    msgOption = `${fichiers.length} photo${fichiers.length > 1 ? 's ajoutées' : ' ajoutée'} à l'album.`;
  } catch (e) { console.error('Album', e); msgOption = 'Une photo n\'a pas pu être envoyée (40 Mo au plus par photo). Réessayez.'; }
  rendre();
}
async function toutTelecharger(bouton) {
  bouton.disabled = true;
  try {
    const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
    const zip = new JSZip(), noms = new Set();
    for (const [k, p] of album.entries()) {
      bouton.textContent = `Préparation ${k + 1} / ${album.length}…`;
      let n = (p.nom || `photo-${k + 1}.jpg`).replace(/[\\/:*?"<>|]/g, '-'); while (noms.has(n)) n = `${k + 1}-${n}`; noms.add(n);
      zip.file((p.photographe ? 'Photographe/' : 'Invités/') + n, await (await fetch(p.url)).blob());
    }
    const blob = await zip.generateAsync({ type: 'blob' }), u = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: u, download: `${evt.titre.replace(/[^\p{L}\d]+/gu, '-')}-album.zip` }).click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
  } catch (e) { console.error('Zip', e); alerteZip(); }
  rendre();
}
const alerteZip = () => { msgOption = 'Le téléchargement groupé a échoué ; téléchargez les photos une à une.'; };

// ── Écritures ───────────────────────────────────────────────────────────────
async function lots(ecritures) {   // par paquets de 400 (limite Firestore : 500 par lot)
  for (let k = 0; k < ecritures.length; k += 400) { const b = writeBatch(db); ecritures.slice(k, k + 400).forEach(f => f(b)); await b.commit(); }
}
const placer = (id, tableId) => { const t = tables.find(x => x.id === tableId); return updateDoc(doc(db, `events/${E}/invites/${id}`), { table: t ? t.id : '', tableNom: t ? t.nom : '' }); };
async function majDeroule(items) {
  items = items.sort((x, y) => (x.heure || '').localeCompare(y.heure || ''));
  await setDoc(doc(db, `events/${E}/outils/deroule`), { items });
  await updateDoc(doc(db, 'events', E), { deroulePublic: items.filter(d => d.public).map(({ heure, titre, lieu }) => ({ heure, titre, lieu: lieu || '' })) });
}
const MODELE_QUIZ = `Où nous sommes-nous rencontrés ?
À une fête chez des amis
*À l'église
Au travail

Qui a dit « je t'aime » le premier ?
*Elle
Lui

Quel est notre plat préféré ?
Le griot
*Le poulet DG
La pizza`;
const MODELE_PRONOS = `À quelle heure la piste sera-t-elle pleine ?
Avant 22 h
Entre 22 h et minuit
Après minuit

Qui pleurera le premier pendant la cérémonie ?
La mariée
Le marié
Une maman`;
const DEROULE_TYPE = [['14:00', 'Préparatifs, photos des mariés', 'Photographe'], ['15:00', 'Cérémonie', 'Officiant', true], ['16:30', 'Vin d\'honneur', 'Traiteur', true], ['17:30', 'Photos de groupe', 'Photographe, témoins', true],
  ['19:30', 'Entrée des mariés', 'DJ', true], ['20:00', 'Dîner', 'Traiteur', true], ['21:30', 'Discours et surprises', 'Témoins', true], ['22:30', 'Ouverture du bal', 'DJ', true], ['23:30', 'Gâteau', 'Traiteur', true]];

// ── Actions ─────────────────────────────────────────────────────────────────
document.addEventListener('click', async ev => {
  const img = ev.target.closest('[data-photo-merci]');
  if (img && E && photoPour) { const id = photoPour; photoPour = null; return updateDoc(doc(db, `events/${E}/invites/${id}`), { 'merci.photo': img.dataset.photoMerci }); }
  const t = ev.target.closest('button, a'); if (!t || !E) return;
  const d = t.dataset, C = evt.ceremonies || [];
  if (d.apercu) return apercu(d.apercu);
  if (d.lien) { location.href = d.lien; return; }
  if (d.changerCollection) { choisirCollection = !choisirCollection; return rendre(); }
  if (d.collection) { choisirCollection = false; await updateDoc(doc(db, 'events', E), { modele: d.collection }); return; }
  if (d.retirerCollection) { if (!confirm('Retirer cette collection ? Votre personnalisation est conservée ; vous en choisirez une autre.')) return; choisirCollection = false; await updateDoc(doc(db, 'events', E), { modele: '' }); return; }
  if (d.onglet) { onglet = d.onglet; msgImport = ''; msgPlacement = ''; msgOption = ''; avantPlacement = null; photoPour = null; rendre(); scrollTo(0, 0); if (onglet === 'reglages' && a('direct')) { const c = await getDoc(doc(db, `events/${E}/prive/config`)); if ($('#i-live')) $('#i-live').value = c.data()?.live || ''; } return; }
  if (d.filtreEnvoi) { filtreEnvoi = d.filtreEnvoi; return rendre(); }
  if ((d.copier || d.copierMessage || d.envoi) && evt.formule === 'essai') {   // gratuit jusqu'à la publication : l'envoi aux invités se débloque au paiement
    ev.preventDefault(); onglet = 'paiement';
    msgPublier = 'Votre invitation est prête à partir. Validez votre formule pour l\'envoyer à vos invités : tout ce que vous avez préparé reste en place, rien n\'est à refaire.';
    rendre(); scrollTo(0, 0); return;
  }
  if (d.copier) { await navigator.clipboard?.writeText(lienInvite(d.copier)).catch(() => {}); $('#m-copie').textContent = 'Lien copié : ' + lienInvite(d.copier); return; }
  if (d.copierMessage) { const i = invites.find(x => x.id === d.copierMessage), m = { ...MESSAGES, ...outils.messages };
    await navigator.clipboard?.writeText(remplir(filtreEnvoi === 'relance' ? m.relance : m.invitation, { prenom: prenom(i.nom), titre: evt.titre, date: dateLongue(evt.date), lien: lienInvite(i.id) })).catch(() => {});
    $('#m-copie').textContent = `Message de ${i.nom} copié.`; return; }
  if (d.copierAcces) { await navigator.clipboard?.writeText(lienEquipe(d.copierAcces)).catch(() => {}); $('#m-copie').textContent = 'Lien copié : ' + lienEquipe(d.copierAcces); return; }
  if (d.envoi) {   // le lien s'ouvre normalement (WhatsApp, SMS, messagerie) ; on note l'envoi ou la relance
    const i = invites.find(x => x.id === d.envoi), champ = filtreEnvoi === 'relance' && i.envoi ? 'relance' : 'envoi';
    return updateDoc(doc(db, `events/${E}/invites/${i.id}`), champ === 'relance' ? { relance: { le: serverTimestamp(), n: (i.relance?.n || 0) + 1, canal: d.canal } } : { envoi: { le: serverTimestamp(), canal: d.canal } });
  }
  if (d.supprInvite) return deleteDoc(doc(db, `events/${E}/invites/${d.supprInvite}`));
  if (d.supprCer) { const L = [...C]; L.splice(+d.supprCer, 1); return updateDoc(doc(db, 'events', E), { ceremonies: L }); }
  if (d.supprPhoto) { const p = photos.find(x => x.id === d.supprPhoto); await deleteObject(ref(storage, p.chemin)).catch(() => {}); return deleteDoc(doc(db, `events/${E}/photos/${p.id}`)); }
  if (d.visiblePhoto) { const p = photos.find(x => x.id === d.visiblePhoto); return updateDoc(doc(db, `events/${E}/photos/${p.id}`), { visible: !p.visible }); }
  if (d.visibleMot) { ev.preventDefault(); const m = livre.find(x => x.id === d.visibleMot); return updateDoc(doc(db, `events/${E}/livre/${m.id}`), { visible: !m.visible }); }
  if (d.supprMot) { ev.preventDefault(); const m = livre.find(x => x.id === d.supprMot); if (m?.media) await deleteObject(ref(storage, m.media.chemin)).catch(() => {}); return deleteDoc(doc(db, `events/${E}/livre/${d.supprMot}`)); }
  if (d.suppr) return deleteDoc(doc(db, `events/${E}/${d.suppr}`));
  if (d.importer && apercuImport) {
    const l = apercuImport; apercuImport = null;
    await lots(l.map(i => b => b.set(doc(db, `events/${E}/invites/${jeton()}`), { ...i, reponses: {}, creeLe: serverTimestamp() })));
    msgImport = `${l.length} invités importés.`; rendre(); return;
  }
  if (d.annulerImport) { apercuImport = null; msgImport = ''; return rendre(); }
  if (d.tablesType) return lots(Array.from({ length: 10 }, (_, k) => b => b.set(doc(collection(db, `events/${E}/tables`)), { nom: `Table ${k + 1}`, places: 10, ordre: k + 1 })));
  if (d.supprTable) { await lots(invites.filter(i => i.table === d.supprTable).map(i => b => b.update(doc(db, `events/${E}/invites/${i.id}`), { table: '', tableNom: '' }))); return deleteDoc(doc(db, `events/${E}/tables/${d.supprTable}`)); }
  if (d.budgetType) return lots(POSTES.map(p => b => b.set(doc(collection(db, `events/${E}/budget`)), { poste: p, libelle: p, prevu: 0, paye: 0 })));
  if (d.prestaBudget) { const p = prestataires.find(x => x.id === d.prestaBudget);
    const poste = { Lieu: 'Lieu de réception', Traiteur: 'Traiteur et boissons', Photographe: 'Photo et vidéo', Vidéaste: 'Photo et vidéo', 'DJ ou orchestre': 'Musique et animation', Fleuriste: 'Décoration et fleurs', Décorateur: 'Décoration et fleurs', Pâtissier: 'Gâteau et douceurs', 'Coiffure et maquillage': 'Tenues, coiffure et beauté', 'Couturier ou créateur': 'Tenues, coiffure et beauté', 'Location de voitures': 'Transport', Officiant: 'Cérémonies (mairie, culte, coutumier, dot)' }[p.metier] || 'Divers';
    return addDoc(collection(db, `events/${E}/budget`), { poste, libelle: `${p.metier} · ${p.nom}`, prevu: +p.montant || 0, paye: +p.verse || 0, presta: p.id }); }
  if (d.planningType) return lots(planningType(evt.type, evt.date).map(x => b => b.set(doc(collection(db, `events/${E}/taches`)), x)));
  if (d.derouleType) return majDeroule(DEROULE_TYPE.map(([heure, titre, qui, pub]) => ({ heure, titre, lieu: '', qui, public: !!pub })));
  if (d.supprDeroule) { const L = [...(outils.deroule?.items || [])]; L.splice(+d.supprDeroule, 1); return majDeroule(L); }
  if (d.export) return exporter(d.export);
  if (d.payer) {
    if (!$('#c-cgv-paie')?.checked) { msgPaiement = 'Cochez l\'acceptation des conditions générales de vente.'; return rendre(); }
    const g = evt.type === 'mariage' ? tarifs.mariage : tarifs.evenement, formule = document.querySelector('[data-choix-formule]:checked')?.value;
    t.disabled = true; t.textContent = 'Ouverture du paiement sécurisé…'; msgPaiement = '';
    try {
      const r = await httpsCallable(fonctions, 'creerPaiement')({ eventId: E, formule, ajouts: [...choixOptions].filter(o => g.options[o]), debutImmediat: !!$('#c-debut-paie')?.checked, partenaire: window.codePartenaire ? window.codePartenaire() : '' });
      location.href = r.data.url;
    } catch (e) {
      // Les refus du serveur (formule, options, propriétaire) sont déjà rédigés en français ; le reste reçoit un message clair.
      console.error('Paiement', e);
      msgPaiement = ['functions/failed-precondition', 'functions/permission-denied', 'functions/unauthenticated', 'functions/not-found'].includes(e.code) ? e.message
        : 'Le paiement n\'a pas pu s\'ouvrir. Réessayez dans un instant ; si cela continue, écrivez à contact@maisonvivat.com.';
      t.disabled = false; rendre();
    }
    return;
  }
  if (d.jeux) {
    const brouillon = outils.quiz || {}, Q = lireQuestions(brouillon.quiz ?? MODELE_QUIZ), P = lireQuestions(brouillon.pronos ?? MODELE_PRONOS).map(({ q, choix }) => ({ q, choix }));
    const publiques = Q.map(({ q, choix }) => ({ q, choix }));
    if (d.jeux === 'ouvrir' || d.jeux === 'rouvrir') { await setDoc(doc(db, `events/${E}/partage/quiz`), { ouvert: true, revele: false, questions: publiques, pronos: P }); await deleteDoc(doc(db, `events/${E}/partage/classement`)).catch(() => {}); msgOption = 'Les jeux sont ouverts : vos invités les voient sur leur page.'; }
    if (d.jeux === 'fermer') { await setDoc(doc(db, `events/${E}/partage/quiz`), { ouvert: false, revele: false, questions: publiques, pronos: P }); msgOption = 'Jeux fermés.'; }
    if (d.jeux === 'reveler') {
      const quiz = jeuxRep.map(r => ({ prenom: r.prenom, score: Q.filter((x, i) => r.quiz?.[i] === x.bonne).length, sur: Q.length })).sort((x, y) => y.score - x.score);
      const pronos = P.map((x, i) => x.choix.map((_, k) => jeuxRep.filter(r => r.pronos?.[i] === k).length));
      await setDoc(doc(db, `events/${E}/partage/classement`), { quiz, pronos: Object.fromEntries(pronos.map((x, i) => [i, x])) });
      await setDoc(doc(db, `events/${E}/partage/quiz`), { ouvert: true, revele: true, questions: Q, pronos: P });
      msgOption = 'Réponses et classement révélés.';
    }
    return rendre();
  }
  if (d.supprTissu) { const c = partage.tenues || { tissus: [] }; const L = [...c.tissus]; L.splice(+d.supprTissu, 1); return setDoc(doc(db, `events/${E}/partage/tenues`), { tissus: L }, { merge: true }); }
  if (d.choisirPhoto) { photoPour = photoPour === d.choisirPhoto ? null : d.choisirPhoto; return rendre(); }
  if (d.merciEnvoye) return updateDoc(doc(db, `events/${E}/invites/${d.merciEnvoye}`), { merciEnvoye: serverTimestamp() });
  if (d.visibleAlbum) { const p = album.find(x => x.id === d.visibleAlbum); return updateDoc(doc(db, `events/${E}/album/${p.id}`), { visible: !p.visible }); }
  if (d.supprAlbum) { const p = album.find(x => x.id === d.supprAlbum); await deleteObject(ref(storage, p.chemin)).catch(() => {}); return deleteDoc(doc(db, `events/${E}/album/${p.id}`)); }
  if (d.zip) return toutTelecharger(t);
  if (d.supprLien) { const L = [...(outils.placement?.liens || [])]; L.splice(+d.supprLien, 1); return setDoc(doc(db, `events/${E}/outils/placement`), { liens: L }); }
  if (d.proposer) {
    const attendus = invites.filter(i => !declineTout(i)), r = proposerPlacement(attendus, tables, outils.placement?.liens || [], { garder: d.proposer === 'garder' });
    avantPlacement = Object.fromEntries(attendus.map(i => [i.id, i.table || '']));
    const changes = attendus.filter(i => (r.place[i.id] || '') !== (i.table || ''));
    await lots(changes.map(i => b => { const t = tables.find(x => x.id === r.place[i.id]); b.update(doc(db, `events/${E}/invites/${i.id}`), { table: t?.id || '', tableNom: t?.nom || '' }); }));
    msgPlacement = (r.infractions.length ? `⚠ ${r.infractions.length} contrainte${r.infractions.length > 1 ? 's' : ''} impossible${r.infractions.length > 1 ? 's' : ''} à respecter avec ces tables. ` : '')
      + `${changes.length} invité${changes.length > 1 ? 's' : ''} placé${changes.length > 1 ? 's' : ''} ou déplacé${changes.length > 1 ? 's' : ''}.`
      + (r.debordement.length ? ` Tables trop pleines : ${r.debordement.join(', ')} ; ajoutez des places ou une table.` : '');
    return rendre();
  }
  if (d.annulerPlacement && avantPlacement) {
    const avant = avantPlacement; avantPlacement = null; msgPlacement = 'Placement annulé.';
    await lots(invites.filter(i => i.id in avant && (i.table || '') !== avant[i.id]).map(i => b => { const t = tables.find(x => x.id === avant[i.id]); b.update(doc(db, `events/${E}/invites/${i.id}`), { table: t?.id || '', tableNom: t?.nom || '' }); }));
    return rendre();
  }
  if (d.retirerMembre) {
    await deleteDoc(doc(db, `events/${E}/equipe/${d.retirerMembre}`));
    if (d.retirerMembre === user.uid) { await deleteDoc(doc(db, `utilisateurs/${user.uid}/acces/${E}`)).catch(() => {}); location.href = 'organisateur.html'; }
  }
});

// Champs modifiés sur place : data-maj="collection/id/champ" (nombres convertis), cases à cocher, plan de table.
document.addEventListener('change', async ev => {
  const t = ev.target; if (!E) return;
  if (t.dataset.maj) { const [col, id, champ] = t.dataset.maj.split('/'), v = t.type === 'number' ? (t.value === '' ? 0 : +t.value) : t.value; return setDoc(doc(db, `events/${E}/${col}/${id}`), { [champ]: v }, { merge: true }); }
  if (t.dataset.choixFormule) { choixFormule = t.dataset.choixFormule; msgPaiement = ''; return rendre(); }
  if (t.dataset.choixOption) { t.checked ? choixOptions.add(t.dataset.choixOption) : choixOptions.delete(t.dataset.choixOption); msgPaiement = ''; return rendre(); }
  if (t.dataset.paye) return updateDoc(doc(db, `events/${E}/invites/${t.dataset.paye}`), { 'tenue.paye': t.checked });
  if (t.dataset.motMerci) return updateDoc(doc(db, `events/${E}/invites/${t.dataset.motMerci}`), { 'merci.mot': t.value.slice(0, 300) });
  if (t.id === 'i-album-photographe' && t.files.length) return deposerAlbum([...t.files]);
  if (t.dataset.fait) return updateDoc(doc(db, `events/${E}/taches/${t.dataset.fait}`), { fait: t.checked, faitLe: t.checked ? aujourdhui() : '' });
  if (t.dataset.placer !== undefined) return placer(t.dataset.placer, t.value);
  if ('tablesVisibles' in t.dataset) return updateDoc(doc(db, 'events', E), { tablesVisibles: t.checked });
  if (t.dataset.renommerTable) { const id = t.dataset.renommerTable, nom = t.value.trim().slice(0, 40); if (!nom) return;
    await updateDoc(doc(db, `events/${E}/tables/${id}`), { nom });
    return lots(invites.filter(i => i.table === id).map(i => b => b.update(doc(db, `events/${E}/invites/${i.id}`), { tableNom: nom }))); }
  if (t.dataset.deroule) { const [k, champ] = t.dataset.deroule.split(':'), L = (outils.deroule?.items || []).map(x => ({ ...x })); L[+k][champ] = t.type === 'checkbox' ? t.checked : t.value; return majDeroule(L); }
  if (t.id === 'i-csv' && t.files[0]) { const f = $('#f-import'); f.texte.value = await t.files[0].text(); f.requestSubmit(); }
});
document.addEventListener('input', ev => { if (ev.target.id === 'recherche') { recherche = ev.target.value; appliquerRecherche(); } });

// Glisser-déposer des convives d'une table à l'autre.
document.addEventListener('dragstart', ev => { const c = ev.target.closest?.('[data-glisser]'); if (c) { ev.dataTransfer.setData('text/plain', c.dataset.glisser); ev.dataTransfer.effectAllowed = 'move'; } });
document.addEventListener('dragover', ev => { const z = ev.target.closest?.('[data-deposer]'); if (z) { ev.preventDefault(); z.classList.add('survol'); } });
document.addEventListener('dragleave', ev => { const z = ev.target.closest?.('[data-deposer]'); if (z && !z.contains(ev.relatedTarget)) z.classList.remove('survol'); });
document.addEventListener('drop', ev => { const z = ev.target.closest?.('[data-deposer]'); if (!z) return; ev.preventDefault(); z.classList.remove('survol'); const id = ev.dataTransfer.getData('text/plain'); if (id) placer(id, z.dataset.deposer); });

document.addEventListener('submit', async ev => {
  if (!E) return; ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target)), C = evt.ceremonies || [], id = ev.target.id;
  if (id === 'f-invite') {
    const choisies = C.length > 1 && a('ceremonies') ? C.filter(c => f['c_' + c.cle]).map(c => c.cle) : C.map(c => c.cle);
    ev.target.reset();
    await setDoc(doc(db, `events/${E}/invites/${jeton()}`), { nom: f.nom.trim(), max: Math.max(0, +f.max || 0), tel: telephone(f.tel), email: f.email.trim(), groupe: f.groupe.trim(), ceremonies: choisies, reponses: {}, creeLe: serverTimestamp() });
  }
  if (id === 'f-import') { apercuImport = invitesDepuisCSV(lireCSV(f.texte || ''), C); if (!apercuImport.length) apercuImport = null; msgImport = apercuImport ? '' : 'Aucun invité reconnu : vérifiez qu\'il y a au moins une colonne de noms.'; document.activeElement?.blur(); rendre(); }
  if (id === 'f-messages') { await setDoc(doc(db, `events/${E}/outils/messages`), { invitation: f.invitation, relance: f.relance }); if ($('#m-messages')) $('#m-messages').textContent = 'Messages enregistrés.'; }
  if (id === 'f-lien') {
    if (!f.a || !f.b || f.a === f.b) { msgPlacement = '⚠ Choisissez deux invités différents.'; return rendre(); }
    const L = (outils.placement?.liens || []).filter(l => !((l.a === f.a && l.b === f.b) || (l.a === f.b && l.b === f.a)));
    msgPlacement = ''; ev.target.reset();
    await setDoc(doc(db, `events/${E}/outils/placement`), { liens: [...L, { a: f.a, b: f.b, type: f.type }] });
  }
  if (id === 'f-table') { ev.target.reset(); await addDoc(collection(db, `events/${E}/tables`), { nom: f.nom.trim(), places: Math.max(1, +f.places || 10), ordre: tables.length + 1 }); }
  if (id === 'f-budget') { ev.target.reset(); await addDoc(collection(db, `events/${E}/budget`), { poste: f.poste, libelle: f.libelle.trim(), prevu: +f.prevu || 0, paye: 0 }); }
  if (id === 'f-presta') { ev.target.reset(); await addDoc(collection(db, `events/${E}/prestataires`), { metier: f.metier, nom: f.nom.trim(), tel: f.tel.trim(), email: f.email.trim(), montant: +f.montant || 0, verse: 0, statut: f.montant ? 'devis' : 'piste', notes: '' }); }
  if (id === 'f-cagnotte') {
    const lien = f.lien.trim();
    await updateDoc(doc(db, 'events', E), { cagnotte: { lien: /^https:\/\//.test(lien) ? lien : '', libelle: f.libelle.trim() || 'Participer à la cagnotte', texte: f.texte.trim() } });
    if ($('#m-cagnotte')) $('#m-cagnotte').textContent = lien && !/^https:\/\//.test(lien) ? 'Le lien doit commencer par https://' : 'Enregistré.';
  }
  if (id === 'f-cadeau') { ev.target.reset(); await addDoc(collection(db, `events/${E}/cadeaux`), { nom: f.nom.trim(), prix: +f.prix || 0, lien: /^https:\/\//.test(f.lien.trim()) ? f.lien.trim() : '', reservePar: null, creeLe: serverTimestamp() }); }
  if (id === 'f-tache') { ev.target.reset(); await addDoc(collection(db, `events/${E}/taches`), { titre: f.titre.trim(), echeance: f.echeance || '', fait: false, ordre: taches.length }); }
  if (id === 'f-deroule') { ev.target.reset(); await majDeroule([...(outils.deroule?.items || []), { heure: f.heure, titre: f.titre.trim(), lieu: f.lieu.trim(), qui: f.qui.trim(), public: true }]); }
  if (id === 'f-jeux') {
    await setDoc(doc(db, `events/${E}/outils/quiz`), { quiz: f.quiz, pronos: f.pronos });
    if (partage.quiz?.ouvert && !partage.quiz?.revele) await setDoc(doc(db, `events/${E}/partage/quiz`), { ouvert: true, revele: false, questions: lireQuestions(f.quiz).map(({ q, choix }) => ({ q, choix })), pronos: lireQuestions(f.pronos).map(({ q, choix }) => ({ q, choix })) });
    msgOption = 'Questions enregistrées.'; document.activeElement?.blur(); rendre();
  }
  if (id === 'f-tissu') {
    const c = partage.tenues || { tissus: [], tailles: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }; ev.target.reset();
    await setDoc(doc(db, `events/${E}/partage/tenues`), { tailles: c.tailles || [], consigne: c.consigne || '', paiement: c.paiement || '', dateLimite: c.dateLimite || '', tissus: [...(c.tissus || []), { id: jeton().slice(0, 8), nom: f.nom.trim(), couleur: f.couleur, prix: +f.prix || 0, unite: f.unite, description: f.description.trim() }] });
  }
  if (id === 'f-tenues-reglages') {
    await setDoc(doc(db, `events/${E}/partage/tenues`), { tissus: partage.tenues?.tissus || [], tailles: f.tailles.split(',').map(x => x.trim()).filter(Boolean).slice(0, 20), dateLimite: f.dateLimite || '', consigne: f.consigne.trim(), paiement: f.paiement.trim() });
  }
  if (id === 'f-merci') { await updateDoc(doc(db, 'events', E), { merci: { ...(evt.merci || {}), texte: f.texte.trim(), actif: 'actif' in f } }); }
  if (id === 'f-acces') { ev.target.reset(); await setDoc(doc(db, `events/${E}/acces/${jeton()}`), { role: f.role, nom: f.nom.trim(), creeLe: serverTimestamp() }); }
  if (id === 'f-cer') {
    const cle = f.nom.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ceremonie';
    ev.target.reset();
    await updateDoc(doc(db, 'events', E), { ceremonies: [...C, { cle: C.some(c => c.cle === cle) ? cle + '-' + C.length : cle, nom: f.nom, date: f.date, lieu: f.lieu }] });
  }
  if (id === 'f-reglages') {
    await updateDoc(doc(db, 'events', E), { titre: f.titre, date: f.date, lieu: f.lieu, modele: f.modele.trim(), dateLimiteReponse: f.dateLimiteReponse || '', notifReponses: 'notifReponses' in f });
    if ('live' in f) await setDoc(doc(db, `events/${E}/prive/config`), { live: f.live.trim() }, { merge: true });
    const code = (f.code || '').trim();
    if (code) await updateDoc(doc(db, 'events', E), { codeAcces: code.toLowerCase() === 'aucun' ? '' : await empreinte(E, code) });
    if ($('#m-reglages')) $('#m-reglages').textContent = 'Enregistré.';
  }
});
