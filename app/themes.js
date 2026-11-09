// Catalogue des directions artistiques du moteur de faire-part.
// Une direction = une ouverture (l'animation d'entrée) + une mise en page + un ornement + une palette + des polices.
// Chaque direction s'affiche en faire-part, en save-the-date et en site : 44 pour le mariage, 10 pour chaque site annexe.
// Au-delà des couleurs, la structure change : couverture, programme et rythme des parties (voir plus bas).

export const OUVERTURES = {
  enveloppe: "Une enveloppe dont le rabat s'ouvre",
  rideau: 'Deux pans de rideau qui s\'écartent',
  portes: 'Deux portes en arche qui s\'ouvrent',
  voile: 'Un voile de tissu qui se lève',
  sceau: 'Un sceau de cire qui se brise',
  eventail: 'Un éventail qui se déploie',
  rouleau: 'Un parchemin qui se déroule',
  pliage: 'Une carte pliée qui s\'ouvre en trois volets',
  lumiere: 'La nuit qui s\'éclaire, un halo de lumière',
  tuiles: 'Une mosaïque de tuiles qui se retournent',
  ruban: 'Un ruban qui se dénoue',
  cadre: 'Un cadre photo qui s\'agrandit jusqu\'à l\'écran',
};

export const MISES_EN_PAGE = {
  classique: 'Centrée, filets fins, symétrie',
  editorial: 'Magazine : grand titre, colonnes asymétriques',
  carte: 'Cartes posées les unes sur les autres',
  arche: 'Photo en arche, texte en colonne',
  minimal: 'Beaucoup de blanc, typographie seule',
  cadre: 'Encadré d\'une bordure ornementale',
};

// Polices proposées (Google Fonts) : titre / texte.
export const POLICES = {
  cormorant: { nom: 'Cormorant et Inter', titre: 'Cormorant Garamond', texte: 'Inter', url: 'Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@300;400;500' },
  playfair: { nom: 'Playfair et Nunito', titre: 'Playfair Display', texte: 'Nunito Sans', url: 'Playfair+Display:ital,wght@0,500;0,600;1,500&family=Nunito+Sans:wght@300;400;600' },
  bodoni: { nom: 'Bodoni et Jost', titre: 'Bodoni Moda', texte: 'Jost', url: 'Bodoni+Moda:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500' },
  cinzel: { nom: 'Cinzel et Lora', titre: 'Cinzel', texte: 'Lora', url: 'Cinzel:wght@500;600&family=Lora:ital,wght@0,400;0,500;1,400' },
  script: { nom: 'Pinyon Script et Montserrat', titre: 'Pinyon Script', texte: 'Montserrat', url: 'Pinyon+Script&family=Montserrat:wght@300;400;500' },
  dmserif: { nom: 'DM Serif et DM Sans', titre: 'DM Serif Display', texte: 'DM Sans', url: 'DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500' },
  marcellus: { nom: 'Marcellus et Raleway', titre: 'Marcellus', texte: 'Raleway', url: 'Marcellus&family=Raleway:wght@300;400;500' },
  fraunces: { nom: 'Fraunces et Work Sans', titre: 'Fraunces', texte: 'Work Sans', url: 'Fraunces:ital,wght@0,400;0,600;1,400&family=Work+Sans:wght@300;400;500' },
};

export const ORNEMENTS = {
  aucun: 'Sans ornement', filet: 'Filets dorés', floral: 'Feuillage', kente: 'Bandes tissées (kente)', madras: 'Carreaux madras',
  bogolan: 'Motifs bogolan', wax: 'Cercles wax', artdeco: 'Éventails art déco', zellige: 'Étoiles zellige', etoiles: 'Étoiles',
  vague: 'Vagues', palmes: 'Palmes', confettis: 'Confettis', points: 'Pois', nuages: 'Nuages', ballons: 'Ballons', lune: 'Lune et étoiles', rayons: 'Rayons de soleil',
};

// Palette : fond de page, papier (cartes), texte, accent, accent secondaire.
const P = (fond, papier, texte, accent, accent2) => ({ fond, papier, texte, accent, accent2 });

// 50 directions artistiques. famille : heritages | intemporels | nature | modernes | festifs.
export const THEMES = [
  // ── Héritages : Afrique et Antilles ─────────────────────────────────────────
  { id: 'lakou', nom: 'Lakou', famille: 'heritages', culture: 'Lakou · maisons gingerbread', ouverture: 'portes', mep: 'arche', ornement: 'palmes', polices: 'playfair', palette: P('#F4EEE4', '#FFFBF5', '#2B2420', '#1F6F5C', '#D9493B') },
  { id: 'kreyol', nom: 'Kreyòl', famille: 'heritages', culture: 'Kreyòl · langue et contes', ouverture: 'ruban', mep: 'carte', ornement: 'floral', polices: 'dmserif', palette: P('#FBF3EA', '#FFFFFF', '#2E1F1A', '#C2442E', '#2B5DA8') },
  { id: 'madras', nom: 'Madras', famille: 'heritages', culture: 'Madras · tèt maré', ouverture: 'ruban', mep: 'carte', ornement: 'madras', polices: 'playfair', palette: P('#FFF7EC', '#FFFFFF', '#3A2418', '#D2232A', '#F2B705') },
  { id: 'kanaval', nom: 'Kanaval', famille: 'heritages', culture: 'Kanaval · masques et chars', ouverture: 'eventail', mep: 'editorial', ornement: 'palmes', polices: 'bodoni', palette: P('#FDF4E7', '#FFFFFF', '#1E1A2E', '#E0533D', '#2C8C6B') },
  { id: 'kente', nom: 'Kente', famille: 'heritages', culture: 'Kente · tissage akan', ouverture: 'tuiles', mep: 'cadre', ornement: 'kente', polices: 'cinzel', palette: P('#15120E', '#1F1A14', '#F3E7CF', '#D4A53A', '#2E8B57') },
  { id: 'adinkra', nom: 'Adinkra', famille: 'heritages', culture: 'Adinkra · symboles akan', ouverture: 'sceau', mep: 'classique', ornement: 'filet', polices: 'marcellus', palette: P('#F3ECE0', '#FBF7F0', '#2A2118', '#9C6B2F', '#1D3B2A') },
  { id: 'owambe', nom: 'Owambe', famille: 'heritages', culture: 'Aso-ebi · fête yoruba', ouverture: 'eventail', mep: 'editorial', ornement: 'artdeco', polices: 'bodoni', palette: P('#F7F1E8', '#FFFFFF', '#1C1714', '#B8862B', '#6E1F3A') },
  { id: 'gele', nom: 'Gèlè', famille: 'heritages', culture: 'Gèlè · coiffe nouée', ouverture: 'voile', mep: 'arche', ornement: 'wax', polices: 'playfair', palette: P('#FAF0F2', '#FFFFFF', '#2D1820', '#A3245A', '#D6A84C') },
  { id: 'toghu', nom: 'Toghu', famille: 'heritages', culture: 'Toghu · Grassfields', ouverture: 'rideau', mep: 'cadre', ornement: 'etoiles', polices: 'cinzel', palette: P('#0E0F1A', '#171A2B', '#EFE6D2', '#C9A04A', '#B33A3A') },
  { id: 'ndop', nom: 'Ndop', famille: 'heritages', culture: 'Ndop · indigo royal', ouverture: 'tuiles', mep: 'minimal', ornement: 'bogolan', polices: 'fraunces', palette: P('#ECEFF5', '#FFFFFF', '#141A33', '#22346E', '#C8CBD6') },
  { id: 'teranga', nom: 'Teranga', famille: 'heritages', culture: 'Grand boubou · bazin', ouverture: 'voile', mep: 'classique', ornement: 'zellige', polices: 'cormorant', palette: P('#F6F4EF', '#FFFFFF', '#262420', '#B08D4C', '#7E9C8E') },
  { id: 'bazin', nom: 'Bazin', famille: 'heritages', culture: 'Bazin riche · teinture', ouverture: 'pliage', mep: 'editorial', ornement: 'filet', polices: 'marcellus', palette: P('#EEF3F4', '#FFFFFF', '#1B2A30', '#2F6E7C', '#C9A55B') },
  { id: 'bogolan', nom: 'Bogolan', famille: 'heritages', culture: 'Bogolanfini · terre et teintures', ouverture: 'rouleau', mep: 'cadre', ornement: 'bogolan', polices: 'fraunces', palette: P('#EFE4D2', '#F8F0E2', '#2E2216', '#7A4A24', '#2A2A26') },
  { id: 'kita', nom: 'Kita', famille: 'heritages', culture: 'Pagne kita · tissage baoulé', ouverture: 'tuiles', mep: 'carte', ornement: 'kente', polices: 'dmserif', palette: P('#FFF5EB', '#FFFFFF', '#241A12', '#E2701F', '#1F1F1F') },
  { id: 'sape', nom: 'Sape', famille: 'heritages', culture: 'La Sape · élégance', ouverture: 'cadre', mep: 'editorial', ornement: 'aucun', polices: 'bodoni', palette: P('#F2F0EC', '#FFFFFF', '#141414', '#C8102E', '#1E4FA0') },
  { id: 'liputa', nom: 'Liputa', famille: 'heritages', culture: 'Liputa · pagne', ouverture: 'ruban', mep: 'arche', ornement: 'wax', polices: 'playfair', palette: P('#F5F0E6', '#FFFFFF', '#1D2A1F', '#2E7D4F', '#E3B23C') },
  { id: 'tibeb', nom: 'Tibeb', famille: 'heritages', culture: 'Habesha kemis · tibeb', ouverture: 'rideau', mep: 'classique', ornement: 'kente', polices: 'cinzel', palette: P('#FAF8F3', '#FFFFFF', '#24211C', '#2D7A4A', '#C79A2B') },
  { id: 'imbali', nom: 'Imbali', famille: 'heritages', culture: 'Perlage zoulou · imbali', ouverture: 'eventail', mep: 'cadre', ornement: 'zellige', polices: 'marcellus', palette: P('#F3EEF7', '#FFFFFF', '#21183A', '#5A2E8A', '#E8A33D') },
  // ── Intemporels ─────────────────────────────────────────────────────────────
  { id: 'ivoire', nom: 'Ivoire', famille: 'intemporels', culture: 'Classique', ouverture: 'enveloppe', mep: 'classique', ornement: 'filet', polices: 'cormorant', palette: P('#F7F3EC', '#FFFDF9', '#1E1B18', '#A8834A', '#D9CDB5') },
  { id: 'monogramme', nom: 'Monogramme', famille: 'intemporels', culture: 'Classique', ouverture: 'sceau', mep: 'classique', ornement: 'filet', polices: 'script', palette: P('#F5F2EE', '#FFFFFF', '#2A2622', '#8C6D3F', '#E5DCCD') },
  { id: 'versailles', nom: 'Versailles', famille: 'intemporels', culture: 'Classique', ouverture: 'portes', mep: 'cadre', ornement: 'artdeco', polices: 'cinzel', palette: P('#F3F1EA', '#FBFAF6', '#26303A', '#B39552', '#7D8C99') },
  { id: 'faubourg', nom: 'Faubourg', famille: 'intemporels', culture: 'Classique', ouverture: 'pliage', mep: 'minimal', ornement: 'aucun', polices: 'bodoni', palette: P('#F4F2EF', '#FFFFFF', '#121212', '#121212', '#BEB6AA') },
  { id: 'chapelle', nom: 'Chapelle', famille: 'intemporels', culture: 'Classique', ouverture: 'lumiere', mep: 'arche', ornement: 'filet', polices: 'cormorant', palette: P('#FAF8F4', '#FFFFFF', '#2B2A26', '#9E8657', '#C9C2B0') },
  { id: 'marine', nom: 'Marine', famille: 'intemporels', culture: 'Classique', ouverture: 'enveloppe', mep: 'editorial', ornement: 'filet', polices: 'playfair', palette: P('#EEF1F5', '#FFFFFF', '#16233A', '#1F3A64', '#C6A15B') },
  { id: 'bordeaux', nom: 'Bordeaux', famille: 'intemporels', culture: 'Classique', ouverture: 'rideau', mep: 'classique', ornement: 'floral', polices: 'cormorant', palette: P('#F6F0EF', '#FFFFFF', '#2A1618', '#7B2333', '#C8A26A') },
  { id: 'emeraude', nom: 'Émeraude', famille: 'intemporels', culture: 'Classique', ouverture: 'sceau', mep: 'cadre', ornement: 'artdeco', polices: 'marcellus', palette: P('#EEF3F0', '#FFFFFF', '#14261E', '#1E5B45', '#C4A15A') },
  { id: 'gatsby', nom: 'Gatsby', famille: 'intemporels', culture: 'Art déco', ouverture: 'eventail', mep: 'cadre', ornement: 'artdeco', polices: 'cinzel', palette: P('#0F0F10', '#18181A', '#EFE7D6', '#C9A54E', '#6B6B6B') },
  { id: 'opera', nom: 'Opéra', famille: 'intemporels', culture: 'Classique', ouverture: 'rideau', mep: 'editorial', ornement: 'filet', polices: 'bodoni', palette: P('#1A0F12', '#24161A', '#F2E6DC', '#C9A15B', '#8E2B3A') },
  { id: 'porcelaine', nom: 'Porcelaine', famille: 'intemporels', culture: 'Classique', ouverture: 'voile', mep: 'carte', ornement: 'floral', polices: 'script', palette: P('#F1F5F9', '#FFFFFF', '#1F2B3A', '#3D6FA8', '#DCE6F0') },
  { id: 'soie', nom: 'Soie', famille: 'intemporels', culture: 'Classique', ouverture: 'voile', mep: 'minimal', ornement: 'aucun', polices: 'cormorant', palette: P('#F7F1EE', '#FFFFFF', '#3A2C28', '#B98B7A', '#EADBD4') },
  // ── Nature et bohème ────────────────────────────────────────────────────────
  { id: 'champetre', nom: 'Champêtre', famille: 'nature', culture: 'Campagne', ouverture: 'pliage', mep: 'carte', ornement: 'floral', polices: 'fraunces', palette: P('#F3F1E8', '#FFFEF8', '#2C3024', '#6F7D4E', '#C9A66B') },
  { id: 'lavande', nom: 'Lavande', famille: 'nature', culture: 'Provence', ouverture: 'ruban', mep: 'classique', ornement: 'floral', polices: 'script', palette: P('#F4F2F7', '#FFFFFF', '#2E2A3B', '#7B6AA8', '#C9C0DD') },
  { id: 'pampa', nom: 'Pampa', famille: 'nature', culture: 'Bohème', ouverture: 'voile', mep: 'arche', ornement: 'palmes', polices: 'dmserif', palette: P('#F5EDE3', '#FFFAF4', '#3A2A20', '#B5714A', '#D9C2A3') },
  { id: 'terracotta', nom: 'Terracotta', famille: 'nature', culture: 'Bohème', ouverture: 'cadre', mep: 'editorial', ornement: 'aucun', polices: 'fraunces', palette: P('#F3E6DB', '#FBF4ED', '#3B2219', '#B4532F', '#5E7A5A') },
  { id: 'eucalyptus', nom: 'Eucalyptus', famille: 'nature', culture: 'Jardin', ouverture: 'enveloppe', mep: 'minimal', ornement: 'floral', polices: 'cormorant', palette: P('#EFF2EE', '#FFFFFF', '#243028', '#6E8B78', '#C7D3C8') },
  { id: 'oliveraie', nom: 'Oliveraie', famille: 'nature', culture: 'Méditerranée', ouverture: 'rouleau', mep: 'classique', ornement: 'floral', polices: 'marcellus', palette: P('#F2F1E6', '#FFFEF6', '#2D2E1F', '#6E7346', '#C2A86A') },
  { id: 'lagon', nom: 'Lagon', famille: 'nature', culture: 'Océan Indien · Antilles', ouverture: 'lumiere', mep: 'carte', ornement: 'vague', polices: 'playfair', palette: P('#ECF4F3', '#FFFFFF', '#173336', '#1F8A8A', '#E8B86A') },
  { id: 'flamboyant', nom: 'Flamboyant', famille: 'nature', culture: 'Tropiques', ouverture: 'eventail', mep: 'arche', ornement: 'palmes', polices: 'dmserif', palette: P('#FFF3EC', '#FFFFFF', '#33190F', '#D9431E', '#2F7A4D') },
  // ── Modernes ────────────────────────────────────────────────────────────────
  { id: 'galerie', nom: 'Galerie', famille: 'modernes', culture: 'Contemporain', ouverture: 'cadre', mep: 'minimal', ornement: 'aucun', polices: 'bodoni', palette: P('#F5F5F3', '#FFFFFF', '#111111', '#111111', '#D0D0CC') },
  { id: 'atelier', nom: 'Atelier', famille: 'modernes', culture: 'Contemporain', ouverture: 'pliage', mep: 'editorial', ornement: 'aucun', polices: 'fraunces', palette: P('#EFEAE3', '#F8F5F0', '#1D1B19', '#C04A2B', '#8C857B') },
  { id: 'neon', nom: 'Néon', famille: 'modernes', culture: 'Contemporain', ouverture: 'lumiere', mep: 'minimal', ornement: 'aucun', polices: 'dmserif', palette: P('#101018', '#181826', '#F2F0FF', '#FF4FA3', '#36E2E6') },
  { id: 'kintsugi', nom: 'Kintsugi', famille: 'modernes', culture: 'Contemporain', ouverture: 'sceau', mep: 'minimal', ornement: 'filet', polices: 'marcellus', palette: P('#1B1B1C', '#232325', '#EDE8DF', '#C9A44C', '#5A5A5C') },
  { id: 'aquarelle', nom: 'Aquarelle', famille: 'modernes', culture: 'Contemporain', ouverture: 'voile', mep: 'carte', ornement: 'vague', polices: 'script', palette: P('#F3F5F8', '#FFFFFF', '#2B3140', '#7A93C2', '#F2C9C1') },
  { id: 'riviera', nom: 'Riviera', famille: 'modernes', culture: 'Côte d\'Azur', ouverture: 'enveloppe', mep: 'editorial', ornement: 'vague', polices: 'bodoni', palette: P('#F1F4F7', '#FFFFFF', '#14253A', '#2E6FB0', '#F0C866') },
  // ── Anniversaires ───────────────────────────────────────────────────────────
  { id: 'gala', nom: 'Gala', famille: 'anniversaires', culture: 'Soirée habillée', ouverture: 'rideau', mep: 'cadre', ornement: 'artdeco', polices: 'bodoni', palette: P('#0D0D0F', '#17171A', '#F1E6CF', '#D4AF37', '#8A8A8A') },
  { id: 'disco', nom: 'Disco', famille: 'anniversaires', culture: 'Années 70', ouverture: 'lumiere', mep: 'editorial', ornement: 'etoiles', polices: 'dmserif', palette: P('#1A0B2E', '#251040', '#F8F0FF', '#FF3CAC', '#2DE2E6') },
  { id: 'champagne', nom: 'Champagne', famille: 'anniversaires', culture: 'Bulles et or rose', ouverture: 'sceau', mep: 'classique', ornement: 'confettis', polices: 'cormorant', palette: P('#F8EFE8', '#FFFBF7', '#3A2A24', '#C08A5B', '#E9C9B6') },
  { id: 'tropicana', nom: 'Tropicana', famille: 'anniversaires', culture: 'Fête sous les palmiers', ouverture: 'eventail', mep: 'carte', ornement: 'palmes', polices: 'dmserif', palette: P('#FFF4E6', '#FFFFFF', '#1F2B22', '#E85D3F', '#1E8C6E') },
  { id: 'vinyle', nom: 'Vinyle', famille: 'anniversaires', culture: 'Rétro', ouverture: 'tuiles', mep: 'editorial', ornement: 'points', polices: 'fraunces', palette: P('#F3E7D3', '#FBF4E8', '#2E1D12', '#C4572A', '#E0A43A') },
  { id: 'gardenparty', nom: 'Garden-party', famille: 'anniversaires', culture: 'Jardin, après-midi', ouverture: 'pliage', mep: 'arche', ornement: 'floral', polices: 'playfair', palette: P('#F1F4EC', '#FFFFFF', '#26301F', '#5F8A4A', '#E7B7A3') },
  { id: 'cabaret', nom: 'Cabaret', famille: 'anniversaires', culture: 'Velours rouge', ouverture: 'rideau', mep: 'minimal', ornement: 'filet', polices: 'cinzel', palette: P('#1C0A0C', '#2A1013', '#F6E8DA', '#C2283A', '#D9B46A') },
  { id: 'pop', nom: 'Pop', famille: 'anniversaires', culture: 'Couleurs franches', ouverture: 'cadre', mep: 'carte', ornement: 'confettis', polices: 'dmserif', palette: P('#FFF8E8', '#FFFFFF', '#141414', '#FF4D3D', '#2F5BFF') },
  { id: 'minuit', nom: 'Minuit', famille: 'anniversaires', culture: 'Nuit étoilée', ouverture: 'lumiere', mep: 'cadre', ornement: 'etoiles', polices: 'marcellus', palette: P('#0D1424', '#141D33', '#EDE7DA', '#C9A85A', '#5B6E9C') },
  { id: 'fiesta', nom: 'Fiesta', famille: 'anniversaires', culture: 'Couleurs et confettis', ouverture: 'ruban', mep: 'classique', ornement: 'confettis', polices: 'fraunces', palette: P('#FFF3EA', '#FFFFFF', '#2A1D2E', '#E2366B', '#F2A93B') },
  // ── Baptêmes ────────────────────────────────────────────────────────────────
  { id: 'nuage', nom: 'Nuage', famille: 'baptemes', culture: 'Douceur', ouverture: 'voile', mep: 'classique', ornement: 'nuages', polices: 'playfair', palette: P('#EEF4FA', '#FFFFFF', '#2A3A4E', '#7FA9D6', '#F4D9E2') },
  { id: 'cierge', nom: 'Cierge', famille: 'baptemes', culture: 'Lumière', ouverture: 'lumiere', mep: 'arche', ornement: 'floral', polices: 'cormorant', palette: P('#FBF9F4', '#FFFFFF', '#33352C', '#6E7B4F', '#C2A15C') },
  { id: 'colombe', nom: 'Colombe', famille: 'baptemes', culture: 'Blanc et olivier', ouverture: 'enveloppe', mep: 'minimal', ornement: 'aucun', polices: 'cormorant', palette: P('#F7F6F2', '#FFFFFF', '#2B2C27', '#7C8A63', '#DAD6C8') },
  { id: 'olivier', nom: 'Olivier', famille: 'baptemes', culture: 'Vert sauge', ouverture: 'rouleau', mep: 'cadre', ornement: 'floral', polices: 'marcellus', palette: P('#EFF1EA', '#FBFCF7', '#25291F', '#66724F', '#C9B98E') },
  { id: 'aube', nom: 'Aube', famille: 'baptemes', culture: 'Pêche et or', ouverture: 'voile', mep: 'carte', ornement: 'etoiles', polices: 'script', palette: P('#FBF0EA', '#FFFFFF', '#3A2B27', '#D9906E', '#EBC7A0') },
  { id: 'lin', nom: 'Lin', famille: 'baptemes', culture: 'Naturel', ouverture: 'pliage', mep: 'editorial', ornement: 'aucun', polices: 'fraunces', palette: P('#F1ECE3', '#F9F6F0', '#2F2A22', '#8E7A5C', '#CFC3AE') },
  { id: 'dragee', nom: 'Dragée', famille: 'baptemes', culture: 'Pastels', ouverture: 'ruban', mep: 'carte', ornement: 'points', polices: 'dmserif', palette: P('#F7F2F4', '#FFFFFF', '#3A3036', '#C79AAE', '#A9C4DC') },
  { id: 'plume', nom: 'Plume', famille: 'baptemes', culture: 'Gris perle', ouverture: 'sceau', mep: 'arche', ornement: 'aucun', polices: 'cormorant', palette: P('#F2F2F1', '#FFFFFF', '#2C2D2F', '#8A8F98', '#D9D6CF') },
  { id: 'source', nom: 'Source', famille: 'baptemes', culture: 'Eau vive', ouverture: 'lumiere', mep: 'classique', ornement: 'vague', polices: 'playfair', palette: P('#EDF4F6', '#FFFFFF', '#1D3138', '#4A8DA0', '#C8DDE3') },
  { id: 'lys', nom: 'Lys', famille: 'baptemes', culture: 'Blanc et or', ouverture: 'portes', mep: 'cadre', ornement: 'filet', polices: 'cinzel', palette: P('#FAF8F2', '#FFFFFF', '#2A2620', '#B39352', '#E8DFC8') },
  // ── Gender reveal ───────────────────────────────────────────────────────────
  { id: 'rosebleu', nom: 'Rose ou bleu', famille: 'reveals', culture: 'Le grand suspense', ouverture: 'ruban', mep: 'carte', ornement: 'aucun', polices: 'dmserif', palette: P('#F6EFE8', '#FFFBF6', '#3B3330', '#E8A9B8', '#9CC3DE') },
  { id: 'secret', nom: 'Top secret', famille: 'reveals', culture: 'Dossier confidentiel', ouverture: 'enveloppe', mep: 'editorial', ornement: 'aucun', polices: 'fraunces', palette: P('#2B2A27', '#F4EFE3', '#24221F', '#B3261E', '#C9A877') },
  { id: 'ballons', nom: 'Ballons', famille: 'reveals', culture: 'Lâcher de ballons', ouverture: 'cadre', mep: 'classique', ornement: 'ballons', polices: 'playfair', palette: P('#FBF6F1', '#FFFFFF', '#33302E', '#E59AAE', '#8DB8D8') },
  { id: 'bulles', nom: 'Bulles', famille: 'reveals', culture: 'Légèreté', ouverture: 'voile', mep: 'minimal', ornement: 'points', polices: 'script', palette: P('#F3F6FA', '#FFFFFF', '#2F3440', '#9BB6D9', '#EBB7C6') },
  { id: 'feux', nom: 'Feu d\'artifice', famille: 'reveals', culture: 'Nuit de fête', ouverture: 'lumiere', mep: 'cadre', ornement: 'etoiles', polices: 'bodoni', palette: P('#11131F', '#191C2C', '#F1ECF6', '#F08BB0', '#7FB3F0') },
  { id: 'duel', nom: 'Le duel', famille: 'reveals', culture: 'Équipe rose, équipe bleue', ouverture: 'portes', mep: 'editorial', ornement: 'aucun', polices: 'dmserif', palette: P('#FFF7F4', '#FFFFFF', '#262326', '#E2557F', '#3E7CC9') },
  { id: 'nuancier', nom: 'Nuancier', famille: 'reveals', culture: 'Aquarelle', ouverture: 'pliage', mep: 'carte', ornement: 'vague', polices: 'cormorant', palette: P('#F6F3F1', '#FFFFFF', '#38323A', '#D59BB0', '#9EC0D8') },
  { id: 'surprise', nom: 'Surprise', famille: 'reveals', culture: 'Confettis', ouverture: 'tuiles', mep: 'classique', ornement: 'confettis', polices: 'fraunces', palette: P('#FFF9EF', '#FFFFFF', '#2B2724', '#EC7FA0', '#6FA8DC') },
  { id: 'cigogne', nom: 'Cigogne', famille: 'reveals', culture: 'Livraison attendue', ouverture: 'ruban', mep: 'arche', ornement: 'nuages', polices: 'playfair', palette: P('#F2F6F8', '#FFFFFF', '#2A3338', '#E6A1B5', '#86B2CF') },
  { id: 'enigme', nom: 'Énigme', famille: 'reveals', culture: 'Point d\'interrogation', ouverture: 'sceau', mep: 'minimal', ornement: 'aucun', polices: 'bodoni', palette: P('#F4F1EC', '#FFFFFF', '#1D1B19', '#C4708A', '#5F8DB8') },
  // ── Naissances ──────────────────────────────────────────────────────────────
  { id: 'lune', nom: 'Lune', famille: 'naissances', culture: 'Nuit douce', ouverture: 'lumiere', mep: 'classique', ornement: 'lune', polices: 'cormorant', palette: P('#141B2E', '#1C2540', '#EEE8DB', '#D8BE7E', '#8C9CC4') },
  { id: 'envol', nom: 'Envol', famille: 'naissances', culture: 'Petits oiseaux', ouverture: 'voile', mep: 'arche', ornement: 'nuages', polices: 'playfair', palette: P('#F1F5F7', '#FFFFFF', '#28343B', '#7FA6B8', '#E8C3B0') },
  { id: 'doudou', nom: 'Doudou', famille: 'naissances', culture: 'Tout doux', ouverture: 'enveloppe', mep: 'carte', ornement: 'points', polices: 'dmserif', palette: P('#F6F0E8', '#FFFDF9', '#3A3029', '#B98E6A', '#E2CDB5') },
  { id: 'coton', nom: 'Coton', famille: 'naissances', culture: 'Blanc pur', ouverture: 'pliage', mep: 'minimal', ornement: 'aucun', polices: 'cormorant', palette: P('#F8F7F4', '#FFFFFF', '#2C2B29', '#A7A08F', '#E3DFD5') },
  { id: 'savane', nom: 'Savane', famille: 'naissances', culture: 'Petits animaux', ouverture: 'rouleau', mep: 'cadre', ornement: 'palmes', polices: 'fraunces', palette: P('#F4ECDD', '#FBF6EC', '#33281C', '#B07A3B', '#6F8452') },
  { id: 'berceuse', nom: 'Berceuse', famille: 'naissances', culture: 'Lavande et étoiles', ouverture: 'rideau', mep: 'classique', ornement: 'etoiles', polices: 'script', palette: P('#F3F1F8', '#FFFFFF', '#2E2A3C', '#8C7DB8', '#D6CDE9') },
  { id: 'petitspas', nom: 'Petits pas', famille: 'naissances', culture: 'Pastels', ouverture: 'tuiles', mep: 'editorial', ornement: 'confettis', polices: 'dmserif', palette: P('#FBF5F2', '#FFFFFF', '#3A3233', '#E3A7A0', '#A8C9C0') },
  { id: 'eden', nom: 'Éden', famille: 'naissances', culture: 'Feuillage', ouverture: 'eventail', mep: 'arche', ornement: 'floral', polices: 'marcellus', palette: P('#EEF2EA', '#FFFFFF', '#23301F', '#5E8255', '#D7C49A') },
  { id: 'perle', nom: 'Perle', famille: 'naissances', culture: 'Gris et nacre', ouverture: 'sceau', mep: 'cadre', ornement: 'filet', polices: 'cinzel', palette: P('#F1F1F2', '#FFFFFF', '#2A2B2E', '#9A9AA3', '#DCD8D2') },
  { id: 'soleil', nom: 'Soleil', famille: 'naissances', culture: 'Jaune tendre', ouverture: 'portes', mep: 'carte', ornement: 'rayons', polices: 'fraunces', palette: P('#FFF8E8', '#FFFFFF', '#33291A', '#E0A43A', '#F2CF8C') },
];

// Familles : les quatre premières pour le mariage, puis une par événement des sites annexes.
export const FAMILLES = { heritages: 'Héritages', intemporels: 'Intemporels', nature: 'Nature et bohème', modernes: 'Modernes',
  anniversaires: 'Anniversaires', baptemes: 'Baptêmes', reveals: 'Gender reveal', naissances: 'Naissances' };
export const FAMILLES_DE = { mariage: ['heritages', 'intemporels', 'nature', 'modernes'], anniversaire: ['anniversaires'], bapteme: ['baptemes'], gender: ['reveals'], naissance: ['naissances'] };
export const EVENEMENT_DE = { heritages: 'mariage', intemporels: 'mariage', nature: 'mariage', modernes: 'mariage', anniversaires: 'anniversaire', baptemes: 'bapteme', reveals: 'gender', naissances: 'naissance' };

// ── Structure : ce qui distingue deux directions au-delà des couleurs ─────────
// Couverture : la composition de la première page.
export const COUVERTURES = {
  portrait: 'Photo verticale centrée', plein: 'Photo plein écran, texte par-dessus', scinde: 'Page coupée en deux : photo et texte côte à côte',
  medaillon: 'Photo ronde cerclée', bandeau: 'Bandeau panoramique, titre aligné à gauche', monogramme: 'Sans photo : grandes initiales', polaroid: 'Photo légèrement inclinée, légende manuscrite',
};
// Programme : la façon de présenter le déroulé.
export const PROGRAMMES = {
  liste: 'Liste horaire', frise: 'Frise verticale, étapes en alternance', cartes: 'Cartes, une par moment', horaire: 'Menu : heures en grand, points de conduite',
  billets: 'Billets détachables', etapes: 'Étapes numérotées, côte à côte',
};
// Rythme : l'enchaînement des parties.
export const RYTHMES = {
  centre: 'Parties centrées', alterne: 'Parties alternées à gauche et à droite', chapitres: 'Chapitres numérotés en chiffres romains',
  bandes: 'Bandes de couleur alternées, pleine largeur', encadre: 'Chaque partie dans un cadre fin',
};

// Chaque direction reçoit une couverture, un programme et un rythme, attribués une fois pour toutes dans l'ordre du catalogue :
// la structure complète (mise en page, couverture, programme, rythme) n'est jamais celle d'une autre direction, et deux
// directions d'une même famille n'ont jamais le même couple couverture et programme, ni la même couverture sur la même mise en page.
const C = Object.keys(COUVERTURES), PR = Object.keys(PROGRAMMES), R = Object.keys(RYTHMES);
const AVEC_PHOTO = new Set(['portrait', 'plein', 'scinde', 'medaillon', 'bandeau', 'polaroid']);
{
  const pris = new Set(), parFamille = {};
  THEMES.forEach((t, k) => {
    const f = parFamille[t.famille] ??= new Set();
    for (let n = 0; n < C.length * PR.length * R.length; n++) {
      const couv = t.couv ?? C[(k * 3 + n) % C.length], prog = t.prog ?? PR[(k * 5 + Math.floor(n / C.length)) % PR.length], rythme = t.rythme ?? R[(k * 2 + Math.floor(n / (C.length * PR.length))) % R.length];
      const cle = [t.mep, couv, prog, rythme].join('/');
      if (pris.has(cle) || f.has(couv + '+' + prog) || f.has(t.mep + '#' + couv) && n < C.length * PR.length) continue;
      pris.add(cle); f.add(couv + '+' + prog); f.add(t.mep + '#' + couv);
      Object.assign(t, { couv, prog, rythme }); break;
    }
    t.evenement = EVENEMENT_DE[t.famille];
  });
}
export const couvAvecPhoto = c => AVEC_PHOTO.has(c);
export const themesPour = type => THEMES.filter(t => (FAMILLES_DE[type] || FAMILLES_DE.mariage).includes(t.famille));

export const theme = id => THEMES.find(t => t.id === id) || THEMES[0];
