"""Version anglaise de l'accueil Mariage (en/index.html), à partir des mêmes données que sites.py (prix, collections).
Lancé par construire.py après les sites français."""
from html import escape as e
from pathlib import Path
import sites

V = Path(__file__).resolve().parent.parent

COLLECTIONS_EN = {
    'grand-hotel': ('Grand Hôtel', 'Signature · Parisian palace', 'Cotton envelope with a wax seal, crystal chandelier and white roses'),
    'heritage': ('Héritage', 'Signature · West Africa', 'Woven kente clutch with a gold clasp, wax print and tropical flowers'),
    'lakay': ('Lakou', 'Lakou · gingerbread houses', 'Gingerbread doors, bougainvillea and the family courtyard'),
    'madras': ('Madras', 'Madras · tèt maré headwrap', 'Madras cloth envelope with a gold brooch, Creole lace'),
    'kente': ('Kente', 'Kente · adinkra symbols', 'Black velvet, gold seal and hand-woven kente'),
    'owambe': ('Owambe', 'Aso-ebi · gele', 'Emerald velvet doors, coral beads and gele'),
    'toghu': ('Toghu', 'Toghu · Grassfields', 'Black velvet embroidered in red, yellow and blue, cowrie clasp'),
    'teranga': ('Teranga', 'Grand boubou · bazin', 'Indigo bazin envelope with gold embroidery, facing the ocean'),
    'sape': ('Sape', 'La Sape · elegance', 'Pastel wardrobe doors, silk bow ties and dandy elegance'),
    'kita': ('Kita', 'Kita cloth · Baoulé weaving', 'Orange and gold kita cloth with a brass Akan gold-weight'),
    'bogolan': ('Bogolan', 'Bogolanfini · mud cloth', 'Carved Dogon-style doors, mud cloth and earth tones'),
    'tibeb': ('Tibeb', 'Habesha kemis · tibeb', 'Hand-woven white cotton, tibeb border and silver filigree'),
    'classique': ('Classique', 'Timeless · château', 'Ivory envelope, double gold border and wax seal'),
    'versailles': ('Versailles', 'Timeless · royal', 'Powder-blue envelope with a baroque border and sun seal'),
    'gatsby': ('Gatsby', 'Timeless · Roaring Twenties', 'Black and gold art deco doors, feathers, pearls and jazz'),
    'opera': ('Opéra', 'Timeless · grand evening', 'Red velvet curtain rising, crystal chandeliers and a masked ball'),
    'emeraude': ('Émeraude', 'Timeless · jewel evening', 'Emerald velvet jewel case opening, white orchids and gold under a glasshouse'),
    'bordeaux': ('Bordeaux', 'Timeless · vineyard', 'Wine-coloured envelope with a vine wax seal, château and autumn vines'),
    'chapelle': ('Chapelle', 'Timeless · seaside chapel', 'Chapel doors opening, an arch of white and blue flowers above the waves'),
    'faubourg': ('Faubourg', 'Timeless · Paris', 'Black lacquered carriage door, zinc rooftops at sunset seen from a wrought-iron balcony'),
    'ivoire': ('Ivoire', 'Timeless · embroidery', 'Pearl-embroidered gatefold that opens, raised branches in the corners, embossed paper'),
    'porcelaine': ('Porcelaine', 'Timeless · faience', 'Cobalt-painted porcelain cabinet that opens, scalloped cartouche around the names'),
    'marine': ('Marine', 'Timeless · watercolour', 'Cotton-paper envelope with painted waves, seashell wax seal, lighthouse and sailboats in watercolour'),
    'soie': ('Soie', 'Timeless · ink drawing', 'Ink-painted silk folding screen that unfolds, wisteria drawn along the edge of the card'),
    'monogramme': ('Monogramme', 'Timeless · paper cut', 'Laser-cut paper gate, three-layer paper diorama with silhouettes and a gold monogram'),
    'karabela': ('Karabela', 'Karabela · quadrille dress', 'Chambray envelope edged with eyelet lace, hibiscus seal; broderie anglaise and tropical flowers around the card'),
    'qunkwa': ('Qun kwa', 'Qun kwa · tea ceremony', 'Red silk envelope embroidered with a phoenix, Chinese knot; gold dragon and phoenix facing each other'),
    'orangerie': ('Orangerie', 'Timeless · winter garden', 'Sage green envelope with an orange blossom sprig, a wrought iron glasshouse drawing itself around a lemon tree'),
    'kanaval': ('Kanaval', 'Kanaval · Jacmel', 'Midnight blue silk clutch embroidered with sequins, papier-mâché butterflies taking flight, hibiscus'),
    'karakou': ('Karakou', 'Karakou · khit errouh', 'Ivory envelope embroidered with gold thread, garnet wax seal; embroidered velvet, white arches and bougainvillea'),
    'takchita': ('Takchita', 'Takchita · sfifa and mdamma', 'Ivory silk envelope with gold passementerie, emerald wax seal; riad courtyard, pierced lanterns and blush pink'),
    'celeste': ('Céleste', 'Universe · under the stars', 'Midnight blue velvet envelope with a gold star map, gold star seal; observatory and milky way'),
    'kanchipuram': ('Kanchipuram', 'Kanchipuram · silk saree and zari', 'Magenta silk envelope edged with gold zari, tied with a string of jasmine; jasmine and marigold garlands, kolam'),
    'bindalli': ('Bindallı', 'Bindallı · henna night', 'Burgundy velvet envelope embroidered with gold and pearls, red ribbon with gold tassels; red veil, henna and candles'),
    'huipil': ('Huipil', 'Huipil · lazo and arras', 'White cotton envelope embroidered with flowers, tied with a pearl lazo; hacienda courtyard and bougainvillea'),
    'keswa': ('Keswa', 'Keswa · fouta and blouza', 'Ivory satin envelope embroidered with gold thread, teal wax seal; white terrace facing the sea'),
    'citadelle': ('Citadelle', 'Worlds · medieval fantasy', 'Parchment envelope with a burgundy border, heraldic dragon wax seal; a castle in the mist, banners and wrought iron chandeliers'),
    'nocturne': ('Nocturne', 'Worlds · romantic gothic', 'Plum velvet envelope with gold lace, black wax seal with a rose; a candlelit gothic chapel under the moon'),
    'adinkra': ('Adinkra', 'Adinkra · Akan symbols', 'Ivory envelope with a heart seal, Akoma and Nkonsonkonson symbols printed as if stamped by hand, flame trees'),
    'bazin': ('Bazin', 'Bazin riche · grand boubou', 'Teal bazin envelope with a gold filigree seal, a draped bazin swag crossed by a moving glint of light, desert roses'),
    'kreyol': ('Kreyòl', 'Kreyòl · “Krik? Krak!”', 'A storybook that opens, a paper Creole house that pops up, anthuriums and a hummingbird'),
    'ndop': ('Ndop', 'Ndop · royal indigo', 'Carved palace doors, swaying indigo banners with white patterns, white flowers'),
    'liputa': ('Liputa', 'Liputa · wax and rumba', 'Wax print envelope with a fabric knot, floating wax swatches around the card, torch ginger flowers'),
    'imbali': ('Imbali', 'Zulu beadwork · umabo', 'Violet envelope with a beaded seal, names inside a slowly turning beaded collar, king proteas'),
    'lehenga': ('Lehenga', 'Lehenga · varmala and mandap', 'Rani pink haveli doors, a marigold toran and swaying jasmine strands'),
    'shiromuku': ('Shiromuku', 'Shiromuku · Shinto ceremony', 'Washi envelope with a mizuhiki knot, a round window onto a cherry blossom garden, a painted branch'),
    'aodai': ('Áo dài', 'Áo dài · lotus', 'Gold-leaf lacquer doors, a lotus pond painted on silk, a dragonfly and a rippling reflection'),
    'hanbok': ('Hanbok', 'Hanbok · pyebaek', 'Hanok doors with hanji paper, plum and rose of Sharon branch across the card, celadon'),
    'lanternes': ('Lanternes', 'Timeless · lakeside night', 'Midnight-blue envelope with gold stars, a lake at blue hour and lanterns rising into the sky'),
    'boheme': ('Bohème', 'Timeless · Provence', 'Pampas curtain, natural linen and late-summer light'),
    'champetre': ('Champêtre', 'Timeless · countryside', 'Linen envelope tied with lavender, by the old mill'),
}
FORMULES_EN = {
    'Essentiel': ['Your complete space: wedding website, RSVPs, guest list, seating plan, budget, planning', 'One invitation from the collections, in your colours', 'Two languages'],
    'Signature': ['Everything in Essentiel', 'Animated save-the-date and invitations per ceremony', 'QR-code entry control', 'Live photo wall, guestbook and album', 'Three languages'],
    'Prestige': ['Everything in Signature', 'Private live stream for family abroad', 'Guests from abroad and a guide to your ceremony', 'Live schedule and personalised thank-you cards',
                 'Music of your choice', 'Opening reworked around your story'],
}


def page():
    groupes = next(s for s in sites.SITES if s['cle'] == 'mariage')['groupes']
    titres = {'À la une': 'Signature collections', 'Héritages': 'Heritage', 'Intemporels': 'Timeless'}
    blocs = []
    for titre, _, slugs in groupes:
        cartes = ''.join(f'''<div class="revele"><a class="oeuvre" href="../{s}/index.html"><div class="cadre"><img src="../{s}/photo.jpg" alt="{e(COLLECTIONS_EN[s][0])}" loading="lazy"></div>
          <span class="etq">{e(COLLECTIONS_EN[s][1])}</span><h4>{e(COLLECTIONS_EN[s][0])}</h4><p>{e(COLLECTIONS_EN[s][2])}</p><span class="ouvrir">Open the invitation</span></a></div>''' for s in slugs if s in COLLECTIONS_EN)
        blocs.append(f'<div class="groupe"><div class="groupe-tete"><h3>{e(titres.get(titre, titre))}</h3></div><div class="oeuvres">{cartes}</div></div>')
    formules = ''.join(f'''<article class="formule revele"><h3>{e(n)}</h3><p class="prix">{p:,} €</p><ul>{''.join(f"<li>{e(x)}</li>" for x in FORMULES_EN.get(n, []))}</ul>
        <a class="btn" href="../creer/?evt=mariage">Choose {e(n)}</a></article>'''.replace(',', ' ') for n, p, _, _ in sites.FORMULES_MARIAGE)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<title>Maison Vivat · Weddings</title>
<meta name="description" content="Realistic animated wedding invitations, a wedding website, RSVPs, seating plan, QR entry and live photos: every guest welcomed, from the first announcement to the last memory.">
<meta property="og:image" content="https://maisonvivat.com/grand-hotel/photo.jpg">
<link rel="alternate" hreflang="fr" href="https://maisonvivat.com/"><link rel="alternate" hreflang="en" href="https://maisonvivat.com/en/">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../_commun/maison.css?v={sites.CSS_V}">
<style>:root{{--accent:#A8834A}} .formules{{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}} .formule{{padding:26px;background:#fff;border:1px solid rgba(168,131,74,.35)}}
.formule .prix{{font-family:'Cormorant Garamond',serif;font-size:40px;margin:6px 0 10px}} .formule ul{{margin:0 0 18px 18px;line-height:1.7}} .faq dt{{font-weight:500;margin-top:16px}} .faq dd{{margin:4px 0 0}}</style>
</head>
<body>
<header class="entete"><div class="conteneur">
  <a class="marque" href="#haut"><b>Maison Vivat</b><span>Weddings</span></a>
  <nav class="nav" aria-label="Sections"><a href="#collections">Collections</a><a href="#space">Your space</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a class="espace" href="../app/organisateur.html">My space</a><a class="langue" href="../" lang="fr" aria-label="Version française">FR</a><a class="rdv" href="../creer/?evt=mariage">Start for free</a></nav>
</div></header>
<main id="haut">
  <div class="conteneur ouverture">
    <div class="revele">
      <span class="etq">The art of hosting · Weddings</span>
      <h1>Several ceremonies, guests from everywhere: <em>one link</em></h1>
      <p>An invitation that opens like a real envelope, with music. Each guest only receives the ceremonies they are invited to, in their own language, and replies in one tap. No ads.</p>
      <div class="actions"><a class="btn" href="../creer/?evt=mariage">Start for free</a><a class="btn clair" href="#collections">See the collections</a></div>
      <p class="rassure">Build everything for free. You only pay when you publish and send the link to your guests.</p>
    </div>
    <div class="arche revele"><img src="../grand-hotel/photo.jpg" alt="" fetchpriority="high"></div>
  </div>

  <section id="collections"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Collections</span><h2>Forty-one collections, as many ways to host</h2>
      <p>Each one has its own opening (envelope, doors, curtain), its own layout, its own music and the couple's photo. Your guests read it in their language: English, French, Creole, Wolof, Lingala, Twi and more.</p></div>
    {''.join(blocs)}
  </div></section>

  <section id="space"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Your space</span><h2>Designed for weddings that bring people together</h2></div>
    <div class="fonctions">
      <article class="revele"><h3>An invitation that opens</h3><p>Envelope, doors, rising curtain: the opening, music and art direction of your collection, with your names.</p></article>
      <article class="revele"><h3>Each ceremony, its guests</h3><p>Traditional, civil, church, party: each guest only receives what they are invited to, and replies for each moment.</p></article>
      <article class="revele"><h3>In everyone's language</h3><p>Fourteen languages, from French, English and Spanish to Arabic, Chinese and Swahili: the invitation and website in up to three languages.</p></article>
      <article class="revele"><h3>Guests from far away</h3><p>Arrival dates, accommodation, visa letter, carpooling from home, and a private live stream for those who cannot come.</p></article>
      <article class="revele"><h3>A smooth wedding day</h3><p>QR code entry, live photo wall and video guest book, with no app to install.</p></article>
      <article class="revele"><h3>And the planning, as a bonus</h3><p>RSVPs, seating plan, budget, planning, gift list and cash fund are included at no extra cost. We never touch the money.</p></article>
    </div>
  </div></section>

  <section class="tarifs" id="pricing"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Pricing</span><h2>Three plans, one payment per wedding</h2><p>Free while you prepare. You pay once, when you publish. Access lasts until 12 months after your wedding.</p></div>
    <div class="formules">{formules}</div>
  </div></section>

  <section id="faq"><div class="conteneur mesure">
    <div class="titre-section revele"><span class="etq">FAQ</span><h2>Good to know</h2></div>
    <dl class="faq revele">
      <dt>Do I need an appointment?</dt><dd>No. Everything happens online: you compose your invitation and see the result live.</dd>
      <dt>Can my guests read it in English?</dt><dd>Yes. Each plan includes two or three languages, and more can be added.</dd>
      <dt>Does the price depend on the number of guests?</dt><dd>No. Each plan is a single payment per wedding, whatever the number of guests.</dd>
      <dt>Is my website private?</dt><dd>Personal links open directly for each guest, and you can protect the general page with an access code.</dd>
      <dt>Can I change my mind?</dt><dd>Yes, within the 14-day withdrawal period described in our <a href="../cgv/index.html">terms of sale</a>.</dd>
    </dl>
    <p class="note revele">The ordering space is currently in French; write to us from your space if you need help in English.</p>
  </div></section>
</main>
<footer class="pied"><div class="conteneur"><p>Maison Vivat · The art of hosting · <a href="../">Version française</a></p></div></footer>
<script>
  const vu = new IntersectionObserver(es => es.forEach(x => {{ if (x.isIntersecting) {{ x.target.classList.add('vu'); vu.unobserve(x.target); }} }}), {{ threshold: .12 }});
  document.querySelectorAll('.revele').forEach(el => vu.observe(el));
</script>
</body>
</html>
'''


def construire():
    (V / 'en').mkdir(exist_ok=True)
    (V / 'en' / 'index.html').write_text(page(), encoding='utf-8')
    print('anglais ok')


if __name__ == '__main__':
    construire()
