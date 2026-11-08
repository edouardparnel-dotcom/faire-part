// Éditeur du faire-part : le couple choisit sa direction artistique, ses couleurs, ses polices, sa photo,
// ajoute, retire, masque et réordonne les parties ; l'aperçu (fp.html?apercu=1) se met à jour en direct.
// Langues : deux langues dans toute formule, trois avec l'option « Langue supplémentaire » ; chaque texte se saisit
// dans la langue choisie en haut de l'éditeur (le français reste l'original).
import { db, storage, $, esc, LOCAL, bandeau, exigerOrganisateur, aLaMain } from './commun.js?v=4';
import { THEMES, FAMILLES, FAMILLES_DE, POLICES, COUVERTURES, PROGRAMMES, RYTHMES, OUVERTURES, MISES_EN_PAGE, theme } from './themes.js?v=2';
import { SECTIONS, designParDefaut } from './moteur.js?v=6';
import { LANGUES } from './langues.js?v=2';
import { GUIDES } from './guides.js?v=1';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';

if (LOCAL) bandeau('Mode local · émulateurs Firebase, données de test');
const vue = $('#vue'), E = new URLSearchParams(location.search).get('e');
let evt, design, famille = 'tous', format = 'fp', ouverte = null, modifie = false, minuteur, saisie = 'fr', ceremonies = [];
const maxLangues = () => (evt.options || []).includes('langue') ? 3 : 2;
const cle = ch => saisie === 'fr' ? ch : `${ch}@${saisie}`;   // champ de la langue en cours de saisie
$('#retour').href = `organisateur.html?e=${encodeURIComponent(E || '')}`;

exigerOrganisateur(vue, async user => {
  const s = await getDoc(doc(db, 'events', E));
  evt = s.data();
  if (!(await aLaMain(evt, E, user.uid))) { vue.innerHTML = '<p class="app-note">Événement introuvable.</p>'; return; }
  design = structuredClone(evt.design || designParDefaut(evt, evt.type === 'mariage' ? 'ivoire' : { anniversaire: 'champagne', bapteme: 'nuage', gender: 'rosebleu', naissance: 'lune' }[evt.type]));
  design.langues ??= ['fr']; ceremonies = structuredClone(evt.ceremonies || []);
  vue.className = 'ed';
  vue.innerHTML = `<div class="ed-panneau">
      <div><span class="etq">${esc(evt.titre)}</span><h1 class="serif" style="font-size:36px;margin:6px 0 4px">Votre faire-part</h1>
        <p class="app-note">Chaque changement apparaît à droite. Pensez à enregistrer.</p></div>
      <details class="boite" open><summary>Direction artistique</summary><div><div class="familles" id="familles"></div><div class="themes" id="themes"></div><p class="app-note" id="structure"></p></div></details>
      <details class="boite"><summary>Structure</summary><div><p class="app-note">Chaque direction a sa propre structure ; vous pouvez en changer chaque élément.</p><div id="structure-choix"></div><button class="mini" id="b-structure-modele">Revenir à la structure de la direction</button></div></details>
      <details class="boite"><summary>Couleurs</summary><div><div class="couleurs" id="couleurs"></div><button class="mini" id="b-couleurs-modele">Revenir aux couleurs du modèle</button></div></details>
      <details class="boite"><summary>Langues</summary><div id="langues"></div></details>
      <details class="boite"><summary>Polices</summary><div><label>Couple de polices<select id="polices"></select></label></div></details>
      <details class="boite"><summary>Couverture</summary><div>
        <label>Petite ligne au-dessus<input id="c-surtitre" maxlength="60"></label>
        <label>Prénoms ou titre<input id="c-titre" maxlength="80"></label>
        <label>Sous-titre (facultatif)<input id="c-soustitre" maxlength="120"></label>
        <div class="photo-couv" id="photo-couv"></div>
        <p class="app-note" id="m-photo"></p></div></details>
      <div class="saisie" id="saisie"></div>
      <details class="boite" open><summary>Parties</summary><div><ul class="parties" id="parties"></ul>
        <div class="ajout"><select id="nouvelle"></select><button class="btn petit" id="b-ajouter">Ajouter</button></div></div></details>
      <details class="boite"><summary>Save-the-date</summary><div>
        <label>Petite ligne au-dessus<input id="s-surtitre" maxlength="60"></label>
        <label>Phrase<input id="s-texte" maxlength="120"></label></div></details>
      <div class="enregistrer"><button class="btn" id="b-enregistrer">Enregistrer</button><span class="etat" id="etat">Tout est enregistré.</span></div>
    </div>
    <div class="ed-apercu">
      <div class="barre-apercu"><button class="mini actif" data-format="fp">Faire-part</button><button class="mini" data-format="std">Save-the-date</button><button class="mini" data-format="site">Site</button><button class="mini" id="b-rejouer">Rejouer l'ouverture</button></div>
      <div class="telephone"><iframe id="apercu" src="fp.html?apercu=1" title="Aperçu du faire-part"></iframe></div>
      <p class="app-note"><a class="lien-or" target="_blank" rel="noopener" href="fp.html?e=${encodeURIComponent(E)}">Voir la page publiée</a></p>
    </div>`;
  addEventListener('message', e => { if (e.origin === location.origin && e.data?.pret) envoyer(true); });
  addEventListener('beforeunload', e => { if (modifie) { e.preventDefault(); e.returnValue = ''; } });
  remplir();
});

// ── Affichage des réglages ──────────────────────────────────────────────────
function remplir() {
  const miennes = FAMILLES_DE[evt.type] || FAMILLES_DE.mariage;
  $('#familles').innerHTML = (miennes.length > 1 ? [['tous', 'Toutes'], ...miennes.map(k => [k, FAMILLES[k]])] : []).map(([k, v]) => `<button data-famille="${k}" class="${k === famille ? 'actif' : ''}">${v}</button>`).join('');
  $('#themes').innerHTML = THEMES.filter(t => miennes.includes(t.famille) && (famille === 'tous' || t.famille === famille)).map(t => `<button class="th ${t.id === design.theme ? 'choisi' : ''}" data-theme="${t.id}">
      <span class="nuances">${['fond', 'papier', 'accent', 'accent2', 'texte'].map(k => `<i style="background:${t.palette[k]}"></i>`).join('')}</span><b>${esc(t.nom)}</b><small>${esc(t.culture)}</small></button>`).join('');
  const th = { ...theme(design.theme), ...(design.structure || {}) };
  $('#structure').textContent = `${COUVERTURES[th.couv]} · programme : ${PROGRAMMES[th.prog].toLowerCase()} · ${RYTHMES[th.rythme].toLowerCase()}.`;
  const base = theme(design.theme), st = design.structure || {};
  $('#structure-choix').innerHTML = [['ouverture', 'Ouverture', OUVERTURES], ['mep', 'Mise en page', MISES_EN_PAGE], ['couv', 'Couverture', COUVERTURES], ['prog', 'Programme', PROGRAMMES], ['rythme', 'Enchaînement des parties', RYTHMES]]
    .map(([k, lib, liste]) => `<label>${lib}<select data-structure="${k}">${Object.entries(liste).map(([v, n]) => `<option value="${v}" ${(st[k] || base[k]) === v ? 'selected' : ''}>${esc(n)}${v === base[k] ? ' (direction)' : ''}</option>`).join('')}</select></label>`).join('');
  const pal = { ...theme(design.theme).palette, ...(design.palette || {}) };
  $('#couleurs').innerHTML = [['fond', 'Fond'], ['papier', 'Papier'], ['texte', 'Texte'], ['accent', 'Accent'], ['accent2', 'Second accent']].map(([k, l]) => `<label>${l}<input type="color" data-couleur="${k}" value="${pal[k]}"></label>`).join('');
  $('#polices').innerHTML = Object.entries(POLICES).map(([k, p]) => `<option value="${k}" ${(design.polices || theme(design.theme).polices) === k ? 'selected' : ''}>${p.nom}</option>`).join('');
  const c = design.couverture;
  if (!design.langues.includes(saisie)) saisie = 'fr';
  $('#langues').innerHTML = `<p class="app-note">Le français est la langue originale. ${maxLangues() === 3 ? 'Votre formule permet trois langues.' : 'Votre formule permet deux langues ; l\'option « Langue supplémentaire » en ajoute une troisième.'}</p>
    <div class="coches">${Object.entries(LANGUES).map(([k, v]) => `<label><input type="checkbox" data-langue="${k}" ${design.langues.includes(k) ? 'checked' : ''} ${k === 'fr' || (!design.langues.includes(k) && design.langues.length >= maxLangues()) ? 'disabled' : ''}>${esc(v)}</label>`).join('')}</div>
    ${design.langues.length > 1 && ceremonies.length ? `<p class="app-note" style="margin-top:8px">Noms des cérémonies dans les autres langues :</p>${ceremonies.map((x, k) => design.langues.filter(l => l !== 'fr').map(l => `<label>${esc(x.nom)} · ${esc(LANGUES[l])}<input data-cer="${k}:${l}" value="${esc(x['nom@' + l] || '')}" maxlength="80"></label>`).join('')).join('')}` : ''}
    ${design.langues.includes('ht') ? '<p class="app-note">Les textes fixes en créole haïtien sont fournis par Maison Vivat ; faites relire les vôtres par un proche.</p>' : ''}`;
  $('#saisie').innerHTML = design.langues.length > 1 ? `<span>Langue de saisie des textes :</span>${design.langues.map(l => `<button class="mini ${l === saisie ? 'actif' : ''}" data-saisie="${l}">${esc(LANGUES[l])}</button>`).join('')}` : '';
  $('#c-surtitre').value = c[cle('surtitre')] || ''; $('#c-titre').value = c.titre || ''; $('#c-soustitre').value = c[cle('soustitre')] || '';
  $('#photo-couv').innerHTML = c.photo ? `<img src="${esc(c.photo)}" alt=""><button class="mini" id="b-sans-photo">Retirer la photo</button><label class="mini" style="cursor:pointer">Changer<input type="file" accept="image/*" id="i-photo" hidden></label>`
    : `<label class="btn petit clair" style="cursor:pointer">Ajouter une photo<input type="file" accept="image/*" id="i-photo" hidden></label>`;
  $('#s-surtitre').value = design.std?.[cle('surtitre')] || ''; $('#s-texte').value = design.std?.[cle('texte')] || '';
  parties();
}

function parties() {
  const S = design.sections;
  $('#parties').innerHTML = S.map((s, k) => `<li class="partie ${s.visible === false ? 'masquee' : ''}">
      <div class="partie-tete"><b>${esc(SECTIONS[s.type]?.nom || s.type)}</b>
        <button class="icone" data-monter="${k}" ${k ? '' : 'disabled'} title="Monter">↑</button>
        <button class="icone" data-descendre="${k}" ${k < S.length - 1 ? '' : 'disabled'} title="Descendre">↓</button>
        <button class="icone" data-voir="${k}" title="${s.visible === false ? 'Afficher' : 'Masquer'}">${s.visible === false ? '◌' : '●'}</button>
        <button class="icone" data-ouvrir="${k}" title="Modifier">✎</button>
        <button class="icone" data-retirer="${k}" title="Retirer">✕</button></div>
      ${ouverte === k ? `<div class="partie-corps">${SECTIONS[s.type]?.auto ? `<p class="app-note">${esc(SECTIONS[s.type].auto)}.</p>` : ''}
        ${optionManquante(s.type) ? `<p class="app-note">Partie liée à l'option « ${esc(SECTIONS[s.type].nom)} » : vos invités la verront une fois l'option activée.</p>` : ''}
        ${s.type === 'galerie' ? `<div class="photos-galerie">${(s.photos || []).map((u, i) => `<span><img src="${esc(u)}" alt=""><button class="icone" data-retirer-galerie="${k}:${i}" title="Retirer">✕</button></span>`).join('')}</div>
          <label class="btn petit clair" style="cursor:pointer;justify-self:start">Ajouter des photos<input type="file" accept="image/*" multiple data-galerie="${k}" hidden></label><p class="app-note" id="m-galerie"></p>` : ''}
        ${s.type === 'guide' && saisie === 'fr' ? `<label>Partir d'un modèle<select data-guide="${k}"><option value="">Choisir un modèle…</option>${Object.entries(GUIDES).map(([g, x]) => `<option value="${g}">${esc(x.nom)}</option>`).join('')}</select></label>` : ''}
        ${saisie !== 'fr' ? `<p class="app-note">Saisie en ${esc(LANGUES[saisie])} ; laissé vide, le texte français s'affiche.</p>` : ''}
        ${Object.entries(SECTIONS[s.type]?.champs || {}).filter(([ch]) => saisie === 'fr' || !['prenom', 'heure', 'poids', 'taille', 'parrain', 'marraine', 'couleurs', 'lien'].includes(ch)).map(([ch, lib]) => ch === 'texte'
          ? `<label>${esc(lib)}<textarea rows="${s.type === 'guide' ? 12 : 4}" data-champ="${k}:${cle(ch)}" maxlength="${s.type === 'guide' ? 6000 : 2000}" placeholder="${esc(saisie === 'fr' ? '' : s[ch] || '')}">${esc(s[cle(ch)] || '')}</textarea></label>`
          : `<label>${esc(lib)}<input data-champ="${k}:${cle(ch)}" value="${esc(s[cle(ch)] || '')}" maxlength="300" placeholder="${esc(saisie === 'fr' ? '' : s[ch] || '')}"></label>`).join('')}</div>` : ''}
    </li>`).join('');
  $('#nouvelle').innerHTML = Object.entries(SECTIONS).map(([k, v]) => `<option value="${k}">${esc(v.nom)}${optionManquante(k) ? ' (option)' : ''}</option>`).join('');
}

const optionManquante = type => SECTIONS[type]?.option && !(evt.options || []).includes(SECTIONS[type].option);

// ── Aperçu et enregistrement ────────────────────────────────────────────────
// L'aperçu montre toutes les parties (même celles d'une option non activée) dans la langue de saisie.
function envoyer(rejouer = false) {
  $('#apercu')?.contentWindow?.postMessage({ evt: { ...evt, options: undefined, ceremonies }, design, format, rejouer, langue: saisie }, location.origin);
}
function changer(refaire = false) {
  modifie = true; $('#etat').textContent = 'Modifications non enregistrées.';
  if (refaire) remplir();
  clearTimeout(minuteur); minuteur = setTimeout(() => envoyer(false), 120);
}

document.addEventListener('click', async ev => {
  const b = ev.target.closest('button'); if (!b || !design) return;
  const S = design.sections, d = b.dataset;
  if (d.famille) { famille = d.famille; return remplir(); }
  if (d.saisie) { saisie = d.saisie; ouverte = null; remplir(); return envoyer(false); }
  if (d.theme) { design.theme = d.theme; design.palette = null; design.polices = null; design.structure = null; return changer(true); }
  if (d.format) { format = d.format; document.querySelectorAll('[data-format]').forEach(x => x.classList.toggle('actif', x === b)); return envoyer(true); }
  if (b.id === 'b-rejouer') return envoyer(true);
  if (b.id === 'b-couleurs-modele') { design.palette = null; return changer(true); }
  if (b.id === 'b-structure-modele') { design.structure = null; return changer(true); }
  if (d.retirerGalerie) { const [k, i] = d.retirerGalerie.split(':').map(Number); S[k].photos.splice(i, 1); parties(); return changer(); }
  if (b.id === 'b-sans-photo') { design.couverture.photo = ''; return changer(true); }
  if (d.monter) { const k = +d.monter; [S[k - 1], S[k]] = [S[k], S[k - 1]]; ouverte = null; parties(); return changer(); }
  if (d.descendre) { const k = +d.descendre; [S[k + 1], S[k]] = [S[k], S[k + 1]]; ouverte = null; parties(); return changer(); }
  if (d.voir) { const s = S[+d.voir]; s.visible = s.visible === false; parties(); return changer(); }
  if (d.ouvrir) { ouverte = ouverte === +d.ouvrir ? null : +d.ouvrir; return parties(); }
  if (d.retirer) { S.splice(+d.retirer, 1); ouverte = null; parties(); return changer(); }
  if (b.id === 'b-ajouter') { const t = $('#nouvelle').value; S.push({ type: t, visible: true, ...SECTIONS[t].defaut }); ouverte = S.length - 1; parties(); return changer(); }
  if (b.id === 'b-enregistrer') {
    b.disabled = true; $('#etat').textContent = 'Enregistrement…';
    try { await updateDoc(doc(db, 'events', E), { design, ceremonies }); modifie = false; $('#etat').textContent = 'Enregistré. Vos invités voient la nouvelle version.'; }
    catch (e) { console.error(e); $('#etat').textContent = 'L\'enregistrement a échoué. Réessayez.'; }
    b.disabled = false;
  }
});

document.addEventListener('input', ev => {
  const t = ev.target; if (!design) return;
  if (t.dataset.couleur) { design.palette = { ...(design.palette || {}), [t.dataset.couleur]: t.value }; return changer(); }
  if (t.dataset.champ) { const i = t.dataset.champ.indexOf(':'), k = +t.dataset.champ.slice(0, i), ch = t.dataset.champ.slice(i + 1); design.sections[k][ch] = t.value; return changer(); }
  if (t.dataset.cer) { const [k, l] = t.dataset.cer.split(':'); ceremonies[+k]['nom@' + l] = t.value; return changer(); }
  const c = { 'c-surtitre': 'surtitre', 'c-titre': 'titre', 'c-soustitre': 'soustitre' }[t.id];
  if (c) { design.couverture[c === 'titre' ? c : cle(c)] = t.value; return changer(); }
  if (t.id === 's-surtitre' || t.id === 's-texte') { design.std = { ...(design.std || {}), [cle(t.id === 's-texte' ? 'texte' : 'surtitre')]: t.value }; return changer(); }
});

document.addEventListener('change', async ev => {
  const t = ev.target; if (!design) return;
  if (t.id === 'polices') { design.polices = t.value; return changer(); }
  if (t.dataset.structure) { const k = t.dataset.structure, base = theme(design.theme)[k]; design.structure = { ...(design.structure || {}), [k]: t.value === base ? '' : t.value }; return changer(true); }
  if (t.dataset.galerie && t.files.length) {
    const S = design.sections[+t.dataset.galerie]; S.photos ??= [];
    try {
      for (const [n, fi] of [...t.files].entries()) {
        $('#m-galerie').textContent = `Envoi ${n + 1} sur ${t.files.length}…`;
        const img = await createImageBitmap(fi), k = Math.min(1, 1800 / Math.max(img.width, img.height));
        const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const r = ref(storage, `events/${E}/design/galerie-${Date.now()}-${n}.jpg`);
        await uploadBytes(r, await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.86)), { contentType: 'image/jpeg' });
        S.photos.push(await getDownloadURL(r));
      }
      parties(); return changer();
    } catch (e) { console.error(e); $('#m-galerie').textContent = 'Une photo n\'a pas pu être envoyée.'; }
  }
  if (t.dataset.langue) { const l = t.dataset.langue; design.langues = t.checked ? [...new Set([...design.langues, l])].slice(0, maxLangues()) : design.langues.filter(x => x !== l); return changer(true); }
  if (t.dataset.guide && t.value) { const g = GUIDES[t.value], S = design.sections[+t.dataset.guide]; Object.assign(S, { intro: g.intro, texte: g.texte }); parties(); return changer(); }
  if (t.id === 'i-photo' && t.files[0]) {
    $('#m-photo').textContent = 'Envoi de la photo…';
    try {
      const img = await createImageBitmap(t.files[0]), k = Math.min(1, 1800 / Math.max(img.width, img.height));
      const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
      const r = ref(storage, `events/${E}/design/couverture-${Date.now()}.jpg`);
      await uploadBytes(r, blob, { contentType: 'image/jpeg' });
      design.couverture.photo = await getDownloadURL(r);
      $('#m-photo').textContent = '';
      changer(true);
    } catch (e) { console.error(e); $('#m-photo').textContent = 'La photo n\'a pas pu être envoyée.'; }
  }
});
