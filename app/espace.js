// Outils de l'espace organisateur sans accès au serveur : CSV (import et export), modèles de planning et de budget,
// messages d'invitation et de relance, comptage des personnes.

// ── CSV ─────────────────────────────────────────────────────────────────────
// Lit un tableau collé depuis Excel, Google Sheets ou un fichier .csv (séparateur ; , ou tabulation, guillemets gérés).
export function lireCSV(texte) {
  texte = texte.replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim();
  if (!texte) return [];
  const premiere = texte.split('\n')[0], sep = ['\t', ';', ','].map(s => [s, premiere.split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
  const lignes = []; let ligne = [], champ = '', guil = false;
  for (let k = 0; k < texte.length; k++) {
    const c = texte[k];
    if (guil) { if (c === '"' && texte[k + 1] === '"') { champ += '"'; k++; } else if (c === '"') guil = false; else champ += c; }
    else if (c === '"') guil = true;
    else if (c === sep) { ligne.push(champ.trim()); champ = ''; }
    else if (c === '\n') { ligne.push(champ.trim()); lignes.push(ligne); ligne = []; champ = ''; }
    else champ += c;
  }
  ligne.push(champ.trim()); lignes.push(ligne);
  return lignes.filter(l => l.some(Boolean));
}

const sansAccent = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const COLONNES = { nom: /^(nom|invite|invites|name|famille)/, prenom: /^(prenom|first)/, email: /(mail|courriel)/, tel: /(tel|portable|mobile|phone|whatsapp)/,
  max: /(accomp|plus|\+1|max)/, groupe: /(groupe|cote|famille de|categorie|lien)/, ceremonies: /(ceremonie|invite a|evenement)/ };

// Transforme les lignes en invités. Sans en-tête reconnu : nom, puis téléphone ou e-mail devinés au contenu.
export function invitesDepuisCSV(lignes, ceremonies) {
  if (!lignes.length) return [];
  const tete = lignes[0].map(sansAccent), idx = {};
  for (const [cle, re] of Object.entries(COLONNES)) { const k = tete.findIndex((t, j) => re.test(t) && !Object.values(idx).includes(j)); if (k >= 0) idx[cle] = k; }
  const avecTete = 'nom' in idx || 'prenom' in idx;
  const corps = avecTete ? lignes.slice(1) : lignes;
  return corps.map(l => {
    const v = k => (idx[k] !== undefined ? l[idx[k]] : '') || '';
    let nom = avecTete ? [v('prenom'), v('nom')].filter(Boolean).join(' ') : l[0];
    let email = v('email'), tel = v('tel');
    if (!avecTete) for (const x of l.slice(1)) { if (/@/.test(x)) email = x; else if (/^[+\d][\d\s.()-]{7,}$/.test(x)) tel = x; }
    const choisies = v('ceremonies') ? ceremonies.filter(c => sansAccent(v('ceremonies')).includes(sansAccent(c.nom).split(' ')[0]) || sansAccent(v('ceremonies')).includes(c.cle)).map(c => c.cle) : [];
    return { nom: String(nom || '').slice(0, 80).trim(), email: email.slice(0, 120), tel: telephone(tel), groupe: v('groupe').slice(0, 60),
      max: Math.min(10, Math.max(0, parseInt(v('max'), 10) || 0)), ceremonies: choisies.length ? choisies : ceremonies.map(c => c.cle) };
  }).filter(i => i.nom);
}

// Numéro au format international sans espaces (06… devient +336…), pour WhatsApp et les SMS.
export function telephone(t) {
  t = String(t || '').replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(t)) return '+33' + t.slice(1);
  if (/^00\d+/.test(t)) return '+' + t.slice(2);
  return t;
}

// Export lisible par Excel (point-virgule, BOM UTF-8).
export function telechargerCSV(nom, lignes) {
  const cell = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const blob = new Blob(['﻿' + lignes.map(l => l.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: nom });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ── Invités ─────────────────────────────────────────────────────────────────
// Personnes attendues pour une fiche : l'invité et ses accompagnants (déclarés s'il a répondu, sinon le maximum prévu).
export const personnes = i => 1 + (i.reponduLe ? (i.accompagnants || 0) : (i.max || 0));
export const declineTout = i => (i.ceremonies || []).length > 0 && (i.ceremonies || []).every(c => i.reponses?.[c] === 'non');
export const prenom = nom => String(nom || '').trim().split(/\s+/)[0];

export const MESSAGES = {
  invitation: "Bonjour {prenom},\n\nNous avons la joie de vous inviter : {titre}, le {date}.\nVotre invitation personnelle, pour découvrir le programme et nous répondre :\n{lien}\n\nAvec toute notre affection",
  relance: "Bonjour {prenom},\n\nPetit rappel avec tendresse : nous attendons votre réponse pour {titre}, le {date}. Elle nous aide à tout préparer.\nC'est ici, en une minute :\n{lien}\n\nMerci !",
};
export const remplir = (modele, v) => modele.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);

// ── Planning type ───────────────────────────────────────────────────────────
// [mois avant la date, tâche] ; une valeur négative tombe après l'événement.
const PLANNING_MARIAGE = [
  [12, 'Fixer le budget global'], [12, 'Dresser une première liste d\'invités'], [12, 'Réserver le lieu de réception'], [12, 'Choisir les témoins'],
  [10, 'Réserver le traiteur'], [10, 'Réserver le photographe et le vidéaste'], [10, 'Réserver la musique (DJ, orchestre, groupe)'],
  [9, 'Choisir la direction artistique du faire-part'], [9, 'Envoyer le save-the-date'], [8, 'Commencer les essayages des tenues'],
  [8, 'Rencontrer l\'officiant, la paroisse ou les familles (coutumier, dot)'], [6, 'Envoyer les faire-part'], [6, 'Ouvrir la liste de mariage ou la cagnotte'],
  [6, 'Trouver l\'hébergement des invités venus de loin'], [6, 'Choisir les tissus des tenues coordonnées'], [4, 'Déposer le dossier à la mairie'],
  [4, 'Réserver le fleuriste et la décoration'], [4, 'Faire la dégustation du menu'], [4, 'Choisir les alliances'], [3, 'Relancer les invités sans réponse'],
  [3, 'Organiser les transports (voitures, navettes)'], [2, 'Faire le plan de table'], [2, 'Écrire le déroulé de la journée avec les prestataires'],
  [2, 'Essai coiffure et maquillage'], [1, 'Confirmer le nombre de couverts au traiteur'], [1, 'Prévoir les soldes des prestataires'],
  [1, 'Préparer les enveloppes et les remerciements des prestataires'], [0.25, 'Dernier point avec chaque prestataire'], [0.25, 'Préparer le sac du jour J'],
  [-0.5, 'Envoyer les remerciements aux invités'], [-1, 'Rassembler les photos des invités et du photographe'],
];
const PLANNING_FETE = [
  [3, 'Fixer le budget et la liste d\'invités'], [3, 'Réserver le lieu'], [2, 'Choisir l\'invitation et l\'envoyer'], [2, 'Réserver traiteur ou buffet'],
  [1.5, 'Réserver la musique ou l\'animation'], [1, 'Commander le gâteau'], [1, 'Relancer les invités sans réponse'], [0.5, 'Prévoir la décoration'],
  [0.25, 'Confirmer le nombre de personnes'], [-0.25, 'Remercier les invités et partager les photos'],
];
export function planningType(type, date) {
  const jour = new Date(date || Date.now());
  return (type === 'mariage' ? PLANNING_MARIAGE : PLANNING_FETE).map(([mois, titre], k) => {
    const d = new Date(jour); d.setDate(d.getDate() - Math.round(mois * 30.4));
    const aujourdhui = new Date(); if (mois > 0 && d < aujourdhui) d.setTime(aujourdhui.getTime());
    return { titre, echeance: d.toISOString().slice(0, 10), fait: false, ordre: k };
  });
}

// ── Budget et prestataires ──────────────────────────────────────────────────
export const POSTES = ['Lieu de réception', 'Traiteur et boissons', 'Tenues, coiffure et beauté', 'Photo et vidéo', 'Musique et animation', 'Décoration et fleurs',
  'Cérémonies (mairie, culte, coutumier, dot)', 'Alliances et bijoux', 'Invitations et espace Maison Vivat', 'Transport', 'Hébergement', 'Gâteau et douceurs', 'Divers'];
export const METIERS = ['Lieu', 'Traiteur', 'Photographe', 'Vidéaste', 'DJ ou orchestre', 'Fleuriste', 'Décorateur', 'Wedding planner', 'Pâtissier',
  'Coiffure et maquillage', 'Couturier ou créateur', 'Location de voitures', 'Officiant', 'Animation enfants', 'Autre'];
export const STATUTS = { piste: 'Piste', devis: 'Devis demandé', reserve: 'Réservé', ecarte: 'Écarté' };
export const euros = n => (Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';

// ── Plan de table : affinités et placement proposé ──────────────────────────
// Un lien relie deux invités : « ensemble » (même table), « separe » (tables différentes), « loin » (au moins DISTANCE tables d'écart,
// dans l'ordre des tables, qui suit en général la disposition de la salle).
export const LIENS = { ensemble: 'Ensemble', separe: 'Tables séparées', loin: 'Éloignés dans la salle' };
export const DISTANCE = 3;

// Contraintes non respectées avec le placement donné (place : id d'invité → id de table, ou '').
export function infractions(invites, tables, liens, place = Object.fromEntries(invites.map(i => [i.id, i.table || '']))) {
  const rang = Object.fromEntries(tables.map((t, k) => [t.id, k])), nom = Object.fromEntries(invites.map(i => [i.id, i.nom]));
  return liens.filter(l => nom[l.a] && nom[l.b]).map(l => {
    const ta = place[l.a], tb = place[l.b];
    if (l.type === 'ensemble' && ta && tb && ta !== tb) return { ...l, texte: `${nom[l.a]} et ${nom[l.b]} devraient être à la même table`, tables: [ta, tb] };
    if (l.type === 'separe' && ta && ta === tb) return { ...l, texte: `${nom[l.a]} et ${nom[l.b]} sont à la même table`, tables: [ta] };
    if (l.type === 'loin' && ta && tb && Math.abs(rang[ta] - rang[tb]) < DISTANCE) return { ...l, texte: `${nom[l.a]} et ${nom[l.b]} sont trop proches (${ta === tb ? 'même table' : Math.abs(rang[ta] - rang[tb]) + ' table d\'écart'})`, tables: [ta, tb] };
    return null;
  }).filter(Boolean);
}

// Propose un placement : les invités liés « ensemble » forment un bloc (avec leurs accompagnants), placé d'un seul tenant ;
// les blocs les plus grands passent d'abord, chacun à la table qui enfreint le moins de contraintes, puis qui réunit le plus
// de membres de son groupe (famille, amis…), puis qui est déjà la plus remplie. garder : on ne déplace pas ceux qui ont une table.
// Plusieurs essais dans des ordres différents (le premier : blocs contraints puis grands), on garde le meilleur.
export function proposerPlacement(invites, tables, liens, options = {}) {
  let graine = 7; const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  let meilleur = null;
  for (let essai = 0; essai < 40; essai++) {
    const r = unPlacement(invites, tables, liens, options, essai ? hasard : null);
    const debord = tables.reduce((s, t) => s + Math.max(0, invites.filter(i => r.place[i.id] === t.id).reduce((n, i) => n + personnes(i), 0) - (+t.places || 0)), 0);
    const groupes = tables.reduce((s, t) => s + new Set(invites.filter(i => r.place[i.id] === t.id).map(i => i.groupe || i.id)).size, 0);
    r.score = r.infractions.length * 1000 + debord * 100 + groupes;
    if (!meilleur || r.score < meilleur.score) meilleur = r;
    if (!r.infractions.length && !debord && essai > 8) break;
  }
  return meilleur;
}

function unPlacement(invites, tables, liens, { garder = true } = {}, hasard) {  const ids = new Set(invites.map(i => i.id)), parent = Object.fromEntries(invites.map(i => [i.id, i.id]));
  const racine = x => parent[x] === x ? x : (parent[x] = racine(parent[x]));
  liens.filter(l => l.type === 'ensemble' && ids.has(l.a) && ids.has(l.b)).forEach(l => { parent[racine(l.a)] = racine(l.b); });
  const blocs = {}; invites.forEach(i => (blocs[racine(i.id)] ??= []).push(i));
  const place = {}, occupe = Object.fromEntries(tables.map(t => [t.id, 0])), rang = Object.fromEntries(tables.map((t, k) => [t.id, k]));
  const existe = id => tables.some(t => t.id === id);
  const aPlacer = [];
  for (const b of Object.values(blocs)) {
    if (garder && b.every(i => i.table && existe(i.table))) { b.forEach(i => { place[i.id] = i.table; occupe[i.table] += personnes(i); }); continue; }
    if (garder && b.some(i => i.table && existe(i.table))) { const t = b.find(i => i.table && existe(i.table)).table; b.forEach(i => { place[i.id] = t; occupe[t] += personnes(i); }); continue; }
    aPlacer.push(b);
  }
  const contre = {}; liens.filter(l => l.type !== 'ensemble').forEach(l => { (contre[l.a] ??= []).push(l); (contre[l.b] ??= []).push({ ...l, a: l.b, b: l.a }); });
  const taille = b => b.reduce((s, i) => s + personnes(i), 0), contraint = b => b.some(i => contre[i.id]);
  // Coût d'une table pour un bloc : contraintes enfreintes, débordement, puis affinités de groupe et tables déjà entamées.
  const cout = (b, t) => {
    const dedans = new Set(b.map(i => i.id)), groupes = new Set(b.map(i => i.groupe).filter(Boolean));
    let s = 0;
    for (const i of b) for (const l of contre[i.id] || []) {
      const autre = place[l.b]; if (!autre || dedans.has(l.b)) continue;
      if (l.type === 'separe' && autre === t.id) s += 1000;
      if (l.type === 'loin' && Math.abs(rang[autre] - rang[t.id]) < DISTANCE) s += 1000;
    }
    const occ = occupe[t.id] - (place[b[0].id] === t.id ? taille(b) : 0), reste = (+t.places || 0) - occ - taille(b);
    if (reste < 0) s += 500 + 50 * -reste;
    s -= 20 * invites.filter(i => place[i.id] === t.id && !dedans.has(i.id) && groupes.has(i.groupe)).length;
    return s - (occ > 0 ? 5 : 0);
  };
  const poser = (b, t) => { if (place[b[0].id]) occupe[place[b[0].id]] -= taille(b); b.forEach(i => { place[i.id] = t; }); occupe[t] += taille(b); };
  // Les blocs contraints d'abord, puis les plus grands.
  const bruit = new Map(aPlacer.map(b => [b, hasard ? hasard() : 0]));
  aPlacer.sort((x, y) => contraint(y) - contraint(x) || (hasard ? bruit.get(x) - bruit.get(y) : taille(y) - taille(x)));
  for (const b of aPlacer) {
    let meilleure = null, score = Infinity;
    for (const t of tables) { const c = cout(b, t); if (c < score) { score = c; meilleure = t.id; } }
    if (!meilleure) break;
    poser(b, meilleure);
  }
  // Quelques passes d'amélioration : un bloc déplaçable change de table si cela réduit son coût.
  for (let passe = 0; passe < 4; passe++) {
    let mieux = false;
    for (const b of aPlacer) {
      const ici = tables.find(t => t.id === place[b[0].id]); if (!ici) continue;
      const actuel = cout(b, ici);
      for (const t of tables) if (t.id !== ici.id && cout(b, t) < actuel - 1) { poser(b, t.id); mieux = true; break; }
    }
    if (!mieux) break;
  }
  return { place, infractions: infractions(invites, tables, liens, place), debordement: tables.filter(t => occupe[t.id] > (+t.places || 0)).map(t => t.nom) };
}
