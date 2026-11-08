// Modèles de départ pour la partie « Guide de la cérémonie » (option guide) : les organisateurs choisissent un modèle,
// puis l'adaptent à leurs familles. Format du texte : une étape par bloc (ligne vide entre deux), la première ligne
// est le titre, les suivantes l'explication ; une ligne qui commence par « Conseil : » devient un « bon à savoir ».
// Les usages varient d'une famille et d'une région à l'autre : ces textes restent généraux et se relisent avant publication.
export const GUIDES = {
  dot: { nom: 'La dot (Cameroun, Congo, Gabon)', intro: "La dot scelle l\'alliance entre deux familles. Voici comment elle se déroule chez nous, pour la vivre avec nous.", texte:
`L'arrivée de la famille du marié
La famille du marié arrive ensemble, souvent en chantant, et attend d'être accueillie. Chaque famille a son porte-parole : ce sont eux qui parlent, pas les mariés.

La présentation de la dot
La famille du marié présente ce qui a été demandé : boissons, pagnes, cadeaux pour les parents et les oncles. La liste a été discutée à l'avance ; on la vérifie devant tous, parfois avec humour.
Conseil : les échanges peuvent sembler âpres, c'est un jeu codifié. On rit, on applaudit, on ne s'en mêle pas.

La présentation de la mariée
Dans certaines familles, on présente d'abord d'autres jeunes femmes voilées avant la vraie mariée. Quand elle apparaît, elle dit publiquement qu'elle accepte.

La bénédiction
Les aînés bénissent le couple. Le partage d'une boisson entre les deux familles marque l'accord.

La fête
Repas, danses et musique : les deux familles n'en font plus qu'une.
Conseil : une tenue en pagne ou dans les couleurs choisies par la famille fait toujours plaisir.` },
  knocking: { nom: 'Le knocking et le mariage traditionnel (Ghana)', intro: "Avant ou le jour même du mariage, le mariage traditionnel unit les familles. Voici les grands moments.", texte:
`Le knocking
La famille du marié « frappe à la porte » de celle de la mariée, avec des boissons, pour demander officiellement sa main. C'est souvent fait avant le jour J, en petit comité.

L'accueil et les présentations
Les deux familles se présentent l'une à l'autre. Un porte-parole mène les échanges de chaque côté.

La remise des présents
La famille du marié remet les présents demandés : tissus, bijoux, boissons, enveloppes pour les parents. Chaque présent est montré et accepté.
Conseil : applaudissez à chaque présent accepté, c'est une marque de joie.

La mariée donne son accord
On demande à la mariée, devant tous, si elle accepte les boissons et donc le mariage. Son « oui » est accueilli par des cris de joie.

La bénédiction et la fête
Les aînés prient et bénissent le couple, puis vient la fête.
Conseil : le kente est à l'honneur ; si les familles ont choisi un tissu, il est apprécié de le porter.` },
  yoruba: { nom: 'Le mariage traditionnel yoruba (Nigeria)', intro: "Le mariage traditionnel yoruba est joyeux, coloré et très codifié. Voici ce qui vous attend.", texte:
`Les maîtresses de cérémonie
Chaque famille a son alága, une maîtresse de cérémonie qui anime, plaisante et guide chaque étape, souvent en yoruba.

L'arrivée du marié
Le marié et ses amis se prosternent devant la famille de la mariée en signe de respect, parfois plusieurs fois.

L'arrivée de la mariée
La mariée entre, accompagnée, et s'agenouille devant ses parents, puis devant ceux du marié, pour recevoir leurs bénédictions.

Le choix du marié
La mariée choisit son mari parmi les invités et lui pose sur la tête son chapeau, le fila : c'est le moment le plus attendu.

La fête
Danses, musique et « spraying » : on lance des billets sur les mariés qui dansent.
Conseil : si les familles ont choisi un tissu commun (aso ebi), le porter montre que vous êtes de la fête. Prévoyez de petites coupures pour le spraying.` },
  ivoire: { nom: 'La dot et le mariage coutumier (Côte d\'Ivoire)', intro: "La dot est la première étape de notre union, celle des familles. Voici comment elle se déroule.", texte:
`Les porte-parole
Chaque famille délègue un porte-parole. Les échanges suivent des règles anciennes, avec proverbes et humour.

La demande
La famille du marié expose sa démarche et demande la main de la mariée.

Les présents
La famille du marié remet la dot : boissons, pagnes, cadeaux, enveloppes. Son contenu varie selon les régions et les familles.

Le consentement de la mariée
On s'assure devant tous que la mariée accepte. Son accord rend l'union effective aux yeux des familles.

Le repas et les danses
La fête réunit les deux familles autour d'un grand repas.
Conseil : une tenue en pagne est la bienvenue ; renseignez-vous sur les couleurs choisies.` },
  senegal: { nom: 'Le mariage au Sénégal', intro: "Au Sénégal, le mariage se vit en plusieurs temps. Voici ce qui vous attend.", texte:
`Le takk
L'union religieuse est scellée à la mosquée, entre hommes des deux familles, souvent en l'absence des mariés. La dot y est remise.

Le mariage civil
À la mairie, pour ceux qui le célèbrent, en présence des témoins.

La fête
Repas, musique, griots qui chantent les familles : la teranga, l'hospitalité, est au cœur de tout.
Conseil : les tenues de fête (grand boubou, bazin) sont de mise ; on aime les couleurs.

La conduite de la mariée
Le soir ou un autre jour, la mariée est accompagnée chez son époux par les femmes de sa famille, avec conseils et chants.` },
  haiti: { nom: 'Le mariage haïtien', intro: "Notre mariage mêle la cérémonie religieuse et les traditions haïtiennes. Voici le fil de la journée.", texte:
`La cérémonie
À l'église, le cortège entre au son de la musique : enfants d'honneur, demoiselles et garçons d'honneur, puis la mariée au bras de son père.

Le cortège et les photos
À la sortie, les mariés sont accueillis par les applaudissements. Place aux photos avec chaque famille.

La réception
On trinque, on mange, on danse le konpa. Le kremas, boisson crémeuse à base de lait concentré et de rhum, fait souvent partie de la fête.
Conseil : les discours du parrain et de la marraine sont un moment fort, on les écoute.

Le gâteau
Le gâteau est coupé par les mariés, entourés de leurs parrains et marraines.
Conseil : une tenue élégante est de mise ; la ponctualité « à l'haïtienne » existe, mais la cérémonie commence à l'heure.` },
  antilles: { nom: 'Le mariage antillais (Martinique, Guadeloupe)', intro: "Un mariage antillais, c'est d'abord une grande famille réunie. Voici le déroulé.", texte:
`La mairie, puis l'église
Le mariage civil, puis la cérémonie religieuse pour ceux qui la célèbrent.

Le vin d'honneur
Punch, accras et boudin : chacun félicite les mariés.

Le repas
Un grand repas, souvent avec des plats créoles, et des discours de la famille.

Le bal
Zouk, biguine, kompa et, selon les familles, un quadrille où les danseurs suivent un commandeur.
Conseil : une touche de madras dans votre tenue est souvent appréciée.` },
  nikah: { nom: 'Le mariage religieux musulman (nikah)', intro: "Le nikah est l'union religieuse. Voici comment elle se déroule, pour la vivre avec nous dans le respect de chacun.", texte:
`L'union
L'imam unit les mariés en présence du tuteur de la mariée et de deux témoins. Chacun exprime son consentement.

Le mahr
Le marié remet à son épouse un don, le mahr, qui lui appartient.

Le sermon et les invocations
L'imam prononce un court sermon et des invocations pour le couple.

La fête
Un repas réunit ensuite les familles.
Conseil : une tenue couvrant les épaules et les genoux est appréciée ; selon les familles, hommes et femmes peuvent être placés séparément. Pas d'alcool.` },
  catholique: { nom: 'La messe de mariage catholique', intro: "Pour ceux qui n'en ont pas l'habitude, voici le déroulé de la cérémonie à l'église.", texte:
`L'entrée
Le marié attend à l'autel ; la mariée entre au bras de son père ou d'un proche. On se lève à son entrée.

La liturgie de la parole
Des lectures, choisies par les mariés, sont lues par des proches ; le prêtre ou le diacre les commente.

Les consentements et les alliances
Les mariés échangent leurs consentements et leurs alliances : c'est le cœur de la cérémonie.
Conseil : téléphones en silencieux ; on laisse le photographe travailler et on garde les photos pour la sortie.

La bénédiction et la signature
Le couple reçoit la bénédiction nuptiale, puis signe les registres avec les témoins.

La sortie
Les mariés sortent sous les applaudissements, parfois sous les pétales.` },
};
