// Retouche automatique des photos du mur (Parnel, 23/11/2026) : le couple choisit UN style dans son espace
// (events.perso.retouche) et chaque photo envoyée par un invité est retouchée dans son téléphone avant l'envoi,
// avec ce style, pour que tout le mur soit cohérent. Une photo trop petite est agrandie (lissage de qualité + légère netteté).
// L'original n'est jamais modifié : l'album en haute définition le garde tel quel.
// Calcul pixel par pixel (getImageData) : marche partout, y compris sur les iPhone où le « filter » du canvas n'existe pas.

export const STYLES = {
  naturel: { nom: 'Naturel', note: 'Aucune retouche' },
  lumineux: { nom: 'Lumineux', note: 'Plus clair et plus net', lum: 1.08, contraste: 1.06, sat: 1.08 },
  chaleureux: { nom: 'Chaleureux', note: 'Tons dorés de fin de journée', lum: 1.04, contraste: 1.04, sat: 1.05, chaud: 18 },
  noiretblanc: { nom: 'Noir et blanc', note: 'Intemporel', contraste: 1.12, gris: 1 },
  argentique: { nom: 'Argentique', note: 'Couleurs douces de pellicule', contraste: 0.94, sat: 0.82, chaud: 10, noirs: 18 },
  doux: { nom: 'Doux', note: 'Lumineux et pastel', lum: 1.06, contraste: 0.9, sat: 0.9, noirs: 10 },
};

const COTE = 1600;      // côté maximal envoyé au mur
const MINIMUM = 1200;   // en dessous, on agrandit (au plus ×2)

// Renvoie un canvas : photo redimensionnée (réduite ou agrandie) puis retouchée selon le style.
export async function preparer(fichier, style) {
  const img = await createImageBitmap(fichier);
  const grand = Math.max(img.width, img.height);
  const k = grand > COTE ? COTE / grand : grand < MINIMUM ? Math.min(2, MINIMUM / grand) : 1;
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const s = STYLES[style];
  if (k > 1) nettete(ctx, c.width, c.height, 0.35);
  if (s && style !== 'naturel') couleurs(ctx, c.width, c.height, s);
  return c;
}

export function versBlob(c, qualite = 0.85) {
  return new Promise((ok, ko) => c.toBlob(b => b ? ok(b) : ko(new Error('retouche')), 'image/jpeg', qualite));
}

function couleurs(ctx, w, h, s) {
  const im = ctx.getImageData(0, 0, w, h), d = im.data;
  const lum = s.lum ?? 1, con = s.contraste ?? 1, sat = s.sat ?? 1, chaud = s.chaud ?? 0, gris = s.gris ?? 0, noirs = s.noirs ?? 0;
  // table de correspondance pour luminosité + contraste + noirs relevés (effet pellicule)
  const t = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    let x = v * lum;
    x = (x - 128) * con + 128;
    x = noirs + x * (255 - noirs) / 255;
    t[v] = x;
  }
  for (let i = 0; i < d.length; i += 4) {
    let r = t[d[i]], g = t[d[i + 1]], b = t[d[i + 2]];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    if (gris) { r = g = b = y; }
    else {
      r = y + (r - y) * sat; g = y + (g - y) * sat; b = y + (b - y) * sat;
      if (chaud) { r += chaud * 0.6; g += chaud * 0.25; b -= chaud * 0.5; }
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(im, 0, 0);
}

// Netteté légère (masque flou simple, 3 × 3) après un agrandissement, pour éviter l'aspect « mou ».
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
