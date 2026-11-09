// Moteur de faire-part : affiche une direction artistique (themes.js) avec les réglages des organisateurs (design)
// et les informations de l'événement. Trois formats : faire-part (fp), save-the-date (std) et site (site : menu,
// couverture plein écran et toutes les parties). La structure vient de la direction : couverture, programme, rythme.
// Langues (option « Langue supplémentaire ») : textes fixes traduits dans langues.js, textes des organisateurs
// traduits dans l'éditeur (« titre@en »…). Une partie liée à une option payante ne s'affiche que si l'option est active.
import { theme as themeDe, POLICES } from './themes.js?v=3';
import { traduire, champ as enLangue, LOCALES, memoriserLangue, LANGUES } from './langues.js?v=2';
import { GUIDES } from './guides.js?v=1';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paragraphes = s => esc(s).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
let L = 'fr';   // langue du rendu en cours
const t = x => traduire(L, x), loc = () => LOCALES[L] || 'fr-FR';
const dateLongue = d => { let s = ''; try { s = d ? new Date(d).toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''; } catch { s = new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } return s.charAt(0).toUpperCase() + s.slice(1); };
const dateCourte = d => d ? new Date(d).toLocaleDateString(loc(), { day: 'numeric', month: 'short' }) : '';
const heure = d => { if (!d) return ''; const h = new Date(d).toLocaleTimeString(L === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }); return L === 'fr' || L === 'ht' ? h.replace(':', ' h ') : h; };
const surUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
const ROMAIN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

// Parties que les organisateurs peuvent ajouter, retirer, réordonner. champs : ce que l'éditeur propose de modifier.
export const SECTIONS = {
  accueil: { nom: 'Mot d\'accueil', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Bienvenue', texte: 'Nous avons la joie de vous inviter à partager ce jour avec nous.' } },
  histoire: { nom: 'Notre histoire', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Notre histoire', texte: 'Tout a commencé par une rencontre, un soir d\'été. Quelques années, deux familles et mille souvenirs plus tard, nous avons décidé de nous dire oui.' } },
  traditions: { nom: 'Nos traditions', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Nos traditions', texte: 'Notre mariage réunit deux familles et leurs coutumes. La dot, la cérémonie coutumière, les chants : voici ce qui vous attend, pour le vivre avec nous.' } },
  programme: { nom: 'Programme', champs: { titre: 'Titre' }, defaut: { titre: 'Le programme' }, auto: 'Les cérémonies de votre espace, avec l\'heure, le lieu et le plan' },
  compte: { nom: 'Compte à rebours', champs: { titre: 'Titre' }, defaut: { titre: 'Plus que' } },
  tenue: { nom: 'Tenue', champs: { titre: 'Titre', texte: 'Texte', couleurs: 'Couleurs suggérées (codes séparés par des virgules)' }, defaut: { titre: 'Tenue', texte: 'Tenue de cérémonie. Une touche de couleur est la bienvenue.', couleurs: '' } },
  hebergement: { nom: 'Hébergement', champs: { titre: 'Titre', texte: 'Texte', libelle: 'Texte du lien', lien: 'Adresse du lien' }, defaut: { titre: 'Où dormir', texte: 'Quelques adresses proches du lieu de réception.', libelle: '', lien: '' } },
  transport: { nom: 'Venir', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Venir', texte: 'Un parking est disponible sur place. Des navettes sont prévues depuis la gare.' } },
  cadeaux: { nom: 'Liste, cagnotte', champs: { titre: 'Titre', texte: 'Texte', libelle: 'Texte du lien', lien: 'Adresse du lien' }, defaut: { titre: 'Liste et cagnotte', texte: 'Votre présence est notre plus beau cadeau. Pour ceux qui le souhaitent :', libelle: 'Voir la liste', lien: '' } },
  faq: { nom: 'Questions fréquentes', champs: { titre: 'Titre', texte: 'Questions et réponses (une question par ligne, puis sa réponse ; une ligne vide entre deux)' }, defaut: { titre: 'Questions fréquentes', texte: 'Les enfants sont-ils invités ?\nOui, avec plaisir.\n\nY a-t-il un parking ?\nOui, sur place.' } },
  contact: { nom: 'Contact', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Une question ?', texte: 'Écrivez-nous ou appelez nos témoins.' } },
  bebe: { nom: 'Fiche de naissance', champs: { titre: 'Titre', prenom: 'Prénom', ne: 'Né ou née le', heure: 'Heure', poids: 'Poids', taille: 'Taille' }, defaut: { titre: 'Bienvenue', prenom: 'Léo', ne: '3 mars 2027', heure: '4 h 12', poids: '3,4 kg', taille: '51 cm' } },
  parrains: { nom: 'Parrain et marraine', champs: { titre: 'Titre', parrain: 'Parrain', marraine: 'Marraine', texte: 'Texte' }, defaut: { titre: 'Parrain et marraine', parrain: 'Jonathan', marraine: 'Naïka', texte: 'Ils veilleront sur lui, toute sa vie.' } },
  pronostic: { nom: 'Pronostics', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Fille ou garçon ?', texte: 'Faites vos pronostics : donnez le vôtre en répondant à l\'invitation.' } },
  guide: { nom: 'Guide de la cérémonie', option: 'guide', champs: { titre: 'Titre', intro: 'Introduction', texte: 'Les étapes (un bloc par étape : titre sur la première ligne, puis l\'explication ; « Conseil : » pour un bon à savoir)' },
    defaut: { titre: 'Le guide de la cérémonie', intro: GUIDES.dot.intro, texte: GUIDES.dot.texte } },
  galerie: { nom: 'Galerie de photos', champs: { titre: 'Titre', texte: 'Texte (facultatif)' }, defaut: { titre: 'En images', texte: '', photos: [] }, auto: 'Ajoutez vos photos ci-dessous ; elles s\'affichent en mosaïque' },
  texte: { nom: 'Texte libre', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Un mot', texte: '' } },
  reponse: { nom: 'Bouton de réponse', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Votre réponse', texte: 'Merci de nous répondre avant le grand jour.' } },
};

// Parties proposées d'emblée, selon l'événement et la famille de la direction : la trame change d'un univers à l'autre.
const TRAMES = {
  heritages: ['accueil', 'histoire', 'traditions', 'programme', 'tenue', 'compte', 'reponse'],
  intemporels: ['accueil', 'programme', 'compte', 'hebergement', 'cadeaux', 'reponse'],
  nature: ['accueil', 'histoire', 'programme', 'transport', 'hebergement', 'reponse'],
  modernes: ['compte', 'accueil', 'programme', 'faq', 'cadeaux', 'reponse'],
  anniversaires: ['accueil', 'programme', 'tenue', 'compte', 'cadeaux', 'reponse'],
  baptemes: ['accueil', 'parrains', 'programme', 'texte', 'reponse'],
  reveals: ['accueil', 'pronostic', 'programme', 'tenue', 'compte', 'reponse'],
  naissances: ['bebe', 'accueil', 'programme', 'cadeaux', 'reponse'],
};
const TRAMES_SITE = {
  mariage: ['accueil', 'histoire', 'galerie', 'programme', 'compte', 'tenue', 'hebergement', 'transport', 'cadeaux', 'faq', 'contact', 'reponse'],
  anniversaire: ['accueil', 'programme', 'compte', 'tenue', 'transport', 'cadeaux', 'faq', 'reponse'],
  bapteme: ['accueil', 'parrains', 'programme', 'texte', 'transport', 'hebergement', 'cadeaux', 'reponse'],
  gender: ['accueil', 'pronostic', 'programme', 'compte', 'tenue', 'transport', 'faq', 'reponse'],
  naissance: ['bebe', 'accueil', 'histoire', 'programme', 'cadeaux', 'contact', 'reponse'],
};
// Textes par défaut propres à chaque événement (le reste vient de SECTIONS).
const TEXTES = {
  anniversaire: { accueil: { titre: 'Venez trinquer', texte: 'Une date ronde se fête entourée de ceux qu\'on aime. Venez comme vous êtes, repartez avec des souvenirs.' }, tenue: { titre: 'Dress code', texte: 'Chic et festif. Une touche dorée est la bienvenue.' }, cadeaux: { titre: 'Un cadeau ?', texte: 'Votre présence suffit. Pour ceux qui y tiennent, une cagnotte commune est ouverte.' } },
  bapteme: { accueil: { titre: 'Un premier grand jour', texte: 'Nous serions heureux de vous avoir à nos côtés pour le baptême de notre enfant, puis autour de la table.' }, texte: { titre: 'Un mot pour lui', texte: 'Pendant le déjeuner, vous pourrez lui laisser quelques mots, qu\'il lira plus tard.' }, cadeaux: { titre: 'Une attention', texte: 'Pour ceux qui le souhaitent, une liste est ouverte.' } },
  gender: { accueil: { titre: 'Le grand suspense', texte: 'Nous allons découvrir ensemble si nous attendons une fille ou un garçon. Venez vivre la surprise avec nous.' }, tenue: { titre: 'Choisissez votre camp', texte: 'Venez en rose si vous pariez sur une fille, en bleu pour un garçon.', couleurs: '#E8A9B8, #9CC3DE' } },
  naissance: { accueil: { titre: 'Il est là', texte: 'Après neuf mois d\'attente, notre petit garçon est arrivé. Nous avons hâte de vous le présenter.' }, programme: { titre: 'Venez le rencontrer' }, cadeaux: { titre: 'Liste de naissance', texte: 'Pour ceux qui nous l\'ont demandé, sa liste de naissance est en ligne.', libelle: 'Voir la liste' }, reponse: { titre: 'Annoncer votre visite', texte: 'Dites-nous quand vous passerez, pour que nous puissions vous accueillir.' }, histoire: { titre: 'Les premiers jours', texte: 'Ses premiers sourires, ses premières nuits (courtes), et toute la famille déjà sous le charme.' } },
};
const SURTITRES = { mariage: 'Nous nous marions', anniversaire: 'Vous êtes invités', bapteme: 'Baptême', gender: 'Fille ou garçon ?', naissance: 'Bienvenue au monde' };

export function designParDefaut(evt, themeId = 'ivoire', format = 'fp') {
  const th = themeDe(themeId), type = evt.type || th.evenement || 'mariage';
  const trame = format === 'site' ? TRAMES_SITE[type] || TRAMES_SITE.mariage : TRAMES[th.famille] || TRAMES.intemporels;
  return {
    theme: th.id, palette: null, polices: null,
    couverture: { surtitre: SURTITRES[type] || SURTITRES.anniversaire, titre: evt.titre || '', soustitre: '', photo: '' },
    sections: trame.map(t => ({ type: t, visible: true, ...SECTIONS[t].defaut, ...(TEXTES[type]?.[t] || {}) })),
    std: { surtitre: type === 'naissance' ? 'Une naissance' : 'Réservez la date', texte: type === 'naissance' ? 'Faire-part à suivre' : 'Invitation à suivre' },
  };
}

// Ornements : motifs SVG en arrière-plan, dessinés dans la couleur d'accent.
function ornement(type, c, c2) {
  const enc = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  const svg = (w, h, corps) => enc(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${corps}</svg>`);
  switch (type) {
    case 'kente': return svg(48, 48, `<rect width='48' height='48' fill='none'/><rect x='0' y='0' width='8' height='48' fill='${c}' opacity='.18'/><rect x='16' y='0' width='4' height='48' fill='${c}' opacity='.28'/><rect x='0' y='20' width='48' height='6' fill='${c}' opacity='.14'/><rect x='30' y='0' width='10' height='48' fill='${c}' opacity='.1'/>`);
    case 'madras': return svg(40, 40, `<rect x='0' y='0' width='40' height='40' fill='none'/><rect x='0' y='12' width='40' height='6' fill='${c}' opacity='.16'/><rect x='12' y='0' width='6' height='40' fill='${c}' opacity='.16'/><rect x='0' y='30' width='40' height='2' fill='${c}' opacity='.25'/><rect x='30' y='0' width='2' height='40' fill='${c}' opacity='.25'/>`);
    case 'bogolan': return svg(56, 56, `<g fill='none' stroke='${c}' stroke-opacity='.3' stroke-width='2'><path d='M4 4h20v20H4z'/><path d='M32 32h20v20H32z'/><path d='M36 8l8 8M44 8l-8 8M8 36l8 8M16 36l-8 8'/></g>`);
    case 'wax': return svg(60, 60, `<g fill='none' stroke='${c}' stroke-opacity='.25' stroke-width='2'><circle cx='15' cy='15' r='10'/><circle cx='15' cy='15' r='4'/><circle cx='45' cy='45' r='10'/><circle cx='45' cy='45' r='4'/></g>`);
    case 'artdeco': return svg(60, 34, `<g fill='none' stroke='${c}' stroke-opacity='.3' stroke-width='1.2'><path d='M0 34a30 30 0 0 1 60 0'/><path d='M10 34a20 20 0 0 1 40 0'/><path d='M20 34a10 10 0 0 1 20 0'/></g>`);
    case 'zellige': return svg(50, 50, `<path d='M25 3l6 16 16 6-16 6-6 16-6-16-16-6 16-6z' fill='none' stroke='${c}' stroke-opacity='.28' stroke-width='1.2'/>`);
    case 'etoiles': return svg(80, 80, `<g fill='${c}' fill-opacity='.35'><circle cx='10' cy='14' r='1.4'/><circle cx='52' cy='8' r='1'/><circle cx='70' cy='40' r='1.6'/><circle cx='30' cy='56' r='1.1'/><circle cx='60' cy='70' r='1.3'/></g>`);
    case 'floral': return svg(90, 90, `<g fill='none' stroke='${c}' stroke-opacity='.28' stroke-width='1.2'><path d='M10 80C30 60 40 40 45 10'/><path d='M28 56c-10-2-16 2-18 8M36 40c8-4 14-2 18 4M40 26c-8-4-12-2-15 3'/></g>`);
    case 'vague': return svg(80, 20, `<path d='M0 10q10-8 20 0t20 0 20 0 20 0' fill='none' stroke='${c}' stroke-opacity='.3' stroke-width='1.2'/>`);
    case 'palmes': return svg(90, 90, `<g fill='none' stroke='${c}' stroke-opacity='.25' stroke-width='1.2'><path d='M45 85V30'/><path d='M45 30c-10-14-26-16-34-12M45 30c10-14 26-16 34-12M45 40c-12-6-24-4-30 2M45 40c12-6 24-4 30 2'/></g>`);
    case 'confettis': return svg(80, 80, `<g fill-opacity='.45'><rect x='8' y='10' width='6' height='3' fill='${c}' transform='rotate(25 11 11)'/><rect x='50' y='16' width='6' height='3' fill='${c2}' transform='rotate(-30 53 17)'/><circle cx='30' cy='40' r='2' fill='${c}'/><rect x='62' y='52' width='6' height='3' fill='${c}' transform='rotate(60 65 53)'/><circle cx='16' cy='66' r='2' fill='${c2}'/></g>`);
    case 'points': return svg(36, 36, `<g fill='${c}' fill-opacity='.22'><circle cx='9' cy='9' r='3'/><circle cx='27' cy='27' r='3'/></g>`);
    case 'nuages': return svg(120, 70, `<g fill='${c}' fill-opacity='.14'><path d='M20 40a12 12 0 0 1 22-7 10 10 0 0 1 18 6 8 8 0 0 1-2 16H24a9 9 0 0 1-4-15z'/><path d='M78 20a8 8 0 0 1 15-4 7 7 0 0 1 12 4 6 6 0 0 1-1 11H82a6 6 0 0 1-4-11z'/></g>`);
    case 'ballons': return svg(90, 110, `<g fill-opacity='.28' stroke-opacity='.3' stroke-width='1'><ellipse cx='26' cy='30' rx='13' ry='16' fill='${c}'/><path d='M26 46q-4 14 2 30' fill='none' stroke='${c}'/><ellipse cx='64' cy='58' rx='11' ry='14' fill='${c2}'/><path d='M64 72q4 12-2 28' fill='none' stroke='${c2}'/></g>`);
    case 'lune': return svg(100, 100, `<path d='M62 22a24 24 0 1 0 16 38 20 20 0 1 1-16-38z' fill='${c}' fill-opacity='.22'/><g fill='${c}' fill-opacity='.4'><circle cx='20' cy='20' r='1.4'/><circle cx='84' cy='14' r='1'/><circle cx='18' cy='80' r='1.2'/></g>`);
    case 'rayons': return svg(100, 100, `<g stroke='${c}' stroke-opacity='.22' stroke-width='1.4'><path d='M50 50L50 4M50 50L96 50M50 50L50 96M50 50L4 50M50 50L83 17M50 50L83 83M50 50L17 83M50 50L17 17'/></g><circle cx='50' cy='50' r='12' fill='${c}' fill-opacity='.18'/>`);
    default: return 'none';
  }
}

function ics(evt) {
  const d = new Date(evt.date), f = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const fin = new Date(d.getTime() + 6 * 3600e3);
  const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Maison Vivat//FR', 'BEGIN:VEVENT', `UID:${f(d)}@maisonvivat.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(d)}`, `DTEND:${f(fin)}`, `SUMMARY:${evt.titre}`, `LOCATION:${evt.lieu || ''}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(txt);
}

// Programme : mêmes données, six présentations (classe prog-…) ; chaque moment porte son numéro, son heure et sa date courte.
function programme(C) {
  const plan = c => `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.lieu || '')}" target="_blank" rel="noopener">${t('plan')}</a>`;
  return `<ol class="programme">${C.map((c, k) => `<li style="--n:${k}"><span class="num">${String(k + 1).padStart(2, '0')}</span><span class="h">${heure(c.date)}</span><span class="jour">${esc(dateCourte(c.date))}</span>
    <div class="corps"><b>${esc(enLangue(c, 'nom', L))}</b><span class="d">${esc(dateLongue(c.date))}</span><span class="l">${esc(c.lieu)} · ${plan(c)}</span></div></li>`).join('')}</ol>`;
}

function section(s, ctx) {
  const { evt, invite, lienReponse } = ctx, v = nom => enLangue(s, nom, L), titre = v('titre'), h = titre ? `<h2>${esc(titre)}</h2>` : '';
  switch (s.type) {
    case 'programme': return h + programme((evt.ceremonies || []).filter(c => !invite || invite.ceremonies?.includes(c.cle)));
    case 'compte': return `${h}<div class="rebours" data-rebours="${esc(evt.date)}"><div><b>--</b>${t('jours')}</div><div><b>--</b>${t('heures')}</div><div><b>--</b>${t('min')}</div><div><b>--</b>${t('sec')}</div></div>`;
    case 'tenue': {
      const cs = (s.couleurs || '').split(',').map(x => x.trim()).filter(x => /^#[0-9a-f]{3,8}$/i.test(x));
      return `${h}${paragraphes(v('texte'))}${cs.length ? `<div class="nuancier">${cs.map(c => `<i style="background:${c}"></i>`).join('')}</div>` : ''}`;
    }
    case 'faq': return `${h}<dl class="faq">${(v('texte') || '').split(/\n{2,}/).map(b => { const [q, ...r] = b.split('\n'); return q ? `<dt>${esc(q)}</dt><dd>${esc(r.join(' '))}</dd>` : ''; }).join('')}</dl>`;
    case 'reponse': return `${h}${paragraphes(v('texte'))}<a class="bouton" href="${esc(lienReponse || '#')}"${lienReponse ? '' : ' data-demo'}>${t('Répondre')}</a>`;
    case 'bebe': return `${h}<p class="bebe-prenom">${esc(s.prenom)}</p><dl class="fiche">${[['Né le', v('ne')], ['À', s.heure], ['Poids', s.poids], ['Taille', s.taille]].filter(([, x]) => x).map(([k, x]) => `<div><dt>${t(k)}</dt><dd>${esc(x)}</dd></div>`).join('')}</dl>`;
    case 'parrains': return `${h}<div class="duo"><div><span>${t('Parrain')}</span><b>${esc(s.parrain)}</b></div><i aria-hidden="true">&amp;</i><div><span>${t('Marraine')}</span><b>${esc(s.marraine)}</b></div></div>${paragraphes(v('texte'))}`;
    case 'galerie': {
      const photos = (s.photos || []).filter(u => /^(https?:\/\/|\.\.\/)/.test(u));
      return `${h}${paragraphes(v('texte'))}<div class="galerie-fp">${photos.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="" loading="lazy"></a>`).join('')}</div>`;
    }
    case 'pronostic': return `${h}<div class="pronos"><span class="fille">${t('Fille')}</span><span class="ou">${t('ou')}</span><span class="garcon">${t('Garçon')}</span></div>${paragraphes(v('texte'))}`;
    case 'guide': {
      // Un bloc par étape ; « Conseil : » devient un encadré.
      const etapes = (v('texte') || '').split(/\n{2,}/).map(b => b.split('\n').filter(x => x.trim())).filter(b => b.length);
      return `${h}${v('intro') ? `<p class="guide-intro">${esc(v('intro'))}</p>` : ''}<ol class="guide">${etapes.map(([titre, ...lignes], k) => `<li><span class="guide-n">${t('Étape')} ${k + 1}</span><h3>${esc(titre)}</h3>
        ${lignes.map(x => /^\s*(conseil|tip|consejo|dica|konsèy)\s*:/i.test(x) ? `<p class="guide-conseil"><b>${t('Bon à savoir')}</b> ${esc(x.replace(/^[^:]*:\s*/, ''))}</p>` : `<p>${esc(x)}</p>`).join('')}</li>`).join('')}</ol>`;
    }
    default: {
      const l = surUrl(s.lien);
      return `${h}${paragraphes(v('texte'))}${l ? `<a class="bouton clair" href="${esc(l)}" target="_blank" rel="noopener">${esc(v('libelle') || t('Ouvrir'))}</a>` : ''}`;
    }
  }
}

const initialesDe = titre => (titre || '').split(/\s*(?:&|\bet\b)\s*/).map(x => x.trim()[0] || '').filter(Boolean).join(' · ');

function ouverture(type, d, nom) {
  const libelle = { enveloppe: 'Ouvrir l\'enveloppe', sceau: 'Briser le sceau', ruban: 'Dénouer le ruban', rouleau: 'Dérouler', lumiere: 'Allumer', tuiles: 'Découvrir' }[type] || 'Ouvrir';
  const tuiles = type === 'tuiles' ? `<div class="grille-tuiles">${Array.from({ length: 24 }, (_, k) => `<i style="--k:${k}"></i>`).join('')}</div>` : '';
  return `<div class="ov ov-${type}" data-ouverture role="button" tabindex="0" aria-label="${esc(libelle)}">
    <div class="ov-a"></div><div class="ov-b"></div>${tuiles}
    <div class="ov-centre"><span class="ov-init">${esc(initialesDe(d.couverture.titre || nom))}</span><span class="ov-lib">${esc(libelle)}</span></div></div>`;
}

// Point d'entrée : racine = élément à remplir. ctx = { evt, design, format: 'fp'|'std'|'site', invite, lienReponse, sansOuverture }
export function rendre(racine, ctx) {
  const langues = ctx.design.langues?.length ? ctx.design.langues : ['fr'];
  L = langues.includes(ctx.langue) ? ctx.langue : langues[0];
  document.documentElement.lang = L === 'ht' ? 'ht' : L;
  // La structure choisie dans l'éditeur (ouverture, mise en page, couverture, programme, rythme) remplace celle de la direction.
  const d = ctx.design, th = { ...themeDe(d.theme), ...Object.fromEntries(Object.entries(d.structure || {}).filter(([, x]) => x)) }, pal = { ...th.palette, ...(d.palette || {}) }, pol = POLICES[d.polices || th.polices] || POLICES.cormorant;
  if (racine._minuteur) clearInterval(racine._minuteur);
  if (!document.querySelector(`link[data-police="${pol.url}"]`)) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.police = pol.url; l.href = `https://fonts.googleapis.com/css2?family=${pol.url}&display=swap`; document.head.append(l);
  }
  const style = `--fond:${pal.fond};--papier:${pal.papier};--texte:${pal.texte};--accent:${pal.accent};--accent2:${pal.accent2};--f-titre:'${pol.titre}',serif;--f-texte:'${pol.texte}',sans-serif;--orn:${ornement(th.ornement, pal.accent, pal.accent2)}`;
  const c = d.couverture || {}, std = ctx.format === 'std', site = ctx.format === 'site';
  const prenom = ctx.invite?.nom ? ctx.invite.nom.split(' ')[0] : '';
  // Sans photo, la composition reste la sienne : le cadre de la photo reçoit un panneau illustré (motif et couleurs de la direction).
  const couv = th.couv, init = esc(initialesDe(c.titre || ctx.evt.titre));
  const visuel = couv === 'monogramme' ? `<div class="couv-mono" aria-hidden="true"><span>${init}</span></div>`
    : c.photo ? `<div class="couv-photo" style="background-image:url('${esc(c.photo)}')"></div>`
    : `<div class="couv-photo couv-motif" aria-hidden="true"><span>${init}</span></div>`;
  const couverture = `<header class="couv couv-${couv}" id="haut">${visuel}
      <div class="couv-texte">
        ${prenom ? `<p class="pour">${t('Pour')} ${esc(prenom)}</p>` : ''}
        <p class="surtitre">${esc(std ? (enLangue(d.std, 'surtitre', L) || 'Réservez la date') : enLangue(c, 'surtitre', L))}</p>
        <h1>${esc(c.titre || ctx.evt.titre)}</h1>
        ${c.soustitre && !std ? `<p class="soustitre">${esc(enLangue(c, 'soustitre', L))}</p>` : ''}
        ${couv === 'polaroid' && !std ? `<p class="legende">${esc(ctx.evt.lieu || '')}</p>` : ''}
        <p class="date">${esc(dateLongue(ctx.evt.date))}</p>
        ${std ? `<p class="lieu-std">${esc(ctx.evt.lieu || '')}</p>` : ''}
      </div></header>`;
  const optionAbsente = s => SECTIONS[s.type].option && Array.isArray(ctx.evt.options) && !ctx.evt.options.includes(SECTIONS[s.type].option);
  const parties = (d.sections || []).filter(s => s.visible !== false && SECTIONS[s.type] && !optionAbsente(s));
  const corps = std
    ? `<section class="bloc std"><p class="std-texte">${esc(enLangue(d.std, 'texte', L) || 'Invitation à suivre')}</p><a class="bouton" href="${ics(ctx.evt)}" download="${esc((ctx.evt.titre || 'evenement').replace(/[^\w]+/g, '-'))}.ics">${t('Ajouter à mon agenda')}</a></section>`
    : parties.map((s, k) => `<section class="bloc bloc-${s.type}" id="p-${k}" data-chapitre="${ROMAIN[k] || k + 1}"><div class="bloc-in">${section(s, ctx)}</div></section>`).join('');
  const menu = site ? `<nav class="site-nav" aria-label="Sommaire"><a class="site-marque" href="#haut">${esc(initialesDe(c.titre || ctx.evt.titre))}</a><div class="site-liens">${parties.map((s, k) => s.titre ? `<a href="#p-${k}">${esc(s.type === 'compte' ? (L === 'fr' ? 'Le jour J' : '⏳') : enLangue(s, 'titre', L))}</a>` : '').join('')}</div></nav>` : '';
  const choixLangue = langues.length > 1 && !std ? `<div class="langues" role="group" aria-label="${t('Langue')}">${langues.map(l => `<button type="button" data-langue="${l}" class="${l === L ? 'actif' : ''}" lang="${l}">${esc(LANGUES[l] || l)}</button>`).join('')}</div>` : '';
  racine.className = `fp mep-${th.mep} orn-${th.ornement} prog-${th.prog} ry-${th.rythme} format-${ctx.format || 'fp'}`;
  racine.setAttribute('style', style);
  racine.innerHTML = (ctx.sansOuverture || site ? '' : ouverture(th.ouverture, d, ctx.evt.titre)) + menu + choixLangue + `<main class="fp-page">${couverture}${corps}<footer class="fp-pied">Maison Vivat</footer></main>`;

  const ov = racine.querySelector('[data-ouverture]');
  if (ov) {
    document.body.classList.add('fp-ferme');
    const ouvrir = () => { if (ov.classList.contains('ouvert')) return; ov.classList.add('ouvert'); document.body.classList.remove('fp-ferme'); setTimeout(() => ov.remove(), 1900); };
    ov.addEventListener('click', ouvrir); ov.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && ouvrir());
  } else document.body.classList.remove('fp-ferme');
  racine.querySelectorAll('[data-langue]').forEach(b => b.addEventListener('click', () => { memoriserLangue(b.dataset.langue); rendre(racine, { ...ctx, langue: b.dataset.langue, sansOuverture: true }); }));
  racine.querySelectorAll('[data-demo]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); a.textContent = 'Démonstration : ce bouton ouvre la page de réponse'; }));
  const rb = racine.querySelector('[data-rebours]');
  if (rb) {
    const cible = new Date(rb.dataset.rebours).getTime(), cases = rb.querySelectorAll('b');
    const maj = () => { let s = Math.max(0, Math.floor((cible - Date.now()) / 1000)); [86400, 3600, 60, 1].forEach((u, k) => { cases[k].textContent = String(Math.floor(s / u)).padStart(k ? 2 : 1, '0'); s %= u; }); };
    maj(); racine._minuteur = setInterval(maj, 1000);
  }
}
