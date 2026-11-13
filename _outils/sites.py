"""Les quatre sites de la maison : mariage (racine), anniversaires, baptêmes, gender reveal.
Offre 100 % en ligne : le client compose son espace (formule + options), voit l'aperçu, paie, valide ;
contact écrit seulement en cas de besoin. Le faire-part est une option de l'espace, pas le produit.
Chaque site tient seul et le pied de page les relie. Appelé par construire.py après les aperçus."""
import os
RACINE_MINI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import json
import math
from html import escape
from emotions import EMOTIONS

MARQUE = 'Maison Vivat'   # domaine maisonvivat.com (acheté le 08/11/2026)
CSS_V = 18               # augmenter à chaque modification de _commun/maison.css (cache GitHub Pages)

ORN = '<svg class="orn" viewBox="0 0 120 14" aria-hidden="true"><path d="M0 7h50M70 7h50" stroke="currentColor" stroke-width=".8"/><path d="M60 1l6 6-6 6-6-6z" fill="none" stroke="currentColor" stroke-width=".8"/></svg>'

# Options : clé, moment, nom, description, prix (None = inclus, 'devis' = sur devis), pensé pour la diaspora
OPTIONS_MARIAGE = [
  ('fairepart', 'Avant', "L'invitation", "Cinquante collections réalistes, chacune avec son ouverture, sa mise en page et sa musique : invitation, save-the-date et site, à vos couleurs.", None, False),
  ('savethedate', 'Avant', 'Save-the-date animé', "L'annonce envoyée des mois avant, pour que chacun bloque la date.", 30, False),
  ('musique', 'Avant', 'Musique au choix', "La musique démarre à l'ouverture de l'invitation : celle de la collection, une autre de notre bibliothèque ou la vôtre.", 15, False),
  ('ceremonies', 'Avant', 'Invitations par cérémonie', "Coutumier ou dot, mairie, église, soirée : chaque invité ne reçoit que ce à quoi il est convié.", 40, True),
  ('guide', 'Avant', 'Guide de la cérémonie', "La dot, le coutumier, les rites expliqués aux invités d'une autre culture.", 30, True),
  ('covoiturage', 'Avant', 'Covoiturage entre invités', "Qui a de la place, qui en cherche : chaque invité indique son point de départ et voit d'abord les trajets qui partent près de chez lui.", 15, False),
  ('etranger', 'Avant', "Invités venus de l'étranger", "Dates d'arrivée, hébergement, navettes et lettre d'invitation pour le visa.", 40, True),
  ('portrait', 'Avant', 'Portrait illustré du couple', "À partir de votre photo, vous deux dessinés à l'aquarelle dans l'univers de votre collection, puis repris sur l'invitation, le site et les remerciements. Une retouche incluse.", 60, True),
  ('tenues', 'Avant', 'Tenues coordonnées', "Aso ebi, pagne de famille : qui porte quel tissu, les tailles, qui a réglé.", 40, True),
  ('langue', 'Avant', 'Langue supplémentaire', "Quatorze langues, de l'anglais à l'arabe, au chinois ou au swahili : le site et l'invitation dans la langue de chacun.", 20, False),
  ('qr', 'Le jour J', "Contrôle d'entrée par QR code", "Chaque invité a son code. Seuls les invités entrent, même à trois cents.", 50, True),
  ('direct', 'Le jour J', 'Direct privé pour les proches qui ne peuvent pas venir', "La cérémonie en direct, sur un lien réservé à vos invités.", 40, True),
  ('deroule', 'Le jour J', 'Déroulé en direct', "Le programme de la journée sur le téléphone de chacun, avec des rappels.", 20, False),
  ('murphoto', 'Le jour J', 'Mur photo en direct', "Les invités ajoutent leurs photos sans application, elles s'affichent pendant la fête.", 30, False),
  ('livredor', 'Le jour J', "Livre d'or vidéo et audio", "Des messages enregistrés pendant la fête, à réécouter des années plus tard.", 30, False),
  ('jeux', 'Le jour J', 'Jeux des invités', "Quiz sur les mariés et pronostics, depuis le téléphone de chacun, puis révélation et classement.", 20, False),
  ('album', 'Après', 'Album partagé', "Les photos des invités et du photographe, réunies en haute définition.", 30, False),
  ('merci', 'Après', 'Remerciements personnalisés', "Une carte pour chaque invité, avec une photo où il apparaît.", 30, False),
  ('livre', 'Après', 'Livre souvenir imprimé', "Les photos et les mots de vos invités, imprimés et reliés.", 'devis', False),
]
OPTIONS_EVENEMENT = [
  ('fairepart', 'Avant', "L'invitation", "Au moins dix directions artistiques, chacune avec sa propre ouverture et sa propre mise en page, reprise à vos couleurs.", None, False),
  ('musique', 'Avant', 'Musique au choix', "La musique démarre à l'ouverture de l'invitation : celle de la collection, une autre de notre bibliothèque ou la vôtre.", 15, False),
  ('langue', 'Avant', 'Langue supplémentaire', "L'invitation et la page dans la langue de chacun.", 20, False),
  ('direct', 'Le jour J', 'Direct privé pour les proches', "Le moment en direct, sur un lien réservé à vos invités.", 40, True),
  ('murphoto', 'Le jour J', 'Mur photo en direct', "Les invités ajoutent leurs photos sans application.", 30, False),
  ('livredor', 'Le jour J', "Livre d'or vidéo et audio", "Des messages enregistrés pendant la fête.", 30, False),
  ('jeux', 'Le jour J', 'Jeux et pronostics', "Quiz, pronostics, votes : les invités jouent sur leur téléphone.", 20, False),
  ('album', 'Après', 'Album partagé', "Toutes les photos réunies en haute définition.", 30, False),
  ('merci', 'Après', 'Remerciements personnalisés', "Une carte pour chaque invité, avec une photo où il apparaît.", 30, False),
]

# Formules : nom, prix, options incluses, lignes affichées
# Prix de lancement de la formule Faire-part : 39 € pour les 50 premiers couples, jusqu'au 30 novembre 2026 inclus, puis 79 €.
# On annonce le prix à venir (« puis 79 € »), jamais un faux prix barré : la formule n'a encore jamais été vendue 79 €.
# Lancement : moitié prix sur les trois formules mariage pour les 50 premiers couples, jusqu'au 30 novembre 2026 inclus.
# On annonce le prix qui suivra (« puis 190 € »), jamais un faux prix barré : ces prix n'ont encore jamais été pratiqués.
# Les options suivent la même remise (choix de Parnel, 12/11) : -50 % sur les options prises avec la formule au prix de lancement.
LANCEMENT = dict(jusqu='2026-12-01T00:00:00+01:00', places=50, prix={'Faire-part': 39, 'Signature': 95, 'Prestige': 195}, options=0.5)
def opt_lancement(p):
    return math.ceil(p * LANCEMENT['options'])
def lancement(n, p):
    return dict(prix=LANCEMENT['prix'][n], jusqu=LANCEMENT['jusqu'], places=LANCEMENT['places'], options=LANCEMENT['options'],
                texte=f"{LANCEMENT['prix'][n]} € pour les 50 premiers couples, jusqu’au 30 novembre, puis {p} €") if n in LANCEMENT['prix'] else None
FORMULES_MARIAGE = [
  ('Faire-part', 79, [], ["L'invitation animée de la collection, à vos prénoms", "Les réponses de vos invités, réunies pour vous", "La version à imprimer incluse", "Passage à une formule supérieure à tout moment, en payant la différence"]),
  ('Signature', 190, ['ceremonies', 'savethedate'], ["Tout le Faire-part", "Le site du mariage, liste de cadeaux et cagnotte", "Save-the-date et invitations par cérémonie", "Plan de table, budget, planning et prestataires", "Deux langues"]),
  ('Prestige', 390, ['ceremonies', 'savethedate', 'qr', 'murphoto', 'livredor', 'album', 'langue', 'direct', 'covoiturage', 'musique'], ["Tout le Signature", "Contrôle d'entrée par QR code", "Mur photo, livre d'or et album", "Direct privé pour les proches qui ne peuvent pas venir", "Covoiturage entre invités et musique au choix", "Trois langues"]),
]
FORMULES_EVENEMENT = [
  ('Essentiel', 49, [], ["L'invitation de la collection, à vos couleurs", "La page de l'événement et les réponses", "Envois et rappels aux invités, en un geste"]),
  ('Signature', 99, ['murphoto', 'livredor', 'langue'], ["Tout l'Essentiel", "Mur photo et livre d'or", "Trois langues"]),
  ('Prestige', 190, ['murphoto', 'livredor', 'langue', 'direct', 'album', 'merci', 'jeux'], ["Tout le Signature", "Direct privé pour les proches", "Album, jeux et remerciements personnalisés", "Ouverture retravaillée pour vous"]),
]

SITES = [
  dict(cle='mariage', dossier='', nom='Mariage', accent='#A8834A', evenements=('mariage',),
    image='lanternes/photo.jpg', video='lanternes/ouverture.mp4', image2='orangerie/photo.jpg',
    titre_page="L'espace de votre mariage",
    h1="Plusieurs cérémonies, des invités venus de partout : <em>un seul lien</em>",
    sous="Une invitation qui s'ouvre comme une vraie enveloppe, en musique. Chaque invité ne reçoit que les cérémonies auxquelles il est convié, dans sa langue, et répond en un geste. Sans publicité.",
    cta='Créer mon espace', essai=('espace/#tableau', "Essayer l'espace"),
    manifeste="Recevoir, c'est penser à chacun, qu'il vienne de la rue d'à côté ou de l'autre bout du monde. Votre espace s'occupe d'eux ; vous profitez de votre journée.",
    titre_espace="Pensé pour les mariages qui rassemblent",
    espace=[('Une invitation qui s\'ouvre', "Enveloppe, portes, rideau qui se lève : l'ouverture, la musique et la direction artistique de votre collection, à vos prénoms."),
            ('Chaque cérémonie, ses invités', "Dot, coutumier, mairie, église, soirée : chacun ne reçoit que ce à quoi il est convié, et répond pour chaque moment."),
            ('Dans la langue de chacun', "Français, anglais, espagnol, portugais, italien, allemand, néerlandais, turc, arabe, chinois, vietnamien, swahili, yoruba, créole haïtien : l'invitation et le site jusqu'à trois langues."),
            ('Les invités venus de loin', "Dates d'arrivée, hébergement, lettre pour le visa, covoiturage depuis chez eux, et un direct privé pour ceux qui ne peuvent pas venir."),
            ('Le jour J, fluide', "Contrôle d'entrée par QR code, mur photo et livre d'or vidéo, sans application à installer."),
            ('Envoyé par vous, au prénom de chacun', "Chaque invitation et chaque relance part de votre WhatsApp, de vos SMS ou de votre messagerie. Aucune publicité, ni pour vous ni pour vos invités."),
            ('Et l\'organisation, en prime', "Réponses, plan de table, budget, planning, liste et cagnotte sont inclus, sans supplément. Maison Vivat ne touche jamais l'argent.")],
    options=OPTIONS_MARIAGE, formules=FORMULES_MARIAGE,
    intro_collections="L'invitation donne le ton de votre réception. Chaque collection a sa direction artistique ; nous la reprenons à vos couleurs, à vos prénoms, à votre langue.",
    titre_collections='Cinquante collections, autant de façons de recevoir',
    # ordre alterné : deux collections voisines ne s'ouvrent pas de la même façon (livre, enveloppe, portes, papillon…)
    groupes=[('À la une', "Nos collections signatures : le faste d'un palace parisien, des lanternes qui s'envolent au-dessus d'un lac, et la douceur d'une aquarelle au bord de la mer.", ['grand-hotel', 'lanternes', 'marine']),
             ('Héritages', "Les codes des cultures d'Afrique, d'Orient, des Antilles et des Amériques, travaillés avec finesse.",
              ['kreyol', 'karakou', 'ndop', 'kanaval', 'takchita', 'keswa', 'huipil', 'kente', 'bindalli', 'lakay', 'bazin', 'heritage', 'karabela', 'madras', 'owambe', 'toghu', 'teranga', 'sape', 'kita', 'tibeb', 'imbali', 'liputa', 'adinkra']),
             ('Asie', "Les tenues de mariage d'Asie, leurs couleurs et leurs gestes, vérifiés avec soin.", ['qunkwa', 'aodai', 'lehenga', 'hanbok', 'kanchipuram', 'shiromuku']),
             ('Intemporels', "Des lignes classiques, pour un mariage hors du temps.", ['gatsby', 'porcelaine', 'chapelle', 'versailles', 'faubourg', 'opera', 'orangerie', 'classique', 'emeraude', 'bordeaux', 'ivoire', 'soie', 'monogramme', 'boheme', 'champetre']),
             ('Univers', "Pour les passionnés : une saga au château, une nuit gothique, un mariage sous les étoiles.", ['citadelle', 'nocturne', 'celeste'])]),
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
    manifeste="Un baptême réunit souvent plusieurs générations et plusieurs pays. L'invitation doit parler à chacun, de la grand-mère au cousin qui vit loin.",
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
    manifeste="Une naissance se partage avec ceux qu'on aime, tout près ou très loin. Un seul lien suffit : le prénom, la première photo, et une place pour chacun quand il viendra le rencontrer.",
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
                  'kita': 'kita', 'bogolan': 'bogolan', 'tibeb': 'tibeb', 'champetre': 'champetre', 'boheme': 'pampa', 'classique': 'ivoire', 'gatsby': 'gatsby', 'versailles': 'versailles', 'orangerie': 'orangerie', 'opera': 'opera', 'lanternes': 'lanternes', 'hanbok': 'hanbok', 'aodai': 'aodai', 'shiromuku': 'shiromuku', 'lehenga': 'lehenga', 'qunkwa': 'qunkwa', 'karabela': 'karabela', 'imbali': 'imbali', 'liputa': 'liputa', 'ndop': 'ndop', 'kreyol': 'kreyol', 'bazin': 'bazin', 'adinkra': 'adinkra', 'kanaval': 'kanaval', 'monogramme': 'monogramme', 'soie': 'soie', 'marine': 'marine', 'porcelaine': 'porcelaine', 'ivoire': 'ivoire', 'faubourg': 'faubourg', 'emeraude': 'emeraude', 'bordeaux': 'bordeaux', 'chapelle': 'chapelle',
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


def decor_paral(pre, elements):
    """Éléments graphiques des collections posés en bord de section, déplacés en parallaxe au défilement (data-v : vitesse,
    négative = sens inverse). elements : (image, style CSS de position et de taille, rotation en degrés, vitesse)."""
    return '<div class="decor-paral" aria-hidden="true">' + ''.join(
        f'<img class="paral" src="{pre}{img}" alt="" loading="lazy" style="{pos};--r:{r}deg" data-v="{v}">' for img, pos, r, v in elements) + '</div>'


def bloc_avis(site):
    avis = [a for a in AVIS if a['valide'] and a['site'] == site['cle']]
    if not avis:
        return ''
    e = escape
    pre = '../' if site['dossier'] else ''
    decor = decor_paral(pre, [('karakou/ouverture.webp', 'left:-70px;top:22%;width:250px', -9, .16), ('citadelle/sceau.webp', 'right:6%;top:9%;width:96px', 14, -.22),
                              ('kanchipuram/sceau.webp', 'left:9%;bottom:6%;width:78px', 0, .3), ('bindalli/sceau.webp', 'right:-10px;bottom:12%;width:120px', -12, .12)])
    return f"""  <section class="avis-clients">{decor}<div class="conteneur">
    <div class="titre-section revele"><span class="etq">Ils nous ont confié leur invitation</span><h2>Leurs mots</h2>
      <p>Des fêtes accompagnées par Maison Vivat, avant le lancement de l'espace complet.</p></div>
    <div class="avis-liste">
{chr(10).join(f'      <figure class="avis revele"><blockquote>«&nbsp;{e(a["texte"])}&nbsp;»</blockquote><figcaption><b>{e(a["signature"])}</b>{' · ' + e(a["lieu"]) if a["lieu"] else ''}</figcaption></figure>' for a in avis)}
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
<meta name="p:domain_verify" content="e429689e0f4edbe6245b75c5ab73d5c7">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{pre}_commun/maison.css?v={CSS_V}">
<style>:root{{--accent:{site['accent']}}}</style>
<script src="{pre}_commun/partenaire.js?v=1" defer></script>
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
  <div><h4>Pour vous</h4><ul><li><a href="{pre}creer/?evt={site['cle']}">{e(site['cta'])}</a></li>{espace}<li><a href="{pre}app/organisateur.html">Mon espace (déjà client)</a></li><li><a href="{accueil}#formules">Formules</a></li><li><a href="{accueil}#assistance">Assistance</a></li><li><a href="{pre}partenaires/index.html">Wedding planners</a></li></ul></div>
  <p class="mention"><a href="{pre}mentions-legales/index.html">Mentions légales</a> · <a href="{pre}confidentialite/index.html">Confidentialité</a> · <a href="{pre}cgv/index.html">CGV</a> · démonstrations : personnes et lieux fictifs, photos Pexels</p>
</div></footer>
<script>
  // Apparitions au défilement, et boutons de démonstration.
  const vu = new IntersectionObserver(es => es.forEach(x => {{ if (x.isIntersecting) {{ x.target.classList.add('vu'); vu.unobserve(x.target); }} }}), {{ rootMargin: '0px 0px -8% 0px' }});
  document.querySelectorAll('.revele').forEach(el => vu.observe(el));
  document.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.demo).style.display = 'block'));
  document.querySelectorAll('video.survol-arche').forEach(v => {{ const a = v.parentElement;
    a.addEventListener('mouseenter', () => v.play().catch(() => {{}})); a.addEventListener('mouseleave', () => v.pause()); }});
  // Décor en parallaxe : chaque élément glisse à sa vitesse quand la section défile (rien si le mouvement réduit est demandé).
  const paral = [...document.querySelectorAll('.paral')];
  if (paral.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {{
    let attente = false;
    const bouge = () => {{ attente = false; const mi = innerHeight / 2;
      for (const el of paral) {{ const r = el.parentElement.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) continue;
        el.style.transform = `translate3d(0,${{((r.top + r.height / 2 - mi) * -parseFloat(el.dataset.v)).toFixed(1)}}px,0) rotate(var(--r))`; }} }};
    addEventListener('scroll', () => {{ if (!attente) {{ attente = true; requestAnimationFrame(bouge); }} }}, {{ passive: true }}); bouge();
  }}
  // Survol d'une collection : son ouverture se joue (chargée au premier survol), puis s'arrête en partant.
  document.querySelectorAll('.oeuvre, .vignette-cat.reelle').forEach(o => {{
    const v = o.querySelector('video.survol'); if (!v) return;
    o.addEventListener('mouseenter', () => {{ if (!v.src) v.src = v.dataset.src; v.currentTime = 0; v.play().then(() => o.classList.add('joue')).catch(() => {{}}); }});
    o.addEventListener('mouseleave', () => {{ o.classList.remove('joue'); v.pause(); }});
  }});
</script>
</body>
</html>
"""


def page(site, modeles):
    pre = '../' if site['dossier'] else ''
    par_slug = {m['slug']: m for m in modeles}
    e = escape
    creer = f"{pre}creer/?evt={site['cle']}"

    def visuel(slug, m, une):
        image = f"{pre}{slug}/{'miniature.jpg' if os.path.exists(os.path.join(RACINE_MINI, slug, 'miniature.jpg')) else 'photo.jpg'}"
        # Au survol, l'ouverture du faire-part se joue sans le son (jamais de lancement automatique) ; « À la une » : format vertical entier.
        en3d = os.path.exists(os.path.join(RACINE_MINI, slug, 'ouverture-3d.mp4'))
        film = 'ouverture-3d.mp4' if en3d else 'ouverture.mp4' if os.path.exists(os.path.join(RACINE_MINI, slug, 'ouverture.mp4')) else None
        if une and en3d:
            image = f'{pre}{slug}/ouverture-3d.jpg'
        html = f'<img src="{image}" alt="Collection {e(m["modele"])}" loading="lazy">'
        if film:
            html += f'<video class="survol" data-src="{pre}{slug}/{film}" muted loop playsinline preload="none" aria-hidden="true"></video>'
        if une and en3d:
            html += '<span class="pastille">Ouverture en 3D</span>'
        return html

    def oeuvre(slug, rang=0, une=False):
        m = par_slug[slug]
        site_m = SITE_DU_MODELE.get(slug)
        # Le vrai site de la collection (décor, photos, programme illustré) quand il existe ; sinon le site du moteur.
        if os.path.exists(os.path.join(RACINE_MINI, slug, 'site.html')):
            lien_site = f'<a class="lien-site" href="{pre}{slug}/site.html" target="_blank" rel="noopener">Voir le site de cette collection</a>'
        else:
            lien_site = f'<a class="lien-site" href="{pre}app/fp.html?demo={site_m}&amp;f=site" target="_blank" rel="noopener">Voir le site de cette collection</a>' if site_m else ''
        return f"""        <div class="revele{' en-plus' if rang >= 3 and site['cle'] == 'mariage' else ''}"><a class="oeuvre" href="{pre}{slug}/index.html">
          <div class="cadre">{visuel(slug, m, une)}</div>
          <span class="etq">{e(m['culture'])}</span>
          <h4>{e(m['modele'])}</h4>
          <span class="ouvrir">Ouvrir l'invitation</span>
        </a>{lien_site}</div>"""

    groupes = []
    for titre, texte, slugs in site['groupes']:
        slugs = [s for s in slugs if s in par_slug]
        tg = f'<div class="groupe-tete"><h3>{e(titre)}</h3><p>{e(texte)}</p></div>' if titre else ''
        une = titre == 'À la une'
        groupes.append(f'      <div class="groupe{" une" if une else ""}">{tg}\n      <div class="oeuvres">\n' + '\n'.join(oeuvre(s, k, une) for k, s in enumerate(slugs)) + '\n      </div></div>')

    espace = '\n'.join(f'      <article class="revele"><h3>{e(t)}</h3><p>{e(p)}</p></article>' for t, p in site['espace'])
    # Directions du moteur pour cet événement (le mariage renvoie au catalogue complet, trop long pour cette page).
    miennes = [t for t in THEMES if t['evt'] == site['cle']]
    catalogue = '' if site['cle'] == 'mariage' else f"""      <div class="groupe">{'<div class="groupe-tete"><h3>Directions artistiques</h3><p>Chacune a sa couverture, son programme et son rythme ; toutes existent en invitation, en annonce et en site.</p></div>' if site['groupes'] else ''}
      <div class="catalogue">""" + ''.join(f"""
        <div class="vignette-cat revele"><a href="{pre}app/fp.html?demo={t['id']}" target="_blank" rel="noopener"><img src="{pre}collections/apercus/{t['id']}-fp.jpg" alt="{e(t['nom'])}" loading="lazy"></a>
          <span class="etq">{e(t['culture'])}</span><b>{e(t['nom'])}</b>
          <span class="liens-cat"><a href="{pre}app/fp.html?demo={t['id']}" target="_blank" rel="noopener">Invitation</a><a href="{pre}app/fp.html?demo={t['id']}&amp;f=std" target="_blank" rel="noopener">Annonce</a><a href="{pre}app/fp.html?demo={t['id']}&amp;f=site" target="_blank" rel="noopener">Site</a></span></div>""" for t in miennes) + """
      </div></div>"""
    # Mariage, pendant le lancement : l'option à moitié prix, puis son prix normal (jamais de faux prix barré).
    def tarif(p):
        if site['cle'] == 'mariage' and isinstance(p, int):
            return f'{prix(opt_lancement(p))}<small class="puis"> puis {prix(p)}</small>'
        return prix(p)
    moments = []
    for moment in ('Avant', 'Le jour J', 'Après'):
        lignes = '\n'.join(f"""        <li class="option"><div><h4>{e(n)}{' <span class="etoile" title="Pensé pour les familles réparties entre plusieurs pays">✦</span>' if d else ''}</h4><p>{e(t)}</p></div><span class="tarif">{tarif(p)}</span></li>"""
                           for k, mo, n, t, p, d in site['options'] if mo == moment)
        if lignes:
            moments.append(f'      <div class="moment revele"><h3>{e(moment)}</h3><ul>\n{lignes}\n      </ul></div>')
    a_etoile = any(o[5] for o in site['options'])
    # L'accueil ne montre que quelques options phares ; la liste complète se déplie, et reste sur la page de commande.
    phares = [o for o in site['options'] if o[0] in ('savethedate', 'qr', 'direct', 'murphoto', 'album')][:4]
    selection = '\n'.join(f"""        <div class="phare-opt revele"><span class="etq">{e(mo)}</span><h4>{e(n)}</h4><p>{e(t)}</p><span class="tarif">{tarif(p)}</span></div>"""
                          for k, mo, n, t, p, d in phares)
    PRINCIPALES = ('Faire-part', 'Signature', 'Prestige')
    prix_opt = {k: p for k, mo, n, t, p, d in site['options'] if isinstance(p, int)}
    def carte(k, n, p, lst, petite=False):
        inc = next(f[2] for f in site['formules'] if f[0] == n)
        val = sum(prix_opt.get(o, 0) for o in inc)
        valeur = f'<p class="valeur-formule">{len(inc)} option{"s" if len(inc) > 1 else ""} incluse{"s" if len(inc) > 1 else ""}, {prix(val)} si prise{"s" if len(inc) > 1 else ""} à l\'unité</p>' if inc else ''
        badge = '<span class="badge-formule">Notre recommandation</span>' if n == 'Signature' else ''
        lc = lancement(n, p) if site['cle'] == 'mariage' else None
        prix_aff = prix(lc['prix']) if lc else prix(p)
        lance = f'<p class="lancement">Prix de lancement : {e(lc["texte"])}</p>' if lc else ''
        return f"""      <div class="formule{' phare' if n == 'Signature' else ''}{' secondaire' if petite else ''} revele">{badge}<h3>{e(n)}</h3><p class="prix">{prix_aff}</p>{lance}{valeur}
        <ul>{''.join(f'<li>{e(x)}</li>' for x in lst)}</ul><a class="btn{'' if n == 'Signature' else ' clair'}" href="{creer}&amp;formule={k}" style="margin-top:auto">Choisir {e(n)}</a></div>"""
    tout = list(enumerate(site['formules']))
    if site['cle'] == 'mariage' and any(n not in PRINCIPALES for n, *_ in site['formules']):
        formules = '\n'.join(carte(k, n, p, lst) for k, (n, p, inc, lst) in tout if n in PRINCIPALES) + \
            '\n    </div>\n    <p class="aussi-formules revele">Aussi, pour aller pas à pas :</p>\n    <div class="formules formules-secondaires">\n' + \
            '\n'.join(carte(k, n, p, lst, True) for k, (n, p, inc, lst) in tout if n not in PRINCIPALES)
    else:
        formules = '\n'.join(carte(k, n, p, lst) for k, (n, p, inc, lst) in tout)
    essai = f'<a class="btn clair" href="{pre}{site["essai"][0]}">{e(site["essai"][1])}</a>' if site['essai'] else f'<a class="btn clair" href="#collections">Voir les collections</a>'
    nav_essai = f'<a href="{pre}espace/#tableau">Démonstration</a>' if site['cle'] == 'mariage' else ''

    return tete(site, pre, f"{MARQUE} · {site['nom']}", site['sous']) + f"""
<header class="entete"><div class="conteneur">
  <a class="marque" href="#haut"><b>{e(MARQUE)}</b><span>{e(site['nom'])}</span></a>
  <nav class="nav" aria-label="Sections"><a href="#collections">Collections</a><a href="#espace">L'espace</a><a href="#formules">Formules</a><a href="#options">Options</a>{nav_essai}<a href="{pre}app/organisateur.html">Mon espace</a>{'<a href="en/" lang="en">EN</a>' if site['cle'] == 'mariage' else ''}<a class="rdv" href="{creer}">{e(site['cta'])}</a></nav>
</div></header>

<main id="haut">
  <div class="conteneur ouverture">
    <div class="revele">
      <span class="etq">L'art de recevoir · {e(site['nom'])}</span>
      <h1>{site['h1']}</h1>
      <p>{e(site['sous'])}</p>
      <div class="actions"><a class="btn" href="{creer}">{e(site['cta'])}</a>{essai}</div>
      <p class="rassure">Gratuit jusqu'à la publication : vous préparez tout, vous ne payez qu'au moment d'envoyer le lien à vos invités.</p>
      {f'<p class="lancement-accueil"><a href="#formules">Lancement : -50 % sur toutes les formules et les options pour les 50 premiers couples, jusqu’au 30 novembre.</a></p>' if site['cle'] == 'mariage' else ''}
    </div>
    <div class="arche revele">{f'<video src="{pre}{site["video"]}" poster="{pre}{site["image"]}" autoplay muted loop playsinline preload="auto" aria-hidden="true"></video>' if site.get('video') else f'<img src="{pre}{site["image"]}" alt="" fetchpriority="high">'}</div>
  </div>

  <section class="manifeste">{decor_paral(pre, [('lanternes/ouverture.webp', 'left:-50px;top:14%;width:260px', -12, .18), ('takchita/sceau.webp', 'right:9%;top:16%;width:104px', 10, -.14),
                                    ('kanaval/papillon.webp', 'right:4%;bottom:10%;width:92px', 16, .32), ('grand-hotel/cachet.webp', 'left:12%;bottom:8%;width:74px', -6, -.24)]) if site['cle'] == 'mariage' else ''}<div class="conteneur revele">
    <span class="etq">L'art de recevoir</span>
    <div style="height:22px"></div>
    <blockquote>«&nbsp;{e(site['manifeste'])}&nbsp;»</blockquote>
  </div></section>

{bloc_avis(site)}  <section id="collections"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Collections</span><h2>{e(site['titre_collections'])}</h2><p>{e(site['intro_collections'])}</p></div>
{chr(10).join(groupes)}
{'<p class="note revele voir-plus"><button class="btn clair" type="button" onclick="document.getElementById(\'collections\').classList.add(\'tout\');this.parentNode.remove()">Voir plus de collections</button></p>' if site['cle'] == 'mariage' else ''}
{catalogue}
    <p class="note revele"><a class="btn" href="{pre}collections/index.html{'' if site['cle'] == 'mariage' else '?evt=' + site['cle']}">{"Voir toutes les collections, en faire-part, save-the-date et site" if site['cle'] == 'mariage' else 'Toutes les directions de la maison'}</a></p>
  </div></section>

  <section id="espace" class="avec-decor">{decor_paral(pre, [('qunkwa/suspendu.webp', 'right:5%;top:0;width:70px', 0, 0.2), ('shiromuku/branche.webp', 'left:-40px;top:38%;width:300px', 8, -0.12), ('takchita/icone-4.webp', 'right:-20px;bottom:14%;width:120px', -6, 0.26), ('huipil/sceau.webp', 'left:6%;bottom:4%;width:110px', 10, -0.2)]) if site['cle'] == 'mariage' else ''}<div class="conteneur">
    <div class="titre-section revele"><span class="etq">L'espace</span><h2>{e(site['titre_espace'])}</h2></div>
    <div class="fonctions">
{espace}
    </div>
    {f'<p class="note revele"><a href="{pre}espace/#tableau" class="lien-or">Essayer l’espace de démonstration →</a></p>' if site['essai'] else ''}
  </div></section>

  <section class="tarifs avec-decor" id="formules">{decor_paral(pre, [('marine/ouverture.webp', 'left:-80px;top:10%;width:240px', 10, 0.14), ('keswa/sceau.webp', 'right:4%;top:6%;width:88px', -10, -0.22), ('kanchipuram/icone-1.webp', 'right:-30px;bottom:8%;width:170px', 6, 0.2)]) if site['cle'] == 'mariage' else ''}<div class="conteneur">
    <div class="titre-section revele"><span class="etq">Formules</span><h2>{['Trois', 'Quatre', 'Cinq'][len(site['formules']) - 3]} formules, des options à l'unité</h2><p>Paiement unique au moment de publier · prix indépendant du nombre d'invités · accès jusqu'à 12 mois après la date · droit de rétractation de 14 jours (voir les CGV).</p></div>
    <div class="formules">
{formules}
    </div>
    <p class="note">Paiement en ligne sécurisé. Toutes les options s'ajoutent aussi à l'unité. TVA non applicable, art. 293 B du CGI.</p>
  </div></section>

  <section class="tarifs avec-decor" id="options">{decor_paral(pre, [('gatsby/icone-1.webp', 'left:-30px;top:18%;width:140px', -8, 0.18), ('nocturne/sceau.webp', 'right:6%;top:10%;width:84px', 12, -0.2), ('bindalli/icone-1.webp', 'left:5%;bottom:6%;width:120px', 0, -0.16), ('huipil/icone-2.webp', 'right:-20px;bottom:16%;width:130px', -14, 0.24)]) if site['cle'] == 'mariage' else ''}<div class="conteneur">
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

  <section class="rendezvous avec-decor" id="assistance">{decor_paral(pre, [('lehenga/toran.webp', 'left:50%;top:0;width:520px;margin-left:-260px', 0, 0.1), ('kanaval/papillon.webp', 'left:8%;bottom:14%;width:84px', -18, 0.34), ('takchita/sceau.webp', 'right:9%;bottom:18%;width:92px', 8, -0.18)]) if site['cle'] == 'mariage' else ''}<div class="conteneur revele">
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
                          img=f"../{m['slug']}/{'miniature.jpg' if os.path.exists(os.path.join(RACINE_MINI, m['slug'], 'miniature.jpg')) else 'photo.jpg'}", voir=f"../{m['slug']}/index.html")
                     for sl in slugs for m in modeles if m['slug'] == sl]
                    + [dict(slug=t['id'], nom=t['nom'], culture=t['culture'], a='', b='', titre='', img=f"../collections/apercus/{t['id']}-fp.jpg", voir=f"../app/fp.html?demo={t['id']}", moteur=True)
                       for t in THEMES if t['evt'] == s['cle'] and not any(m['slug'] == sl for sl in slugs for m in modeles)],
            exemple={'mariage': 'Awa et Thomas', 'anniversaire': 'Les 40 ans de Nadia', 'bapteme': 'Gabriel', 'gender': 'Fille ou garçon ?', 'naissance': 'Léo'}[s['cle']],
            formules=[dict(nom=n, prix=p, inclus=inc, lignes=l, **({'lancement': lancement(n, p)} if s['cle'] == 'mariage' and lancement(n, p) else {})) for n, p, inc, l in s['formules']],
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
      <div class="ligne-total" id="t-remise" hidden><span id="t-remise-nom"></span><b id="t-remise-val"></b></div>
      <div class="ligne-total grand"><span>Total</span><b id="t-total"></b></div>
      <label class="code-partenaire">Code partenaire (votre wedding planner)<input id="f-partenaire" autocomplete="off" spellcheck="false" placeholder="facultatif"></label>
    </div>
    <label class="case"><input type="checkbox" id="c-cgv"><span>J'accepte les <a href="../cgv/index.html" target="_blank" rel="noopener">conditions générales de vente</a>.</span></label>
    <label class="case"><input type="checkbox" id="c-debut"><span>Je demande que la réalisation commence tout de suite. Je sais que je perdrai mon droit de rétractation une fois l'invitation validée par moi et mise en ligne.</span></label>
    <button class="btn" type="button" id="b-payer" style="width:100%" disabled>Créer mon espace, gratuitement</button>
    <p class="rassure">Gratuit tant que vous préparez. Vous validez votre formule après avoir vu votre faire-part, par carte, sur la page sécurisée de Stripe.</p>
    <p class="rassure">Sans rendez-vous. Assistance écrite sous 24 heures.</p>
    <p class="rassure">Vos données et celles de vos invités restent en France : <a href="../confidentialite/index.html">confidentialité</a>.</p>
  </aside>
</main>
<script>
const D = """ + js + """;
const q = new URLSearchParams(location.search);
let evt = D[q.get('evt')] ? q.get('evt') : 'mariage', choix = { modele: 0, formule: q.has('formule') ? +q.get('formule') : -1, options: new Set() };
const prixF = f => f.lancement && Date.now() < Date.parse(f.lancement.jusqu) ? f.lancement.prix : f.prix;
// Options : même remise que la formule pendant le lancement (le serveur recalcule le montant).
const prixO = (o, f) => prixF(f) < f.prix && f.lancement.options ? Math.ceil(o.prix * f.lancement.options) : o.prix;
const $ = id => document.getElementById(id), eur = n => n.toLocaleString('fr-FR') + ' €';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function changerEvt(k) {
  evt = k; const E = D[evt]; choix.modele = 0; choix.options.clear();
  if (choix.formule < 0 || choix.formule >= E.formules.length) choix.formule = Math.max(0, E.formules.findIndex(f => f.nom === 'Signature'));
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
  $('formules').innerHTML = E.formules.map((f, i) => `<button type="button" class="choix-formule ${i === choix.formule ? 'choisie' : ''}" data-formule="${i}"><b>${esc(f.nom)}</b><span>${eur(prixF(f))}${prixF(f) < f.prix ? ` <em class="lancement">puis ${eur(f.prix)}</em>` : ''}</span><small>${esc(f.lignes.slice(0, 3).join(' · '))}</small></button>`).join('');
  const moments = [...new Set(E.options.map(o => o.moment))];
  $('options').innerHTML = moments.map(mo => `<h3 class="moment-titre">${esc(mo)}</h3>` + E.options.filter(o => o.moment === mo).map(o => {
    const inclus = F.inclus.includes(o.cle), coche = inclus || choix.options.has(o.cle);
    return `<label class="choix-option ${inclus ? 'inclus' : ''}"><input type="checkbox" data-option="${o.cle}" ${coche ? 'checked' : ''} ${inclus || o.devis ? 'disabled' : ''}><span><b>${esc(o.nom)}</b><small>${esc(o.texte)}</small></span><em>${inclus ? 'Inclus' : o.devis ? 'Sur devis' : '+ ' + eur(prixO(o, F)) + (prixO(o, F) < o.prix ? `<small class="lancement"> puis ${eur(o.prix)}</small>` : '')}</em></label>`;
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
  $('t-formule').textContent = 'Formule ' + F.nom + (prixF(F) < F.prix ? ' (prix de lancement)' : ''); $('t-formule-prix').textContent = eur(prixF(F));
  $('t-options').innerHTML = extras.map(o => `<div class="ligne-total"><span>${esc(o.nom)}</span><b>+ ${eur(prixO(o, F))}</b></div>`).join('');
  const brut = prixF(F) + extras.reduce((s, o) => s + prixO(o, F), 0), code = window.codePartenaire ? window.codePartenaire() : '';
  if ($('f-partenaire') && document.activeElement !== $('f-partenaire')) $('f-partenaire').value = code;
  $('t-remise').hidden = !code; $('t-remise-nom').textContent = `Remise partenaire ${code}`; $('t-remise-val').textContent = '− ' + eur(Math.round(brut * 0.1));
  $('t-total').textContent = eur(code ? brut - Math.round(brut * 0.1) : brut);
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
$('f-partenaire').addEventListener('change', e => { e.target.value = window.retenirPartenaire(e.target.value); rendre(); });
// Vers l'espace : création du compte et de l'événement, puis paiement avec la formule et les options choisies.
$('b-payer').addEventListener('click', () => {
  const E2 = D[evt], F = E2.formules[choix.formule], opts = [...choix.options].filter(o => !F.inclus.includes(o));
  location.href = `../app/organisateur.html?nouveau=${evt}&formule=${encodeURIComponent(F.nom.toLowerCase())}&options=${encodeURIComponent(opts.join(','))}&modele=${encodeURIComponent(E2.modeles[choix.modele]?.slug || '')}`;
});
changerEvt(evt);
const depart = D[evt].modeles.findIndex(x => x.slug === q.get('modele'));
if (depart > 0) { choix.modele = depart; rendre(); }
history.replaceState(null, '', `?evt=${evt}` + (choix.formule ? `&formule=${choix.formule}` : ''));
</script>
</body>
</html>
"""



def page_partenaires():
    """Page des wedding planners : vos couples ont 10 % de remise avec votre code, vous touchez 10 % de ce qu'ils paient."""
    site, pre, e = SITES[0], '../', escape
    exemples = [(n, p) for n, p, inc, l in site['formules'] if p]
    lignes = ''.join(f'<tr><td>{e(n)}</td><td>{prix(p)}</td><td>{prix(p - round(p * .1))}</td><td><b>{prix(round((p - round(p * .1)) * .1))}</b></td></tr>' for n, p in exemples)
    return tete(site, pre, f"{MARQUE} · Partenaires wedding planners", "Wedding planners : vos couples ont 10 % de remise sur leur espace mariage, vous touchez 10 % de ce qu'ils paient.") + f"""
<header class="entete"><div class="conteneur">
  <a class="marque" href="{pre}index.html"><b>{e(MARQUE)}</b><span>Partenaires</span></a>
  <nav class="nav" aria-label="Sections"><a href="#principe">Le principe</a><a href="#exemples">Exemples</a><a href="#rejoindre">Nous rejoindre</a><a class="rdv" href="mailto:contact@maisonvivat.com?subject=Partenariat%20wedding%20planner">Demander mon code</a></nav>
</div></header>
<main id="haut">
  <section><div class="conteneur mesure-texte revele">
    <span class="etq">Wedding planners, lieux de réception</span>
    <h1 class="serif" style="font-weight:500;font-size:clamp(36px,5vw,58px);line-height:1.06;margin:16px 0 20px">Offrez à vos couples<br><em>l'espace de leur mariage</em></h1>
    <p>Invitation animée, site du mariage, réponses par cérémonie, plan de table, entrée des invités, photos : tout se pilote depuis un seul espace, que vous pouvez suivre avec eux. Vos couples ont <b>10 % de remise</b> avec votre code ; vous recevez <b>10 % de ce qu'ils paient</b>.</p>
  </div></section>

  <section id="principe"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Le principe</span><h2>Simple pour vous, avantageux pour eux</h2></div>
    <div class="fonctions">
      <article class="revele"><h3>Votre code</h3><p>Nous vous remettons un code et un lien personnels. Vous les transmettez à vos couples, rien d'autre à installer.</p></article>
      <article class="revele"><h3>10 % pour vos couples</h3><p>La remise s'applique toute seule au paiement, sur la formule comme sur les options.</p></article>
      <article class="revele"><h3>10 % pour vous</h3><p>Calculés sur ce que le couple a réellement payé, versés chaque mois sur votre facture d'apport d'affaires.</p></article>
      <article class="revele"><h3>Vous gardez la main</h3><p>Le couple peut vous inviter dans son espace au rôle de wedding planner : réponses, plan de table, déroulé du jour J.</p></article>
    </div>
  </div></section>

  <section id="exemples" class="tarifs"><div class="conteneur">
    <div class="titre-section revele"><span class="etq">Exemples</span><h2>Ce que chacun y gagne</h2><p>Montants arrondis à l'euro, pour une formule seule.</p></div>
    <table class="tableau-partenaires revele"><thead><tr><th>Formule</th><th>Prix public</th><th>Le couple paie</th><th>Votre commission</th></tr></thead><tbody>{lignes}</tbody></table>
  </div></section>

  <section class="rendezvous" id="rejoindre"><div class="conteneur revele">
    {ORN}
    <span class="etq">Nous rejoindre</span>
    <h2>Demandez votre code</h2>
    <p>Écrivez-nous avec le nom de votre agence et votre site : nous vous répondons sous 24 heures avec votre code, votre lien et l'accès à l'espace de démonstration.</p>
    <a class="btn" href="mailto:contact@maisonvivat.com?subject=Partenariat%20wedding%20planner">contact@maisonvivat.com</a>
  </div></section>
</main>

""" + pied(site, pre)

def page_collections(modeles=()):
    """Catalogue : d'abord les collections faites main (Grand Hôtel et Héritage en tête), puis toutes les directions
    artistiques du moteur, lues depuis app/themes.js : trois formats, filtres par famille."""
    site = SITES[0]
    n = len(THEMES)
    par_slug = {m['slug']: m for m in modeles}
    e = escape

    def aper(slug, nom):
        f = os.path.join(RACINE_MINI, slug, 'apercus', nom)
        return f'../{slug}/apercus/{nom}' if os.path.exists(f) else f"../{slug}/{'miniature.jpg' if os.path.exists(os.path.join(RACINE_MINI, slug, 'miniature.jpg')) else 'photo.jpg'}"

    def carte(slug, groupe, une):
        # une collection réelle : son aperçu et sa page changent avec la bascule Faire-part / Save-the-date / Site
        m = par_slug[slug]
        badge = '<span class="badge-une">À la une</span>' if une else ''
        site_ok = os.path.exists(os.path.join(RACINE_MINI, slug, 'site.html'))
        film = 'ouverture-3d.mp4' if os.path.exists(os.path.join(RACINE_MINI, slug, 'ouverture-3d.mp4')) else 'ouverture.mp4'
        return (f"""      <a class="vignette-cat main reelle" data-groupe="{e(groupe)}" href="../{slug}/faire-part.html" target="_blank" rel="noopener" """
                f"""data-fp="../{slug}/faire-part.html" data-std="../{slug}/faire-part.html?f=std" data-site="../{slug}/{'site.html' if site_ok else 'index.html'}" """
                f"""data-img-fp="{aper(slug, 'faire-part.webp')}" data-img-std="{aper(slug, 'save-the-date.webp')}" data-img-site="{aper(slug, 'site.webp')}">{badge}
        <span class="cadre-cat"><img src="{aper(slug, 'faire-part.webp')}" alt="Collection {e(m['modele'])}" loading="lazy"><video class="survol" data-src="../{slug}/{film}" muted loop playsinline preload="none" aria-hidden="true"></video></span>
        <span class="etq">{e(m['culture'])}</span><b>{e(m['modele'])}</b><small>{e(m['da'])}</small></a>""")

    vus, cartes, groupes_vus = set(), [], []
    for titre, texte, slugs in SITES[0]['groupes']:
        slugs = [g for g in slugs if g in par_slug and g not in vus]
        if not slugs:
            continue
        vus.update(slugs); groupes_vus.append((titre, len(slugs)))
        cartes += [carte(g, titre, titre == 'À la une') for g in slugs]
    nb_main = len(vus)
    filtres = ''.join(f'<button data-groupe="{e(t)}">{e(t)} ({k})</button>' for t, k in groupes_vus)
    faites_main = f"""  <div class="titre-section"><span class="etq">Mariage</span><h2>{nb_main} collections signées</h2>
    <p>Dessinées une à une, avec leur ouverture animée, leur musique, leur site, leur plan de table, leur mur photo et leur livre d'or. Toutes existent en faire-part, en save-the-date et en site.</p></div>
  <div class="filtres" id="filtres-main"><button data-groupe="tous" class="actif">Toutes ({nb_main})</button>{filtres}</div>
  <div class="bascule" id="bascule-main"><button data-fmt="fp" class="actif">Faire-part</button><button data-fmt="std">Save-the-date</button><button data-fmt="site">Site</button></div>
  <div class="catalogue" id="catalogue-main">
{chr(10).join(cartes)}
  </div>
  <div style="height:72px"></div>
""" if cartes else ""
    nav = ''.join(f'<a href="../{x["dossier"] + "/" if x["dossier"] else ""}index.html">{escape(x["nom"])}</a>' for x in SITES)
    return tete(site, '../', f'{MARQUE} · Collections', f"{nb_main} collections de mariage, chacune en faire-part, save-the-date et site, et des invitations pour les autres fêtes de la vie.") + f"""
<header class="entete"><div class="conteneur">
  <a class="marque" href="../index.html"><b>{escape(MARQUE)}</b><span>Collections</span></a>
  <nav class="nav" aria-label="Sites">{nav}<a class="rdv" href="../creer/index.html">Créer</a></nav>
</div></header>
<main class="conteneur" style="padding-top:56px;padding-bottom:96px">
<style>.banque-groupe{{font-family:'Bodoni Moda',serif;font-weight:400;font-size:30px;margin:48px 0 22px}}
.vignette-cat.main{{position:relative}}.vignette-cat.main small{{display:block;margin-top:6px}}
.vignette-cat.reelle img{{aspect-ratio:420/700;object-position:top}}
.cadre-cat{{position:relative;display:block;overflow:hidden}}.cadre-cat video.survol{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .4s;pointer-events:none}}.reelle.joue video.survol{{opacity:1}}
.badge-une{{position:absolute;top:12px;left:12px;z-index:1;background:#A8834A;color:#fff;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:6px 10px}}</style>
{faites_main}  <div class="titre-section"><span class="etq">Les autres fêtes</span><h2>Anniversaires, baptêmes, naissances</h2>
    <p>Des invitations pour les autres grands moments : chacune a sa propre structure et existe en faire-part, en save-the-date et en site ; couleurs, polices, photo et parties se changent ensuite dans votre espace, avec un aperçu en direct.</p></div>
  <div class="filtres" id="filtres"></div>
  <div class="bascule" id="bascule"><button data-format="fp" class="actif">Faire-part</button><button data-format="std">Save-the-date</button><button data-format="site">Site</button></div>
  <div class="catalogue" id="catalogue"></div>
</main>
<script>
  // Collections de mariage : filtre par famille, et bascule du format (aperçu et page)
  let groupe = 'tous', fmt = 'fp';
  function majMain() {{
    document.querySelectorAll('#catalogue-main .reelle').forEach(a => {{
      a.style.display = groupe === 'tous' || a.dataset.groupe === groupe ? '' : 'none';
      a.href = a.dataset[fmt]; a.querySelector('img').src = a.dataset['img' + fmt[0].toUpperCase() + fmt.slice(1)];
    }});
  }}
  document.getElementById('filtres-main')?.addEventListener('click', ev => {{ const b = ev.target.closest('button'); if (!b) return; groupe = b.dataset.groupe;
    document.querySelectorAll('#filtres-main button').forEach(x => x.classList.toggle('actif', x === b)); majMain(); }});
  document.getElementById('bascule-main')?.addEventListener('click', ev => {{ const b = ev.target.closest('button'); if (!b) return; fmt = b.dataset.fmt;
    document.querySelectorAll('#bascule-main button').forEach(x => x.classList.toggle('actif', x === b)); majMain(); }});
</script>
<script type="module">
  import {{ THEMES, FAMILLES, FAMILLES_DE, COUVERTURES, PROGRAMMES }} from '../app/themes.js?v=3';
  // le moteur ne sert plus que les autres fêtes : les directions de mariage sont remplacées par les collections ci-dessus
  const AUTRES = THEMES.filter(t => !FAMILLES_DE.mariage.includes(t.famille));
  const q = new URLSearchParams(location.search);
  let famille = FAMILLES_DE[q.get('evt')]?.length === 1 ? FAMILLES_DE[q.get('evt')][0] : 'tous', format = 'fp';
  if (FAMILLES_DE.mariage.includes(famille)) famille = 'tous';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }})[c]);
  function rendre() {{
    document.getElementById('filtres').innerHTML = [['tous', 'Toutes (' + AUTRES.length + ')'], ...Object.entries(FAMILLES).filter(([k]) => !FAMILLES_DE.mariage.includes(k)).map(([k, v]) => [k, v + ' (' + AUTRES.filter(t => t.famille === k).length + ')'])]
      .map(([k, v]) => `<button data-famille="${{k}}" class="${{k === famille ? 'actif' : ''}}">${{v}}</button>`).join('');
    document.getElementById('catalogue').innerHTML = AUTRES.filter(t => famille === 'tous' || t.famille === famille).map(t => `
      <a class="vignette-cat" href="../app/fp.html?demo=${{t.id}}${{format === 'fp' ? '' : '&f=' + format}}" target="_blank" rel="noopener">
        <img src="apercus/${{t.id}}-${{format === 'std' ? 'std' : 'fp'}}.jpg" alt="${{esc(t.nom)}}" loading="lazy">
        <span class="etq">${{esc(t.culture)}}</span><b>${{esc(t.nom)}}</b><small>${{esc(COUVERTURES[t.couv])}} · programme en ${{esc(PROGRAMMES[t.prog].toLowerCase())}}</small></a>`).join('');
  }}
  document.addEventListener('click', e => {{
    const b = e.target.closest('#filtres button, #bascule button'); if (!b) return;
    if (b.dataset.famille) {{ famille = b.dataset.famille; rendre(); }}
    if (b.dataset.format) {{ format = b.dataset.format; document.querySelectorAll('#bascule [data-format]').forEach(x => x.classList.toggle('actif', x === b)); rendre(); }}
  }});
  rendre();
</script>
""" + pied(site, '../')


def tarifs():
    """Grille de prix unique, lue par l'espace (affichage) et par le serveur de paiement (montant facturé)."""
    def site(cle):
        s = next(x for x in SITES if x['cle'] == cle)
        return dict(
            formules={n.lower(): dict(nom=n, prix=p, inclus=inc, **({'lancement': lancement(n, p)} if cle == 'mariage' and lancement(n, p) else {})) for n, p, inc, _ in s['formules']},
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
    dict(slug='kanaval', modele='Kanaval', culture='Kanaval · Jacmel', da="Pochette de soie bleu nuit brodée de paillettes, papillons en papier mâché qui s'envolent, hibiscus", a='Darline', b='Stanley'),
    dict(slug='karakou', modele='Karakou', culture='Karakou · khit errouh', da="Enveloppe d'ivoire brodée au fil d'or, sceau de cire grenat ; velours brodé, arcades blanches et bougainvilliers", a='Lina', b='Yanis'),
    dict(slug='takchita', modele='Takchita', culture='Takchita · sfifa et mdamma', da="Enveloppe de soie ivoire à la passementerie d'or, sceau de cire émeraude ; cour de riad, lanternes ciselées et rose poudré", a='Salma', b='Mehdi'),
    dict(slug='celeste', modele='Céleste', culture='Univers · sous les étoiles', da="Enveloppe de velours bleu nuit à la carte du ciel dorée, cachet d'or étoilé ; observatoire et voie lactée", a='Iris', b='Raphaël'),
    dict(slug='kanchipuram', modele='Kanchipuram', culture='Kanchipuram · sari de soie et zari', da="Enveloppe de soie magenta bordée de zari d'or, nouée d'un fil de jasmin ; guirlandes de jasmin et d'œillets d'Inde, kolam", a='Meenakshi', b='Arjun'),
    dict(slug='bindalli', modele='Bindallı', culture='Bindallı · soirée du henné', da="Enveloppe de velours bordeaux brodée d'or et de perles, ruban rouge à pompons dorés ; voile rouge, henné et bougies", a='Elif', b='Can'),
    dict(slug='huipil', modele='Huipil', culture='Huipil · lazo et arras', da="Enveloppe de coton blanc brodée de fleurs, nouée d'un lazo de perles ; patio d'hacienda et bougainvillées", a='Valeria', b='Mateo'),
    dict(slug='keswa', modele='Keswa', culture='Keswa · fouta et blouza', da="Enveloppe de satin ivoire brodée au fil d'or, sceau de cire bleu canard ; terrasse blanche face à la mer", a='Yasmine', b='Karim'),
    dict(slug='citadelle', modele='Citadelle', culture='Univers · fantasy médiévale', da="Enveloppe de parchemin au liseré bordeaux, sceau de cire au dragon héraldique ; château dans la brume, bannières et chandeliers de fer forgé", a='Aliénor', b='Gauthier'),
    dict(slug='nocturne', modele='Nocturne', culture='Univers · gothique romantique', da="Enveloppe de velours prune à dentelle d'or, sceau de cire noire à la rose ; chapelle gothique aux chandelles sous la lune", a='Morgane', b='Victor'),
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
    dict(slug='orangerie', modele='Orangerie', culture='Intemporel · jardin d’hiver', da="Enveloppe vert sauge au brin de fleur d'oranger, verrière de fer forgé qui se dessine autour d'un citronnier", a='Nadia', b='Samuel'),
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
    # Collections proposées dans l'espace du couple (choisir, changer de collection) : nom, culture, aperçu.
    cols = [dict(slug=m['slug'], nom=m['modele'], culture=m['culture'],
                 img=f"../{m['slug']}/apercus/faire-part.webp" if (racine / m['slug'] / 'apercus' / 'faire-part.webp').exists() else f"../{m['slug']}/photo.jpg")
            for _, _, slugs in SITES[0]['groupes'] for m in visibles if m['slug'] in slugs]
    vus = set(); cols = [c for c in cols if not (c['slug'] in vus or vus.add(c['slug']))]
    (racine / 'app' / 'collections.json').write_text(json.dumps(cols, ensure_ascii=False, indent=1), encoding='utf-8')
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
    (racine / 'partenaires').mkdir(exist_ok=True)
    (racine / 'partenaires' / 'index.html').write_text(page_partenaires(), encoding='utf-8')
    print('partenaires ok')
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
