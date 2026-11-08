// Éditeur du faire-part : le couple choisit sa direction artistique, ses couleurs, ses polices, sa photo,
// ajoute, retire, masque et réordonne les parties ; l'aperçu (fp.html?apercu=1) se met à jour en direct.
import { db, storage, $, esc, LOCAL, bandeau, exigerOrganisateur } from './commun.js?v=2';
import { THEMES, FAMILLES, POLICES, theme } from './themes.js?v=1';
import { SECTIONS, designParDefaut } from './moteur.js?v=1';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';

if (LOCAL) bandeau('Mode local · émulateurs Firebase, données de test');
const vue = $('#vue'), E = new URLSearchParams(location.search).get('e');
let evt, design, famille = 'tous', format = 'fp', ouverte = null, modifie = false, minuteur;
$('#retour').href = `organisateur.html?e=${encodeURIComponent(E || '')}`;

exigerOrganisateur(vue, async user => {
  const s = await getDoc(doc(db, 'events', E));
  evt = s.data();
  if (!evt || evt.owner !== user.uid) { vue.innerHTML = '<p class="app-note">Événement introuvable.</p>'; return; }
  design = structuredClone(evt.design || designParDefaut(evt, 'ivoire'));
  vue.className = 'ed';
  vue.innerHTML = `<div class="ed-panneau">
      <div><span class="etq">${esc(evt.titre)}</span><h1 class="serif" style="font-size:36px;margin:6px 0 4px">Votre faire-part</h1>
        <p class="app-note">Chaque changement apparaît à droite. Pensez à enregistrer.</p></div>
      <details class="boite" open><summary>Direction artistique</summary><div><div class="familles" id="familles"></div><div class="themes" id="themes"></div></div></details>
      <details class="boite"><summary>Couleurs</summary><div><div class="couleurs" id="couleurs"></div><button class="mini" id="b-couleurs-modele">Revenir aux couleurs du modèle</button></div></details>
      <details class="boite"><summary>Polices</summary><div><label>Couple de polices<select id="polices"></select></label></div></details>
      <details class="boite"><summary>Couverture</summary><div>
        <label>Petite ligne au-dessus<input id="c-surtitre" maxlength="60"></label>
        <label>Prénoms ou titre<input id="c-titre" maxlength="80"></label>
        <label>Sous-titre (facultatif)<input id="c-soustitre" maxlength="120"></label>
        <div class="photo-couv" id="photo-couv"></div>
        <p class="app-note" id="m-photo"></p></div></details>
      <details class="boite" open><summary>Parties</summary><div><ul class="parties" id="parties"></ul>
        <div class="ajout"><select id="nouvelle"></select><button class="btn petit" id="b-ajouter">Ajouter</button></div></div></details>
      <details class="boite"><summary>Save-the-date</summary><div>
        <label>Petite ligne au-dessus<input id="s-surtitre" maxlength="60"></label>
        <label>Phrase<input id="s-texte" maxlength="120"></label></div></details>
      <div class="enregistrer"><button class="btn" id="b-enregistrer">Enregistrer</button><span class="etat" id="etat">Tout est enregistré.</span></div>
    </div>
    <div class="ed-apercu">
      <div class="barre-apercu"><button class="mini actif" data-format="fp">Faire-part</button><button class="mini" data-format="std">Save-the-date</button><button class="mini" id="b-rejouer">Rejouer l'ouverture</button></div>
      <div class="telephone"><iframe id="apercu" src="fp.html?apercu=1" title="Aperçu du faire-part"></iframe></div>
      <p class="app-note"><a class="lien-or" target="_blank" rel="noopener" href="fp.html?e=${encodeURIComponent(E)}">Voir la page publiée</a></p>
    </div>`;
  addEventListener('message', e => { if (e.origin === location.origin && e.data?.pret) envoyer(true); });
  addEventListener('beforeunload', e => { if (modifie) { e.preventDefault(); e.returnValue = ''; } });
  remplir();
});

// ── Affichage des réglages ──────────────────────────────────────────────────
function remplir() {
  $('#familles').innerHTML = [['tous', 'Toutes'], ...Object.entries(FAMILLES)].map(([k, v]) => `<button data-famille="${k}" class="${k === famille ? 'actif' : ''}">${v}</button>`).join('');
  $('#themes').innerHTML = THEMES.filter(t => famille === 'tous' || t.famille === famille).map(t => `<button class="th ${t.id === design.theme ? 'choisi' : ''}" data-theme="${t.id}">
      <span class="nuances">${['fond', 'papier', 'accent', 'accent2', 'texte'].map(k => `<i style="background:${t.palette[k]}"></i>`).join('')}</span><b>${esc(t.nom)}</b><small>${esc(t.culture)}</small></button>`).join('');
  const pal = { ...theme(design.theme).palette, ...(design.palette || {}) };
  $('#couleurs').innerHTML = [['fond', 'Fond'], ['papier', 'Papier'], ['texte', 'Texte'], ['accent', 'Accent'], ['accent2', 'Second accent']].map(([k, l]) => `<label>${l}<input type="color" data-couleur="${k}" value="${pal[k]}"></label>`).join('');
  $('#polices').innerHTML = Object.entries(POLICES).map(([k, p]) => `<option value="${k}" ${(design.polices || theme(design.theme).polices) === k ? 'selected' : ''}>${p.nom}</option>`).join('');
  const c = design.couverture;
  $('#c-surtitre').value = c.surtitre || ''; $('#c-titre').value = c.titre || ''; $('#c-soustitre').value = c.soustitre || '';
  $('#photo-couv').innerHTML = c.photo ? `<img src="${esc(c.photo)}" alt=""><button class="mini" id="b-sans-photo">Retirer la photo</button><label class="mini" style="cursor:pointer">Changer<input type="file" accept="image/*" id="i-photo" hidden></label>`
    : `<label class="btn petit clair" style="cursor:pointer">Ajouter une photo<input type="file" accept="image/*" id="i-photo" hidden></label>`;
  $('#s-surtitre').value = design.std?.surtitre || ''; $('#s-texte').value = design.std?.texte || '';
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
        ${Object.entries(SECTIONS[s.type]?.champs || {}).map(([ch, lib]) => ch === 'texte'
          ? `<label>${esc(lib)}<textarea rows="4" data-champ="${k}:${ch}" maxlength="2000">${esc(s[ch] || '')}</textarea></label>`
          : `<label>${esc(lib)}<input data-champ="${k}:${ch}" value="${esc(s[ch] || '')}" maxlength="300"></label>`).join('')}</div>` : ''}
    </li>`).join('');
  $('#nouvelle').innerHTML = Object.entries(SECTIONS).map(([k, v]) => `<option value="${k}">${esc(v.nom)}</option>`).join('');
}

// ── Aperçu et enregistrement ────────────────────────────────────────────────
function envoyer(rejouer = false) {
  $('#apercu')?.contentWindow?.postMessage({ evt, design, format, rejouer }, location.origin);
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
  if (d.theme) { design.theme = d.theme; design.palette = null; design.polices = null; return changer(true); }
  if (d.format) { format = d.format; document.querySelectorAll('[data-format]').forEach(x => x.classList.toggle('actif', x === b)); return envoyer(true); }
  if (b.id === 'b-rejouer') return envoyer(true);
  if (b.id === 'b-couleurs-modele') { design.palette = null; return changer(true); }
  if (b.id === 'b-sans-photo') { design.couverture.photo = ''; return changer(true); }
  if (d.monter) { const k = +d.monter; [S[k - 1], S[k]] = [S[k], S[k - 1]]; ouverte = null; parties(); return changer(); }
  if (d.descendre) { const k = +d.descendre; [S[k + 1], S[k]] = [S[k], S[k + 1]]; ouverte = null; parties(); return changer(); }
  if (d.voir) { const s = S[+d.voir]; s.visible = s.visible === false; parties(); return changer(); }
  if (d.ouvrir) { ouverte = ouverte === +d.ouvrir ? null : +d.ouvrir; return parties(); }
  if (d.retirer) { S.splice(+d.retirer, 1); ouverte = null; parties(); return changer(); }
  if (b.id === 'b-ajouter') { const t = $('#nouvelle').value; S.push({ type: t, visible: true, ...SECTIONS[t].defaut }); ouverte = S.length - 1; parties(); return changer(); }
  if (b.id === 'b-enregistrer') {
    b.disabled = true; $('#etat').textContent = 'Enregistrement…';
    try { await updateDoc(doc(db, 'events', E), { design }); modifie = false; $('#etat').textContent = 'Enregistré. Vos invités voient la nouvelle version.'; }
    catch (e) { console.error(e); $('#etat').textContent = 'L\'enregistrement a échoué. Réessayez.'; }
    b.disabled = false;
  }
});

document.addEventListener('input', ev => {
  const t = ev.target; if (!design) return;
  if (t.dataset.couleur) { design.palette = { ...(design.palette || {}), [t.dataset.couleur]: t.value }; return changer(); }
  if (t.dataset.champ) { const [k, ch] = t.dataset.champ.split(':'); design.sections[+k][ch] = t.value; return changer(); }
  const c = { 'c-surtitre': 'surtitre', 'c-titre': 'titre', 'c-soustitre': 'soustitre' }[t.id];
  if (c) { design.couverture[c] = t.value; return changer(); }
  if (t.id === 's-surtitre' || t.id === 's-texte') { design.std = { ...(design.std || {}), [t.id === 's-texte' ? 'texte' : 'surtitre']: t.value }; return changer(); }
});

document.addEventListener('change', async ev => {
  const t = ev.target; if (!design) return;
  if (t.id === 'polices') { design.polices = t.value; return changer(); }
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
