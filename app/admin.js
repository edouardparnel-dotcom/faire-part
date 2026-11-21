// Tableau de bord de la maison : visites du site, comptes, essais, collections testées, commandes et paiements.
// Les données viennent de la fonction tableauAdmin, réservée aux comptes marqués admin (backend/outils/admin.cjs).
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import { fonctions, exigerOrganisateur, deconnecter, $, esc, NOMS_OPTIONS } from './commun.js';

const vue = $('#vue');
const euros = c => (c / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const jourFr = iso => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';
const somme = (liste, cle) => liste.reduce((t, x) => t + (x[cle] || 0), 0);
const ajouter = (m, cle, n = 1) => { m[cle] = (m[cle] || 0) + n; return m; };
const classer = m => Object.entries(m).sort((a, b) => b[1] - a[1]);
const tableau = (titres, lignes, vide = 'Rien pour le moment.') => lignes.length
  ? `<div class="adm-defile"><table><thead><tr>${titres.map(t => `<th>${t}</th>`).join('')}</tr></thead><tbody>${lignes.join('')}</tbody></table></div>`
  : `<p class="adm-vide">${vide}</p>`;
let periode = 30;

exigerOrganisateur(vue, () => { $('#b-sortir').hidden = false; charger(); });
$('#b-sortir').addEventListener('click', e => { e.preventDefault(); deconnecter(); });

async function charger() {
  vue.innerHTML = '<div class="adm"><p>Chargement…</p></div>';
  let d;
  try { d = (await httpsCallable(fonctions, 'tableauAdmin')({ jours: periode })).data; }
  catch (e) {
    vue.innerHTML = `<div class="adm"><h1 class="serif">Accès réservé</h1><p>${e.code === 'functions/permission-denied'
      ? "Ce compte n'a pas l'accès au tableau de bord." : 'Chargement impossible : ' + esc(e.message)}</p></div>`;
    return;
  }
  afficher(d);
}

function afficher(d) {
  const limite = Date.now() - d.jours * 864e5, recent = x => x.creeLe && Date.parse(x.creeLe) >= limite;
  const vues = somme(d.stats, 'vues'), sessions = somme(d.stats, 'sessions');
  const mobile = somme(d.stats, 'mobile'), ordi = somme(d.stats, 'ordinateur');
  const pages = {}, sources = {};
  for (const s of d.stats) {
    for (const [p, n] of Object.entries(s.pages || {})) ajouter(pages, p, n);
    for (const [p, n] of Object.entries(s.sources || {})) ajouter(sources, p, n);
  }
  const payes = d.paiements.filter(p => p.etat === 'paye'), ouverts = d.paiements.filter(p => p.etat !== 'paye');
  const payesPeriode = payes.filter(p => Date.parse(p.payeLe || p.creeLe) >= limite);
  const evts = new Map(d.evenements.map(e => [e.id, e]));
  const nouveaux = d.evenements.filter(recent);
  const parModele = {};
  for (const e of d.evenements) {
    const m = parModele[e.modele || '(sans collection)'] ||= { essais: 0, payes: 0, invites: 0 };
    m[e.formule === 'essai' ? 'essais' : 'payes']++; m.invites += e.invites;
  }
  const parOption = {};
  for (const p of payes) for (const o of p.options) ajouter(parOption, NOMS_OPTIONS[o] || o);
  // Jours de la période, y compris ceux sans visite
  const parJour = new Map(d.stats.map(s => [s.jour, s.sessions || 0])), barres = [];
  for (let i = d.jours - 1; i >= 0; i--) {
    const j = new Date(Date.now() - i * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
    barres.push([j, parJour.get(j) || 0]);
  }
  const max = Math.max(1, ...barres.map(b => b[1]));

  vue.innerHTML = `<div class="adm">
    <h1 class="serif">Tableau de bord</h1>
    <div class="adm-periode">${[7, 30, 90, 365].map(n => `<button data-j="${n}" aria-pressed="${n === d.jours}">${n === 365 ? '12 mois' : n + ' jours'}</button>`).join('')}</div>
    <div class="adm-tuiles">
      <div class="adm-tuile"><b>${sessions}</b><span>visites</span></div>
      <div class="adm-tuile"><b>${vues}</b><span>pages vues</span></div>
      <div class="adm-tuile"><b>${d.nouveauxComptes}</b><span>comptes créés (${d.comptes} au total)</span></div>
      <div class="adm-tuile"><b>${nouveaux.length}</b><span>espaces créés (essais)</span></div>
      <div class="adm-tuile"><b>${payesPeriode.length}</b><span>commandes payées</span></div>
      <div class="adm-tuile"><b>${euros(somme(payesPeriode, 'total'))}</b><span>encaissé sur la période</span></div>
      <div class="adm-tuile"><b>${ouverts.length}</b><span>paiements commencés, non payés</span></div>
      <div class="adm-tuile"><b>${d.lancement}</b><span>places de lancement prises</span></div>
    </div>

    <h2>Visites par jour</h2>
    <div class="adm-barres" title="Visites par jour">${barres.map(([j, n]) => `<div style="height:${Math.round(n / max * 100)}%" title="${j} : ${n} visite(s)"></div>`).join('')}</div>
    <p class="adm-vide">${mobile + ordi ? `${Math.round(mobile / (mobile + ordi) * 100)} % sur téléphone. ` : ''}Mesure sans cookie, active depuis le 21/11/2026 ; les robots ne sont pas comptés.</p>

    <div class="adm-deux">
      <div><h2>Pages les plus vues</h2>${tableau(['Page', 'Vues'], classer(pages).slice(0, 25).map(([p, n]) => `<tr><td><a href="${esc(p.startsWith('/app/fp.html/') ? '/app/fp.html?demo=' + p.split('/').pop() : p)}" target="_blank" rel="noopener">${esc(p)}</a></td><td class="n">${n}</td></tr>`))}</div>
      <div><h2>D'où viennent les visiteurs</h2>${tableau(['Source', 'Visites'], classer(sources).map(([s, n]) => `<tr><td>${esc(s)}</td><td class="n">${n}</td></tr>`))}</div>
    </div>

    <h2>Collections essayées et achetées</h2>
    ${tableau(['Collection', 'Essais', 'Payés', 'Invités saisis'], classer(Object.fromEntries(Object.entries(parModele).map(([k, v]) => [k, v.essais + v.payes])))
      .map(([m]) => `<tr><td>${esc(m)}</td><td class="n">${parModele[m].essais}</td><td class="n">${parModele[m].payes}</td><td class="n">${parModele[m].invites}</td></tr>`))}

    <h2>Commandes et paiements</h2>
    ${tableau(['Date', 'Espace', 'Compte', 'Formule', 'Options', 'Code', 'Montant', 'État'],
      [...d.paiements].sort((a, b) => (b.creeLe || '').localeCompare(a.creeLe || '')).map(p => {
        const e = evts.get(p.eventId) || {};
        return `<tr><td>${jourFr(p.payeLe || p.creeLe)}</td><td>${esc(e.titre || p.eventId)}</td><td>${esc(e.email || '')}</td><td>${esc(p.formule || '')}</td>
          <td>${esc(p.options.map(o => NOMS_OPTIONS[o] || o).join(', '))}</td><td>${esc(p.partenaire)}${p.lancement ? ' <span class="adm-pastille">lancement</span>' : ''}</td>
          <td class="n">${euros(p.total)}</td><td><span class="adm-pastille ${p.etat === 'paye' ? 'paye' : 'ouvert'}">${p.etat === 'paye' ? 'payé' : 'commencé'}</span></td></tr>`;
      }), 'Aucun paiement pour le moment.')}
    ${Object.keys(parOption).length ? `<p class="adm-vide">Options achetées : ${classer(parOption).map(([o, n]) => `${esc(o)} (${n})`).join(', ')}</p>` : ''}

    <h2>Espaces créés</h2>
    ${tableau(['Créé le', 'Espace', 'Type', 'Collection', 'Formule', 'Invités', 'Date de l\'événement', 'Compte'],
      [...d.evenements].sort((a, b) => (b.creeLe || '').localeCompare(a.creeLe || '')).map(e => `<tr><td>${jourFr(e.creeLe)}</td><td>${esc(e.titre)}</td><td>${esc(e.type)}</td>
        <td>${esc(e.modele)}</td><td>${esc(e.formule)}</td><td class="n">${e.invites}</td><td>${esc(e.date)}</td><td>${esc(e.email)}</td></tr>`), 'Aucun espace créé pour le moment.')}
  </div>`;
  vue.querySelectorAll('[data-j]').forEach(b => b.addEventListener('click', () => { periode = +b.dataset.j; charger(); }));
}
