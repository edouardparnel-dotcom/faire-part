// Moteur de faire-part : affiche une direction artistique (themes.js) avec les réglages du couple (design)
// et les informations de l'événement. Deux formats : faire-part (fp) et save-the-date (std).
import { theme as themeDe, POLICES } from './themes.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paragraphes = s => esc(s).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
const dateLongue = d => { const s = d ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''; return s.charAt(0).toUpperCase() + s.slice(1); };
const heure = d => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ') : '';
const surUrl = u => /^https?:\/\//i.test(u || '') ? u : '';

// Parties qu'un couple peut ajouter, retirer, réordonner. champs : ce que l'éditeur propose de modifier.
export const SECTIONS = {
  accueil: { nom: 'Mot d\'accueil', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Bienvenue', texte: 'Nous avons la joie de vous inviter à partager ce jour avec nous.' } },
  histoire: { nom: 'Notre histoire', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Notre histoire', texte: 'Tout a commencé par une rencontre…' } },
  programme: { nom: 'Programme', champs: { titre: 'Titre' }, defaut: { titre: 'Le programme' }, auto: 'Les cérémonies de votre espace, avec l\'heure, le lieu et le plan' },
  compte: { nom: 'Compte à rebours', champs: { titre: 'Titre' }, defaut: { titre: 'Plus que' } },
  tenue: { nom: 'Tenue', champs: { titre: 'Titre', texte: 'Texte', couleurs: 'Couleurs suggérées (codes séparés par des virgules)' }, defaut: { titre: 'Tenue', texte: 'Tenue de cérémonie. Une touche de couleur est la bienvenue.', couleurs: '' } },
  hebergement: { nom: 'Hébergement', champs: { titre: 'Titre', texte: 'Texte', libelle: 'Texte du lien', lien: 'Adresse du lien' }, defaut: { titre: 'Où dormir', texte: 'Quelques adresses proches du lieu de réception.', libelle: '', lien: '' } },
  transport: { nom: 'Venir', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Venir', texte: 'Un parking est disponible sur place. Des navettes sont prévues depuis la gare.' } },
  cadeaux: { nom: 'Liste de mariage, cagnotte', champs: { titre: 'Titre', texte: 'Texte', libelle: 'Texte du lien', lien: 'Adresse du lien' }, defaut: { titre: 'Liste et cagnotte', texte: 'Votre présence est notre plus beau cadeau. Pour ceux qui le souhaitent :', libelle: 'Voir la liste', lien: '' } },
  faq: { nom: 'Questions fréquentes', champs: { titre: 'Titre', texte: 'Questions et réponses (une question par ligne, puis sa réponse ; une ligne vide entre deux)' }, defaut: { titre: 'Questions fréquentes', texte: 'Les enfants sont-ils invités ?\nOui, avec plaisir.\n\nY a-t-il un parking ?\nOui, sur place.' } },
  contact: { nom: 'Contact', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Une question ?', texte: 'Écrivez-nous ou appelez nos témoins.' } },
  texte: { nom: 'Texte libre', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Un mot', texte: '' } },
  reponse: { nom: 'Bouton de réponse', champs: { titre: 'Titre', texte: 'Texte' }, defaut: { titre: 'Votre réponse', texte: 'Merci de nous répondre avant le grand jour.' } },
};

export function designParDefaut(evt, themeId = 'ivoire') {
  const fete = evt.type && evt.type !== 'mariage';
  return {
    theme: themeId, palette: null, polices: null,
    couverture: { surtitre: fete ? 'Vous êtes invités' : 'Nous nous marions', titre: evt.titre || '', soustitre: '', photo: '' },
    sections: ['accueil', 'programme', 'compte', 'tenue', 'reponse'].map(type => ({ type, visible: true, ...SECTIONS[type].defaut })),
    std: { surtitre: 'Réservez la date', texte: 'Invitation à suivre' },
  };
}

// Ornements : motifs SVG en arrière-plan, dessinés dans la couleur d'accent.
function ornement(type, c) {
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
    case 'filet': return 'none';
    default: return 'none';
  }
}

function ics(evt) {
  const d = new Date(evt.date), f = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const fin = new Date(d.getTime() + 6 * 3600e3);
  const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Maison Vivat//FR', 'BEGIN:VEVENT', `UID:${f(d)}@maisonvivat.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(d)}`, `DTEND:${f(fin)}`, `SUMMARY:${evt.titre}`, `LOCATION:${evt.lieu || ''}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(txt);
}

function section(s, ctx) {
  const { evt, invite, lienReponse } = ctx, t = s.titre ? `<h2>${esc(s.titre)}</h2>` : '';
  switch (s.type) {
    case 'programme': {
      const C = (evt.ceremonies || []).filter(c => !invite || invite.ceremonies?.includes(c.cle));
      return `${t}<ul class="programme">${C.map(c => `<li><span class="h">${heure(c.date)}</span><div><b>${esc(c.nom)}</b><span>${esc(dateLongue(c.date))}</span><span>${esc(c.lieu)} · <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.lieu || '')}" target="_blank" rel="noopener">plan</a></span></div></li>`).join('')}</ul>`;
    }
    case 'compte': return `${t}<div class="rebours" data-rebours="${esc(evt.date)}"><div><b>--</b>jours</div><div><b>--</b>heures</div><div><b>--</b>min</div><div><b>--</b>sec</div></div>`;
    case 'tenue': {
      const cs = (s.couleurs || '').split(',').map(x => x.trim()).filter(x => /^#[0-9a-f]{3,8}$/i.test(x));
      return `${t}${paragraphes(s.texte)}${cs.length ? `<div class="nuancier">${cs.map(c => `<i style="background:${c}"></i>`).join('')}</div>` : ''}`;
    }
    case 'faq': return `${t}<dl class="faq">${(s.texte || '').split(/\n{2,}/).map(b => { const [q, ...r] = b.split('\n'); return q ? `<dt>${esc(q)}</dt><dd>${esc(r.join(' '))}</dd>` : ''; }).join('')}</dl>`;
    case 'reponse': return `${t}${paragraphes(s.texte)}<a class="bouton" href="${esc(lienReponse || '#')}"${lienReponse ? '' : ' data-demo'}>Répondre</a>`;
    default: {
      const l = surUrl(s.lien);
      return `${t}${paragraphes(s.texte)}${l ? `<a class="bouton clair" href="${esc(l)}" target="_blank" rel="noopener">${esc(s.libelle || 'Ouvrir')}</a>` : ''}`;
    }
  }
}

function ouverture(type, d, nom) {
  const libelle = { enveloppe: 'Ouvrir l\'enveloppe', sceau: 'Briser le sceau', ruban: 'Dénouer le ruban', rouleau: 'Dérouler', lumiere: 'Allumer', tuiles: 'Découvrir' }[type] || 'Ouvrir';
  const initiales = (d.couverture.titre || nom || '').split(/\s*(?:&|et)\s*/).map(x => x.trim()[0] || '').join(' · ');
  const tuiles = type === 'tuiles' ? `<div class="grille-tuiles">${Array.from({ length: 24 }, (_, k) => `<i style="--k:${k}"></i>`).join('')}</div>` : '';
  return `<div class="ov ov-${type}" data-ouverture role="button" tabindex="0" aria-label="${esc(libelle)}">
    <div class="ov-a"></div><div class="ov-b"></div>${tuiles}
    <div class="ov-centre"><span class="ov-init">${esc(initiales)}</span><span class="ov-lib">${esc(libelle)}</span></div></div>`;
}

// Point d'entrée : racine = élément à remplir. ctx = { evt, design, format: 'fp'|'std', invite, lienReponse, sansOuverture }
export function rendre(racine, ctx) {
  const d = ctx.design, th = themeDe(d.theme), pal = { ...th.palette, ...(d.palette || {}) }, pol = POLICES[d.polices || th.polices] || POLICES.cormorant;
  if (racine._minuteur) clearInterval(racine._minuteur);
  if (!document.querySelector(`link[data-police="${pol.url}"]`)) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.police = pol.url; l.href = `https://fonts.googleapis.com/css2?family=${pol.url}&display=swap`; document.head.append(l);
  }
  const style = `--fond:${pal.fond};--papier:${pal.papier};--texte:${pal.texte};--accent:${pal.accent};--accent2:${pal.accent2};--f-titre:'${pol.titre}',serif;--f-texte:'${pol.texte}',sans-serif;--orn:${ornement(th.ornement, pal.accent)}`;
  const c = d.couverture || {}, std = ctx.format === 'std';
  const prenom = ctx.invite?.nom ? ctx.invite.nom.split(' ')[0] : '';
  const couverture = `<header class="couv">
      ${c.photo ? `<div class="couv-photo" style="background-image:url('${esc(c.photo)}')"></div>` : `<div class="couv-orn" aria-hidden="true"></div>`}
      <div class="couv-texte">
        ${prenom ? `<p class="pour">Pour ${esc(prenom)}</p>` : ''}
        <p class="surtitre">${esc(std ? (d.std?.surtitre || 'Réservez la date') : c.surtitre)}</p>
        <h1>${esc(c.titre || ctx.evt.titre)}</h1>
        ${c.soustitre && !std ? `<p class="soustitre">${esc(c.soustitre)}</p>` : ''}
        <p class="date">${esc(dateLongue(ctx.evt.date))}</p>
        ${std ? `<p class="lieu-std">${esc(ctx.evt.lieu || '')}</p>` : ''}
      </div></header>`;
  const corps = std
    ? `<section class="bloc std"><p class="std-texte">${esc(d.std?.texte || 'Invitation à suivre')}</p><a class="bouton" href="${ics(ctx.evt)}" download="${esc((ctx.evt.titre || 'evenement').replace(/[^\w]+/g, '-'))}.ics">Ajouter à mon agenda</a></section>`
    : (d.sections || []).filter(s => s.visible !== false && SECTIONS[s.type]).map(s => `<section class="bloc bloc-${s.type}">${section(s, ctx)}</section>`).join('');
  racine.className = `fp mep-${th.mep} orn-${th.ornement} ${std ? 'format-std' : 'format-fp'}`;
  racine.setAttribute('style', style);
  racine.innerHTML = (ctx.sansOuverture ? '' : ouverture(th.ouverture, d, ctx.evt.titre)) + `<main class="fp-page">${couverture}${corps}<footer class="fp-pied">Maison Vivat</footer></main>`;

  const ov = racine.querySelector('[data-ouverture]');
  if (ov) {
    document.body.classList.add('fp-ferme');
    const ouvrir = () => { if (ov.classList.contains('ouvert')) return; ov.classList.add('ouvert'); document.body.classList.remove('fp-ferme'); setTimeout(() => ov.remove(), 1900); };
    ov.addEventListener('click', ouvrir); ov.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && ouvrir());
  }
  racine.querySelectorAll('[data-demo]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); a.textContent = 'Démonstration : ce bouton ouvre la page de réponse'; }));
  const rb = racine.querySelector('[data-rebours]');
  if (rb) {
    const cible = new Date(rb.dataset.rebours).getTime(), cases = rb.querySelectorAll('b');
    const maj = () => { let s = Math.max(0, Math.floor((cible - Date.now()) / 1000)); [86400, 3600, 60, 1].forEach((u, k) => { cases[k].textContent = String(Math.floor(s / u)).padStart(k ? 2 : 1, '0'); s %= u; }); };
    maj(); racine._minuteur = setInterval(maj, 1000);
  }
}
