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
