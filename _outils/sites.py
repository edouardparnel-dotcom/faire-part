"""Les quatre sites de la maison : mariage (racine), anniversaires, baptêmes, gender reveal.
Offre 100 % en ligne : le client compose son espace (formule + options), voit l'aperçu, paie, valide ;
contact écrit seulement en cas de besoin. Le faire-part est une option de l'espace, pas le produit.
Chaque site tient seul et le pied de page les relie. Appelé par construire.py après les aperçus."""
import json
from html import escape
from emotions import EMOTIONS

MARQUE = 'Maison Vivat'   # domaine maisonvivat.com (acheté le 08/11/2026)
CSS_V = 12                # augmenter à chaque modification de _commun/maison.css (cache GitHub Pages)

ORN = '<svg class="orn" viewBox="0 0 120 14" aria-hidden="true"><path d="M0 7h50M70 7h50" stroke="currentColor" stroke-width=".8"/><path d="M60 1l6 6-6 6-6-6z" fill="none" stroke="currentColor" stroke-width=".8"/></svg>'

# Options : clé, moment, nom, description, prix (None = inclus, 'devis' = sur devis), pensé pour la diaspora
OPTIONS_MARIAGE = [
  ('fairepart', 'Avant', "L'invitation", "Quarante collections réalistes, chacune avec son ouverture, sa mise en page et sa musique : invitation, save-the-date et site, à vos couleurs.", None, False),
  ('savethedate', 'Avant', 'Save-the-date animé', "L'annonce envoyée des mois avant, pour que chacun bloque la date.", 90, False),
  ('musique', 'Avant', 'Musique au choix', "La musique démarre à l'ouverture de l'invitation : celle de la collection, une autre de notre bibliothèque ou la vôtre.", 40, False),
  ('ceremonies', 'Avant', 'Invitations par cérémonie', "Coutumier ou dot, mairie, église, soirée : chaque invité ne reçoit que ce à quoi il est convié.", 120, True),
  ('guide', 'Avant', 'Guide de la cérémonie', "La dot, le coutumier, les rites expliqués aux invités d'une autre culture.", 90, True),
  ('etranger', 'Avant', "Invités venus de l'étranger", "Dates d'arrivée, hébergement, navettes et lettre d'invitation pour le visa.", 120, True),
  ('tenues', 'Avant', 'Tenues coordonnées', "Aso ebi, pagne de famille : qui porte quel tissu, les tailles, qui a réglé.", 120, True),
  ('langue', 'Avant', 'Langue supplémentaire', "Anglais, créole, wolof, lingala, twi… Le site et l'invitation dans la langue de chacun.", 60, False),
  ('qr', 'Le jour J', "Contrôle d'entrée par QR code", "Chaque invité a son code. Seuls les invités entrent, même à trois cents.", 150, True),
  ('direct', 'Le jour J', 'Direct privé pour la famille au pays', "La cérémonie en direct, sur un lien réservé à vos invités.", 190, True),
  ('deroule', 'Le jour J', 'Déroulé en direct', "Le programme de la journée sur le téléphone de chacun, avec des rappels.", 60, False),
  ('murphoto', 'Le jour J', 'Mur photo en direct', "Les invités ajoutent leurs photos sans application, elles s'affichent pendant la fête.", 90, False),
  ('livredor', 'Le jour J', "Livre d'or vidéo et audio", "Des messages enregistrés pendant la fête, à réécouter des années plus tard.", 90, False),
  ('jeux', 'Le jour J', 'Jeux des invités', "Quiz sur les mariés et pronostics, depuis le téléphone de chacun, puis révélation et classement.", 60, False),
  ('album', 'Après', 'Album partagé', "Les photos des invités et du photographe, réunies en haute définition.", 90, False),
  ('merci', 'Après', 'Remerciements personnalisés', "Une carte pour chaque invité, avec une photo où il apparaît.", 90, False),
  ('livre', 'Après', 'Livre souvenir imprimé', "Les photos et les mots de vos invités, imprimés et reliés.", 'devis', False),
]
OPTIONS_EVENEMENT = [
  ('fairepart', 'Avant', "L'invitation", "Au moins dix directions artistiques, chacune avec sa propre ouverture et sa propre mise en page, reprise à vos couleurs.", None, False),
  ('musique', 'Avant', 'Musique au choix', "La musique démarre à l'ouverture de l'invitation : celle de la collection, une autre de notre bibliothèque ou la vôtre.", 40, False),
  ('langue', 'Avant', 'Langue supplémentaire', "L'invitation et la page dans la langue de chacun.", 60, False),
  ('direct', 'Le jour J', 'Direct privé pour les proches', "Le moment en direct, sur un lien réservé à vos invités.", 190, True),
  ('murphoto', 'Le jour J', 'Mur photo en direct', "Les invités ajoutent leurs photos sans application.", 90, False),
  ('livredor', 'Le jour J', "Livre d'or vidéo et audio", "Des messages enregistrés pendant la fête.", 90, False),
  ('jeux', 'Le jour J', 'Jeux et pronostics', "Quiz, pronostics, votes : les invités jouent sur leur téléphone.", 60, False),
  ('album', 'Après', 'Album partagé', "Toutes les photos réunies en haute définition.", 90, False),
  ('merci', 'Après', 'Remerciements personnalisés', "Une carte pour chaque invité, avec une photo où il apparaît.", 90, False),
]

# Formules : nom, prix, options incluses, lignes affichées
FORMULES_MARIAGE = [
  ('Essentiel', 390, [], ["Votre espace complet : site du mariage, réponses, invités, plan de table, budget, planning", "Une invitation de la collection, à vos couleurs", "Deux langues"]),
  ('Signature', 890, ['savethedate', 'ceremonies', 'qr', 'murphoto', 'livredor', 'album', 'langue'], ["Tout l'Essentiel", "Save-the-date et invitations par cérémonie", "Contrôle d'entrée par QR code", "Mur photo, livre d'or et album", "Trois langues"]),
  ('Prestige', 1690, ['savethedate', 'ceremonies', 'qr', 'murphoto', 'livredor', 'album', 'langue', 'direct', 'etranger', 'guide', 'merci', 'deroule', 'musique'], ["Tout le Signature", "Direct privé pour la famille au pays", "Invités venus de l'étranger et guide de la cérémonie", "Déroulé en direct et remerciements personnalisés", "Musique au choix, site protégé par code et à votre nom de domaine", "Ouverture retravaillée selon votre histoire"]),
]
FORMULES_EVENEMENT = [
  ('Essentiel', 190, [], ["L'invitation de la collection, à vos couleurs", "La page de l'événement et les réponses", "Envois et rappels aux invités, en un geste"]),
  ('Signature', 390, ['murphoto', 'livredor', 'langue'], ["Tout l'Essentiel", "Mur photo et livre d'or", "Trois langues"]),
  ('Prestige', 790, ['murphoto', 'livredor', 'langue', 'direct', 'album', 'merci', 'jeux'], ["Tout le Signature", "Direct privé pour les proches", "Album, jeux et remerciements personnalisés", "Ouverture retravaillée pour vous"]),
]

SITES = [
  dict(cle='mariage', dossier='', nom='Mariage', accent='#A8834A', evenements=('mariage',),
    image='grand-hotel/photo.jpg', image2='heritage/photo.jpg',
    titre_page="L'espace de votre mariage",
    h1="Tout votre mariage, <em>dans un seul espace</em>",
    sous="Invitations, site du mariage, réponses, plan de table, entrée des invités, photos : chacun de vos invités est reçu, de la première annonce au dernier souvenir.",
    cta='Créer mon espace', essai=('espace/#tableau', "Essayer l'espace"),
    manifeste="Recevoir, c'est penser à chacun : celui qui vient de la rue d'à côté, celle qui traverse l'océan, la grand-mère qui suivra la cérémonie de loin. Votre espace s'occupe d'eux, pour que vous profitiez de votre journée.",
    titre_espace="Votre espace, inclus dans chaque formule",
    espace=[('Le site du mariage', "Programme, lieux, hébergement, tenue, questions fréquentes, dans la langue de vos invités."),
            ('Les réponses', "Accompagnants, enfants, régimes, choix du plat : tout arrive au même endroit."),
            ('Les invités', "La liste importée en un clic, puis chaque invitation et chaque relance envoyée depuis votre WhatsApp, vos SMS ou votre messagerie, au prénom de chacun."),
            ('Le plan de table', "Chaque invité à sa place, et sa table sur son téléphone le jour venu."),
            ('Le budget', "Ce qui est prévu, payé et ce qu'il reste, prestataire par prestataire."),
            ('Le planning', "Toutes les tâches, de « à faire » à « fait », jusqu'au jour J."),
            ('Liste et cagnotte', "Vos invités réservent le cadeau qu'ils offrent, sans doublon, ou participent à votre cagnotte. Maison Vivat ne touche jamais l'argent.")],
    options=OPTIONS_MARIAGE, formules=FORMULES_MARIAGE,
    intro_collections="L'invitation donne le ton de votre réception. Chaque collection a sa direction artistique ; nous la reprenons à vos couleurs, à vos prénoms, à votre langue.",
    titre_collections='Quarante collections, quarante façons de recevoir',
    groupes=[('À la une', "Nos collections signatures : le faste d'un palace parisien, la noblesse des cérémonies d'Afrique de l'Ouest, et la douceur d'une aquarelle au bord de la mer.", ['grand-hotel', 'heritage', 'marine']),
             ('Héritages', "Les codes des cultures d'Afrique et des Antilles, travaillés avec finesse.",
              ['lakay', 'karabela', 'madras', 'kente', 'owambe', 'toghu', 'teranga', 'sape', 'kita', 'bogolan', 'tibeb', 'imbali', 'liputa', 'ndop', 'kreyol', 'bazin', 'adinkra']),
             ('Asie', "Les tenues de mariage d'Asie, leurs couleurs et leurs gestes, vérifiés avec soin.", ['qunkwa', 'hanbok', 'aodai', 'shiromuku', 'lehenga']),
             ('Intemporels', "Des lignes classiques, pour un mariage hors du temps.", ['classique', 'versailles', 'gatsby', 'opera', 'emeraude', 'bordeaux', 'chapelle', 'faubourg', 'ivoire', 'porcelaine', 'soie', 'monogramme', 'lanternes', 'boheme', 'champetre'])]),
  dict(cle='anniversaire', dossier='anniversaires', nom='Anniversaires', accent='#8E4A52', evenements=('anniversaire',),
    image='anniversaire-gala/decor-detail.jpg', image2='anniversaire-disco/decor-detail.jpg',
    titre_page="Invitations d'anniversaire",
    h1="Une soirée qui commence <em>dès l'invitation</em>",
    sous="Trente, cinquante, soixante-dix ans : une invitation qui donne le ton, une page pour vos invités, et leurs souvenirs après la fête.",
    cta='Créer mon invitation', essai=None,
    manifeste="Un anniversaire se reçoit comme une soirée privée : on soigne l'entrée, la lumière, le premier regard. Votre invitation en est le seuil.",
    titre_espace="Votre page de soirée, incluse dans chaque formule",
    espace=[('La page de la soirée', "Lieu, programme, tenue, carte des cocktails : tout tient dans un lien."),
            ('Les réponses', "Qui vient, avec qui, et les mots de ceux qui ne pourront pas."),
            ('Les rappels', "Qui n'a pas répondu, d'un coup d'œil, et un rappel personnel en un geste.")],
    options=OPTIONS_EVENEMENT, formules=FORMULES_EVENEMENT,
    intro_collections="Trois univers, trois façons d'ouvrir la soirée, repris à votre âge, vos prénoms, vos couleurs.",
    titre_collections="L'invitation, en treize collections",
    groupes=[('Faites main', "Trois invitations dessinées une à une.", ['anniversaire-gala', 'anniversaire-disco', 'anniversaire-tropical'])]),
  dict(cle='bapteme', dossier='baptemes', nom='Baptêmes', accent='#6E7B4F', evenements=('bapteme',),
    image='bapteme-lumiere/photo.jpg', image2='bapteme-lumiere/decor-ensemble.jpg',
    titre_page='Invitations de baptême',
    h1="Accueillir vos proches autour d'un <em>premier grand jour</em>",
    sous="Une invitation douce, une page pour la famille avec la cérémonie et le déjeuner, et les mots de chacun pour l'enfant.",
    cta='Créer mon invitation', essai=None,
    manifeste="Un baptême réunit souvent plusieurs générations et plusieurs pays. L'invitation doit parler à chacun, de la grand-mère au cousin resté au pays.",
    titre_espace="Votre page de baptême, incluse dans chaque formule",
    espace=[('La page de la journée', "La cérémonie, le déjeuner, les parrain et marraine, l'adresse et l'heure."),
            ('Les réponses', "La famille répond en un geste, même de l'autre côté de l'océan."),
            ('Les rappels', "Qui n'a pas répondu, d'un coup d'œil, et un rappel personnel en un geste.")],
    options=OPTIONS_EVENEMENT, formules=FORMULES_EVENEMENT,
    intro_collections="Trois atmosphères, de la plus sobre à la plus poétique, reprises au prénom de l'enfant.",
    titre_collections="L'invitation, en treize collections",
    groupes=[('Faites main', "Trois invitations dessinées une à une.", ['bapteme-lumiere', 'bapteme-nuage', 'bapteme-etoiles'])]),
  dict(cle='gender', dossier='reveal', nom='Gender reveal', accent='#9A6B78', evenements=('gender',),
    image='gender-reveal/decor-detail.jpg', image2='gender-boite/decor-ensemble.jpg',
    titre_page='Invitations de gender reveal',
    h1="Une révélation à partager, <em>même à distance</em>",
    sous="Une invitation qui joue le jeu, les pronostics de vos proches, et la surprise partagée avec ceux qui ne pourront pas venir.",
    cta='Créer mon invitation', essai=None,
    manifeste="Le plus beau d'un gender reveal, ce sont les visages au moment de la surprise. Nous préparons le terrain : le suspense, les pronostics, et une place pour la famille éloignée.",
    titre_espace="Votre page de fête, incluse dans chaque formule",
    espace=[('La page de la fête', "Lieu, heure, tenue de votre camp : tout tient dans un lien."),
            ('Les réponses', "Qui vient, et qui suivra la révélation de loin."),
            ('Les pronostics', "Chacun vote avant la révélation, la jauge monte.")],
    options=OPTIONS_EVENEMENT, formules=FORMULES_EVENEMENT,
    intro_collections="Trois façons de garder le secret jusqu'au bout, reprises à vos prénoms et vos couleurs.",
    titre_collections="L'invitation, en treize collections",
    groupes=[('Faites main', "Trois invitations dessinées une à une.", ['gender-reveal', 'gender-boite', 'gender-secret'])]),
  dict(cle='naissance', dossier='naissances', nom='Naissances', accent='#7A86A8', evenements=('naissance',),
    image='bapteme-nuage/photo.jpg', image2='bapteme-etoiles/photo.jpg',
    titre_page='Faire-part de naissance',
    h1="Annoncer une naissance, <em>avec douceur</em>",
    sous="Un faire-part qui présente votre enfant, une page pour la famille d'ici et d'ailleurs, la liste de naissance et les visites, sans répondre cent fois au téléphone.",
    cta='Créer mon faire-part', essai=None,
    manifeste="Une naissance se partage avec ceux qu'on aime, ici et au pays. Un seul lien suffit : le prénom, la première photo, et une place pour chacun quand il viendra le rencontrer.",
    titre_espace="Votre page de naissance, incluse dans chaque formule",
    espace=[('Le faire-part', "Le prénom, la date, l'heure, le poids, la taille, et la première photo."),
            ('La liste de naissance', "Un lien vers la liste ou la cagnotte, pour ceux qui demandent."),
            ('Les visites', "Chacun annonce sa visite : vous gardez la main sur votre tranquillité.")],
    options=OPTIONS_EVENEMENT, formules=FORMULES_EVENEMENT,
    intro_collections="Dix directions, de la plus sobre à la plus tendre, reprises au prénom de votre enfant, en faire-part, en annonce et en site.",
    titre_collections="Le faire-part, en dix directions",
    groupes=[]),
]

# ── Directions du moteur (app/themes.js), lues ici pour les pages statiques ──
import re
from pathlib import Path
FAMILLE_EVT = {'heritages': 'mariage', 'intemporels': 'mariage', 'nature': 'mariage', 'modernes': 'mariage',
               'anniversaires': 'anniversaire', 'baptemes': 'bapteme', 'reveals': 'gender', 'naissances': 'naissance'}
def themes_moteur():
    js = (Path(__file__).resolve().parent.parent / 'app' / 'themes.js').read_text(encoding='utf-8')
    chaine = r"'((?:[^'\\]|\\.)*)'"
    motif = re.compile(r"\{ id: " + chaine + r", nom: " + chaine + r", famille: " + chaine + r", culture: " + chaine)
    return [dict(id=a, nom=b.replace("\\'", "'"), famille=c, culture=d.replace("\\'", "'"), evt=FAMILLE_EVT[c]) for a, b, c, d in motif.findall(js)]
THEMES = themes_moteur()
# Collection faite main et direction du moteur du même nom : la seconde sert de « site » à la première.
SITE_DU_MODELE = {'lakay': 'lakou', 'madras': 'madras', 'kente': 'kente', 'owambe': 'owambe', 'toghu': 'toghu', 'teranga': 'teranga', 'sape': 'sape',
                  'kita': 'kita', 'bogolan': 'bogolan', 'tibeb': 'tibeb', 'champetre': 'champetre', 'boheme': 'pampa', 'classique': 'ivoire', 'gatsby': 'gatsby', 'versailles': 'versailles', 'opera': 'opera', 'lanternes': 'lanternes', 'hanbok': 'hanbok', 'aodai': 'aodai', 'shiromuku': 'shiromuku', 'lehenga': 'lehenga', 'qunkwa': 'qunkwa', 'karabela': 'karabela', 'imbali': 'imbali', 'liputa': 'liputa', 'ndop': 'ndop', 'kreyol': 'kreyol', 'bazin': 'bazin', 'adinkra': 'adinkra', 'monogramme': 'monogramme', 'soie': 'soie', 'marine': 'marine', 'porcelaine': 'porcelaine', 'ivoire': 'ivoire', 'faubourg': 'faubourg', 'emeraude': 'emeraude', 'bordeaux': 'bordeaux', 'chapelle': 'chapelle',
                  'anniversaire-gala': 'gala', 'anniversaire-disco': 'disco', 'anniversaire-tropical': 'tropicana', 'bapteme-lumiere': 'cierge',
                  'bapteme-nuage': 'nuage', 'bapteme-etoiles': 'aube', 'gender-reveal': 'ballons', 'gender-boite': 'rosebleu', 'gender-secret': 'secret'}


# Avis clients. Un avis ne s'affiche que si « valide » est vrai : passer à True SEULEMENT après l'accord écrit de la
# personne sur le texte exact (sinon c'est un faux avis, interdit par l'article L121-4 du Code de la consommation).
# Brouillons et message de demande : ../../avis-a-valider.md
AVIS = [
    dict(valide=True, site='mariage', signature='Martin et Falencie', lieu='',
         texte="Notre faire-part s'ouvrait comme une vraie enveloppe, et nos proches qui vivent loin ont eu l'impression d'être déjà avec nous. Tout le monde a pu l'ouvrir facilement, même les plus âgés. Après le mariage, Maison Vivat nous a fait un album photo et un film de notre journée : un souvenir qu'on garde précieusement."),
    dict(valide=True, site='mariage', signature='Mirlande et Charlie', lieu='',
         texte="Notre faire-part nous ressemble : nos couleurs, notre photo, notre soirée. Nos invités nous répondent facilement, et on a reçu beaucoup de compliments. Maison Vivat a tout de suite compris ce qu'on voulait."),
]


# Réalisations : des faits, sans citation ni nom (aucun accord nécessaire, rien d'inventé).
REALISATIONS = [
    dict(site='mariage', titre='Un mariage, des invités dans plusieurs pays', quand='2026',
         texte="Faire-part animé qui s'ouvre comme une enveloppe, avec le programme de la journée, le compte à rebours et l'ajout à l'agenda, envoyé par WhatsApp à des invités de plusieurs pays. Après la fête : un album photo privé et un montage vidéo."),
    dict(site='mariage', titre='Un mariage aux couleurs du couple', quand='2026',
         texte="Faire-part aux couleurs choisies par les mariés, avec le programme de la soirée. Les invités répondent en touchant un bouton ; le lien s'affiche sur WhatsApp avec une grande image."),
]


def bloc_realisations(site):
    r = [x for x in REALISATIONS if x['site'] == site['cle']]
    if not r:
        return ''
    e = escape
    return f"""  <section class="realisations"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Nos réalisations</span><h2>Ils nous ont confié leur invitation</h2>
      <p>Deux mariages accompagnés par Maison Vivat, avant le lancement de l'espace complet.</p></div>
    <div class="avis-liste">
{chr(10).join(f'      <article class="avis revele"><span class="etq">{e(x["quand"])}</span><h3>{e(x["titre"])}</h3><p>{e(x["texte"])}</p></article>' for x in r)}
    </div>
  </div></section>

"""


def bloc_avis(site):
    avis = [a for a in AVIS if a['valide'] and a['site'] == site['cle']]
    if not avis:
        return ''
    e = escape
    return f"""  <section class="avis-clients"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Ils nous ont confié leur invitation</span><h2>Leurs mots</h2>
      <p>Des fêtes accompagnées par Maison Vivat, avant le lancement de l'espace complet.</p></div>
    <div class="avis-liste">
{chr(10).join(f'      <figure class="avis revele"><blockquote>« {e(a["texte"])} »</blockquote><figcaption><b>{e(a["signature"])}</b>{' · ' + e(a["lieu"]) if a["lieu"] else ''}</figcaption></figure>' for a in avis)}
    </div>
  </div></section>

"""


def prix(p):
    if p is None:
        return 'Inclus'
    if p == 'devis':
        return 'Sur devis'
    return f'{p:,}'.replace(',', ' ') + ' €'


def tete(site, pre, titre, desc):
    e = escape
    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="robots" content="noindex">
<title>{e(titre)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:title" content="{e(titre)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="https://maisonvivat.com/{site['image']}">
<meta name="theme-color" content="#F7F3EC">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{pre}_commun/maison.css?v={CSS_V}">
<style>:root{{--accent:{site['accent']}}}</style>
</head>
<body>"""


def pied(site, pre):
    e = escape
    maisons = '\n'.join(f'''        <li><a href="{pre}{s['dossier'] + '/' if s['dossier'] else ''}index.html"{' aria-current="page"' if s is site else ''}>{e(s['nom'])}</a></li>''' for s in SITES)
    espace = f'<li><a href="{pre}espace/#tableau">Essayer l\'espace mariage</a></li>' if site['cle'] == 'mariage' else f'<li><a href="{pre}index.html">Nos mariages</a></li>'
    accueil = f"{pre}{site['dossier'] + '/' if site['dossier'] else ''}index.html"
    return f"""<footer class="pied"><div class="conteneur">
  <div><b>{e(MARQUE)}</b><p>L'art de recevoir, dès l'invitation. Tout se fait en ligne ; nous répondons par écrit sous 24 heures.</p></div>
  <div><h4>Nos maisons</h4><ul>
{maisons}
  </ul></div>
  <div><h4>Pour vous</h4><ul><li><a href="{pre}creer/?evt={site['cle']}">{e(site['cta'])}</a></li>{espace}<li><a href="{pre}app/organisateur.html">Mon espace (déjà client)</a></li><li><a href="{accueil}#formules">Formules</a></li><li><a href="{accueil}#assistance">Assistance</a></li></ul></div>
  <p class="mention"><a href="{pre}mentions-legales/index.html">Mentions légales</a> · <a href="{pre}confidentialite/index.html">Confidentialité</a> · <a href="{pre}cgv/index.html">CGV</a> · démonstrations : personnes et lieux fictifs, photos Pexels</p>
</div></footer>
<script>
  // Apparitions au défilement, et boutons de démonstration.
  const vu = new IntersectionObserver(es => es.forEach(x => {{ if (x.isIntersecting) {{ x.target.classList.add('vu'); vu.unobserve(x.target); }} }}), {{ rootMargin: '0px 0px -8% 0px' }});
  document.querySelectorAll('.revele').forEach(el => vu.observe(el));
  document.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.demo).style.display = 'block'));
</script>
</body>
</html>
"""


def page(site, modeles):
    pre = '../' if site['dossier'] else ''
    par_slug = {m['slug']: m for m in modeles}
    e = escape
    creer = f"{pre}creer/?evt={site['cle']}"

    def oeuvre(slug):
        m = par_slug[slug]
        site_m = SITE_DU_MODELE.get(slug)
        lien_site = f'<a class="lien-site" href="{pre}app/fp.html?demo={site_m}&amp;f=site" target="_blank" rel="noopener">Voir le site de cette collection</a>' if site_m else ''
        return f"""        <div class="revele"><a class="oeuvre" href="{pre}{slug}/index.html">
          <div class="cadre"><img src="{pre}{slug}/photo.jpg" alt="Collection {e(m['modele'])}" loading="lazy"></div>
          <span class="etq">{e(m['culture'])}</span>
          <h4>{e(m['modele'])}</h4>
          <span class="ouvrir">Ouvrir l'invitation</span>
        </a>{lien_site}</div>"""

    groupes = []
    for titre, texte, slugs in site['groupes']:
        slugs = [s for s in slugs if s in par_slug]
        tg = f'<div class="groupe-tete"><h3>{e(titre)}</h3><p>{e(texte)}</p></div>' if titre else ''
        groupes.append(f'      <div class="groupe">{tg}\n      <div class="oeuvres">\n' + '\n'.join(oeuvre(s) for s in slugs) + '\n      </div></div>')

    espace = '\n'.join(f'      <article class="revele"><h3>{e(t)}</h3><p>{e(p)}</p></article>' for t, p in site['espace'])
    # Directions du moteur pour cet événement (le mariage renvoie au catalogue complet, trop long pour cette page).
    miennes = [t for t in THEMES if t['evt'] == site['cle']]
    catalogue = '' if site['cle'] == 'mariage' else f"""      <div class="groupe">{'<div class="groupe-tete"><h3>Directions artistiques</h3><p>Chacune a sa couverture, son programme et son rythme ; toutes existent en invitation, en annonce et en site.</p></div>' if site['groupes'] else ''}
      <div class="catalogue">""" + ''.join(f"""
        <div class="vignette-cat revele"><a href="{pre}app/fp.html?demo={t['id']}" target="_blank" rel="noopener"><img src="{pre}collections/apercus/{t['id']}-fp.jpg" alt="{e(t['nom'])}" loading="lazy"></a>
          <span class="etq">{e(t['culture'])}</span><b>{e(t['nom'])}</b>
          <span class="liens-cat"><a href="{pre}app/fp.html?demo={t['id']}" target="_blank" rel="noopener">Invitation</a><a href="{pre}app/fp.html?demo={t['id']}&amp;f=std" target="_blank" rel="noopener">Annonce</a><a href="{pre}app/fp.html?demo={t['id']}&amp;f=site" target="_blank" rel="noopener">Site</a></span></div>""" for t in miennes) + """
      </div></div>"""
    moments = []
    for moment in ('Avant', 'Le jour J', 'Après'):
        lignes = '\n'.join(f"""        <li class="option"><div><h4>{e(n)}{' <span class="etoile" title="Pensé pour les familles réparties entre plusieurs pays">✦</span>' if d else ''}</h4><p>{e(t)}</p></div><span class="tarif">{prix(p)}</span></li>"""
                           for k, mo, n, t, p, d in site['options'] if mo == moment)
        if lignes:
            moments.append(f'      <div class="moment revele"><h3>{e(moment)}</h3><ul>\n{lignes}\n      </ul></div>')
    a_etoile = any(o[5] for o in site['options'])
    # L'accueil ne montre que quelques options phares ; la liste complète se déplie, et reste sur la page de commande.
    phares = [o for o in site['options'] if o[0] in ('savethedate', 'qr', 'direct', 'murphoto', 'album')][:4]
    selection = '\n'.join(f"""        <div class="phare-opt revele"><span class="etq">{e(mo)}</span><h4>{e(n)}</h4><p>{e(t)}</p><span class="tarif">{prix(p)}</span></div>"""
                          for k, mo, n, t, p, d in phares)
    formules = '\n'.join(f"""      <div class="formule{' phare' if k == 1 else ''} revele"><h3>{e(n)}</h3><p class="prix">{prix(p)}</p>
        <ul>{''.join(f'<li>{e(x)}</li>' for x in lst)}</ul><a class="btn{'' if k == 1 else ' clair'}" href="{creer}&amp;formule={k}" style="margin-top:auto">Choisir {e(n)}</a></div>""" for k, (n, p, inc, lst) in enumerate(site['formules']))
    essai = f'<a class="btn clair" href="{pre}{site["essai"][0]}">{e(site["essai"][1])}</a>' if site['essai'] else f'<a class="btn clair" href="#collections">Voir les collections</a>'
    nav_essai = f'<a href="{pre}espace/#tableau">Démonstration</a>' if site['cle'] == 'mariage' else ''

    return tete(site, pre, f"{MARQUE} · {site['nom']}", site['sous']) + f"""
<header class="entete"><div class="conteneur">
  <a class="marque" href="#haut"><b>{e(MARQUE)}</b><span>{e(site['nom'])}</span></a>
  <nav class="nav" aria-label="Sections"><a href="#espace">L'espace</a><a href="#options">Options</a><a href="#collections">Collections</a><a href="#formules">Formules</a>{nav_essai}<a href="{pre}app/organisateur.html">Mon espace</a>{'<a href="en/" lang="en">EN</a>' if site['cle'] == 'mariage' else ''}<a class="rdv" href="{creer}">{e(site['cta'])}</a></nav>
</div></header>

<main id="haut">
  <div class="conteneur ouverture">
    <div class="revele">
      <span class="etq">L'art de recevoir · {e(site['nom'])}</span>
      <h1>{site['h1']}</h1>
      <p>{e(site['sous'])}</p>
      <div class="actions"><a class="btn" href="{creer}">{e(site['cta'])}</a>{essai}</div>
      <p class="rassure">Gratuit jusqu'à la publication : vous préparez tout, vous ne payez qu'au moment d'envoyer le lien à vos invités.</p>
    </div>
    <div class="arche revele"><img src="{pre}{site['image']}" alt="" fetchpriority="high"></div>
  </div>

  <section class="manifeste"><div class="conteneur revele">
    <span class="etq">L'art de recevoir</span>
    <div style="height:22px"></div>
    <blockquote>« {e(site['manifeste'])} »</blockquote>
  </div></section>

  <section id="espace"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">L'espace</span><h2>{e(site['titre_espace'])}</h2></div>
    <div class="fonctions">
{espace}
    </div>
    {f'<p class="note revele"><a href="{pre}espace/#tableau" class="lien-or">Essayer l’espace de démonstration →</a></p>' if site['essai'] else ''}
  </div></section>

  <section class="tarifs" id="options"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Options</span><h2>Quelques options, pour aller plus loin</h2><p>L'invitation est incluse. Ajoutez seulement ce qui compte pour vous ; plusieurs options sont réunies dans les formules.</p></div>
    <div class="phares-opt">
{selection}
    </div>
    <details class="toutes-opt"><summary>Voir les {len(site['options'])} options</summary>
    <div class="moments">
{chr(10).join(moments)}
    </div>
    {'<p class="note"><span class="etoile">✦</span> Pensé pour les familles réparties entre plusieurs pays.</p>' if a_etoile else ''}
    </details>
  </div></section>

  <section id="collections"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Collections</span><h2>{e(site['titre_collections'])}</h2><p>{e(site['intro_collections'])}</p></div>
{chr(10).join(groupes)}
{catalogue}
    <p class="note revele"><a class="btn" href="{pre}collections/index.html{'' if site['cle'] == 'mariage' else '?evt=' + site['cle']}">{f"Voir les {sum(t['evt'] == 'mariage' for t in THEMES)} directions du mariage, en faire-part, save-the-date et site" if site['cle'] == 'mariage' else 'Toutes les directions de la maison'}</a></p>
  </div></section>

  <section><div class="conteneur mesure">
    <img class="revele" src="{pre}{site['image2']}" alt="" loading="lazy">
    <div class="revele">
      <span class="etq">Comment ça marche</span>
      <h2 class="serif" style="font-weight:500;font-size:clamp(34px,4vw,50px);line-height:1.08;margin:14px 0 18px">En ligne, à votre rythme</h2>
      <ol class="etapes">
        <li><div><h3>Composez, gratuitement</h3><p>Choisissez votre collection et préparez tout : invitation, site, invités, plan de table. Rien n'est à payer à cette étape.</p></div></li>
        <li><div><h3>Renseignez</h3><p>Vos prénoms, vos cérémonies, vos langues, vos invités : un questionnaire guidé, à remplir quand vous voulez.</p></div></li>
        <li><div><h3>Voyez</h3><p>Votre invitation se met à jour sous vos yeux : textes, couleurs, musique. Vous modifiez tout, à tout moment, sans attendre personne.</p></div></li>
        <li><div><h3>Publiez et partagez</h3><p>Vous payez une seule fois, au moment de publier, puis envoyez le lien et suivez tout depuis votre espace jusqu'au dernier souvenir.</p></div></li>
      </ol>
    </div>
  </div></section>

{bloc_realisations(site)}{bloc_avis(site)}  <section class="tarifs" id="formules"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Formules</span><h2>Trois formules, des options à l'unité</h2><p>Paiement unique au moment de publier · prix indépendant du nombre d'invités · accès jusqu'à 12 mois après la date · droit de rétractation de 14 jours (voir les CGV).</p></div>
    <div class="formules">
{formules}
    </div>
    <p class="note">Paiement en ligne sécurisé. Toutes les options s'ajoutent aussi à l'unité. TVA non applicable, art. 293 B du CGI.</p>
  </div></section>

  <section class="rendezvous" id="assistance"><div class="conteneur revele">
    {ORN}
    <span class="etq">Assistance</span>
    <h2>Une question ? Nous répondons par écrit</h2>
    <p>Tout se fait en ligne. Si quelque chose bloque, écrivez-nous depuis votre espace : réponse sous 24 heures, sept jours sur sept.</p>
    <a class="btn" href="{creer}">{e(site['cta'])}</a>
  </div></section>
</main>

""" + pied(site, pre)


def page_creer(modeles):
    """Le configurateur commun aux quatre sites : collection, informations, formule, options, total, aperçu."""
    site = SITES[0]
    donnees = {}
    for s in SITES:
        slugs = [x for _, _, ls in s['groupes'] for x in ls]
        donnees[s['cle']] = dict(
            nom=s['nom'], accent=s['accent'], cta=s['cta'], retour=('../' + s['dossier'] + '/' if s['dossier'] else '../') + 'index.html',
            modeles=[dict(slug=m['slug'], nom=m['modele'], culture=m['culture'], a=m['a'], b=m.get('b', ''), titre=m.get('titre_og', ''),
                          img=f"../{m['slug']}/photo.jpg", voir=f"../{m['slug']}/index.html")
                     for sl in slugs for m in modeles if m['slug'] == sl]
                    + [dict(slug=t['id'], nom=t['nom'], culture=t['culture'], a='', b='', titre='', img=f"../collections/apercus/{t['id']}-fp.jpg", voir=f"../app/fp.html?demo={t['id']}", moteur=True)
                       for t in THEMES if t['evt'] == s['cle']],
            exemple={'mariage': 'Awa et Thomas', 'anniversaire': 'Les 40 ans de Nadia', 'bapteme': 'Gabriel', 'gender': 'Fille ou garçon ?', 'naissance': 'Léo'}[s['cle']],
            formules=[dict(nom=n, prix=p, inclus=inc, lignes=l) for n, p, inc, l in s['formules']],
            options=[dict(cle=k, moment=mo, nom=n, texte=t, prix=p if isinstance(p, int) else 0, devis=p == 'devis') for k, mo, n, t, p, d in s['options'] if p is not None])
    js = json.dumps(donnees, ensure_ascii=False)
    return tete(site, '../', f'{MARQUE} · Créer', "Composez votre espace : collection, formule, options, et l'aperçu de votre invitation.") + """
<header class="entete"><div class="conteneur">
  <a class="marque" id="retour" href="../index.html"><b>""" + escape(MARQUE) + """</b><span id="evt-nom">Mariage</span></a>
  <nav class="nav" aria-label="Événement" id="evts"></nav>
</div></header>
<main class="conteneur creer">
  <div class="colonne">
    <span class="etq">Composer</span>
    <h1 class="serif">Votre <em id="h-objet">espace</em>, en quelques minutes</h1>
    <p class="doux">Le prix s'affiche au fur et à mesure. Vous validerez l'aperçu avant toute mise en ligne.</p>

    <h2 class="etape-titre"><span>I</span> La collection</h2>
    <div class="vignettes" id="modeles"></div>

    <h2 class="etape-titre"><span>II</span> Vos informations</h2>
    <div class="champs">
      <label>Prénoms ou titre<input id="f-noms" placeholder="Awa et Thomas"></label>
      <label>Date<input id="f-date" type="date"></label>
      <label class="large">Lieu<input id="f-lieu" placeholder="Domaine des Tilleuls, Montreuil"></label>
    </div>

    <h2 class="etape-titre"><span>III</span> La formule</h2>
    <div class="choix-formules" id="formules"></div>

    <h2 class="etape-titre"><span>IV</span> Les options</h2>
    <div id="options"></div>
  </div>

  <aside class="recap">
    <div class="apercu" id="apercu">
      <div class="apercu-img" id="ap-img"></div>
      <iframe class="apercu-direct" id="ap-direct" title="Aperçu de l'invitation" hidden></iframe>
      <div class="apercu-texte">
        <span class="etq" id="ap-coll"></span>
        <p class="ap-noms" id="ap-noms"></p>
        <p class="ap-date" id="ap-date"></p>
        <p class="ap-lieu" id="ap-lieu"></p>
      </div>
    </div>
    <a class="lien-or" id="ap-voir" href="#" target="_blank" rel="noopener">Ouvrir la collection en entier →</a>
    <div class="total">
      <div class="ligne-total"><span id="t-formule"></span><b id="t-formule-prix"></b></div>
      <div id="t-options"></div>
      <div class="ligne-total grand"><span>Total</span><b id="t-total"></b></div>
    </div>
    <label class="case"><input type="checkbox" id="c-cgv"><span>J'accepte les <a href="../cgv/index.html" target="_blank" rel="noopener">conditions générales de vente</a>.</span></label>
    <label class="case"><input type="checkbox" id="c-debut"><span>Je demande que la réalisation commence tout de suite. Je sais que je perdrai mon droit de rétractation une fois l'invitation validée par moi et mise en ligne.</span></label>
    <button class="btn" type="button" id="b-payer" style="width:100%" disabled>Continuer vers le paiement</button>
    <p class="rassure">Vous créez votre espace, puis vous payez par carte sur la page sécurisée de Stripe.</p>
    <p class="rassure">Sans rendez-vous. Assistance écrite sous 24 heures.</p>
    <p class="rassure">Vos données et celles de vos invités restent en France : <a href="../confidentialite/index.html">confidentialité</a>.</p>
  </aside>
</main>
<script>
const D = """ + js + """;
const q = new URLSearchParams(location.search);
let evt = D[q.get('evt')] ? q.get('evt') : 'mariage', choix = { modele: 0, formule: +q.get('formule') || 0, options: new Set() };
const $ = id => document.getElementById(id), eur = n => n.toLocaleString('fr-FR') + ' €';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function changerEvt(k) {
  evt = k; const E = D[evt]; choix.modele = 0; choix.options.clear();
  if (choix.formule >= E.formules.length) choix.formule = 0;
  document.documentElement.style.setProperty('--accent', E.accent);
  $('evt-nom').textContent = E.nom; $('retour').href = E.retour; $('h-objet').textContent = evt === 'mariage' ? 'espace' : evt === 'naissance' ? 'faire-part' : 'invitation';
  $('evts').innerHTML = Object.entries(D).map(([c, x]) => `<a href="?evt=${c}" data-evt="${c}" ${c === evt ? 'class="rdv"' : ''}>${esc(x.nom)}</a>`).join('');
  const m0 = E.modeles[0]; $('f-noms').placeholder = m0.b ? `${m0.a} et ${m0.b}` : (m0.titre || m0.a || E.exemple);
  history.replaceState(null, '', `?evt=${evt}`);
  rendre();
}
function rendre() {
  const E = D[evt], F = E.formules[choix.formule], m = E.modeles[choix.modele];
  $('modeles').innerHTML = E.modeles.map((x, i) => `<button type="button" class="vignette ${i === choix.modele ? 'choisie' : ''}" data-modele="${i}"><img src="${x.img}" alt="" loading="lazy"><span>${esc(x.nom)}</span></button>`).join('');
  $('formules').innerHTML = E.formules.map((f, i) => `<button type="button" class="choix-formule ${i === choix.formule ? 'choisie' : ''}" data-formule="${i}"><b>${esc(f.nom)}</b><span>${eur(f.prix)}</span><small>${esc(f.lignes.slice(0, 3).join(' · '))}</small></button>`).join('');
  const moments = [...new Set(E.options.map(o => o.moment))];
  $('options').innerHTML = moments.map(mo => `<h3 class="moment-titre">${esc(mo)}</h3>` + E.options.filter(o => o.moment === mo).map(o => {
    const inclus = F.inclus.includes(o.cle), coche = inclus || choix.options.has(o.cle);
    return `<label class="choix-option ${inclus ? 'inclus' : ''}"><input type="checkbox" data-option="${o.cle}" ${coche ? 'checked' : ''} ${inclus || o.devis ? 'disabled' : ''}><span><b>${esc(o.nom)}</b><small>${esc(o.texte)}</small></span><em>${inclus ? 'Inclus' : o.devis ? 'Sur devis' : '+ ' + eur(o.prix)}</em></label>`;
  }).join('')).join('');
  // Aperçu : la photo de la collection, vos prénoms, votre date, votre lieu
  const noms = $('f-noms').value.trim() || $('f-noms').placeholder, d = $('f-date').value;
  $('ap-img').style.backgroundImage = `url('${m.img}')`;
  $('ap-coll').textContent = 'Collection ' + m.nom;
  $('ap-noms').textContent = noms;
  const longue = d ? new Date(d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'La date de votre événement';
  $('ap-date').textContent = longue.charAt(0).toUpperCase() + longue.slice(1);
  $('ap-lieu').textContent = $('f-lieu').value.trim() || $('f-lieu').placeholder;
  $('ap-voir').href = m.voir;
  // Direction du moteur : l'aperçu est l'invitation elle-même, à vos prénoms, votre date et votre lieu (mise à jour après la frappe).
  $('ap-direct').hidden = !m.moteur; $('ap-img').hidden = !!m.moteur; document.querySelector('.apercu-texte').hidden = !!m.moteur;
  if (m.moteur) {
    const src = `../app/fp.html?demo=${m.slug}&sans-ouverture&titre=${encodeURIComponent($('f-noms').value.trim())}&date=${encodeURIComponent(d)}&lieu=${encodeURIComponent($('f-lieu').value.trim())}`;
    clearTimeout(rendre.minuteur); rendre.minuteur = setTimeout(() => { if ($('ap-direct').getAttribute('src') !== src) $('ap-direct').src = src; }, 350);
  }
  // Total
  const extras = E.options.filter(o => choix.options.has(o.cle) && !F.inclus.includes(o.cle));
  $('t-formule').textContent = 'Formule ' + F.nom; $('t-formule-prix').textContent = eur(F.prix);
  $('t-options').innerHTML = extras.map(o => `<div class="ligne-total"><span>${esc(o.nom)}</span><b>+ ${eur(o.prix)}</b></div>`).join('');
  $('t-total').textContent = eur(F.prix + extras.reduce((s, o) => s + o.prix, 0));
}
document.addEventListener('click', ev => {
  const e2 = ev.target.closest('[data-evt]'); if (e2) { ev.preventDefault(); return changerEvt(e2.dataset.evt); }
  const mo = ev.target.closest('[data-modele]'); if (mo) { choix.modele = +mo.dataset.modele; return rendre(); }
  const fo = ev.target.closest('[data-formule]'); if (fo) { choix.formule = +fo.dataset.formule; return rendre(); }
  const de = ev.target.closest('[data-demo]'); if (de) $(de.dataset.demo).style.display = 'block';
});
document.addEventListener('change', ev => { const o = ev.target.closest('[data-option]'); if (o) { o.checked ? choix.options.add(o.dataset.option) : choix.options.delete(o.dataset.option); rendre(); } });
['f-noms', 'f-date', 'f-lieu'].forEach(id => $(id).addEventListener('input', rendre));
// Le paiement n'est possible qu'après acceptation des CGV (la seconde case est facultative : sans elle, la réalisation attend la fin du délai de rétractation).
$('c-cgv').addEventListener('change', e => $('b-payer').disabled = !e.target.checked);
// Vers l'espace : création du compte et de l'événement, puis paiement avec la formule et les options choisies.
$('b-payer').addEventListener('click', () => {
  const E2 = D[evt], F = E2.formules[choix.formule], opts = [...choix.options].filter(o => !F.inclus.includes(o));
  location.href = `../app/organisateur.html?nouveau=${evt}&formule=${encodeURIComponent(F.nom.toLowerCase())}&options=${encodeURIComponent(opts.join(','))}`;
});
changerEvt(evt);
const depart = D[evt].modeles.findIndex(x => x.slug === q.get('modele'));
if (depart > 0) { choix.modele = depart; rendre(); }
history.replaceState(null, '', `?evt=${evt}` + (choix.formule ? `&formule=${choix.formule}` : ''));
</script>
</body>
</html>
"""


def page_collections(modeles=()):
    """Catalogue : d'abord les collections faites main (Grand Hôtel et Héritage en tête), puis toutes les directions
    artistiques du moteur, lues depuis app/themes.js : trois formats, filtres par famille."""
    site = SITES[0]
    n = len(THEMES)
    par_slug = {m['slug']: m for m in modeles}
    e = escape

    def carte(slug, une):
        m = par_slug[slug]
        badge = '<span class="badge-une">À la une</span>' if une else ''
        return f"""      <a class="vignette-cat main" href="../{slug}/index.html">{badge}
        <img src="../{slug}/photo.jpg" alt="Collection {e(m['modele'])}" loading="lazy">
        <span class="etq">{e(m['culture'])}</span><b>{e(m['modele'])}</b><small>{e(m['da'])}</small></a>"""

    vus, blocs = set(), []
    for x in SITES:
        for titre, texte, slugs in x['groupes']:
            slugs = [g for g in slugs if g in par_slug and g not in vus]
            if not slugs:
                continue
            vus.update(slugs)
            nom = titre if x['cle'] == 'mariage' else f"{x['nom']} · {titre}"
            blocs.append(f'    <h3 class="banque-groupe">{e(nom)}</h3>\n    <div class="catalogue">\n'
                         + '\n'.join(carte(g, titre == 'À la une') for g in slugs) + '\n    </div>')
    nb_main = len(vus)
    faites_main = f"""  <div class="titre-section"><span class="etq">Faites main</span><h2>{nb_main} collections signées</h2>
    <p>Dessinées une à une, avec leur ouverture animée, leur musique, leur site, leur plan de table, leur mur photo et leur livre d'or.</p></div>
{chr(10).join(blocs)}
  <div style="height:72px"></div>
""" if blocs else ""
    nav = ''.join(f'<a href="../{x["dossier"] + "/" if x["dossier"] else ""}index.html">{escape(x["nom"])}</a>' for x in SITES)
    return tete(site, '../', f'{MARQUE} · Collections', f"{n} directions artistiques, chacune en faire-part, save-the-date et site, toutes personnalisables.") + f"""
<header class="entete"><div class="conteneur">
  <a class="marque" href="../index.html"><b>{escape(MARQUE)}</b><span>Collections</span></a>
  <nav class="nav" aria-label="Sites">{nav}<a class="rdv" href="../creer/index.html">Créer</a></nav>
</div></header>
<main class="conteneur" style="padding-top:56px;padding-bottom:96px">
<style>.banque-groupe{{font-family:'Bodoni Moda',serif;font-weight:400;font-size:30px;margin:48px 0 22px}}
.vignette-cat.main{{position:relative}}.vignette-cat.main small{{display:block;margin-top:6px}}
.badge-une{{position:absolute;top:12px;left:12px;z-index:1;background:#A8834A;color:#fff;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:6px 10px}}</style>
{faites_main}  <div class="titre-section"><span class="etq">Directions artistiques</span><h2>{n} directions personnalisables</h2>
    <p>Chacune a sa propre structure : la composition de la couverture, la présentation du programme, le rythme des parties. Toutes existent en faire-part, en save-the-date et en site ; couleurs, polices, photo et parties se changent ensuite dans votre espace, avec un aperçu en direct.</p></div>
  <div class="filtres" id="filtres"></div>
  <div class="bascule" id="bascule"><button data-format="fp" class="actif">Faire-part</button><button data-format="std">Save-the-date</button><button data-format="site">Site</button></div>
  <div class="catalogue" id="catalogue"></div>
</main>
<script type="module">
  import {{ THEMES, FAMILLES, FAMILLES_DE, COUVERTURES, PROGRAMMES }} from '../app/themes.js?v=3';
  const q = new URLSearchParams(location.search);
  let famille = FAMILLES_DE[q.get('evt')]?.length === 1 ? FAMILLES_DE[q.get('evt')][0] : 'tous', format = 'fp';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }})[c]);
  function rendre() {{
    document.getElementById('filtres').innerHTML = [['tous', 'Toutes (' + THEMES.length + ')'], ...Object.entries(FAMILLES).map(([k, v]) => [k, v + ' (' + THEMES.filter(t => t.famille === k).length + ')'])]
      .map(([k, v]) => `<button data-famille="${{k}}" class="${{k === famille ? 'actif' : ''}}">${{v}}</button>`).join('');
    document.getElementById('catalogue').innerHTML = THEMES.filter(t => famille === 'tous' || t.famille === famille).map(t => `
      <a class="vignette-cat" href="../app/fp.html?demo=${{t.id}}${{format === 'fp' ? '' : '&f=' + format}}" target="_blank" rel="noopener">
        <img src="apercus/${{t.id}}-${{format === 'std' ? 'std' : 'fp'}}.jpg" alt="${{esc(t.nom)}}" loading="lazy">
        <span class="etq">${{esc(t.culture)}}</span><b>${{esc(t.nom)}}</b><small>${{esc(COUVERTURES[t.couv])}} · programme en ${{esc(PROGRAMMES[t.prog].toLowerCase())}}</small></a>`).join('');
  }}
  document.addEventListener('click', e => {{
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.famille) {{ famille = b.dataset.famille; rendre(); }}
    if (b.dataset.format) {{ format = b.dataset.format; document.querySelectorAll('[data-format]').forEach(x => x.classList.toggle('actif', x === b)); rendre(); }}
  }});
  rendre();
</script>
""" + pied(site, '../')


def tarifs():
    """Grille de prix unique, lue par l'espace (affichage) et par le serveur de paiement (montant facturé)."""
    def site(cle):
        s = next(x for x in SITES if x['cle'] == cle)
        return dict(
            formules={n.lower(): dict(nom=n, prix=p, inclus=inc) for n, p, inc, _ in s['formules']},
            options={k: dict(nom=n, prix=p) for k, mo, n, t, p, d in s['options'] if isinstance(p, int)})
    return dict(devise='eur', mariage=site('mariage'), evenement=site('anniversaire'))


# Collections créées directement en suite réaliste (realiste/suite.py), sans ancienne page faite main.
REALISTES = [
    dict(slug='grand-hotel', modele='Grand Hôtel', culture='Signature · palace parisien', da="Enveloppe de coton au cachet de cire, lustre de cristal et guirlande de roses blanches", a='Éléonore', b='Gabriel'),
    dict(slug='heritage', modele='Héritage', culture='Signature · Afrique de l’Ouest', da="Pochette de kente tissé, fermoir d'or, wax et fleurs tropicales", a='Efua', b='Kojo'),
    dict(slug='gatsby', modele='Gatsby', culture='Intemporel · années folles', da="Portes laquées noir et or qui s'ouvrent, plumes, perles et jazz", a='Chloé', b='Adrien'),
    dict(slug='emeraude', modele='Émeraude', culture='Intemporel · soirée précieuse', da="Écrin de velours émeraude qui s'ouvre, orchidées blanches et or, sous une verrière", a='Jade', b='Malik'),
    dict(slug='bordeaux', modele='Bordeaux', culture='Intemporel · vignoble', da="Enveloppe couleur de vin au sceau de la vigne, château et rangs d'automne", a='Camille', b='Yanis'),
    dict(slug='chapelle', modele='Chapelle', culture='Intemporel · bord de mer', da="Portes de chapelle qui s'ouvrent, arche de fleurs blanches et bleues, au-dessus des vagues", a='Naomi', b='Jérémie'),
    dict(slug='faubourg', modele='Faubourg', culture='Intemporel · Paris', da="Porte cochère laquée noire, toits de zinc au soleil couchant vus d'un balcon en fer forgé", a='Inès', b='Thomas'),
    dict(slug='ivoire', modele='Ivoire', culture='Intemporel · broderie', da="Volets brodés de perles qui s'ouvrent, branches en relief dans les coins, papier gaufré", a='Clarisse', b='Daniel'),
    dict(slug='porcelaine', modele='Porcelaine', culture='Intemporel · faïence', da="Cabinet de porcelaine peint en bleu de cobalt qui s'ouvre, cartouche festonné autour des prénoms", a='Joanne', b='Malick'),
    dict(slug='marine', modele='Marine', culture='Intemporel · aquarelle', da="Enveloppe de papier coton aux vagues peintes, sceau coquillage, phare et voiliers à l'aquarelle", a='Salomé', b='Ibrahim'),
    dict(slug='soie', modele='Soie', culture='Intemporel · dessin à l’encre', da="Paravent de soie peint à l'encre qui se déplie, glycine dessinée le long de la carte", a='Adèle', b='Kwame'),
    dict(slug='monogramme', modele='Monogramme', culture='Intemporel · papier découpé', da="Portail de papier ciselé, diorama de trois feuilles découpées, silhouettes et monogramme doré", a='Lina', b='Gabriel'),
    dict(slug='karabela', modele='Karabela', culture='Karabela · robe quadrille', da="Enveloppe de chambray bordée de dentelle, fermée d'un hibiscus ; broderie anglaise et fleurs tropicales autour de la carte", a='Fabienne', b='Stanley'),
    dict(slug='qunkwa', modele='Qun kwa', culture='Qun kwa · cérémonie du thé', da="Enveloppe de soie rouge brodée d'un phénix, nœud chinois ; dragon et phénix d'or face à face", a='Ka-Yan', b='Jonathan'),
    dict(slug='adinkra', modele='Adinkra', culture='Adinkra · symboles akan', da="Enveloppe ivoire au sceau du cœur, symboles Akoma et Nkonsonkonson qui s'impriment comme au tampon, flamboyants", a='Akosua', b='Kwame'),
    dict(slug='bazin', modele='Bazin', culture='Bazin riche · grand boubou', da="Enveloppe de bazin turquoise au médaillon de filigrane d'or, drapé de bazin traversé d'un reflet de lumière, roses du désert", a='Claire', b='Mamadou'),
    dict(slug='kreyol', modele='Kreyòl', culture='Kreyòl · « Krik ? Krak ! »', da="Livre de contes qui s'ouvre, case créole en papier qui se déplie comme un livre animé, anthuriums et colibri", a='Maëlle', b='Jordan'),
    dict(slug='ndop', modele='Ndop', culture='Ndop · indigo royal', da="Portes sculptées de chefferie, tentures d'indigo aux motifs blancs qui se balancent, fleurs blanches", a='Ornella', b='Landry'),
    dict(slug='liputa', modele='Liputa', culture='Liputa · pagne et rumba', da="Enveloppe en wax au nœud de pagne, échantillons de pagne qui flottent autour de la carte, roses de porcelaine", a='Merveille', b='Glody'),
    dict(slug='imbali', modele='Imbali', culture='Perlage zoulou · umabo', da="Enveloppe violette au sceau perlé, prénoms au cœur d'un collier de perles qui tourne lentement, protéas royales", a='Zanele', b='Sipho'),
    dict(slug='lehenga', modele='Lehenga', culture='Lehenga · varmala et mandap', da="Portes de haveli rose indien, toran d'œillets d'Inde et fils de jasmin qui se balancent", a='Priya', b='Arjun'),
    dict(slug='shiromuku', modele='Shiromuku', culture='Shiromuku · cérémonie shintō', da="Enveloppe de washi au nœud de mizuhiki, fenêtre ronde ouverte sur un jardin de cerisiers, branche peinte", a='Yui', b='Haruto'),
    dict(slug='aodai', modele='Áo dài', culture='Áo dài · lotus', da="Portes laquées à la feuille d'or, étang de lotus peint sur soie, libellule et reflet sur l'eau", a='Linh', b='Thomas'),
    dict(slug='hanbok', modele='Hanbok', culture='Hanbok · pyebaek', da="Portes de hanok tendues de papier hanji, branche de prunier et de mugunghwa en diagonale, céladon", a='Ji-woo', b='Julien'),
    dict(slug='lanternes', modele='Lanternes', culture='Intemporel · nuit au bord de l’eau', da="Enveloppe bleu nuit semée d'étoiles d'or, lac à l'heure bleue et lanternes qui montent dans le ciel", a='Aïcha', b='Hugo'),
    dict(slug='opera', modele='Opéra', culture='Intemporel · grand soir', da="Rideau de velours rouge qui se lève, lustres de cristal et bal masqué", a='Victoria', b='Samuel'),
    dict(slug='versailles', modele='Versailles', culture='Intemporel · royal', da="Enveloppe bleu poudré à bordure baroque et sceau du soleil", a='Joséphine', b='Arthur'),
]


def construire_sites(modeles, racine):
    modeles = list(modeles) + [m for m in REALISTES if m['slug'] not in {x['slug'] for x in modeles}]
    visibles = [m for m in modeles if (racine / m['slug'] / 'photo.jpg').exists()]
    # Grille de prix : pour l'espace (app/tarifs.json) et pour les fonctions de paiement (backend/functions/tarifs.json).
    grille = json.dumps(tarifs(), ensure_ascii=False, indent=1)
    (racine / 'app' / 'tarifs.json').write_text(grille, encoding='utf-8')
    # Photothèque de l'éditeur : les lieux, fonds et ambiances des collections, que l'organisateur peut reprendre.
    biblio = []
    for m in visibles:
        for fichier, cat in (('lieu.webp', 'Lieux'), ('fond.jpg', 'Matières et fonds'), ('photo.jpg', 'Ambiances')):
            if (racine / m['slug'] / fichier).exists():
                biblio.append(dict(src=f"../{m['slug']}/{fichier}", cat=cat, nom=m['modele']))
    (racine / 'app' / 'phototheque.json').write_text(json.dumps(biblio, ensure_ascii=False, indent=0), encoding='utf-8')
    fonctions = racine.parent / 'backend' / 'functions'
    if fonctions.exists():
        (fonctions / 'tarifs.json').write_text(grille, encoding='utf-8')
    for site in SITES:
        dossier = racine / site['dossier'] if site['dossier'] else racine
        dossier.mkdir(exist_ok=True)
        (dossier / 'index.html').write_text(page(site, visibles), encoding='utf-8')
        print('site ok', site['cle'])
    (racine / 'creer').mkdir(exist_ok=True)
    (racine / 'creer' / 'index.html').write_text(page_creer(visibles), encoding='utf-8')
    print('creer ok')
    (racine / 'collections').mkdir(exist_ok=True)
    (racine / 'collections' / 'index.html').write_text(page_collections(visibles), encoding='utf-8')
    print('collections ok')
    import sys, legal
    legal.construire_legal(sys.modules[__name__], racine)


def site_de(modele):
    """Adresse (depuis le dossier d'un modèle) du site auquel il appartient."""
    evt = modele.get('evenement', 'mariage')
    s = next(s for s in SITES if evt in s['evenements'])
    return s, ('../' + s['dossier'] + '/' if s['dossier'] else '../') + 'index.html#collections'


DEBUT, FIN = '<!-- maison:debut -->', '<!-- maison:fin -->'


def pied_modele(modele, chemin):
    """Barre de bas de page commune sous chaque invitation : retour à sa collection, choix de la collection, liens vers les quatre sites.
    Entre deux balises de commentaire, pour pouvoir la régénérer sans toucher au reste de la page."""
    site, retour = site_de(modele)
    liens = ' · '.join(f'''<a href="../{s['dossier'] + '/' if s['dossier'] else ''}index.html" style="color:#BDB4A7;text-decoration:none">{escape(s['nom'])}</a>''' for s in SITES)
    bloc = f'''{DEBUT}
<nav aria-label="{escape(MARQUE)}" style="position:relative;z-index:40;background:#1E1B18;color:#BDB4A7;text-align:center;padding:26px 16px 30px;font:300 13px/1.9 Inter,system-ui,sans-serif;letter-spacing:.04em">
  <a href="{retour}" style="color:#F7F3EC;text-decoration:none;font:italic 400 20px/1.4 'Bodoni Moda',Georgia,serif;letter-spacing:0">← {escape(MARQUE)} · {escape(site['nom'])}</a><br>
  <a href="../creer/?evt={site['cle']}&amp;modele={modele['slug']}" style="display:inline-block;margin:10px 0 14px;color:#1E1B18;background:#F7F3EC;text-decoration:none;padding:9px 18px;font-size:12px;letter-spacing:.14em;text-transform:uppercase">{escape(site['cta'])} avec cette collection</a><br>
  <span style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#8B8378">Nos maisons</span><br>{liens}
</nav>
{FIN}'''
    html = chemin.read_text(encoding='utf-8')
    if DEBUT in html:
        html = html[:html.index(DEBUT)] + bloc + html[html.index(FIN) + len(FIN):]
    else:
        i = html.rindex('</body>')
        html = html[:i] + bloc + '\n' + html[i:]
    chemin.write_text(html, encoding='utf-8', newline='')
