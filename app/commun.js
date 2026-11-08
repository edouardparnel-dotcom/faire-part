// Module commun aux pages de l'application (organisateur, invité, entrée, mur photo).
// En local (127.0.0.1 ou localhost), tout passe par les émulateurs Firebase : aucune donnée réelle.
// En ligne, il faut renseigner CONFIG_PRODUCTION avec la configuration du projet Firebase de la maison.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, connectAuthEmulator, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';

// Projet Firebase de production « maison-vivat » (identifiants publics d'application web, protégés par les règles).
const CONFIG_PRODUCTION = {
  apiKey: 'AIzaSyB2xVG8r9ViMPLbs_tgZMK9A98Na6zVPCk',
  authDomain: 'maison-vivat.firebaseapp.com',
  projectId: 'maison-vivat',
  storageBucket: 'maison-vivat.firebasestorage.app',
  messagingSenderId: '298135046191',
  appId: '1:298135046191:web:7e32e43e1b1744606c1eda',
};
export const LOCAL = ['127.0.0.1', 'localhost'].includes(location.hostname);
export const PRET = LOCAL || !!CONFIG_PRODUCTION;

let app, auth, db, storage;
if (PRET) {
  app = initializeApp(LOCAL ? { apiKey: 'demo-key', projectId: 'demo-maison-lakou', storageBucket: 'demo-maison-lakou.appspot.com' } : CONFIG_PRODUCTION);
  auth = getAuth(app); db = getFirestore(app); storage = getStorage(app);
  if (LOCAL) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  }
}
export { auth, db, storage };

export const $ = s => document.querySelector(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const dateLongue = d => d ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
export const heure = d => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
export const majuscule = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// Jeton d'invité : 20 caractères aléatoires (environ 119 bits), impossible à deviner.
export function jeton() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', o = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(o, x => a[x % a.length]).join('');
}

export const NOMS_OPTIONS = {
  savethedate: 'Save-the-date', ceremonies: 'Invitations par cérémonie', guide: 'Guide de la cérémonie', etranger: "Invités venus de l'étranger",
  tenues: 'Tenues coordonnées', langue: 'Langue supplémentaire', qr: "Contrôle d'entrée", direct: 'Direct privé', deroule: 'Déroulé en direct',
  murphoto: 'Mur photo', livredor: "Livre d'or", jeux: 'Jeux', album: 'Album partagé', merci: 'Remerciements',
};

export function bandeau(texte) {
  const b = document.createElement('div'); b.className = 'app-bandeau'; b.textContent = texte; document.body.prepend(b);
}

// Écran de connexion de l'organisateur ; appelle quandConnecte(user) une fois connecté avec un compte e-mail.
export function exigerOrganisateur(conteneur, quandConnecte) {
  if (!PRET) { conteneur.innerHTML = '<p class="app-note">Le serveur n\'est pas encore branché pour la version en ligne.</p>'; return; }
  onAuthStateChanged(auth, user => {
    if (user && !user.isAnonymous) return quandConnecte(user);
    conteneur.innerHTML = `<form class="app-carte app-connexion" id="f-connexion">
      <span class="etq">Votre espace</span><h1 class="serif">Connexion</h1>
      <label>Adresse e-mail<input name="email" type="email" autocomplete="username" required></label>
      <label>Mot de passe<input name="mdp" type="password" autocomplete="current-password" minlength="8" required></label>
      <button class="btn">Se connecter</button>
      <button class="btn clair" type="button" id="b-creer">Créer mon compte</button>
      <p class="app-erreur" id="e-connexion"></p></form>`;
    const f = $('#f-connexion'), err = m => $('#e-connexion').textContent = m;
    f.addEventListener('submit', async ev => {
      ev.preventDefault();
      try { await signInWithEmailAndPassword(auth, f.email.value, f.mdp.value); } catch { err('Adresse ou mot de passe incorrect.'); }
    });
    $('#b-creer').addEventListener('click', async () => {
      if (!f.reportValidity()) return;
      try { await createUserWithEmailAndPassword(auth, f.email.value, f.mdp.value); } catch (e) { err(e.code === 'auth/email-already-in-use' ? 'Un compte existe déjà avec cette adresse.' : 'Création impossible : vérifiez l\'adresse et un mot de passe de 8 caractères.'); }
    });
  });
}
export const deconnecter = () => signOut(auth);

// L'organisateur, ou un membre de son équipe (co-organisateur, wedding planner) : mêmes pages de gestion.
export async function aLaMain(evt, e, uid) {
  if (!evt) return false;
  if (evt.owner === uid) return true;
  return (await getDoc(doc(db, `events/${e}/equipe/${uid}`)).catch(() => null))?.exists() || false;
}
