// Code partenaire (wedding planner) : lu dans l'adresse (?partenaire=CODE) ou saisi à la commande, gardé 120 jours sur cet appareil.
// Le navigateur ne fait que transmettre le code : c'est le serveur qui vérifie qu'il existe et applique la remise.
(() => {
  const K = 'mv-partenaire', ok = c => /^[A-Z0-9-]{3,24}$/.test(c);
  const garder = c => { try { localStorage.setItem(K, JSON.stringify({ code: c, t: Date.now() })); } catch {} };
  try {
    const c = (new URLSearchParams(location.search).get('partenaire') || '').trim().toUpperCase();
    if (ok(c)) garder(c);
  } catch {}
  window.codePartenaire = () => {
    try { const v = JSON.parse(localStorage.getItem(K) || 'null'); return v && ok(v.code) && Date.now() - v.t < 120 * 864e5 ? v.code : ''; } catch { return ''; }
  };
  window.retenirPartenaire = saisi => {
    const c = (saisi || '').trim().toUpperCase();
    if (ok(c)) { garder(c); return c; }
    if (!c) try { localStorage.removeItem(K); } catch {}
    return '';
  };
})();
