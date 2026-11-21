// Mesure d'audience de Maison Vivat, sans cookie ni identifiant : la page vue, le site d'où vient le visiteur
// et s'il commence une visite. Lu seulement par le tableau de bord de la maison (app/admin.html).
(function () {
  if (!/(^|\.)maisonvivat\.com$/.test(location.hostname) || navigator.webdriver) return;
  var nouvelle = false;
  try { nouvelle = !sessionStorage.getItem("mv-visite"); sessionStorage.setItem("mv-visite", "1"); } catch (e) {}
  var q = new URLSearchParams(location.search), source = q.get("utm_source") || q.get("partenaire") || "";
  if (!source && document.referrer) {
    try { var h = new URL(document.referrer).hostname.replace(/^www\./, ""); if (!/(^|\.)maisonvivat\.com$/.test(h)) source = h; } catch (e) {}
  }
  // Le moteur générique (app/fp.html?demo=…) sert plusieurs modèles : le modèle vu fait partie du chemin compté.
  var chemin = location.pathname + (q.get("demo") ? "/" + q.get("demo").replace(/[^a-z0-9\-]/gi, "").slice(0, 30) : "");
  var corps = JSON.stringify({ p: chemin, s: source.slice(0, 60), n: nouvelle, m: matchMedia("(max-width: 760px)").matches });
  var url = "https://europe-west9-maison-vivat.cloudfunctions.net/compter";
  if (!(navigator.sendBeacon && navigator.sendBeacon(url, new Blob([corps], { type: "text/plain" })))) {
    fetch(url, { method: "POST", body: corps, keepalive: true, mode: "no-cors" }).catch(function () {});
  }
})();
