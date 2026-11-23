// Retouche des photos du mur (Parnel, 23/11/2026) : le couple choisit UN style dans son espace (events.perso.retouche).
// Le style s'applique À L'AFFICHAGE (filtre CSS sur les images de classe « retouchee » : mur, galerie des invités, espace du couple) :
// il est donc rétroactif (photos déjà envoyées et suivantes) et le couple peut en changer à tout moment, même pendant la fête.
// À l'envoi, la photo est seulement mise à la bonne taille : réduite à 1600 px, ou agrandie (×2 au plus, lissage + légère netteté)
// si elle est trop petite. L'album en haute définition garde les originaux. Le film souvenir applique le même style (film/monter.py).

export const STYLES = {
  naturel: { nom: 'Naturel', note: 'Aucune retouche', filtre: 'none' },
  lumineux: { nom: 'Lumineux', note: 'Plus clair et plus net', filtre: 'brightness(1.08) contrast(1.06) saturate(1.08)' },
  chaleureux: { nom: 'Chaleureux', note: 'Tons dorés de fin de journée', filtre: 'brightness(1.04) contrast(1.04) saturate(1.1) sepia(0.18)' },
  noiretblanc: { nom: 'Noir et blanc', note: 'Intemporel', filtre: 'grayscale(1) contrast(1.12)' },
  argentique: { nom: 'Argentique', note: 'Couleurs douces de pellicule', filtre: 'brightness(1.03) contrast(0.92) saturate(0.82) sepia(0.15)' },
  doux: { nom: 'Doux', note: 'Lumineux et pastel', filtre: 'brightness(1.07) contrast(0.88) saturate(0.9)' },
};

// À appeler dès que l'événement est lu (et à chaque mise à jour) : toutes les images « retouchee » prennent le style.
export function appliquerRetouche(style) {
  if (!document.getElementById('mv-retouche')) {
    const s = document.createElement('style'); s.id = 'mv-retouche';
    s.textContent = 'img.retouchee{filter:var(--retouche,none)}';
    document.head.append(s);
  }
  document.documentElement.style.setProperty('--retouche', (STYLES[style] || STYLES.naturel).filtre);
}

const COTE = 1600;      // côté maximal envoyé au mur
const MINIMUM = 1200;   // en dessous, on agrandit (au plus ×2)

// Renvoie un canvas : photo réduite, ou agrandie si elle est trop petite (sans retouche des couleurs).
export async function preparer(fichier) {
  const img = await createImageBitmap(fichier);
  const grand = Math.max(img.width, img.height);
  const k = grand > COTE ? COTE / grand : grand < MINIMUM ? Math.min(2, MINIMUM / grand) : 1;
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, c.width, c.height);
  if (k > 1) nettete(ctx, c.width, c.height, 0.35);
  return c;
}

export function versBlob(c, qualite = 0.85) {
  return new Promise((ok, ko) => c.toBlob(b => b ? ok(b) : ko(new Error('retouche')), 'image/jpeg', qualite));
}

// Netteté légère (masque flou simple) après un agrandissement, pour éviter l'aspect « mou ».
function nettete(ctx, w, h, force) {
  const im = ctx.getImageData(0, 0, w, h), s = im.data, o = new Uint8ClampedArray(s);
  const L = w * 4;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * L + x * 4;
      for (let c = 0; c < 3; c++) {
        const flou = (s[i - L + c] + s[i + L + c] + s[i - 4 + c] + s[i + 4 + c]) / 4;
        o[i + c] = s[i + c] + (s[i + c] - flou) * force;
      }
    }
  }
  im.data.set(o);
  ctx.putImageData(im, 0, 0);
}
