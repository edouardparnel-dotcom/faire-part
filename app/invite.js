// Page personnelle d'un invité (lien invite.html?e=<événement>&g=<jeton>) : ses cérémonies et ses réponses,
// puis selon les options payées : pass d'entrée QR, infos de voyage, guide de la cérémonie, déroulé, direct, mur photo,
// livre d'or écrit, vocal ou vidéo, album en haute définition, jeux, tenues coordonnées, carte de remerciement ;
// sa table, si les organisateurs ont choisi de la montrer. Le tout dans la langue de l'invité (option langue).
import { auth, db, storage, $, esc, heure, majuscule, LOCAL, PRET, bandeau } from './commun.js?v=4';
import { signInAnonymously, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, collection, query, where, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';
import { traduire, champ, LANGUES, LOCALES, langueChoisie, memoriserLangue } from './langues.js?v=2';
import { theme } from './themes.js?v=3';

if (LOCAL) bandeau('Mode local · émulateurs Firebase, données de test');
const vue = $('#vue'), p = new URLSearchParams(location.search), E = p.get('e'), T = p.get('g');
let cadeaux = [], msgMot = '', evt, inv, live = '', photos = [], mots = [], album = [], quiz = null, classement = null, mesJeux = null, tenues = null, L = 'fr';
const a = o => evt?.options?.includes(o);
const t = x => traduire(L, x);
const dateLongue = d => { if (!d) return ''; try { return new Date(d).toLocaleDateString(LOCALES[L] || 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch { return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } };
const euros = n => (Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' €';
const recents = l => l.sort((x, y) => (y.creeLe?.seconds || 0) - (x.creeLe?.seconds || 0));

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
  await auth.authStateReady();   // attendre l'état de connexion (l'ancienne attente pouvait rester bloquée quand il était déjà connu)
  await rattacher();
  evt = (await getDoc(doc(db, 'events', E))).data();
  if (evt?.formule === 'essai') { vue.innerHTML = '<div class="app-carte" style="text-align:center"><h2 class="serif">Cette invitation se prépare</h2><p class="app-note">Les hôtes mettent la dernière main à leur invitation. Revenez très vite.</p></div>'; return; }
  onSnapshot(doc(db, `events/${E}/invites/${T}`), s => { inv = s.data(); L = langueChoisie(evt.design?.langues || ['fr'], inv?.langue); try { rendre(); } catch (e) { console.error('Affichage de la page invité', e); } }, e => console.error('Fiche invité', e));
  onSnapshot(collection(db, `events/${E}/cadeaux`), s => { cadeaux = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => (x.creeLe?.seconds || 0) - (y.creeLe?.seconds || 0)); rendre(); }, () => {});
  if (a('direct')) live = (await getDoc(doc(db, `events/${E}/prive/config`))).data()?.live || '';
  if (a('murphoto')) onSnapshot(query(collection(db, `events/${E}/photos`), where('visible', '==', true)), s => { photos = recents(s.docs.map(d => ({ id: d.id, ...d.data() }))); rendreGalerie(); });
  if (a('livredor')) onSnapshot(query(collection(db, `events/${E}/livre`), where('visible', '==', true)), s => { mots = recents(s.docs.map(d => ({ id: d.id, ...d.data() }))); rendreMots(); });
  if (a('album')) onSnapshot(query(collection(db, `events/${E}/album`), where('visible', '==', true)), s => { album = recents(s.docs.map(d => ({ id: d.id, ...d.data() }))); rendreAlbum(); });
  if (a('jeux')) {
    onSnapshot(doc(db, `events/${E}/partage/quiz`), s => { quiz = s.data() || null; rendreJeux(); });
    onSnapshot(doc(db, `events/${E}/partage/classement`), s => { classement = s.data() || null; rendreJeux(); });
    onSnapshot(doc(db, `events/${E}/jeuxReponses/${T}`), s => { mesJeux = s.data() || null; rendreJeux(); }, () => {});
  }
  if (a('tenues')) onSnapshot(doc(db, `events/${E}/partage/tenues`), s => { tenues = s.data() || null; rendre(); });
}

const lienPerso = () => new URL(`invite.html?e=${encodeURIComponent(E)}&g=${encodeURIComponent(T)}`, location.href).href;
const embed = u => { const m = u.match(/(?:youtu\.be\/|v=|embed\/|live\/)([\w-]{11})/); return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : u; };
const enSaisie = () => document.activeElement?.closest('#f-reponse, #f-voyage, #f-mot, #f-jeux, #f-tenue') && document.activeElement.matches('input, textarea, select');

function rendre() {
  if (!inv || !evt) return;
  if (enSaisie()) return;   // ne pas effacer une saisie en cours
  const mesC = (evt.ceremonies || []).filter(c => inv.ceremonies?.includes(c.cle));
  const prenom = inv.nom.split(' ')[0], langues = evt.design?.langues || ['fr'];
  const guide = a('guide') ? (evt.design?.sections || []).find(s => s.type === 'guide' && s.visible !== false) : null;
  const merci = a('merci') && evt.merci?.actif ? evt.merci : null;
  document.documentElement.lang = L;
  vue.innerHTML = `${langues.length > 1 ? `<div class="langues-invite">${langues.map(l => `<button type="button" data-langue="${l}" class="${l === L ? 'actif' : ''}">${esc(LANGUES[l])}</button>`).join('')}</div>` : ''}
    ${merci ? `<div class="carte-merci" style="--accent-carte:${esc(carteCouleur())}">${inv.merci?.photo ? `<img src="${esc(inv.merci.photo)}" alt="">` : ''}<div><span class="etq">${t('Merci')}</span><h2 class="serif">${esc(prenom)},</h2>
      ${(champ(merci, 'texte', L) || '').split(/\n{2,}/).map(x => `<p>${esc(x)}</p>`).join('')}${inv.merci?.mot ? `<p class="mot-perso">« ${esc(inv.merci.mot)} »</p>` : ''}<p class="signature">${esc(evt.titre)}</p></div></div>` : ''}
    <div style="text-align:center;margin:20px 0 30px"><span class="etq">${t('Votre invitation')}</span><h1 class="serif">${esc(evt.titre)}</h1>
      <p class="app-note">${esc(majuscule(dateLongue(evt.date)))}</p>
      <a class="btn clair" style="margin-top:18px" href="fp.html?e=${encodeURIComponent(E)}&g=${encodeURIComponent(T)}">${t('Ouvrir le faire-part')}</a></div>
    <form class="app-carte" id="f-reponse"><h2>${t('Bonjour')} ${esc(prenom)}</h2><p class="app-note">${mesC.length > 1 ? t('Vous êtes invité(e) aux moments suivants. Merci de répondre pour chacun.') : t('Merci de nous dire si vous serez présent(e).')}</p>
      ${mesC.map(c => `<div class="ceremonie"><div><h3>${esc(champ(c, 'nom', L))}</h3><p>${esc(majuscule(dateLongue(c.date)))} ${t('à')} ${heure(c.date)}<br>${esc(c.lieu)} · <a class="lien-or" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.lieu)}">${t('plan')}</a></p></div>
        <div class="choix-rep" data-cer="${esc(c.cle)}"><button type="button" data-r="oui" class="${inv.reponses?.[c.cle] === 'oui' ? 'choisi' : ''}">${t('Je serai là')}</button><button type="button" data-r="non" class="${inv.reponses?.[c.cle] === 'non' ? 'choisi' : ''}">${t('Je ne pourrai pas')}</button></div></div>`).join('')}
      <div class="app-grille" style="margin-top:16px">
        ${inv.max ? `<label>${t('Accompagnants')}<select name="accompagnants">${Array.from({ length: inv.max + 1 }, (_, k) => `<option ${k === (inv.accompagnants || 0) ? 'selected' : ''}>${k}</option>`).join('')}</select></label>` : ''}
        <label>${t('Régime, allergies')}<input name="regime" maxlength="120" value="${esc(inv.regime || '')}"></label></div>
      <label>${t(evt.type === 'mariage' ? 'Un mot pour les mariés' : 'Un mot pour les organisateurs')}<textarea name="message" rows="2" maxlength="500">${esc(inv.message || '')}</textarea></label>
      ${evt.dateLimiteReponse && !inv.reponduLe ? `<p class="app-note" style="margin-top:12px">${t('Merci de répondre avant le')} ${esc(dateLongue(evt.dateLimiteReponse + 'T12:00'))}.</p>` : ''}
      <button class="btn" style="margin-top:14px">${t('Envoyer ma réponse')}</button><p class="ok-msg" id="m-rep">${inv.reponduLe ? t('Réponse bien reçue, merci. Vous pouvez la modifier à tout moment.') : ''}</p></form>
    ${a('etranger') ? `<form class="app-carte" id="f-voyage"><h2>${t('Vous venez de loin ?')}</h2><p class="app-note" style="margin-bottom:12px">${t("Dites-nous quand vous arrivez : nous organisons l'accueil, les navettes et, si besoin, la lettre d'invitation pour le visa.")}</p>
      <div class="app-grille"><label>${t("Date d'arrivée")}<input name="date" type="date" value="${esc(inv.arrivee?.date || '')}"></label><label>${t('Vol ou train')}<input name="vol" maxlength="40" value="${esc(inv.arrivee?.vol || '')}"></label></div>
      <div class="coches"><label><input type="checkbox" name="hebergement" ${inv.arrivee?.hebergement ? 'checked' : ''}>${t("J'ai besoin d'un hébergement")}</label><label><input type="checkbox" name="visa" ${inv.arrivee?.visa ? 'checked' : ''}>${t("J'ai besoin d'une lettre pour le visa")}</label></div>
      <button class="btn clair">${t('Enregistrer')}</button><p class="ok-msg" id="m-voyage"></p></form>` : ''}
    ${a('qr') ? `<div class="app-carte qr"><h2>${t("Votre pass d'entrée")}</h2><div id="qr"></div><p class="app-note">${t("Présentez ce code à l'entrée. Il est personnel")}${inv.max ? ` ${t('et vaut pour vous et')} ${inv.max} ${t(inv.max > 1 ? 'accompagnants' : 'accompagnant')}` : ''}.</p>${inv.entree ? `<p class="ok-msg">${t('Entrée validée à')} ${heure(inv.entree.toDate())}. ${t('Bonne fête !')}</p>` : ''}</div>` : ''}
    ${evt.tablesVisibles && inv.tableNom ? `<div class="app-carte" style="text-align:center"><span class="etq">${t('Votre table')}</span><h2 style="font-size:34px;margin:6px 0 0">${esc(inv.tableNom)}</h2></div>` : ''}
    ${guide ? `<div class="app-carte"><h2>${esc(champ(guide, 'titre', L) || t('Le guide de la cérémonie'))}</h2>${champ(guide, 'intro', L) ? `<p class="app-note" style="margin-bottom:12px">${esc(champ(guide, 'intro', L))}</p>` : ''}
      ${(champ(guide, 'texte', L) || '').split(/\n{2,}/).map(b => b.split('\n').filter(x => x.trim())).filter(b => b.length).map(([titre, ...l], k) => `<div class="etape-guide"><span class="etq">${t('Étape')} ${k + 1}</span><h3>${esc(titre)}</h3>${l.map(x => /^\s*(conseil|tip|consejo|dica|konsèy)\s*:/i.test(x) ? `<p class="conseil"><b>${t('Bon à savoir')}</b> ${esc(x.replace(/^[^:]*:\s*/, ''))}</p>` : `<p>${esc(x)}</p>`).join('')}</div>`).join('')}</div>` : ''}
    ${a('deroule') && evt.deroulePublic?.length ? `<div class="app-carte"><h2>${t('Le déroulé')}</h2>${evt.deroulePublic.map(d => `<div class="ceremonie"><div><h3>${esc(d.heure)} · ${esc(d.titre)}</h3>${d.lieu ? `<p>${esc(d.lieu)}</p>` : ''}</div></div>`).join('')}</div>` : ''}
    ${a('tenues') && tenues?.tissus?.length ? formTenue() : ''}
    ${evt.cagnotte?.lien || cadeaux.length ? `<div class="app-carte" id="cadeaux"><h2>${t('Liste et cagnotte')}</h2><p class="app-note" style="margin-bottom:12px">${esc(evt.cagnotte?.texte || t('Votre présence est notre plus beau cadeau. Pour ceux qui le souhaitent :'))}</p>
      ${/^https:\/\//.test(evt.cagnotte?.lien || '') ? `<a class="btn" href="${esc(evt.cagnotte.lien)}" target="_blank" rel="noopener">${esc(evt.cagnotte.libelle || t('Participer à la cagnotte'))}</a>` : ''}
      ${cadeaux.length ? `<ul class="liste-cadeaux" style="list-style:none;margin-top:14px;display:grid;gap:10px">${cadeaux.map(c => `<li style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border:1px solid rgba(0,0,0,.08);border-radius:10px;${c.reservePar && c.reservePar !== T ? 'opacity:.5' : ''}">
        <span><b>${/^https:\/\//.test(c.lien || '') ? `<a href="${esc(c.lien)}" target="_blank" rel="noopener">${esc(c.nom)}</a>` : esc(c.nom)}</b>${c.prix ? ` · ${euros(c.prix)}` : ''}</span>
        ${!c.reservePar ? `<button class="btn petit" data-reserver="${c.id}">${t("Je l'offre")}</button>` : c.reservePar === T ? `<button class="btn petit clair" data-liberer="${c.id}">${t('Annuler')}</button>` : `<span class="app-note">${t('Déjà offert')}</span>`}</li>`).join('')}</ul>
        <p class="app-note" style="margin-top:10px">${t("Réservez le cadeau que vous offrez : les autres invités le verront pris. Vous l'achetez où vous voulez.")}</p>` : ''}</div>` : ''}
    ${a('jeux') ? `<div class="app-carte" id="jeux"></div>` : ''}
    ${a('direct') && live ? `<div class="app-carte"><h2>${t('Le direct')}</h2><p class="app-note" style="margin-bottom:12px">${t('Vous ne pouvez pas venir ? Suivez la cérémonie ici, en direct.')}</p><div class="video"><iframe src="${esc(embed(live))}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Direct"></iframe></div></div>` : ''}
    ${a('murphoto') ? `<div class="app-carte"><h2>${t('Le mur photo')}</h2><p class="app-note" style="margin-bottom:12px">${t("Partagez vos photos de la fête : elles s'affichent sur le mur.")}</p>
      <label class="btn clair" style="display:inline-block;cursor:pointer">${t('Ajouter des photos')}<input type="file" accept="image/*" multiple id="i-photo" hidden></label><p class="ok-msg" id="m-photo"></p><div class="galerie" id="galerie" style="margin-top:14px"></div></div>` : ''}
    ${a('album') ? `<div class="app-carte"><h2>${t("L'album")}</h2><p class="app-note" style="margin-bottom:12px">${t('Les photos de la fête, en haute définition. Ajoutez les vôtres en qualité originale.')}</p>
      <label class="btn clair" style="display:inline-block;cursor:pointer">${t("Ajouter à l'album")}<input type="file" accept="image/*" multiple id="i-album" hidden></label><p class="ok-msg" id="m-album"></p><div class="galerie" id="album" style="margin-top:14px"></div></div>` : ''}
    ${a('livredor') ? `<form class="app-carte" id="f-mot"><h2>${t("Le livre d'or")}</h2><label>${t('Votre prénom')}<input name="de" maxlength="60" required value="${esc(prenom)}"></label>
      <label style="margin-top:10px">${t('Votre message')}<textarea name="texte" rows="3" maxlength="1000"></textarea></label><button class="btn clair" style="margin-top:12px">${t("Signer le livre d'or")}</button>
      <div class="enregistreur" id="enregistreur"><button type="button" class="btn petit clair" data-enregistrer="audio">${t('Laisser un message vocal')}</button><button type="button" class="btn petit clair" data-enregistrer="video">${t('Laisser une vidéo')}</button>
        <label class="lien-or" style="cursor:pointer">${t('ou choisir un fichier')}<input type="file" accept="audio/*,video/*" id="i-media" hidden></label></div>
      <p class="ok-msg" id="m-mot">${esc(msgMot)}</p><div id="mots" style="margin-top:14px"></div></form>` : ''}`;
  // Le pass contient le lien personnel : l'appareil photo de n'importe quel téléphone l'ouvre, et le scanner de l'entrée le reconnaît.
  if (a('qr') && window.qrcode) { const q = qrcode(0, 'M'); q.addData(lienPerso()); q.make(); $('#qr').innerHTML = q.createImgTag(5, 8, "Pass d'entrée"); }
  else if (a('qr')) $('#qr').innerHTML = '<p class="app-erreur">Le pass n\'a pas pu s\'afficher. Rechargez la page.</p>';
  rendreGalerie(); rendreMots(); rendreAlbum(); rendreJeux();
}
const carteCouleur = () => evt.design?.palette?.accent || theme(evt.design?.theme || 'ivoire').palette.accent;

// ── Tenues coordonnées : l'invité choisit son tissu, sa quantité et sa taille ; le règlement est noté par les organisateurs.
function formTenue() {
  const c = inv.tenue || {}, tissu = tenues.tissus.find(x => x.id === c.tissu);
  return `<form class="app-carte" id="f-tenue"><h2>${t('Les tenues')}</h2>${tenues.consigne ? `<p class="app-note" style="margin-bottom:12px">${esc(tenues.consigne)}</p>` : ''}
    <div class="tissus">${tenues.tissus.map(x => `<label class="tissu ${x.id === c.tissu ? 'choisi' : ''}"><input type="radio" name="tissu" value="${esc(x.id)}" ${x.id === c.tissu ? 'checked' : ''} required>
      <i style="background:${esc(x.couleur || '#ccc')}"></i><b>${esc(x.nom)}</b><small>${esc(euros(x.prix))} / ${esc(x.unite || 'pièce')}${x.description ? ` · ${esc(x.description)}` : ''}</small></label>`).join('')}</div>
    <div class="app-grille" style="margin-top:12px"><label>${t('Quantité')}<input name="qte" type="number" min="1" max="20" value="${c.qte || 1}"></label>
      ${tenues.tailles?.length ? `<label>${t('Votre taille')}<select name="taille">${tenues.tailles.map(x => `<option ${x === c.taille ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>` : ''}</div>
    <label>${t('Précisions (mesures, couleur…)')}<input name="note" maxlength="200" value="${esc(c.note || '')}"></label>
    <button class="btn clair" style="margin-top:12px">${t('Commander')}</button>
    ${c.tissu ? `<p class="${c.paye ? 'ok-msg' : 'app-note'}" style="margin-top:10px">${esc(tissu?.nom || '')} × ${c.qte} · ${esc(euros((tissu?.prix || 0) * (c.qte || 1)))} · <b>${c.paye ? t('Payé') : t('À régler')}</b>${!c.paye && tenues.paiement ? ` · ${esc(tenues.paiement)}` : ''}${tenues.dateLimite ? ` · ${t('Avant le')} ${esc(dateLongue(tenues.dateLimite))}` : ''}</p>` : ''}
    <p class="ok-msg" id="m-tenue"></p></form>`;
}

// ── Jeux : quiz sur les mariés et pronostics ; les réponses restent modifiables jusqu'à la révélation.
function rendreJeux() {
  const z = $('#jeux'); if (!z || enSaisie()) return;
  if (!quiz || (!quiz.ouvert && !quiz.revele)) { z.innerHTML = `<h2>${t('Les jeux')}</h2><p class="app-note">${t('Les jeux ouvrent bientôt.')}</p>`; return; }
  const Q = quiz.questions || [], P = quiz.pronos || [], m = mesJeux || {};
  const choix = (nom, i, q, val, bonne) => `<div class="question"><p><b>${esc(champ(q, 'q', L))}</b></p><div class="choix-rep">${(q.choix || []).map((c, k) => `<label class="${val === k ? 'choisi' : ''} ${bonne === k ? 'bonne' : ''}"><input type="radio" name="${nom}${i}" value="${k}" ${val === k ? 'checked' : ''} ${quiz.revele ? 'disabled' : ''} hidden>${esc(c)}</label>`).join('')}</div></div>`;
  const score = quiz.revele ? Q.filter((q, i) => m.quiz?.[i] === q.bonne).length : null;
  z.innerHTML = `<form id="f-jeux"><h2>${t('Les jeux')}</h2>${quiz.revele ? `<p class="ok-msg">${t('Les réponses sont révélées.')}${Q.length ? ` ${t('Votre score')} : <b>${score} / ${Q.length}</b>` : ''}</p>` : ''}
    ${Q.length ? `<h3 class="serif" style="font-size:22px;margin:10px 0">${t('Le quiz')}</h3>${Q.map((q, i) => choix('q', i, q, m.quiz?.[i], quiz.revele ? q.bonne : -1)).join('')}` : ''}
    ${P.length ? `<h3 class="serif" style="font-size:22px;margin:16px 0 10px">${t('Les pronostics')}</h3>${P.map((q, i) => choix('p', i, q, m.pronos?.[i], -1) + (quiz.revele && classement?.pronos?.[i] ? `<p class="app-note">${q.choix.map((c, k) => `${esc(c)} : ${classement.pronos[i][k] || 0}`).join(' · ')}</p>` : '')).join('')}` : ''}
    ${quiz.revele ? '' : `<button class="btn clair" style="margin-top:12px">${t('Valider mes réponses')}</button>`}<p class="ok-msg" id="m-jeux">${mesJeux && !quiz.revele ? t('Réponses enregistrées. Vous pouvez les changer jusqu\'à la révélation.') : ''}</p>
    ${quiz.revele && classement?.quiz?.length ? `<h3 class="serif" style="font-size:22px;margin:16px 0 8px">${t('Le classement')}</h3><ol class="classement">${classement.quiz.slice(0, 10).map(x => `<li><span>${esc(x.prenom)}</span><b>${x.score} / ${x.sur}</b></li>`).join('')}</ol>` : ''}</form>`;
}

// ── Galeries ────────────────────────────────────────────────────────────────
// Chacun peut retirer les photos qu'il a lui-même partagées.
function rendreGalerie() { const g = $('#galerie'); if (g) g.innerHTML = photos.map(x => `<figure><img src="${esc(x.url)}" alt="" loading="lazy">${x.token === T ? `<button class="galerie-perso" data-retirer-photo="${x.id}">${t('Retirer')}</button>` : ''}<figcaption>${esc(x.auteur)}</figcaption></figure>`).join(''); }
function rendreAlbum() { const g = $('#album'); if (g) g.innerHTML = album.map(x => `<figure><img src="${esc(x.url)}" alt="" loading="lazy">${x.token === T ? `<button class="galerie-perso" data-retirer-album="${x.id}">${t('Retirer')}</button>` : ''}<figcaption>${esc(x.photographe ? t('Photographe') : x.auteur)} · <a href="#" data-telecharger="${x.id}">${t('Télécharger')}</a></figcaption></figure>`).join(''); }
function rendreMots() {
  const m = $('#mots'); if (!m) return;
  m.innerHTML = mots.map(x => `<div class="mot">${x.media ? (x.media.type === 'video' ? `<video src="${esc(x.media.url)}" controls playsinline preload="metadata"></video>` : `<audio src="${esc(x.media.url)}" controls preload="metadata"></audio>`) : ''}${x.texte ? `<p>« ${esc(x.texte)} »</p>` : ''}<span>${esc(x.de)}${x.token === T ? ` · <a href="#" data-retirer-mot="${x.id}">${t('Retirer')}</a>` : ''}</span></div>`).join('');
}

// Réduit une photo à 1600 px de côté avant l'envoi au mur (moins de données pour les invités en 4G) ; l'album garde l'original.
async function reduire(fichier) {
  const img = await createImageBitmap(fichier), k = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
}

// ── Livre d'or vocal ou vidéo : 60 secondes au plus, enregistrées dans le navigateur ──
let enreg = null;
async function enregistrer(type) {
  const z = $('#enregistreur');
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { $('#m-mot').className = 'app-erreur'; $('#m-mot').textContent = t("Votre téléphone ne permet pas l'enregistrement ici : choisissez un fichier."); return; }
  try {
    const flux = await navigator.mediaDevices.getUserMedia(type === 'video' ? { audio: true, video: { facingMode: 'user', width: { ideal: 720 } } } : { audio: true });
    const mime = ['video/mp4', 'video/webm', 'audio/mp4', 'audio/webm'].filter(x => x.startsWith(type === 'video' ? 'video' : 'audio')).find(x => MediaRecorder.isTypeSupported(x)) || '';
    const rec = new MediaRecorder(flux, mime ? { mimeType: mime } : {}), morceaux = [];
    enreg = { rec, flux, type };
    rec.ondataavailable = e => e.data.size && morceaux.push(e.data);
    rec.onstop = () => {
      flux.getTracks().forEach(x => x.stop());
      enreg.blob = new Blob(morceaux, { type: rec.mimeType || (type === 'video' ? 'video/webm' : 'audio/webm') });
      const url = URL.createObjectURL(enreg.blob);
      z.innerHTML = `${type === 'video' ? `<video src="${url}" controls playsinline></video>` : `<audio src="${url}" controls></audio>`}<button type="button" class="btn petit" data-envoyer-media="1">${t('Envoyer')}</button><button type="button" class="btn petit clair" data-recommencer="1">${t('Recommencer')}</button>`;
    };
    z.innerHTML = `${type === 'video' ? '<video id="vu" autoplay muted playsinline></video>' : ''}<p class="enreg-encours">● ${t('Enregistrement…')} <span id="chrono">60</span> s</p><button type="button" class="btn petit" data-arreter="1">${t('Arrêter')}</button>`;
    if (type === 'video') $('#vu').srcObject = flux;
    rec.start(1000);
    let reste = 60; enreg.minuteur = setInterval(() => { reste--; if ($('#chrono')) $('#chrono').textContent = reste; if (reste <= 0) arreter(); }, 1000);
  } catch (e) { console.error('Micro ou caméra', e); $('#m-mot').className = 'app-erreur'; $('#m-mot').textContent = t("Votre téléphone ne permet pas l'enregistrement ici : choisissez un fichier."); }
}
function arreter() { if (enreg?.rec.state === 'recording') { clearInterval(enreg.minuteur); enreg.rec.stop(); } }
async function envoyerMedia(blob, type) {
  const msg = $('#m-mot'), uid = auth.currentUser.uid, f = $('#f-mot');
  const ext = /mp4/.test(blob.type) ? (type === 'video' ? 'mp4' : 'm4a') : /ogg/.test(blob.type) ? 'ogg' : /mpeg/.test(blob.type) ? 'mp3' : /quicktime/.test(blob.type) ? 'mov' : 'webm';
  msg.className = 'ok-msg'; msg.textContent = '…';
  try {
    const chemin = `events/${E}/livre/${uid}/${Date.now()}.${ext}`, r = ref(storage, chemin);
    await uploadBytes(r, blob, { contentType: blob.type || (type === 'video' ? 'video/webm' : 'audio/webm') });
    await addDoc(collection(db, `events/${E}/livre`), { token: T, de: (f?.de.value || inv.nom.split(' ')[0]).slice(0, 60), texte: (f?.texte.value || '').slice(0, 1000), media: { type, chemin, url: await getDownloadURL(r) }, creeLe: serverTimestamp(), visible: true });
    msgMot = t('Message envoyé, merci !'); enreg = null; rendre();
  } catch (e) { console.error('Message du livre d\'or', e); msg.className = 'app-erreur'; msg.textContent = t("Le message n'a pas pu être envoyé. Réessayez."); }
}

// Téléchargement d'une photo de l'album sous son nom d'origine (le lien direct s'ouvrirait dans un onglet).
async function telecharger(x) {
  try { const b = await (await fetch(x.url)).blob(), u = URL.createObjectURL(b); Object.assign(document.createElement('a'), { href: u, download: x.nom || 'photo.jpg' }).click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }
  catch { window.open(x.url, '_blank', 'noopener'); }
}

document.addEventListener('click', async ev => {
  const c = ev.target.closest('button, a, label'); if (!c) return;
  const d = c.dataset;
  if (d.reserver) { try { await updateDoc(doc(db, `events/${E}/cadeaux/${d.reserver}`), { reservePar: T, reserveNom: inv.nom, reserveLe: serverTimestamp() }); } catch { alert(t('Ce cadeau vient d\'être réservé par un autre invité.')); } return; }
  if (d.liberer) { await updateDoc(doc(db, `events/${E}/cadeaux/${d.liberer}`), { reservePar: null, reserveNom: null, reserveLe: null }).catch(() => {}); return; }
  if (d.langue) { L = d.langue; memoriserLangue(L); rendre(); updateDoc(doc(db, `events/${E}/invites/${T}`), { langue: L }).catch(() => {}); return; }
  if (d.retirerPhoto) {
    const ph = photos.find(x => x.id === d.retirerPhoto); if (!ph) return;
    c.disabled = true;
    await deleteObject(ref(storage, ph.chemin)).catch(() => {});   // fichier déposé depuis un autre téléphone : seule la fiche est retirée
    try { await deleteDoc(doc(db, `events/${E}/photos/${ph.id}`)); } catch (e) { console.error('Retrait de photo', e); c.disabled = false; }
    return;
  }
  if (d.retirerAlbum) { const ph = album.find(x => x.id === d.retirerAlbum); if (!ph) return; c.disabled = true; await deleteObject(ref(storage, ph.chemin)).catch(() => {}); await deleteDoc(doc(db, `events/${E}/album/${ph.id}`)).catch(() => { c.disabled = false; }); return; }
  if (d.retirerMot) { ev.preventDefault(); const m = mots.find(x => x.id === d.retirerMot); if (!m) return; if (m.media) await deleteObject(ref(storage, m.media.chemin)).catch(() => {}); await deleteDoc(doc(db, `events/${E}/livre/${m.id}`)).catch(() => {}); return; }
  if (d.telecharger) { ev.preventDefault(); const x = album.find(y => y.id === d.telecharger); if (x) telecharger(x); return; }
  if (d.enregistrer) return enregistrer(d.enregistrer);
  if (d.arreter) return arreter();
  if (d.recommencer) { enreg = null; return rendre(); }
  if (d.envoyerMedia && enreg?.blob) { c.disabled = true; return envoyerMedia(enreg.blob, enreg.type); }
  if (d.r) { c.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('choisi', x === c)); return; }
  // Choix d'un jeu ou d'un tissu : la sélection se voit tout de suite.
  if (c.matches('.choix-rep label')) { c.parentElement.querySelectorAll('label').forEach(x => x.classList.toggle('choisi', x === c)); }
  if (c.matches('.tissu')) { c.parentElement.querySelectorAll('.tissu').forEach(x => x.classList.toggle('choisi', x === c)); }
});
document.addEventListener('submit', async ev => {
  ev.preventDefault(); const f = new FormData(ev.target), id = ev.target.id;
  if (id === 'f-reponse') {
    const reponses = { ...(inv.reponses || {}) };
    ev.target.querySelectorAll('[data-cer]').forEach(g => { const c = g.querySelector('.choisi'); if (c) reponses[g.dataset.cer] = c.dataset.r; });
    const maj = { reponses, regime: f.get('regime') || '', message: f.get('message') || '', reponduLe: serverTimestamp() };
    if (f.has('accompagnants')) maj.accompagnants = +f.get('accompagnants');
    document.activeElement?.blur();
    await updateDoc(doc(db, `events/${E}/invites/${T}`), maj);
  }
  if (id === 'f-voyage') {
    document.activeElement?.blur();
    await updateDoc(doc(db, `events/${E}/invites/${T}`), { arrivee: { date: f.get('date') || '', vol: f.get('vol') || '', hebergement: f.has('hebergement'), visa: f.has('visa') } });
    $('#m-voyage') && ($('#m-voyage').textContent = t('Enregistré, merci.'));
  }
  if (id === 'f-mot') {
    if (!(f.get('texte') || '').trim()) return;
    await addDoc(collection(db, `events/${E}/livre`), { token: T, de: f.get('de'), texte: f.get('texte'), creeLe: serverTimestamp(), visible: true });
    ev.target.texte.value = ''; document.activeElement?.blur();
  }
  if (id === 'f-jeux') {
    const lire = (pre, n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, f.get(pre + i)]).filter(([, v]) => v !== null).map(([i, v]) => [i, +v]));
    document.activeElement?.blur();
    try { await setDoc(doc(db, `events/${E}/jeuxReponses/${T}`), { prenom: inv.nom.split(' ')[0], quiz: lire('q', quiz.questions?.length || 0), pronos: lire('p', quiz.pronos?.length || 0), majLe: serverTimestamp() }); $('#m-jeux').textContent = t('Réponses enregistrées. Vous pouvez les changer jusqu\'à la révélation.'); }
    catch (e) { console.error('Jeux', e); }
  }
  if (id === 'f-tenue') {
    document.activeElement?.blur();
    await updateDoc(doc(db, `events/${E}/invites/${T}`), { tenue: { tissu: f.get('tissu'), qte: Math.max(1, +f.get('qte') || 1), taille: f.get('taille') || '', note: (f.get('note') || '').slice(0, 200), paye: !!inv.tenue?.paye, majLe: new Date().toISOString() } });
    $('#m-tenue') && ($('#m-tenue').textContent = t('Commande enregistrée.'));
  }
});
document.addEventListener('change', async ev => {
  const id = ev.target.id;
  if (id === 'i-media' && ev.target.files[0]) { const fi = ev.target.files[0]; if (fi.size > 60 * 1024 * 1024) { $('#m-mot').className = 'app-erreur'; $('#m-mot').textContent = '60 Mo max.'; return; } return envoyerMedia(fi, fi.type.startsWith('video') ? 'video' : 'audio'); }
  if (id !== 'i-photo' && id !== 'i-album') return;
  const versAlbum = id === 'i-album', fichiers = [...ev.target.files], msg = $(versAlbum ? '#m-album' : '#m-photo'), uid = auth.currentUser.uid;
  msg.className = 'ok-msg';
  try {
    for (const [k, fi] of fichiers.entries()) {
      msg.textContent = `${k + 1} / ${fichiers.length}…`;
      const ext = versAlbum ? (fi.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') : 'jpg';
      const chemin = `events/${E}/${versAlbum ? 'album' : 'photos'}/${uid}/${Date.now()}-${k}.${ext}`, r = ref(storage, chemin);
      if (versAlbum && fi.size > 40 * 1024 * 1024) throw new Error('trop lourd');
      await uploadBytes(r, versAlbum ? fi : await reduire(fi), { contentType: versAlbum ? fi.type || 'image/jpeg' : 'image/jpeg' });
      const fiche = { token: T, auteur: inv.nom.split(' ')[0], chemin, url: await getDownloadURL(r), creeLe: serverTimestamp(), visible: true };
      await addDoc(collection(db, `events/${E}/${versAlbum ? 'album' : 'photos'}`), versAlbum ? { ...fiche, nom: fi.name.slice(0, 120) } : fiche);
    }
    msg.textContent = t(fichiers.length > 1 ? 'Photos partagées, merci !' : 'Photo partagée, merci !');
  } catch (e) {
    // Un échec ne doit jamais passer pour un envoi réussi.
    console.error('Envoi de photo', e);
    msg.className = 'app-erreur';
    msg.textContent = 'La photo n\'a pas pu être envoyée. Réessayez dans un instant ; si cela continue, prévenez les organisateurs.';
  }
  ev.target.value = '';
});
