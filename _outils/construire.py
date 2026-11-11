# Fabrique la vitrine des faire-part de démonstration (faux couples), à partir du faire-part
# Falencie & Martin (C:\Dev\mariage-fm\index.html). Aucune automatisation côté client :
# Parnel montre la vitrine, puis personnalise à la main le modèle choisi.
# Usage : python construire.py   →   ..\<modele>\index.html + apercu-whatsapp.jpg, ..\index.html
from emotions import EMOTIONS
import base64, re, subprocess, sys
from pathlib import Path

OUTILS = Path(__file__).parent
VITRINE = OUTILS.parent
SOURCE = Path(r'C:\Dev\mariage-fm\index.html')
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

EN = {  # libellés du modèle d'origine → anglais
    '<html lang="fr">': '<html lang="en">',
    '<meta property="og:locale" content="fr_FR" />': '<meta property="og:locale" content="en_GB" />',
    '<div class="ls">vous invitent</div>': '<div class="ls">invite you</div>',
    '<p class="env-hint">Appuyez pour ouvrir 💌</p>': '<p class="env-hint">Tap to open 💌</p>',
    'aria-label="Ouvrir l\'invitation"': 'aria-label="Open the invitation"',
    'class="scroll-hint">Ouvrir l\'invitation</a>': 'class="scroll-hint">Open the invitation</a>',
    '<p class="invite">ont le plaisir de vous inviter à leur</p>': '<p class="invite">request the pleasure of your company at their</p>',
    '<h3>Lieu</h3>': '<h3>Venue</h3>',
    '>Voir sur la carte</a>': '>View on the map</a>',
    '<p>Nous serions heureux de vous voir dans ces teintes</p>': '<p>We would love to see you in these colours</p>',
    'Plus que… ⏳': 'Counting down… ⏳',
    '<small>jours</small>': '<small>days</small>',
    '<small>heures</small>': '<small>hours</small>',
    '📅 Ajouter à mon agenda': '📅 Add to my calendar',
    "C\\'est le grand jour&nbsp;!": "It\\'s the big day!",
}

MODELES = [
  dict(slug='lakay', da="Portes de maison gingerbread qui s'ouvrent, lettrage peint des tap-taps", modele='Lakay', culture='Lakou · maisons gingerbread', langues='Français · créole haïtien', anglais=False,
    fond='fond-lakay.svg', a='Naïka', b='Jonathan', date_txt='Samedi 19 juin 2027', heure='15h00',
    iso='2027-06-19T15:00:00', fin='20270619T233000', debut='20270619T150000',
    lieu='Domaine des Flamboyants', l1='Route de Kenscoff', l2='Chapelle et jardins', l3='Pétion-Ville, Haïti', carte='Pétion-Ville Haïti',
    sub='Nou pral marye · Nous nous marions', ceremonie='Mariage religieux et réception',
    citation=['« Lanmou se yon lakay. »', "L'amour est une maison :", 'venez la remplir avec nous.'],
    programme=[('15h00', 'Bénédiction à la chapelle'), ('16h30', 'Cocktail et photos dans les jardins'), ('18h00', 'Dîner : griot, diri ak djon djon'), ('20h00', 'Bal konpa'), ('23h30', 'Fin de la fête')],
    teintes=[('#1F3A8A', 'Bleu nuit'), ('#C9A227', 'Or')],
    rsvp_titre='Konfime prezans ou · Confirmez votre présence 💌', rsvp_oui='✅ Je serai présent(e)', rsvp_non='❌ Je ne pourrai pas venir',
    demo='Démonstration : sur votre faire-part, ce bouton ouvre WhatsApp vers votre numéro, avec la réponse déjà écrite.',
    tel='+509 00 00 00 00', pied='Nou kontan pataje moman sa a avèk nou 💙❤️', mention='Faire-part de démonstration · couple fictif',
    emojis=['💙', '❤️', '🌺', '💍'],
    palette=dict(cream='#F6F2E8', cream2='#FFFDF7', beige='#E8E1CF', beige2='#F2EDE0', gold='#C9A227', gold_soft='#E3C766', titre='#1F3A8A', ink='#2B2F45', ink_soft='#6B7088', rose='#D2383F', rose_soft='#F2B8BC', rose_deep='#A3122A', fond_doux='#F2EDE0'),
    env=dict(ecran=('#2A4AA0', '#0E1B4D'), corps=('#2A4AA0', '#16296B'), cote='#1F3A8A', bas='#16296B', rabat=('#2E50A8', '#1F3A8A'), sceau=('#E0303F', '#A3122A'), symbole='#FFE7A3', aide='#E3C766'),
    og=dict(voile=('rgba(10,18,50,.35)', 'rgba(10,18,50,.85)'), texte='#FFF3D1', bouton=('#E3C766', '#C9A227'))),

  dict(slug='madras', da="Coiffe tèt maré qui se dénoue, photo dans une fenêtre de case créole", modele='Madras', culture='Madras · tèt maré', langues='Français · créole antillais', anglais=False,
    fond='fond-madras.svg', a='Maëlle', b='Kévin', date_txt='Samedi 10 juillet 2027', heure='16h00',
    iso='2027-07-10T16:00:00', fin='20270711T010000', debut='20270710T160000',
    lieu='Habitation des Alizés', l1='Route de la Pointe', l2='Face à la mer', l3='Le François, Martinique', carte='Le François Martinique',
    sub='Nou ka mayé · Nous nous marions', ceremonie='Cérémonie laïque et réception',
    citation=['« Dé kè, an sèl chimen. »', 'Deux cœurs, un seul chemin :', 'venez le fêter avec nous.'],
    programme=[('16h00', 'Cérémonie face à la mer'), ('17h30', 'Cocktail, accras et ti-punch'), ('19h30', 'Dîner créole'), ('21h30', 'Bal zouk et biguine'), ('01h00', 'Fin de la fête')],
    teintes=[('#E9A800', 'Madras'), ('#FFFFFF', 'Blanc')],
    rsvp_titre='Konfimé si zot ka vini · Confirmez votre présence 💌', rsvp_oui='✅ Je serai présent(e)', rsvp_non='❌ Je ne pourrai pas venir',
    demo='Démonstration : sur votre faire-part, ce bouton ouvre WhatsApp vers votre numéro, avec la réponse déjà écrite.',
    tel='+596 000 00 00 00', pied='Mèsi anpil pou zot prézans 💛❤️', mention='Faire-part de démonstration · couple fictif',
    emojis=['💛', '❤️', '🌺', '🥂'],
    palette=dict(cream='#FFF8EC', cream2='#FFFDF8', beige='#F6E3C1', beige2='#FBEFD8', gold='#C98A00', gold_soft='#F2B705', titre='#B3121E', ink='#3B2A1E', ink_soft='#7A6450', rose='#D62828', rose_soft='#F5B7B1', rose_deep='#9B1B1B', fond_doux='#FBEFD8'),
    env=dict(ecran=('#F2B705', '#B3121E'), corps=('#E9A800', '#C98A00'), cote='#D62828', bas='#9B1B1B', rabat=('#F77F00', '#D62828'), sceau=('#2A9D8F', '#1B6F65'), symbole='#FFF8E7', aide='#FFF8E7'),
    og=dict(voile=('rgba(60,10,10,.30)', 'rgba(40,8,8,.85)'), texte='#FFF8E7', bouton=('#F2B705', '#E9A800'))),

  dict(slug='kente', da="Bandes tissées qui s'ouvrent comme un métier, noir et or, symbole adinkra", modele='Kente', culture='Kente · symboles adinkra', langues='English · twi', anglais=True,
    fond='fond-kente.svg', a='Abena', b='Kwame', date_txt='Saturday 21 August 2027', heure='11:00',
    iso='2027-08-21T11:00:00', fin='20270821T230000', debut='20270821T110000',
    lieu='Golden Palm Gardens', l1='Airport Residential Area', l2='Traditional rites and reception', l3='Accra, Ghana', carte='Accra Ghana',
    sub='Me dɔ wo · We are getting married', ceremonie='Traditional marriage and white wedding',
    citation=['“Odo nnyew fie kwan.”', 'Love never loses', 'its way home.'],
    programme=[('11:00', 'Knocking and traditional rites'), ('14:00', 'Church blessing'), ('17:00', 'Reception and toasts'), ('20:00', 'Highlife and dancing'), ('23:00', 'End of the celebration')],
    teintes=[('#D4A017', 'Kente gold'), ('#0B6E4F', 'Green')],
    rsvp_titre='Kindly confirm your presence 💌', rsvp_oui='✅ I will attend', rsvp_non='❌ I cannot attend',
    demo='Demo: on your invitation, this button opens WhatsApp to your number with the reply already written.',
    tel='+233 00 000 0000', pied='Thank you for being part of our story 💛💚', mention='Demo invitation · fictional couple',
    emojis=['💛', '💚', '❤️', '💍'],
    palette=dict(cream='#FBF5E6', cream2='#FFFDF6', beige='#EFE2BF', beige2='#F6EDD3', gold='#B8860B', gold_soft='#D4A017', titre='#0B6E4F', ink='#1E2A22', ink_soft='#5E6B60', rose='#B3001B', rose_soft='#F0B3B8', rose_deep='#7A0012', fond_doux='#F6EDD3'),
    env=dict(ecran=('#1F6B4F', '#0A0A0A'), corps=('#D4A017', '#B8860B'), cote='#C9971A', bas='#B07F0A', rabat=('#E0B12B', '#D4A017'), sceau=('#B3001B', '#7A0012'), symbole='#F5D06F', aide='#F5D06F'),
    og=dict(voile=('rgba(0,0,0,.35)', 'rgba(0,0,0,.88)'), texte='#F5E6B8', bouton=('#F5D06F', '#D4A017'))),

  dict(slug='owambe', da="Éventail doré qui s'ouvre, couverture de magazine de mode", modele='Owambe', culture='Aso-ebi · gele', langues='English · yoruba', anglais=True,
    fond='fond-owambe.svg', a='Tolu', b='Femi', date_txt='Saturday 4 December 2027', heure='10:00',
    iso='2027-12-04T10:00:00', fin='20271204T230000', debut='20271204T100000',
    lieu='Royal Coral Hall', l1='Admiralty Way', l2='Engagement and reception', l3='Lekki, Lagos, Nigeria', carte='Lekki Lagos Nigeria',
    sub='Ìfẹ́ · We are getting married', ceremonie='Traditional engagement and owambe',
    citation=['“Two families,', 'one love,', 'one big celebration.”'],
    programme=[('10:00', 'Traditional engagement and prayers'), ('13:00', 'White wedding'), ('16:00', 'Owambe reception'), ('19:00', 'Afrobeats and dancing'), ('23:00', 'End of the celebration')],
    teintes=[('#0F5C4A', 'Aso-ebi emerald'), ('#D9B44A', 'Gold')],
    rsvp_titre='Kindly confirm your presence 💌', rsvp_oui='✅ I will attend', rsvp_non='❌ I cannot attend',
    demo='Demo: on your invitation, this button opens WhatsApp to your number with the reply already written.',
    tel='+234 000 000 0000', pied='Thank you for celebrating with us 💚✨', mention='Demo invitation · fictional couple',
    emojis=['💚', '✨', '🥂', '💍'],
    palette=dict(cream='#F3F7F2', cream2='#FCFEFB', beige='#DCE9DF', beige2='#EAF2EC', gold='#B8902C', gold_soft='#D9B44A', titre='#0F5C4A', ink='#1C2B26', ink_soft='#5B6B65', rose='#E2553F', rose_soft='#F6C1B7', rose_deep='#A83420', fond_doux='#EAF2EC'),
    env=dict(ecran=('#13705A', '#03231C'), corps=('#13705A', '#0F5C4A'), cote='#0F5C4A', bas='#0A4537', rabat=('#178066', '#13705A'), sceau=('#E2553F', '#A83420'), symbole='#F3E1A6', aide='#D9B44A'),
    og=dict(voile=('rgba(3,35,28,.30)', 'rgba(2,23,18,.88)'), texte='#F3E1A6', bouton=('#E9C96A', '#D9B44A'))),

  dict(slug='toghu', da="Pans de toghu brodé qui glissent, médaillon royal, nuit et étoiles", modele='Toghu', culture='Toghu · Grassfields', langues='Français', anglais=False,
    fond='fond-toghu.svg', a='Laure', b='Brice', date_txt='Samedi 14 août 2027', heure='11h00',
    iso='2027-08-14T11:00:00', fin='20270814T235900', debut='20270814T110000',
    lieu='Salle des Collines', l1='Quartier Bonapriso', l2='Dot, bénédiction et réception', l3='Douala, Cameroun', carte='Douala Cameroun',
    sub='Deux familles, un même chemin', ceremonie='Dot, mariage religieux et réception',
    citation=['« Deux familles,', 'un même chemin,', 'une seule grande fête. »'],
    programme=[('11h00', 'Dot et cérémonie coutumière'), ('15h00', 'Bénédiction nuptiale'), ('19h00', 'Réception et dîner'), ('21h00', 'Makossa, bikutsi et danse'), ('00h30', 'Fin de la fête')],
    teintes=[('#0B0B0B', 'Toghu noir'), ('#E63946', 'Rouge')],
    rsvp_titre='Confirmez votre présence 💌', rsvp_oui='✅ Je serai présent(e)', rsvp_non='❌ Je ne pourrai pas venir',
    demo='Démonstration : sur votre faire-part, ce bouton ouvre WhatsApp vers votre numéro, avec la réponse déjà écrite.',
    tel='+237 0 00 00 00 00', pied='Merci de partager ce grand jour avec nous ❤️💛', mention='Faire-part de démonstration · couple fictif',
    emojis=['❤️', '💛', '💙', '💍'],
    palette=dict(cream='#F7F4EF', cream2='#FFFDFB', beige='#E7DFD3', beige2='#F1ECE4', gold='#C79A1E', gold_soft='#F4C430', titre='#0B0B0B', ink='#1F1F1F', ink_soft='#666', rose='#E63946', rose_soft='#F5B8BD', rose_deep='#A4161A', fond_doux='#F1ECE4'),
    env=dict(ecran=('#2B2B2B', '#000000'), corps=('#1A1A1A', '#0B0B0B'), cote='#141414', bas='#0B0B0B', rabat=('#222222', '#111111'), sceau=('#E63946', '#A4161A'), symbole='#F4C430', aide='#F4C430'),
    og=dict(voile=('rgba(0,0,0,.35)', 'rgba(0,0,0,.9)'), texte='#F4E3B0', bouton=('#F4C430', '#C79A1E'))),
  # Modèles écrits à la main (directions artistiques) : seules les infos de la vitrine et de l'aperçu servent ici.
  dict(slug='teranga', da="Voile de bazin blanc qui se lève, arabesques et filets dorés", modele='Teranga', culture='Grand boubou · bazin', langues='Français · wolof', anglais=False,
    fond='fond-lakay.svg', a='Awa', b='Ousmane', sub='Teranga', date_txt='Samedi 22 mai 2027', heure='16h00', lieu='Les Almadies', l3='Dakar, Sénégal',
    og=dict(voile=('rgba(30,42,74,.25)', 'rgba(30,42,74,.85)'), texte='#F3E7CF', bouton=('#E3CB95', '#B8954A'))),
  dict(slug='sape', da="Étiquette de couture qui se retourne, catalogue de mode aux couleurs franches", modele='Sape', culture='La Sape · élégance', langues='Français · lingala', anglais=False,
    fond='fond-toghu.svg', a='Grâce', b='Dieudonné', sub='Libala · collection 2027', date_txt='Samedi 18 septembre 2027', heure='11h00', lieu='Salle Mont-Fleury', l3='Gombe, Kinshasa',
    og=dict(voile=('rgba(17,17,17,.2)', 'rgba(17,17,17,.85)'), texte='#F5D90A', bouton=('#F27AB0', '#E83E8C'))),
  dict(slug='champetre', da="Serviette de lin nouée d'un brin de lavande, polaroïd et fleurs des champs", modele='Champêtre', culture='Classique · campagne', langues='Français', anglais=False,
    fond='fond-lakay.svg', a='Clara', b='Julien', sub='On se marie à la campagne', date_txt='Samedi 12 juin 2027', heure='15h30', lieu='Domaine du Moulin', l3='Bourgogne',
    og=dict(voile=('rgba(63,58,47,.15)', 'rgba(63,58,47,.8)'), texte='#F4EFE4', bouton=('#BFC9AE', '#A9B596'))),
  dict(slug='boheme', da="Herbes de la pampa qui s'écartent, arches terre cuite, lumière de fin d'été", modele='Bohème chic', culture='Classique · bohème', langues='Français', anglais=False,
    fond='fond-madras.svg', a='Inès', b='Mathis', sub='On se dit oui', date_txt='Samedi 4 septembre 2027', heure='17h00', lieu='Mas des Oliviers', l3='Provence',
    og=dict(voile=('rgba(74,59,51,.15)', 'rgba(74,59,51,.8)'), texte='#F3E9DD', bouton=('#E7C9BC', '#C9A38A'))),
  dict(slug='classique', da="Enveloppe ivoire au sceau de cire, monogramme et double filet doré", modele='Classique', culture='Classique · intemporel', langues='Français', anglais=False,
    fond='fond-toghu.svg', a='Sarah', b='Thomas', sub='Faire-part de mariage', date_txt='Samedi 26 juin 2027', heure='15h00', lieu='Château de Valmont', l3='Val de Loire',
    og=dict(voile=('rgba(47,42,36,.15)', 'rgba(47,42,36,.8)'), texte='#F5EBD8', bouton=('#E3CFA6', '#B08D57'))),
  dict(slug='kita', da="Mosaïque de carreaux de pagne qui se retournent, grille de tuiles orange et noir", modele='Kita', culture='Pagne kita · tissage baoulé', langues='Français', anglais=False,
    fond='fond-madras.svg', a='Aya', b='Koffi', sub='Akwaba à notre mariage', date_txt='Samedi 9 octobre 2027', heure='10h00', lieu='Jardins de la Riviera', l3='Cocody, Abidjan',
    og=dict(voile=('rgba(26,20,16,.2)', 'rgba(26,20,16,.85)'), texte='#FBF4E8', bouton=('#F0A04B', '#E07A1F'))),
  # Bogolan retiré du catalogue le 11/11 (Parnel : « j'aime pas »), fichiers gardés.
  # dict(slug='bogolan', da="Rouleau de tissu de boue qui se relève, parchemin et frises géométriques", modele='Bogolan', culture='Bogolanfini · terre et teintures', langues='Français · bambara', anglais=False,
  # fond='fond-toghu.svg', a='Fatoumata', b='Moussa', sub='Furu · notre mariage', date_txt='Samedi 13 novembre 2027', heure='10h00', lieu='Domaine du Niger', l3='Bamako, Mali',
  # og=dict(voile=('rgba(59,42,30,.25)', 'rgba(30,26,22,.88)'), texte='#F2E8D5', bouton=('#D8BB94', '#C5A27A'))),
  dict(slug='tibeb', da="Pans de coton blanc à bordures tissées qui s'écartent, croix en ornement", modele='Tibeb', culture='Habesha kemis · tibeb', langues='English · amharique', anglais=True,
    fond='fond-kente.svg', a='Selam', b='Dawit', sub='We are getting married', date_txt='Saturday 25 September 2027', heure='10:00', lieu='Entoto Gardens', l3='Addis Ababa',
    og=dict(voile=('rgba(34,37,43,.2)', 'rgba(34,37,43,.85)'), texte='#FFFFFF', bouton=('#3FA36F', '#1F7A4D'))),
  dict(slug='anniversaire-gala', evenement='anniversaire', da="Rideau de paillettes dorées qui tombe, chiffre monumental, noir et or", modele='Gala', culture='Anniversaire chic', langues='Français', anglais=False,
    fond='fond-toghu.svg', titre_og='Les 50 ans de Nadia', a='Nadia', b='', sub='Soirée gala', date_txt='Samedi 20 mars 2027', heure='20h00', lieu='Le Salon Doré', l3='Paris',
    og=dict(voile=('rgba(11,11,13,.35)', 'rgba(11,11,13,.9)'), texte='#F1D98A', bouton=('#F1D98A', '#D4AF37'))),
  dict(slug='bapteme-nuage', evenement='bapteme', da="Nuages qui s'écartent sur un ciel bleu, colombe, douceur pastel", modele='Nuage', culture='Baptême', langues='Français', anglais=False,
    fond='fond-lakay.svg', titre_og='Le baptême de Léo', a='Léo', b='', sub='Dimanche, jour de fête', date_txt='Dimanche 16 mai 2027', heure='11h00', lieu='Église Saint-Paul', l3='',
    og=dict(voile=('rgba(62,75,92,.2)', 'rgba(62,75,92,.75)'), texte='#EAF3FB', bouton=('#C7DDF1', '#9CC3E6'))),
  dict(slug='gender-reveal', evenement='gender', da="Ballon à éclater, vote des invités, révélation à gratter avec confettis", modele='Surprise', culture='Gender reveal', langues='Français', anglais=False,
    fond='fond-madras.svg', titre_og='Fille ou garçon ?', a='Camille', b='Hugo', sub='Votez avant la révélation', date_txt='Samedi 10 avril 2027', heure='16h00', lieu='Jardin des Lilas', l3='',
    og=dict(voile=('rgba(74,59,71,.2)', 'rgba(74,59,71,.8)'), texte='#FFF6F2', bouton=('#F7A8C4', '#E86A9A'))),
  dict(slug='anniversaire-disco', evenement='anniversaire', da="Boule à facettes qui s'illumine, titres en néon rose et bleu, piste en damier", modele='Disco', culture='Anniversaire festif', langues='Français', anglais=False,
    fond='fond-toghu.svg', titre_og='Les 30 ans de Yanis', a='Yanis', b='', sub='Soirée disco', date_txt='Samedi 5 juin 2027', heure='21h00', lieu='Le Studio 54 bis', l3='Lyon',
    og=dict(voile=('rgba(26,11,46,.35)', 'rgba(26,11,46,.9)'), texte='#FFFFFF', bouton=('#FF3CAC', '#2DE2E6'))),
  dict(slug='anniversaire-tropical', evenement='anniversaire', da="Feuilles de monstera qui s'écartent, couleurs jungle et corail, carte des cocktails", modele='Tropical', culture='Anniversaire en plein air', langues='Français', anglais=False,
    fond='fond-madras.svg', titre_og="Les 18 ans d'Inaya", a='Inaya', b='', sub='Fête tropicale', date_txt='Samedi 17 juillet 2027', heure='18h00', lieu='Villa Palmeraie', l3='',
    og=dict(voile=('rgba(15,81,50,.25)', 'rgba(15,81,50,.85)'), texte='#FFF4E2', bouton=('#FFC845', '#FF7A59'))),
  dict(slug='bapteme-lumiere', evenement='bapteme', da="Cierge qui s'allume et inonde l'écran de lumière, rameaux d'olivier, blanc et or", modele='Lumière', culture='Baptême sobre', langues='Français', anglais=False,
    fond='fond-lakay.svg', titre_og='Le baptême de Gabriel', a='Gabriel', b='', sub='Baptême', date_txt='Dimanche 6 juin 2027', heure='10h30', lieu='Église Notre-Dame', l3='',
    og=dict(voile=('rgba(51,53,44,.2)', 'rgba(51,53,44,.8)'), texte='#FBF9F4', bouton=('#E3D3A6', '#C2A15C'))),
  dict(slug='bapteme-etoiles', evenement='bapteme', da="Nuit étoilée et croissant de lune, la nuit devient aube, bleu nuit et or", modele='Petite étoile', culture='Baptême', langues='Français', anglais=False,
    fond='fond-toghu.svg', titre_og='Le baptême de Maël', a='Maël', b='', sub='Une petite étoile est née', date_txt='Dimanche 26 septembre 2027', heure='11h00', lieu='Chapelle Sainte-Anne', l3='',
    og=dict(voile=('rgba(20,33,61,.35)', 'rgba(20,33,61,.9)'), texte='#E8C66A', bouton=('#F3DC97', '#E8C66A'))),
  dict(slug='gender-boite', evenement='gender', da="Boîte cadeau dont le couvercle se soulève, ballons rose et bleu qui s'envolent, jauge des pronostics", modele='Boîte à ballons', culture='Gender reveal', langues='Français', anglais=False,
    fond='fond-madras.svg', titre_og='Rose ou bleu ?', a='Awa', b='Thomas', sub='Ouvrez la boîte', date_txt='Samedi 22 mai 2027', heure='15h00', lieu='La Maison des Roses', l3='',
    og=dict(voile=('rgba(59,51,48,.2)', 'rgba(59,51,48,.8)'), texte='#FFFBF6', bouton=('#E8A9B8', '#9CC3DE'))),
  dict(slug='gender-secret', evenement='gender', da="Dossier kraft tamponné « confidentiel », rapport tapé à la machine, passages caviardés à toucher", modele='Top secret', culture='Gender reveal', langues='Français', anglais=False,
    fond='fond-kente.svg', titre_og='Dossier top secret', a='Fatou', b='Kevin', sub='Fille ou garçon ?', date_txt='Samedi 12 juin 2027', heure='16h00', lieu='Le Loft des Tilleuls', l3='Montreuil',
    og=dict(voile=('rgba(43,42,39,.3)', 'rgba(43,42,39,.9)'), texte='#F4EFE3', bouton=('#C9A877', '#B3261E'))),
]


# Grain de papier (bruit très léger), réutilisé sur le rabat.
GRAIN = base64.b64encode(b"""<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0'/></filter><rect width='160' height='160' filter='url(#g)'/></svg>""").decode()


def pochette(e):
    """Pochette de l'enveloppe en un seul dessin (380 × 260, étiré) : côtés puis bas par-dessus, plis ombrés."""
    c, b = e['cote'], e['bas']
    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 380 260' preserveAspectRatio='none'>
<defs>
 <linearGradient id='l' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.10'/></linearGradient>
 <linearGradient id='r' x1='1' y1='0' x2='0' y2='0'><stop offset='0' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.10'/></linearGradient>
 <linearGradient id='b' x1='0' y1='1' x2='0' y2='0'><stop offset='0' stop-color='#fff' stop-opacity='0'/><stop offset='1' stop-color='#fff' stop-opacity='.06'/></linearGradient>
 <linearGradient id='o' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000' stop-opacity='.22'/><stop offset='1' stop-color='#000' stop-opacity='0'/></linearGradient>
 <filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .06 0'/></filter>
</defs>
<path d='M0 0 L196 142 L0 260Z' fill='{c}'/><path d='M0 0 L196 142 L0 260Z' fill='url(#l)'/>
<path d='M380 0 L184 142 L380 260Z' fill='{c}'/><path d='M380 0 L184 142 L380 260Z' fill='url(#r)'/>
<path d='M0 260 L190 118 L380 260Z' fill='#000' opacity='.18' transform='translate(0 -3)'/>
<path d='M0 260 L190 118 L380 260Z' fill='{b}'/><path d='M0 260 L190 118 L380 260Z' fill='url(#b)'/>
<path d='M0 260 L190 118 L380 260' fill='none' stroke='#fff' stroke-opacity='.18' stroke-width='1'/>
<path d='M0 0 L190 138 L380 0' fill='none' stroke='#000' stroke-opacity='.12' stroke-width='1.2'/>
<clipPath id='p'><path d='M0 0 L190 140 L380 0 L380 260 L0 260Z'/></clipPath>
<rect width='380' height='260' filter='url(#g)' clip-path='url(#p)'/>
</svg>"""
    return base64.b64encode(svg.encode()).decode()


def fabriquer(m):
    s = SOURCE.read_text(encoding='utf-8')

    def rempl(vieux, neuf, compte=1):
        nonlocal s
        n = s.count(vieux)
        if n != compte:
            sys.exit(f"[{m['slug']}] attendu {compte}, trouvé {n} : {vieux[:70]}")
        s = s.replace(vieux, neuf)

    def sub_re(motif, neuf):
        nonlocal s
        s, n = re.subn(motif, lambda _: neuf, s, count=1, flags=re.S)
        if n != 1:
            sys.exit(f"[{m['slug']}] motif introuvable : {motif[:60]}")

    a, b, p, e = m['a'], m['b'], m['palette'], m['env']
    et = 'and' if m['anglais'] else 'et'
    couple = f'{a} &amp; {b}'

    # La photo des vrais mariés est remplacée par le décor dessiné du modèle.
    fond = base64.b64encode((OUTILS / m['fond']).read_bytes()).decode()
    sub_re(r'url\("data:image/[^"]+"\) center/cover no-repeat;', f'url("data:image/svg+xml;base64,{fond}") center/cover no-repeat;')

    sub_re(r'/\* Palette mariage : rose · or · blanc \*/.*?--rose-deep:#C24C66;',
           f"/* Palette « {m['modele']} » */\n    --cream:{p['cream']}; --cream2:{p['cream2']}; --beige:{p['beige']}; --beige2:{p['beige2']};\n"
           f"    --gold:{p['gold']}; --gold-soft:{p['gold_soft']}; --olive:{p['titre']}; --ink:{p['ink']}; --ink-soft:{p['ink_soft']};\n"
           f"    --rose:{p['rose']}; --rose-soft:{p['rose_soft']}; --rose-deep:{p['rose_deep']};")
    rempl('<meta name="theme-color" content="#F7DCE6" />', f'<meta name="theme-color" content="{e["ecran"][1]}" />')

    titre_page = 'Wedding (demo)' if m['anglais'] else 'Mariage (démonstration)'
    rempl('<title>Falencie & Martin — Mariage</title>', f'<title>{a} & {b} — {titre_page}</title>')
    rempl('content="Falencie & Martin — Notre Mariage 💗"', f'content="{a} & {b} — {m["sub"]}"')
    sub_re(r'content="12 septembre 2026 · 10h30 · Orix Hôtel, Ouanaminthe \(Haïti\)\. Rejoignez-nous pour célébrer notre union\."',
           f'content="{m["date_txt"]} · {m["heure"]} · {m["lieu"]}, {m["l3"]}."')
    rempl('content="Faire-part de mariage Falencie & Martin — 12 septembre 2026"', f'content="{a} & {b} — {m["date_txt"]}"')
    rempl('https://edouardparnel-dotcom.github.io/falencie-martin/preview-v8.jpg', 'apercu-whatsapp.jpg', 2)

    rempl('<div class="ln">Falencie et Martin</div>', f'<div class="ln">{a} {et} {b}</div>')
    # Enveloppe d'une seule pièce : la pochette (côtés + bas) devient un seul dessin, sans jointure.
    rempl("""      <div class="tri tri-l"></div>
      <div class="tri tri-r"></div>
      <div class="tri tri-b"></div>
      <div class="flap"></div>""", f"""      <div class="tri tri-b"></div>
      <div class="flap-ombre"></div>
      <div class="flap"></div>
      <div class="sceau">{a[0]}&amp;{b[0]}</div>""")
    rempl('<h1 class="names">Falencie &amp; Martin</h1>', f'<h1 class="names">{couple}</h1>')
    rempl('<p class="sub">Nous nous marions</p>', f'<p class="sub">{m["sub"]}</p>')
    rempl('<h2 class="names">Falencie &amp; Martin</h2>', f'<h2 class="names">{couple}</h2>')
    rempl('<p class="civil">Cérémonie de mariage</p>', f'<p class="civil">{m["ceremonie"]}</p>')
    sub_re(r'<span>« Deux âmes, un cœur, une promesse…</span>.*?<span>l\'amour qui nous unit à jamais\. »</span>',
           '\n        '.join(f'<span>{c}</span>' for c in m['citation']))

    rempl('<b>12 Septembre 2026</b>', f'<b>{m["date_txt"]}</b>')
    rempl('<small>À 10h30</small>', f'<small>{"At" if m["anglais"] else "À"} {m["heure"]}</small>')
    rempl('<b>Orix Hôtel</b>', f'<b>{m["lieu"]}</b>')
    rempl('<p>Rue Lamine #41</p>', f'<p>{m["l1"]}</p>')
    rempl('<p>À côté du Collège Univers</p>', f'<p>{m["l2"]}</p>')
    rempl('<p>Ouanaminthe, Haïti</p>', f'<p>{m["l3"]}</p>')
    rempl('query=Orix+Hotel+Ouanaminthe+Haiti', 'query=' + m['carte'].replace(' ', '+'))

    items = [f'<div class="prog-item"><span class="prog-h">{h}</span><span class="prog-q">{t}</span></div>' for h, t in m['programme']]
    items[-1] = items[-1].replace('class="prog-item"', 'class="prog-item fin"')
    sub_re(r'<div class="prog-liste">.*?</div>\s*</div>', '<div class="prog-liste">\n          ' + '\n          '.join(items) + '\n        </div>')

    (c1, n1), (c2, n2) = m['teintes']
    rempl('<div class="teinte"><div class="pastille champagne"></div><span>Champagne</span></div>',
          f'<div class="teinte"><div class="pastille champagne" style="background:{c1};border:1px solid rgba(0,0,0,.15)"></div><span>{n1}</span></div>')
    rempl('<div class="teinte"><div class="pastille rose-poudre"></div><span>Rose poudré</span></div>',
          f'<div class="teinte"><div class="pastille rose-poudre" style="background:{c2};border:1px solid rgba(0,0,0,.15)"></div><span>{n2}</span></div>')

    # Réponses : boutons WhatsApp inactifs (aucun vrai numéro dans une démonstration).
    sub_re(r'<div class="rsvp reveal">.*?</div>\s*(?=<div class="end">)', f"""<div class="rsvp reveal">
        <h3 class="rsvp-title">{m['rsvp_titre']}</h3>
        <div class="rsvp-btns">
          <a class="rsvp-btn yes demo-rsvp" href="#">{m['rsvp_oui']}</a>
          <a class="rsvp-btn no demo-rsvp" href="#">{m['rsvp_non']}</a>
        </div>
        <p class="rsvp-mail">WhatsApp : {m['tel']}</p>
        <p class="rsvp-mail" id="demoMsg" style="display:none;color:var(--rose-deep);font-weight:600">{m['demo']}</p>
      </div>

      """)
    rempl('<p class="foot">Au plaisir de partager ce moment avec vous 💗</p>',
          f'<p class="foot">{m["pied"]}<br><small>{m["mention"]}</small></p>')

    sub_re(r"// Compte à rebours \(12 septembre 2026, 10h30[^\n]*", '// Compte à rebours (heure locale de l\'événement)')
    rempl("new Date('2026-09-12T10:30:00')", f"new Date('{m['iso']}')")
    rempl("'PRODID:-//FalencieMartin//Mariage//FR'", f"'PRODID:-//Demo//{m['slug']}//FR'")
    rempl("'BEGIN:VEVENT','UID:falencie-martin-2026-09-12@wedding',", f"'BEGIN:VEVENT','UID:{m['slug']}-demo@faire-part',")
    rempl("'DTSTAMP:20260101T000000Z','DTSTART:20260912T103000','DTEND:20260912T163000',",
          f"'DTSTAMP:20270101T000000Z','DTSTART:{m['debut']}','DTEND:{m['fin']}',")
    rempl("'SUMMARY:💍 Mariage de Falencie & Martin',", f"'SUMMARY:💍 {a} & {b}',")
    rempl("'LOCATION:Orix Hôtel\\\\, Rue Lamine #41\\\\, Ouanaminthe\\\\, Haïti',",
          f"'LOCATION:{m['lieu']}\\\\, {m['l1']}\\\\, {m['l3'].replace(',', chr(92) * 2 + ',')}',")
    sub_re(r"'DESCRIPTION:Cérémonie de mariage de Falencie & Martin\.[^']*',", f"'DESCRIPTION:{a} & {b} ({m['mention']})',")
    rempl("a.download='mariage-falencie-martin.ics';", f"a.download='{m['slug']}-demo.ics';")
    rempl("const hearts=['💗','🤍','💍','🌿'];", 'const hearts=[' + ','.join(f"'{x}'" for x in m['emojis']) + '];')
    rempl('  </script>\n</body>', """    document.querySelectorAll('.demo-rsvp').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();document.getElementById('demoMsg').style.display='block';}));
  </script>
</body>""")

    if m['anglais']:
        for fr, en in EN.items():
            rempl(fr, en)

    # Enveloppe et touches de couleur du modèle (surcharge des roses d'origine).
    rempl('</style>', f"""  /* ── Thème « {m['modele']} » ── */
  .env-screen{{background:radial-gradient(circle at 50% 32%, {e['ecran'][0]} 0%, {e['ecran'][1]} 80%)}}
  .envelope{{filter:drop-shadow(0 24px 44px rgba(0,0,0,.45))}}
  .envelope{{perspective:1400px}}
  /* fond de l'enveloppe = doublure dans le tissu du modèle, visible quand le rabat s'ouvre */
  .env-body{{background:url("data:image/svg+xml;base64,{fond}") center/cover; border-radius:10px;
    box-shadow:inset 0 0 0 9999px rgba(0,0,0,.12)}}
  .letter{{border:2px solid var(--gold-soft); box-shadow:0 6px 16px rgba(0,0,0,.25)}}
  /* pochette d'une seule pièce : côtés et bas dessinés ensemble, plis ombrés, grain du papier */
  .tri-b{{clip-path:none; border-radius:0 0 10px 10px; background:url("data:image/svg+xml;base64,{pochette(e)}") center/100% 100% no-repeat}}
  .flap-ombre{{position:absolute; inset:0; z-index:5; clip-path:polygon(0 0,100% 0,50% 65%);
    background:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(0,0,0,.30) 100%); transition:opacity .3s}}
  .envelope.open .flap-ombre{{opacity:0}}
  .flap{{clip-path:polygon(0 0,100% 0,50% 60%); border-radius:10px 10px 0 0;
    background:url("data:image/svg+xml;base64,{GRAIN}"), linear-gradient(180deg,{e['rabat'][0]} 0%,{e['rabat'][1]} 100%);
    transition:transform .6s ease, background 0s .3s}}
  .envelope.open .flap{{background:url("data:image/svg+xml;base64,{fond}") center/cover}}
  /* sceau de cire aux initiales */
  .sceau{{position:absolute; left:50%; top:58%; transform:translate(-50%,-50%); z-index:7; width:62px; height:62px;
    border-radius:48% 52% 50% 50% / 52% 47% 53% 48%;
    background:radial-gradient(circle at 34% 28%, rgba(255,255,255,.45) 0 6%, transparent 18%), radial-gradient(circle at 50% 50%, {e['sceau'][0]} 0 52%, {e['sceau'][1]} 72%);
    box-shadow:0 3px 7px rgba(0,0,0,.45), inset 0 0 0 5px rgba(0,0,0,.14), inset 0 0 0 7px rgba(255,255,255,.12);
    color:{e['symbole']}; font-family:'Great Vibes',cursive; font-size:22px; line-height:62px; text-align:center;
    text-shadow:0 1px 0 rgba(0,0,0,.35); transition:opacity .25s}}
  .envelope.open .sceau{{opacity:0}}
  .env-hint{{color:{e['aide']}}}
  .scroll-hint{{background:linear-gradient(135deg,var(--gold-soft) 0%,var(--gold) 100%); color:#1F1A0A; box-shadow:0 12px 26px -12px rgba(0,0,0,.6)}}
  .quote,.dress{{background:{p['fond_doux']}}}
</style>""")

    for nom in ['Falencie', 'Martin', 'Ouanaminthe', 'Orix', 'dumais', 'Lamine']:
        if re.search(rf'\b{nom}\b', s):
            sys.exit(f"[{m['slug']}] reste : {nom}")
    dossier = VITRINE / m['slug']
    dossier.mkdir(exist_ok=True)
    (dossier / 'index.html').write_text(s, encoding='utf-8')
    apercu(m, dossier)


def apercu(m, dossier):
    """Image d'aperçu WhatsApp (1200 × 630) : og.html rendu par Edge sans fenêtre, puis JPEG."""
    o = m['og']
    fond_og = 'photo.jpg' if (dossier / 'photo.jpg').exists() else f"../_outils/{m['fond']}"
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{{font-family:'Great Vibes';src:url('../_outils/gv.ttf') format('truetype');font-display:block}}
  *{{margin:0;padding:0;box-sizing:border-box}} html,body{{width:1200px;height:630px;overflow:hidden}}
  .card{{position:relative;width:1200px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:Georgia,serif}}
  .card::before{{content:"";position:absolute;inset:0;background:linear-gradient(180deg,{o['voile'][0]},{o['voile'][1]}),url('{fond_og}') center 30%/cover no-repeat}}
  .card>*{{position:relative}}
  .names{{font-family:'Great Vibes',cursive;color:#fff;font-size:128px;line-height:1.02;text-shadow:0 2px 18px rgba(0,0,0,.6)}}
  .sub{{font-size:30px;color:{o['texte']};margin:6px 0 26px}} .date{{font-size:34px;font-weight:600;color:#fff}}
  .venue{{font-size:24px;color:{o['texte']};margin-top:8px}}
  .pill{{margin-top:30px;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#1F1A0A;background:linear-gradient(135deg,{o['bouton'][0]},{o['bouton'][1]});padding:14px 34px;border-radius:999px}}
</style></head><body><div class="card">
  <div class="names">{m.get('titre_og') or (m['a'] + ' &amp; ' + m['b'])}</div><div class="sub">{m['sub']}</div>
  <div class="date">{m['date_txt']} · {m['heure']}</div><div class="venue">{m['lieu']}{(' · ' + m['l3']) if m['l3'] else ''}</div>
  <div class="pill">{'Tap to open' if m['anglais'] else 'Appuyez pour ouvrir'} 💌</div></div></body></html>"""
    og = dossier / '_og.html'
    og.write_text(html, encoding='utf-8')
    png = dossier / '_og.png'
    subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=2000',
                    f'--screenshot={png}', '--window-size=1200,630', og.as_uri()], capture_output=True, timeout=60)
    subprocess.run(['powershell', '-NoProfile', '-Command',
                    "Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Image]::FromFile($env:PNG);"
                    "$c=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|?{$_.MimeType -eq 'image/jpeg'};"
                    "$p=New-Object System.Drawing.Imaging.EncoderParameters 1;"
                    "$p.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality),86L;"
                    "$i.Save($env:JPG,$c,$p);$i.Dispose()"],
                   env={**__import__('os').environ, 'PNG': str(png), 'JPG': str(dossier / 'apercu-whatsapp.jpg')}, check=True)
    og.unlink(); png.unlink()


EVENEMENTS = [('mariage', 'Mariage'), ('anniversaire', 'Anniversaire'), ('bapteme', 'Baptême'), ('gender', 'Gender reveal')]


def vitrine():
    """Page d'accueil de la plateforme : onglets par type d'événement, espace organisateur, niveaux de personnalisation."""
    def carte(m):
        legende = f"{m['a']} et {m['b']}" if m.get('b') else m.get('titre_og', m['a'])
        return f"""      <a class="carte" data-evt="{m.get('evenement', 'mariage')}" href="{m['slug']}/index.html">
        <img src="{m['slug']}/apercu-whatsapp.jpg" alt="Modèle {m['modele']} : {legende}" loading="lazy">
        <div class="infos"><h3>{m['modele']}</h3><p class="culture">{m['culture']}</p><p class="langues">{m['langues']}</p><p class="da">{m['da']}</p>
        <span class="voir">Voir la démonstration →</span></div>
      </a>"""
    # Un modèle n'apparaît sur l'accueil qu'une fois sa photo en place.
    visibles = [m for m in MODELES if (VITRINE / m['slug'] / 'photo.jpg').exists()]
    onglets = '\n'.join(f'    <button role="tab" data-onglet="{k}" aria-selected="{str(k == "mariage").lower()}">{lib} <span>{sum(1 for m in visibles if m.get("evenement", "mariage") == k)}</span></button>' for k, lib in EVENEMENTS)
    cartes = '\n'.join(carte(m) for m in visibles)
    html = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<title>Faire-part interactifs</title>
<meta name="robots" content="noindex">
<meta property="og:title" content="Faire-part interactifs : mariage, anniversaire, baptême, gender reveal">
<meta property="og:description" content="Des invitations à ouvrir sur le téléphone, chacune avec sa direction artistique, et un espace pour organiser tout l'événement.">
<meta property="og:image" content="https://maisonvivat.com/lakay/apercu-whatsapp.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root{{--fond:#FAF7F2;--carte:#fff;--texte:#1F1C19;--doux:#6F685F;--or:#A8834A;--bord:#E9E2D6;--noir:#1F1C19}}
  @media (prefers-color-scheme:dark){{:root{{--fond:#14120F;--carte:#1D1A16;--texte:#F2EDE4;--doux:#A39B90;--or:#D9B26E;--bord:#2E2A24;--noir:#F2EDE4}}}}
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:'Inter',system-ui,sans-serif;background:var(--fond);color:var(--texte);line-height:1.55}}
  .haut{{max-width:1120px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;padding:18px 16px}}
  .marque{{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:26px}}
  .haut a{{color:var(--texte);font-size:14px;text-decoration:none;border:1px solid var(--bord);border-radius:999px;padding:8px 14px}}
  .hero{{max-width:860px;margin:0 auto;padding:30px 16px 20px;text-align:center}}
  .hero h1{{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(34px,6vw,58px);line-height:1.05}}
  .hero h1 em{{color:var(--or)}}
  .hero p{{color:var(--doux);margin:14px auto 0;max-width:620px}}
  .onglets{{position:sticky;top:0;z-index:5;background:var(--fond);display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:14px 16px;border-bottom:1px solid var(--bord)}}
  .onglets button{{font:inherit;font-size:14px;border:1px solid var(--bord);background:var(--carte);color:var(--texte);border-radius:999px;padding:9px 16px;cursor:pointer}}
  .onglets button span{{color:var(--doux);font-size:12px;margin-left:4px}}
  .onglets button[aria-selected="true"]{{background:var(--noir);color:var(--fond);border-color:var(--noir)}}
  .onglets button[aria-selected="true"] span{{color:inherit;opacity:.7}}
  .grille{{max-width:1120px;margin:0 auto;padding:22px 16px 40px;display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:18px}}
  .carte{{background:var(--carte);border:1px solid var(--bord);border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s}}
  .carte:hover{{transform:translateY(-3px);box-shadow:0 14px 30px -18px rgba(0,0,0,.35)}}
  .carte[hidden]{{display:none}}
  .carte img{{display:block;width:100%;aspect-ratio:1200/630;object-fit:cover;background:var(--bord)}}
  .infos{{padding:16px 18px 18px}} h3{{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:26px;line-height:1.1}}
  .culture{{font-weight:600;color:var(--or)}} .langues{{color:var(--doux);font-size:13px}} .da{{margin-top:8px;font-size:14px}}
  .voir{{display:inline-block;margin-top:10px;font-weight:600;font-size:14px}}
  section.bloc{{max-width:1120px;margin:0 auto;padding:30px 16px}}
  section.bloc h2{{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(28px,4vw,40px);text-align:center}}
  section.bloc > p{{text-align:center;color:var(--doux);max-width:640px;margin:8px auto 22px}}
  .fonctions{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}}
  .fonction{{display:block;text-decoration:none;color:inherit;background:var(--carte);border:1px solid var(--bord);border-radius:14px;padding:16px;transition:border-color .2s,transform .2s}}
  .fonction:hover{{border-color:var(--or);transform:translateY(-2px)}}
  .fonction i{{display:block;margin-top:8px;font-style:normal;font-weight:600;font-size:13px;color:var(--or)}}
  section[hidden]{{display:none}}
  .fonction b{{display:block;font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;font-size:21px}}
  .fonction span{{font-size:14px;color:var(--doux)}}
  .cta{{text-align:center;margin-top:22px}}
  .cta a{{display:inline-block;background:var(--noir);color:var(--fond);text-decoration:none;border-radius:10px;padding:13px 22px;font-weight:500}}
  .niveaux{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}}
  .niv{{background:var(--carte);border:1px solid var(--bord);border-radius:16px;padding:20px}}
  .niv h3{{font-size:24px}} .niv .prix{{color:var(--or);font-weight:600;margin:4px 0 10px}}
  .niv ul{{padding-left:18px;color:var(--doux);font-size:14px}}
  footer{{text-align:center;color:var(--doux);font-size:13px;padding:10px 16px 40px}}
</style></head><body>
<div class="haut"><span class="marque">Faire-part interactifs</span><a href="espace/#tableau">Espace mariage</a></div>
<div class="hero">
  <h1>Une invitation qui s'ouvre, <em>pour chaque moment</em> de la vie</h1>
  <p>Mariage, anniversaire, baptême, gender reveal : un lien à envoyer sur WhatsApp, une direction artistique unique, et tout l'événement organisé au même endroit.</p>
</div>
<div class="onglets" role="tablist" aria-label="Type d'événement">
{onglets}
</div>
<main class="grille" id="grille">
{cartes}
</main>
<section class="bloc" id="espace" data-evt="mariage">
  <h2>Votre espace mariage</h2>
  <p>Un espace privé pour organiser tout le mariage. Touchez une partie pour l'ouvrir : chaque élément s'ajoute, se modifie et se supprime depuis l'espace.</p>
  <div class="fonctions">
    <a class="fonction" href="espace/#mariage"><b>Mon mariage</b><span>Prénoms, date, lieu, modèle du faire-part et budget total.</span><i>Modifier →</i></a>
    <a class="fonction" href="espace/#tableau"><b>Les réponses</b><span>Qui vient, qui ne vient pas, qui n'a pas répondu, en un coup d'œil.</span><i>Ouvrir →</i></a>
    <a class="fonction" href="espace/#invites"><b>Les invités</b><span>Ajouter, renommer, supprimer, changer une réponse ; envoi et relances par WhatsApp ou courriel.</span><i>Modifier →</i></a>
    <a class="fonction" href="espace/#tables"><b>Le plan de table</b><span>Créer et renommer les tables, choisir le nombre de places, placer chaque invité.</span><i>Modifier →</i></a>
    <a class="fonction" href="espace/#budget"><b>Le budget</b><span>Ajouter un prestataire, noter un paiement, voir ce qu'il reste.</span><i>Modifier →</i></a>
    <a class="fonction" href="espace/#planning"><b>Le planning</b><span>Ajouter une tâche, la faire avancer de « à faire » à « fait », la renommer.</span><i>Modifier →</i></a>
    <a class="fonction" href="espace/#photos"><b>Le mur photo</b><span>Les photos de vos invités en direct ; vous retirez celles que vous ne voulez pas.</span><i>Ouvrir →</i></a>
    <a class="fonction" href="espace/#livre-or"><b>Le livre d'or et la musique</b><span>Leurs mots et leurs chansons ; vous gardez la main sur ce qui s'affiche.</span><i>Ouvrir →</i></a>
    <a class="fonction" href="espace/#jeux"><b>Les jeux</b><span>Quiz, pronostics, bingo, coin des enfants : vous activez ceux que vous voulez.</span><i>Choisir →</i></a>
  </div>
  <div class="cta"><a href="espace/#tableau">Ouvrir l'espace mariage →</a></div>
</section>
<section class="bloc">
  <h2>La personnalisation, à votre mesure</h2>
  <p>Chaque modèle se personnalise : vos prénoms, vos photos, vos lieux, vos couleurs.</p>
  <div class="niveaux">
    <div class="niv"><h3>Essentiel</h3><p class="prix">à partir de 79 €</p><ul><li>Le modèle choisi, tel quel</li><li>Vos prénoms, photos, lieux, horaires et langue</li><li>Lien prêt en 72 h</li></ul></div>
    <div class="niv"><h3>Personnalisé</h3><p class="prix">à partir de 179 €</p><ul><li>Le modèle adapté : couleurs, tissu, motifs</li><li>Sections au choix et espace organisateur</li><li>Une série de retouches</li></ul></div>
    <div class="niv"><h3>Sur mesure</h3><p class="prix">à partir de 349 €</p><ul><li>Une direction artistique créée pour vous</li><li>Deux cultures réunies, ouverture unique</li><li>Mur photo et album privé après la fête</li></ul></div>
  </div>
</section>
<footer>Démonstrations avec des personnes fictives. Photos Pexels.</footer>
<script>
  // Onglets : n'affiche que les modèles du type d'événement choisi (onglet retenu dans l'adresse).
  const boutons = [...document.querySelectorAll('[data-onglet]')], cartes = [...document.querySelectorAll('[data-evt]')];
  function choisir(k) {{
    boutons.forEach(b => b.setAttribute('aria-selected', String(b.dataset.onglet === k)));
    cartes.forEach(c => c.hidden = c.dataset.evt !== k);  // cartes et espace mariage
    history.replaceState(null, '', '#' + k);
  }}
  boutons.forEach(b => b.addEventListener('click', () => choisir(b.dataset.onglet)));
  choisir(boutons.some(b => b.dataset.onglet === location.hash.slice(1)) ? location.hash.slice(1) : 'mariage');
</script>
</body></html>"""
    (VITRINE / 'index.html').write_text(html, encoding='utf-8')


if __name__ == '__main__':
    # Modèles refaits à la main avec leur propre direction artistique : on ne les régénère plus.
    SUR_MESURE = {m['slug'] for m in MODELES}
    for m in MODELES:
        if m['slug'] in SUR_MESURE:
            if not (VITRINE / m['slug'] / 'photo.jpg').exists():
                print('photo manquante', m['slug']); continue
            apercu(m, VITRINE / m['slug'])
            continue
        fabriquer(m)
        print('ok', m['slug'])
    # Les quatre sites (mariage à la racine, puis anniversaires, baptêmes, gender reveal) et le bas de page de chaque invitation.
    import sites
    sites.construire_sites(MODELES, VITRINE)
    import anglais
    anglais.construire()
    for m in MODELES:
        page = VITRINE / m['slug'] / 'index.html'
        # Les collections réalistes (moodboard + suite) ont leur propre navigation : on n'y ajoute pas l'ancien bas de page.
        if (VITRINE / m['slug'] / 'photo.jpg').exists() and '_commun/suite.css' not in page.read_text(encoding='utf-8'):
            sites.pied_modele(m, page)
    print('vitrine ok')
