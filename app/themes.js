// Catalogue des directions artistiques du moteur de faire-part.
// Une direction = une ouverture (l'animation d'entrée) + une mise en page + un ornement + une palette + des polices.
// Chaque direction s'affiche en faire-part et en save-the-date : 50 directions = 50 + 50.

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
  vague: 'Vagues', palmes: 'Palmes',
};

// Palette : fond de page, papier (cartes), texte, accent, accent secondaire.
const P = (fond, papier, texte, accent, accent2) => ({ fond, papier, texte, accent, accent2 });

// 50 directions artistiques. famille : heritages | intemporels | nature | modernes | festifs.
export const THEMES = [
  // ── Héritages : Afrique et Antilles ─────────────────────────────────────────
  { id: 'lakou', nom: 'Lakou', famille: 'heritages', culture: 'Haïti', ouverture: 'portes', mep: 'arche', ornement: 'palmes', polices: 'playfair', palette: P('#F4EEE4', '#FFFBF5', '#2B2420', '#1F6F5C', '#D9493B') },
  { id: 'kreyol', nom: 'Kreyòl', famille: 'heritages', culture: 'Haïti', ouverture: 'ruban', mep: 'carte', ornement: 'floral', polices: 'dmserif', palette: P('#FBF3EA', '#FFFFFF', '#2E1F1A', '#C2442E', '#2B5DA8') },
  { id: 'madras', nom: 'Madras', famille: 'heritages', culture: 'Martinique · Guadeloupe', ouverture: 'ruban', mep: 'carte', ornement: 'madras', polices: 'playfair', palette: P('#FFF7EC', '#FFFFFF', '#3A2418', '#D2232A', '#F2B705') },
  { id: 'kanaval', nom: 'Kanaval', famille: 'heritages', culture: 'Antilles', ouverture: 'eventail', mep: 'editorial', ornement: 'palmes', polices: 'bodoni', palette: P('#FDF4E7', '#FFFFFF', '#1E1A2E', '#E0533D', '#2C8C6B') },
  { id: 'kente', nom: 'Kente', famille: 'heritages', culture: 'Ghana', ouverture: 'tuiles', mep: 'cadre', ornement: 'kente', polices: 'cinzel', palette: P('#15120E', '#1F1A14', '#F3E7CF', '#D4A53A', '#2E8B57') },
  { id: 'adinkra', nom: 'Adinkra', famille: 'heritages', culture: 'Ghana', ouverture: 'sceau', mep: 'classique', ornement: 'filet', polices: 'marcellus', palette: P('#F3ECE0', '#FBF7F0', '#2A2118', '#9C6B2F', '#1D3B2A') },
  { id: 'owambe', nom: 'Owambe', famille: 'heritages', culture: 'Nigeria', ouverture: 'eventail', mep: 'editorial', ornement: 'artdeco', polices: 'bodoni', palette: P('#F7F1E8', '#FFFFFF', '#1C1714', '#B8862B', '#6E1F3A') },
  { id: 'gele', nom: 'Gèlè', famille: 'heritages', culture: 'Nigeria', ouverture: 'voile', mep: 'arche', ornement: 'wax', polices: 'playfair', palette: P('#FAF0F2', '#FFFFFF', '#2D1820', '#A3245A', '#D6A84C') },
  { id: 'toghu', nom: 'Toghu', famille: 'heritages', culture: 'Cameroun', ouverture: 'rideau', mep: 'cadre', ornement: 'etoiles', polices: 'cinzel', palette: P('#0E0F1A', '#171A2B', '#EFE6D2', '#C9A04A', '#B33A3A') },
  { id: 'ndop', nom: 'Ndop', famille: 'heritages', culture: 'Cameroun', ouverture: 'tuiles', mep: 'minimal', ornement: 'bogolan', polices: 'fraunces', palette: P('#ECEFF5', '#FFFFFF', '#141A33', '#22346E', '#C8CBD6') },
  { id: 'teranga', nom: 'Teranga', famille: 'heritages', culture: 'Sénégal', ouverture: 'voile', mep: 'classique', ornement: 'zellige', polices: 'cormorant', palette: P('#F6F4EF', '#FFFFFF', '#262420', '#B08D4C', '#7E9C8E') },
  { id: 'bazin', nom: 'Bazin', famille: 'heritages', culture: 'Sénégal · Mali', ouverture: 'pliage', mep: 'editorial', ornement: 'filet', polices: 'marcellus', palette: P('#EEF3F4', '#FFFFFF', '#1B2A30', '#2F6E7C', '#C9A55B') },
  { id: 'bogolan', nom: 'Bogolan', famille: 'heritages', culture: 'Mali', ouverture: 'rouleau', mep: 'cadre', ornement: 'bogolan', polices: 'fraunces', palette: P('#EFE4D2', '#F8F0E2', '#2E2216', '#7A4A24', '#2A2A26') },
  { id: 'kita', nom: 'Kita', famille: 'heritages', culture: "Côte d'Ivoire", ouverture: 'tuiles', mep: 'carte', ornement: 'kente', polices: 'dmserif', palette: P('#FFF5EB', '#FFFFFF', '#241A12', '#E2701F', '#1F1F1F') },
  { id: 'sape', nom: 'Sape', famille: 'heritages', culture: 'Congo', ouverture: 'cadre', mep: 'editorial', ornement: 'aucun', polices: 'bodoni', palette: P('#F2F0EC', '#FFFFFF', '#141414', '#C8102E', '#1E4FA0') },
  { id: 'liputa', nom: 'Liputa', famille: 'heritages', culture: 'Congo', ouverture: 'ruban', mep: 'arche', ornement: 'wax', polices: 'playfair', palette: P('#F5F0E6', '#FFFFFF', '#1D2A1F', '#2E7D4F', '#E3B23C') },
  { id: 'tibeb', nom: 'Tibeb', famille: 'heritages', culture: 'Éthiopie', ouverture: 'rideau', mep: 'classique', ornement: 'kente', polices: 'cinzel', palette: P('#FAF8F3', '#FFFFFF', '#24211C', '#2D7A4A', '#C79A2B') },
  { id: 'imbali', nom: 'Imbali', famille: 'heritages', culture: 'Afrique du Sud', ouverture: 'eventail', mep: 'cadre', ornement: 'zellige', polices: 'marcellus', palette: P('#F3EEF7', '#FFFFFF', '#21183A', '#5A2E8A', '#E8A33D') },
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
  // ── Festifs (anniversaire, baptême, gender reveal) ─────────────────────────
  { id: 'gala', nom: 'Gala', famille: 'festifs', culture: 'Anniversaire', ouverture: 'rideau', mep: 'cadre', ornement: 'artdeco', polices: 'bodoni', palette: P('#0D0D0F', '#17171A', '#F1E6CF', '#D4AF37', '#8A8A8A') },
  { id: 'disco', nom: 'Disco', famille: 'festifs', culture: 'Anniversaire', ouverture: 'lumiere', mep: 'editorial', ornement: 'etoiles', polices: 'dmserif', palette: P('#1A0B2E', '#251040', '#F8F0FF', '#FF3CAC', '#2DE2E6') },
  { id: 'nuage', nom: 'Nuage', famille: 'festifs', culture: 'Baptême', ouverture: 'voile', mep: 'classique', ornement: 'etoiles', polices: 'playfair', palette: P('#EEF4FA', '#FFFFFF', '#2A3A4E', '#7FA9D6', '#F4D9E2') },
  { id: 'cierge', nom: 'Cierge', famille: 'festifs', culture: 'Baptême', ouverture: 'lumiere', mep: 'arche', ornement: 'floral', polices: 'cormorant', palette: P('#FBF9F4', '#FFFFFF', '#33352C', '#6E7B4F', '#C2A15C') },
  { id: 'rosebleu', nom: 'Rose ou bleu', famille: 'festifs', culture: 'Gender reveal', ouverture: 'ruban', mep: 'carte', ornement: 'aucun', polices: 'dmserif', palette: P('#F6EFE8', '#FFFBF6', '#3B3330', '#E8A9B8', '#9CC3DE') },
  { id: 'secret', nom: 'Top secret', famille: 'festifs', culture: 'Gender reveal', ouverture: 'enveloppe', mep: 'editorial', ornement: 'aucun', polices: 'fraunces', palette: P('#2B2A27', '#F4EFE3', '#24221F', '#B3261E', '#C9A877') },
];

export const FAMILLES = { heritages: 'Héritages', intemporels: 'Intemporels', nature: 'Nature et bohème', modernes: 'Modernes', festifs: 'Festifs' };

export const theme = id => THEMES.find(t => t.id === id) || THEMES[0];
