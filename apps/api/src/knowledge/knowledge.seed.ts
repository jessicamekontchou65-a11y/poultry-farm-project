/**
 * Starter content for the Poultry Knowledge Center. It is inserted once, when the
 * collection is empty; afterwards admins edit everything from the dashboard.
 *
 * Writing rules for health content: describe, never diagnose. Say what signs "may be
 * associated with", always point to a veterinarian or laboratory for confirmation,
 * and never give doses.
 */

type L = { en: string; fr: string };

export interface KnowledgeSeed {
  slug: string;
  section: string;
  order: number;
  title: L;
  summary: L;
  body: L;
  symptoms?: string[];
  tags?: string[];
  poultryTypes?: string[];
  minAgeDays?: number;
  maxAgeDays?: number;
  alertLevel?: "info" | "caution" | "urgent";
  warnings?: L[];
  checklist?: L[];
  references?: { title: string; url?: string }[];
}

const VET_WARNING: L = {
  en: "This guide is educational. It does not diagnose disease. Only a veterinarian or a laboratory can confirm what is affecting your birds.",
  fr: "Ce guide est éducatif. Il ne pose pas de diagnostic. Seul un vétérinaire ou un laboratoire peut confirmer ce qui touche vos oiseaux."
};

const NO_SELF_MEDICATION: L = {
  en: "Do not give medicines or antibiotics without a veterinarian's advice. Wrong products or doses can harm birds and consumers.",
  fr: "Ne donnez pas de médicaments ni d'antibiotiques sans l'avis d'un vétérinaire. Un mauvais produit ou une mauvaise dose peut nuire aux oiseaux et aux consommateurs."
};

const FAO = { title: "FAO – Poultry production and health", url: "https://www.fao.org/poultry-production-products/en/" };
const WOAH = { title: "WOAH – Animal diseases", url: "https://www.woah.org/en/what-we-do/animal-health-and-welfare/animal-diseases/" };

export const KNOWLEDGE_SEED: KnowledgeSeed[] = [
  // ───────────────────────────── Production ─────────────────────────────
  {
    slug: "broiler-management",
    section: "production",
    order: 1,
    poultryTypes: ["broiler"],
    tags: ["broiler", "growth", "chair"],
    title: { en: "Broiler management by growth stage", fr: "Conduite des poulets de chair par stade" },
    summary: {
      en: "What to focus on from day-old chicks to market weight.",
      fr: "Les priorités du poussin d'un jour jusqu'au poids de vente."
    },
    body: {
      en: `## Growth stages
| Stage | Age | Main focus |
|---|---|---|
| Starter | 0–10 days | Heat, water, starter feed, chick comfort |
| Grower | 11–24 days | Space, ventilation, steady feed intake |
| Finisher | 25 days to sale | Ventilation, heat stress, weight checks |

## Good practice
- Weigh a sample of 20–50 birds every week and compare with your strain's guide.
- Keep feed and water available at all times; raise feeders and drinkers as birds grow.
- Avoid overcrowding: crowded birds grow unevenly and get sick more often.
- Most strains reach market weight (about 1.8–2.5 kg) between 35 and 42 days.

## Record every day
Feed given, water, deaths and their likely cause, and anything unusual. These records feed your PoultryHub reports.`,
      fr: `## Stades de croissance
| Stade | Âge | Priorité |
|---|---|---|
| Démarrage | 0–10 jours | Chaleur, eau, aliment démarrage, confort des poussins |
| Croissance | 11–24 jours | Espace, ventilation, consommation régulière |
| Finition | 25 jours à la vente | Ventilation, stress thermique, contrôle du poids |

## Bonnes pratiques
- Pesez un échantillon de 20 à 50 oiseaux chaque semaine et comparez au guide de votre souche.
- Gardez l'aliment et l'eau disponibles en permanence ; relevez mangeoires et abreuvoirs avec la croissance.
- Évitez la surdensité : des oiseaux serrés grandissent mal et tombent plus souvent malades.
- La plupart des souches atteignent le poids de vente (environ 1,8 à 2,5 kg) entre 35 et 42 jours.

## Notez chaque jour
Aliment donné, eau, mortalité et sa cause probable, et tout ce qui est inhabituel. Ces données alimentent vos rapports PoultryHub.`
    },
    checklist: [
      { en: "Weekly sample weighing done", fr: "Pesée hebdomadaire d'un échantillon faite" },
      { en: "Feeders and drinkers at back height of birds", fr: "Mangeoires et abreuvoirs à hauteur du dos des oiseaux" },
      { en: "Daily records entered", fr: "Registres du jour saisis" }
    ],
    references: [FAO]
  },
  {
    slug: "layer-management",
    section: "production",
    order: 2,
    poultryTypes: ["layer"],
    tags: ["layer", "eggs", "pondeuse", "ponte"],
    title: { en: "Layer management: rearing to peak production", fr: "Conduite des pondeuses : de l'élevage au pic de ponte" },
    summary: {
      en: "Rear a uniform flock, then support steady egg production.",
      fr: "Élever un lot homogène, puis soutenir une ponte régulière."
    },
    body: {
      en: `## Key phases
- **Chick (0–8 weeks):** brooding, vaccination programme, good uniformity.
- **Pullet (9–17 weeks):** controlled growth, do not let birds get fat; prepare the laying house.
- **Point of lay (about 18–20 weeks):** move birds before laying starts, switch gradually to layer feed.
- **Production:** most modern hybrids reach peak lay around 25–30 weeks.

## Light
Laying hens need a stable day length, usually 14–16 hours of light. Never reduce light during production.

## Egg collection
Collect eggs at least twice a day, store them cool and dry, and record good, cracked and dirty eggs separately.`,
      fr: `## Phases clés
- **Poussin (0–8 semaines) :** démarrage, programme de vaccination, bonne homogénéité.
- **Poulette (9–17 semaines) :** croissance maîtrisée, éviter l'engraissement ; préparer le bâtiment de ponte.
- **Entrée en ponte (environ 18–20 semaines) :** transférer avant le début de la ponte, passer progressivement à l'aliment ponte.
- **Production :** la plupart des hybrides modernes atteignent leur pic vers 25–30 semaines.

## Lumière
Les pondeuses ont besoin d'une durée d'éclairage stable, en général 14 à 16 heures. Ne réduisez jamais la lumière en production.

## Ramassage des œufs
Ramassez au moins deux fois par jour, stockez au frais et au sec, et notez séparément les œufs bons, fêlés et sales.`
    },
    symptoms: ["drop in egg production", "baisse de ponte", "soft-shelled eggs", "œufs à coquille molle"],
    checklist: [
      { en: "Eggs collected twice today", fr: "Œufs ramassés deux fois aujourd'hui" },
      { en: "Light programme unchanged", fr: "Programme lumineux inchangé" },
      { en: "Egg production entered in PoultryHub", fr: "Production d'œufs saisie dans PoultryHub" }
    ],
    references: [FAO]
  },
  {
    slug: "chick-management",
    section: "production",
    order: 3,
    poultryTypes: ["chick", "broiler", "layer", "local", "hybrid", "cockerel"],
    maxAgeDays: 21,
    tags: ["chicks", "poussins", "brooding", "démarrage"],
    title: { en: "Chick management: the first three weeks", fr: "Les poussins : les trois premières semaines" },
    summary: {
      en: "The first days decide the whole flock. Heat, water and feed come first.",
      fr: "Les premiers jours décident de tout le lot. Chaleur, eau et aliment d'abord."
    },
    body: {
      en: `## Before arrival
Clean and disinfect, spread dry litter, and pre-heat the brooding area for at least 12–24 hours.

## On arrival
- Check chicks quickly and place them near water and feed.
- Fill drinkers with clean water at room temperature.
- Watch how chicks spread out under the heat source:
  - **Crowded under the heater:** too cold.
  - **Far from the heater, panting:** too hot.
  - **Evenly spread and active:** comfortable.

## First week
Check crops after a few hours: most chicks should have a full, soft crop. Record any deaths every day.`,
      fr: `## Avant l'arrivée
Nettoyez et désinfectez, étalez une litière sèche et préchauffez la zone de démarrage au moins 12 à 24 heures.

## À l'arrivée
- Vérifiez rapidement les poussins et placez-les près de l'eau et de l'aliment.
- Remplissez les abreuvoirs d'eau propre à température ambiante.
- Observez la répartition sous la source de chaleur :
  - **Entassés sous le radiant :** trop froid.
  - **Loin du radiant, bec ouvert :** trop chaud.
  - **Bien répartis et actifs :** confortable.

## Première semaine
Vérifiez le jabot après quelques heures : la plupart des poussins doivent avoir un jabot plein et souple. Notez la mortalité chaque jour.`
    },
    symptoms: ["chicks crowding", "poussins entassés", "panting", "halètement"],
    checklist: [
      { en: "Brooder pre-heated before arrival", fr: "Poussinière préchauffée avant l'arrivée" },
      { en: "Chick spread checked morning and evening", fr: "Répartition des poussins vérifiée matin et soir" },
      { en: "Crop fill checked on day 1", fr: "Remplissage du jabot vérifié le jour 1" }
    ]
  },
  {
    slug: "performance-indicators",
    section: "production",
    order: 4,
    tags: ["kpi", "fcr", "mortality", "indice"],
    title: { en: "Performance indicators you should follow", fr: "Les indicateurs de performance à suivre" },
    summary: {
      en: "Mortality, feed conversion, uniformity and laying rate in simple words.",
      fr: "Mortalité, indice de consommation, homogénéité et taux de ponte expliqués simplement."
    },
    body: {
      en: `## Mortality rate
Deaths ÷ birds placed × 100. A sudden rise matters more than the total: compare day to day.

## Feed conversion ratio (FCR)
Feed eaten (kg) ÷ live weight gained (kg). Lower is better. Broilers often reach about 1.6–1.9 at market age.

## Uniformity
Share of weighed birds within ±10% of the average weight. Above 80% is a good sign.

## Laying rate (layers)
Eggs collected ÷ hens present × 100 for the day.

PoultryHub computes most of these from your daily records on the flock and report pages.`,
      fr: `## Taux de mortalité
Morts ÷ oiseaux mis en place × 100. Une hausse brutale compte plus que le total : comparez jour après jour.

## Indice de consommation (IC)
Aliment consommé (kg) ÷ gain de poids vif (kg). Plus il est bas, mieux c'est. Les poulets de chair atteignent souvent 1,6 à 1,9 à l'âge de vente.

## Homogénéité
Part des oiseaux pesés à ±10 % du poids moyen. Au-dessus de 80 %, c'est bon signe.

## Taux de ponte (pondeuses)
Œufs ramassés ÷ poules présentes × 100 pour la journée.

PoultryHub calcule la plupart de ces chiffres à partir de vos registres, sur les pages lot et rapports.`
    }
  },

  // ───────────────────────────── Feeding & Nutrition ─────────────────────────────
  {
    slug: "feed-stages",
    section: "feeding",
    order: 1,
    tags: ["feed", "aliment", "nutrition"],
    title: { en: "Feed stages and schedules", fr: "Les phases d'alimentation" },
    summary: {
      en: "Which feed to give at each age, and how to change feed safely.",
      fr: "Quel aliment donner à chaque âge, et comment changer d'aliment sans risque."
    },
    body: {
      en: `## Broilers
| Feed | Usual age | Crude protein (approx.) |
|---|---|---|
| Starter | 0–10 days | 22–23% |
| Grower | 11–24 days | 20–21% |
| Finisher | 25 days to sale | 18–19% |

## Layers
Chick feed → grower → pre-lay (around 16–18 weeks) → layer feed rich in calcium once laying starts.

## Changing feed
Mix the old and new feed over 3–4 days. Sudden changes can reduce intake and upset digestion.

Follow your feed supplier's programme: values differ between strains and products.`,
      fr: `## Poulets de chair
| Aliment | Âge habituel | Protéines brutes (env.) |
|---|---|---|
| Démarrage | 0–10 jours | 22–23 % |
| Croissance | 11–24 jours | 20–21 % |
| Finition | 25 jours à la vente | 18–19 % |

## Pondeuses
Aliment poussin → croissance → pré-ponte (vers 16–18 semaines) → aliment ponte riche en calcium dès le début de la ponte.

## Changer d'aliment
Mélangez l'ancien et le nouvel aliment sur 3 à 4 jours. Un changement brutal peut réduire la consommation et perturber la digestion.

Suivez le programme de votre fournisseur : les valeurs varient selon les souches et les produits.`
    },
    checklist: [
      { en: "Feed matches the flock's age", fr: "L'aliment correspond à l'âge du lot" },
      { en: "Feed stored dry, off the floor", fr: "Aliment stocké au sec, surélevé" }
    ]
  },
  {
    slug: "water-management",
    section: "feeding",
    order: 2,
    tags: ["water", "eau", "drinkers", "abreuvoirs"],
    symptoms: ["not drinking", "ne boit pas", "wet litter", "litière humide"],
    title: { en: "Water management", fr: "La gestion de l'eau" },
    summary: {
      en: "Birds drink about twice as much as they eat. Clean water every day.",
      fr: "Les oiseaux boivent environ deux fois plus qu'ils ne mangent. De l'eau propre chaque jour."
    },
    body: {
      en: `## How much?
Birds usually drink about 1.6–2 times the weight of feed they eat, and much more in hot weather.

## Keep water clean
- Clean drinkers every day; remove litter and droppings from them.
- Use a safe source; store water covered and in the shade.
- Flush water lines between flocks.

## Watch for changes
A sudden drop in water intake is often one of the **first signs** of a problem. Note it and observe the birds closely.`,
      fr: `## Combien ?
Les oiseaux boivent en général 1,6 à 2 fois le poids d'aliment consommé, et beaucoup plus par temps chaud.

## Une eau propre
- Nettoyez les abreuvoirs chaque jour ; retirez la litière et les fientes.
- Utilisez une source sûre ; stockez l'eau couverte et à l'ombre.
- Rincez les canalisations entre deux lots.

## Surveillez les changements
Une baisse soudaine de la consommation d'eau est souvent l'un des **premiers signes** d'un problème. Notez-la et observez les oiseaux de près.`
    },
    checklist: [
      { en: "Drinkers cleaned today", fr: "Abreuvoirs nettoyés aujourd'hui" },
      { en: "Water available in every drinker", fr: "Eau disponible dans chaque abreuvoir" }
    ]
  },
  {
    slug: "feeding-problems",
    section: "feeding",
    order: 3,
    alertLevel: "caution",
    tags: ["mould", "moisissure", "aflatoxin"],
    symptoms: ["not eating", "perte d'appétit", "feed refusal", "refus d'aliment", "wet droppings", "fientes humides"],
    title: { en: "Common feeding problems", fr: "Problèmes d'alimentation fréquents" },
    summary: {
      en: "Low intake, wasted feed and mouldy feed: what to check first.",
      fr: "Faible consommation, gaspillage et aliment moisi : que vérifier en premier."
    },
    body: {
      en: `## Birds eat less
Check, in this order: water availability, house temperature, feed freshness, a recent feed change, and whether birds look unwell.

## Wasted feed
Feeders too low or overfilled. Fill to about one third and set the lip at the height of the birds' backs.

## Mouldy or caked feed
Do not use it. Mould can produce toxins that harm growth and health. Store bags on pallets, away from walls and rain.

If birds still eat little after these checks, observe them closely and contact a veterinarian.`,
      fr: `## Les oiseaux mangent moins
Vérifiez dans cet ordre : disponibilité de l'eau, température du bâtiment, fraîcheur de l'aliment, changement d'aliment récent, et si les oiseaux semblent malades.

## Aliment gaspillé
Mangeoires trop basses ou trop remplies. Remplissez au tiers environ et réglez le bord à hauteur du dos des oiseaux.

## Aliment moisi ou en mottes
Ne l'utilisez pas. Les moisissures peuvent produire des toxines nuisibles à la croissance et à la santé. Stockez les sacs sur palettes, loin des murs et de la pluie.

Si les oiseaux mangent toujours peu après ces vérifications, observez-les de près et contactez un vétérinaire.`
    },
    warnings: [
      { en: "Never feed mouldy feed to birds.", fr: "Ne donnez jamais d'aliment moisi aux oiseaux." }
    ]
  },

  // ───────────────────────────── Housing & Environment ─────────────────────────────
  {
    slug: "temperature-ventilation",
    section: "housing",
    order: 1,
    tags: ["temperature", "ventilation", "chaleur", "ammoniac"],
    symptoms: ["panting", "halètement", "huddling", "entassement", "heat stress", "stress thermique"],
    title: { en: "Temperature and ventilation", fr: "Température et ventilation" },
    summary: {
      en: "Target temperatures by age and signs that birds are too hot or too cold.",
      fr: "Températures cibles selon l'âge et signes que les oiseaux ont trop chaud ou trop froid."
    },
    body: {
      en: `## Target temperature at bird level
| Age | Temperature |
|---|---|
| Days 1–7 | 32–35 °C |
| Week 2 | 29–31 °C |
| Week 3 | 26–28 °C |
| Week 4 onward | 21–25 °C |

Reduce heat gradually and always trust the **birds' behaviour** over the thermometer.

## Ventilation
Fresh air removes moisture and ammonia. If the air stings your eyes or nose, ventilation is not enough.

## Hot weather
Open sides early, give cool water, avoid handling birds in the hottest hours and do not overcrowd.`,
      fr: `## Température cible au niveau des oiseaux
| Âge | Température |
|---|---|
| Jours 1–7 | 32–35 °C |
| Semaine 2 | 29–31 °C |
| Semaine 3 | 26–28 °C |
| À partir de la semaine 4 | 21–25 °C |

Baissez la chaleur progressivement et fiez-vous toujours au **comportement des oiseaux** plutôt qu'au thermomètre.

## Ventilation
L'air frais évacue l'humidité et l'ammoniac. Si l'air pique les yeux ou le nez, la ventilation est insuffisante.

## Temps chaud
Ouvrez les côtés tôt, donnez de l'eau fraîche, évitez de manipuler les oiseaux aux heures chaudes et ne surchargez pas.`
    },
    checklist: [
      { en: "Temperature checked at bird level", fr: "Température vérifiée au niveau des oiseaux" },
      { en: "No ammonia smell at bird height", fr: "Pas d'odeur d'ammoniac à hauteur des oiseaux" }
    ]
  },
  {
    slug: "litter-and-cleaning",
    section: "housing",
    order: 2,
    tags: ["litter", "litière", "cleaning", "nettoyage", "disinfection"],
    symptoms: ["wet litter", "litière humide", "foot sores", "lésions des pattes"],
    title: { en: "Litter management and cleaning between flocks", fr: "Litière et nettoyage entre deux lots" },
    summary: {
      en: "Dry litter keeps birds healthy. Clean thoroughly before each new flock.",
      fr: "Une litière sèche garde les oiseaux en bonne santé. Nettoyez à fond avant chaque nouveau lot."
    },
    body: {
      en: `## Litter
Keep litter dry and loose. Remove wet or caked patches, especially around drinkers, and add fresh material.

## All-in, all-out
Raise one age group per house. When it leaves:
1. Remove all litter and manure.
2. Dry-clean, then wash with water and detergent.
3. Disinfect with an approved product, following the label.
4. Leave the house empty and dry for at least 2 weeks if possible.`,
      fr: `## Litière
Gardez la litière sèche et meuble. Retirez les zones humides ou croûtées, surtout autour des abreuvoirs, et ajoutez de la litière neuve.

## Bande unique
Un seul âge par bâtiment. Au départ du lot :
1. Retirez toute la litière et le fumier.
2. Nettoyez à sec, puis lavez à l'eau et au détergent.
3. Désinfectez avec un produit homologué, selon l'étiquette.
4. Laissez le bâtiment vide et sec au moins 2 semaines si possible.`
    },
    checklist: [
      { en: "Wet litter removed", fr: "Litière humide retirée" },
      { en: "House emptied, washed and disinfected between flocks", fr: "Bâtiment vidé, lavé et désinfecté entre les lots" }
    ]
  },

  // ───────────────────────────── Health & Diseases (educational) ─────────────────────────────
  {
    slug: "newcastle-disease",
    section: "health",
    order: 1,
    alertLevel: "urgent",
    tags: ["newcastle", "virus", "notifiable"],
    symptoms: [
      "twisted neck", "torticolis", "coughing", "cough", "toux", "tousse", "gasping", "respiration difficile",
      "green diarrhea", "diarrhée verte", "sudden death", "mort subite", "drop in egg production", "baisse de ponte"
    ],
    title: { en: "Newcastle disease (educational)", fr: "Maladie de Newcastle (fiche éducative)" },
    summary: {
      en: "A serious viral disease that can spread fast. Vaccination is the main protection.",
      fr: "Une maladie virale grave qui peut se propager vite. La vaccination est la principale protection."
    },
    body: {
      en: `## What it is
A contagious viral disease of poultry found in many countries, including Cameroon. Severity varies a lot between strains of the virus.

## Signs that **may** be seen
Breathing difficulty, greenish diarrhoea, twisted neck or paralysis, a sharp drop in eggs, and sometimes many sudden deaths. These signs are also seen with other diseases.

## What to do
- Isolate sick birds and stop visits to the farm.
- Contact a veterinarian quickly; a laboratory test is needed to confirm.
- Record deaths and signs in PoultryHub.

## Prevention
Vaccination according to a programme set with your veterinarian, plus strict biosecurity.`,
      fr: `## De quoi s'agit-il
Une maladie virale contagieuse des volailles, présente dans de nombreux pays dont le Cameroun. La gravité varie beaucoup selon les souches du virus.

## Signes **pouvant** être observés
Difficultés respiratoires, diarrhée verdâtre, torticolis ou paralysie, chute brutale de la ponte, et parfois de nombreuses morts soudaines. Ces signes se voient aussi avec d'autres maladies.

## Que faire
- Isolez les oiseaux malades et arrêtez les visites.
- Contactez rapidement un vétérinaire ; un test de laboratoire est nécessaire pour confirmer.
- Notez la mortalité et les signes dans PoultryHub.

## Prévention
Vaccination selon un programme établi avec votre vétérinaire, et biosécurité stricte.`
    },
    warnings: [VET_WARNING, NO_SELF_MEDICATION],
    references: [WOAH]
  },
  {
    slug: "gumboro-ibd",
    section: "health",
    order: 2,
    alertLevel: "caution",
    minAgeDays: 14,
    maxAgeDays: 56,
    tags: ["gumboro", "ibd", "virus"],
    symptoms: ["ruffled feathers", "plumes ébouriffées", "white watery diarrhea", "diarrhée blanche", "depression", "abattement"],
    title: { en: "Gumboro disease (IBD) – educational", fr: "Maladie de Gumboro (IBD) – fiche éducative" },
    summary: {
      en: "A viral disease of young birds that weakens their immune system.",
      fr: "Une maladie virale des jeunes oiseaux qui affaiblit leurs défenses immunitaires."
    },
    body: {
      en: `## What it is
A viral disease mostly affecting birds around 3 to 6 weeks old. It damages the organ that builds immunity, so birds can then catch other diseases more easily.

## Signs that **may** be seen
Ruffled feathers, birds sitting and depressed, whitish watery droppings, a rise in deaths over a few days.

## What to do
Isolate affected birds, keep them warm with easy access to water, and call a veterinarian for confirmation and advice.

## Prevention
Vaccination timed by your veterinarian, and thorough cleaning between flocks: the virus survives a long time in houses.`,
      fr: `## De quoi s'agit-il
Une maladie virale qui touche surtout les oiseaux de 3 à 6 semaines environ. Elle abîme l'organe qui construit l'immunité ; les oiseaux attrapent ensuite plus facilement d'autres maladies.

## Signes **pouvant** être observés
Plumes ébouriffées, oiseaux couchés et abattus, fientes blanchâtres et liquides, hausse de mortalité sur quelques jours.

## Que faire
Isolez les oiseaux atteints, gardez-les au chaud avec un accès facile à l'eau, et appelez un vétérinaire pour confirmer et conseiller.

## Prévention
Vaccination au bon moment fixé par votre vétérinaire, et nettoyage complet entre les lots : le virus survit longtemps dans les bâtiments.`
    },
    warnings: [VET_WARNING, NO_SELF_MEDICATION],
    references: [WOAH]
  },
  {
    slug: "coccidiosis",
    section: "health",
    order: 3,
    alertLevel: "caution",
    minAgeDays: 10,
    maxAgeDays: 70,
    tags: ["coccidiosis", "coccidiose", "parasite"],
    symptoms: ["bloody droppings", "fientes sanglantes", "diarrhea", "diarrhée", "ruffled feathers", "plumes ébouriffées", "pale birds", "oiseaux pâles"],
    title: { en: "Coccidiosis – educational", fr: "Coccidiose – fiche éducative" },
    summary: {
      en: "An intestinal parasite favoured by wet litter.",
      fr: "Un parasite intestinal favorisé par la litière humide."
    },
    body: {
      en: `## What it is
Tiny parasites that multiply in the gut. They spread through droppings and thrive in warm, wet litter.

## Signs that **may** be seen
Droppings with blood or mucus, birds hunched with ruffled feathers, poor growth, pale combs.

## What to do
Keep litter dry, isolate weak birds, and ask a veterinarian before using any anticoccidial product.

## Prevention
Dry litter, enough drinkers that do not leak, good stocking density, and the prevention programme advised by your veterinarian or feed supplier.`,
      fr: `## De quoi s'agit-il
De minuscules parasites qui se multiplient dans l'intestin. Ils se transmettent par les fientes et prospèrent dans une litière chaude et humide.

## Signes **pouvant** être observés
Fientes avec du sang ou du mucus, oiseaux recroquevillés aux plumes ébouriffées, mauvaise croissance, crêtes pâles.

## Que faire
Gardez la litière sèche, isolez les oiseaux faibles et demandez l'avis d'un vétérinaire avant tout produit anticoccidien.

## Prévention
Litière sèche, abreuvoirs en nombre suffisant et sans fuite, bonne densité, et le programme de prévention conseillé par votre vétérinaire ou votre fournisseur d'aliment.`
    },
    warnings: [VET_WARNING, NO_SELF_MEDICATION]
  },
  {
    slug: "respiratory-diseases",
    section: "health",
    order: 4,
    alertLevel: "caution",
    tags: ["respiratory", "respiratoire", "mycoplasma", "bronchitis"],
    symptoms: ["coughing", "cough", "toux", "tousse", "sneezing", "sneeze", "éternuements", "éternue", "nasal discharge", "écoulement nasal", "swollen eyes", "yeux gonflés", "rattling", "râles"],
    title: { en: "Respiratory problems – educational", fr: "Problèmes respiratoires – fiche éducative" },
    summary: {
      en: "Coughing, sneezing and noisy breathing have many possible causes.",
      fr: "Toux, éternuements et respiration bruyante ont de nombreuses causes possibles."
    },
    body: {
      en: `## Possible causes
Infections (for example mycoplasma or infectious bronchitis), but also dust, ammonia from wet litter, or poor ventilation.

## Signs that **may** be seen
Coughing, sneezing, rattling breath, discharge from nose or eyes, swollen eyes, reduced feed intake or egg production.

## What to do
1. Check ventilation and litter first: ammonia alone can irritate airways.
2. Note how many birds are affected and since when.
3. Contact a veterinarian; several diseases look alike and need tests.`,
      fr: `## Causes possibles
Des infections (par exemple mycoplasmes ou bronchite infectieuse), mais aussi la poussière, l'ammoniac d'une litière humide ou une mauvaise ventilation.

## Signes **pouvant** être observés
Toux, éternuements, respiration bruyante, écoulement du nez ou des yeux, yeux gonflés, baisse de consommation ou de ponte.

## Que faire
1. Vérifiez d'abord la ventilation et la litière : l'ammoniac seul peut irriter les voies respiratoires.
2. Notez combien d'oiseaux sont touchés et depuis quand.
3. Contactez un vétérinaire ; plusieurs maladies se ressemblent et nécessitent des analyses.`
    },
    warnings: [VET_WARNING, NO_SELF_MEDICATION]
  },
  {
    slug: "avian-influenza",
    section: "health",
    order: 5,
    alertLevel: "urgent",
    tags: ["avian influenza", "grippe aviaire", "notifiable", "déclaration obligatoire"],
    symptoms: [
      "sudden death", "mort subite", "swollen head", "tête enflée", "blue comb", "crête bleue",
      "high mortality", "forte mortalité", "drop in egg production", "baisse de ponte"
    ],
    title: { en: "Avian influenza – a notifiable disease", fr: "Grippe aviaire – maladie à déclaration obligatoire" },
    summary: {
      en: "Suspicion must be reported to the veterinary services. Do not move birds.",
      fr: "Toute suspicion doit être déclarée aux services vétérinaires. Ne déplacez pas les oiseaux."
    },
    body: {
      en: `## Why it matters
Highly pathogenic avian influenza can kill many birds within days and some strains can affect people. It is a **notifiable disease**: authorities must be informed.

## Signs that **may** be seen
Many sudden deaths, swollen head or wattles, blue or dark comb, breathing difficulty, sharp fall in eggs.

## If you suspect it
- **Do not** sell, move or give away birds, eggs or manure.
- Keep people and vehicles away from the farm.
- Inform a veterinarian and the official veterinary services (in Cameroon, your local MINEPIA delegation) immediately.
- Avoid touching sick or dead birds with bare hands.`,
      fr: `## Pourquoi c'est important
La grippe aviaire hautement pathogène peut tuer de nombreux oiseaux en quelques jours et certaines souches peuvent toucher l'homme. C'est une **maladie à déclaration obligatoire** : les autorités doivent être informées.

## Signes **pouvant** être observés
Nombreuses morts soudaines, tête ou barbillons enflés, crête bleue ou foncée, difficultés respiratoires, chute brutale de la ponte.

## En cas de suspicion
- **Ne vendez pas**, ne déplacez pas et ne donnez pas d'oiseaux, d'œufs ni de fumier.
- Tenez les personnes et véhicules à l'écart de la ferme.
- Informez immédiatement un vétérinaire et les services vétérinaires officiels (au Cameroun, votre délégation du MINEPIA).
- Ne touchez pas les oiseaux malades ou morts à mains nues.`
    },
    warnings: [
      {
        en: "Suspected avian influenza must be reported to official veterinary services.",
        fr: "Toute suspicion de grippe aviaire doit être signalée aux services vétérinaires officiels."
      },
      VET_WARNING
    ],
    references: [WOAH]
  },
  {
    slug: "parasites",
    section: "health",
    order: 6,
    tags: ["worms", "vers", "mites", "poux", "acariens"],
    symptoms: ["feather loss", "perte de plumes", "itching", "démangeaisons", "pale comb", "crête pâle", "weight loss", "amaigrissement"],
    title: { en: "Worms, mites and lice – educational", fr: "Vers, acariens et poux – fiche éducative" },
    summary: {
      en: "Internal and external parasites slowly reduce growth and laying.",
      fr: "Les parasites internes et externes réduisent lentement la croissance et la ponte."
    },
    body: {
      en: `## Signs that **may** be seen
Birds scratching or pecking at feathers, feather loss, pale combs, weight loss, fewer eggs. Red mites hide in cracks during the day and feed at night.

## What to do
Inspect birds and perches at night with a torch. Ask a veterinarian which product to use and respect the withdrawal period for eggs and meat.

## Prevention
Clean perches and nests, limit contact with wild birds, and treat the house between flocks.`,
      fr: `## Signes **pouvant** être observés
Oiseaux qui se grattent ou s'arrachent les plumes, perte de plumes, crêtes pâles, amaigrissement, moins d'œufs. Le pou rouge se cache dans les fissures le jour et se nourrit la nuit.

## Que faire
Inspectez oiseaux et perchoirs la nuit avec une lampe. Demandez à un vétérinaire quel produit utiliser et respectez le délai d'attente pour les œufs et la viande.

## Prévention
Nettoyez perchoirs et pondoirs, limitez le contact avec les oiseaux sauvages et traitez le bâtiment entre deux lots.`
    },
    warnings: [NO_SELF_MEDICATION]
  },

  // ───────────────────────────── Diagnosis & Observation ─────────────────────────────
  {
    slug: "daily-observation-guide",
    section: "observation",
    order: 1,
    tags: ["observation", "surveillance"],
    title: { en: "How to observe your flock every day", fr: "Observer son lot chaque jour" },
    summary: {
      en: "A calm 10-minute walk-through catches most problems early. It does not replace a diagnosis.",
      fr: "Une tournée calme de 10 minutes repère tôt la plupart des problèmes. Elle ne remplace pas un diagnostic."
    },
    body: {
      en: `## Before entering
Listen: unusual silence, coughing or loud distress calls are worth noting.

## Look at
- **Behaviour:** are birds active, spread out, eating and drinking?
- **Breathing:** open beaks, rattling, sneezing?
- **Droppings:** colour and consistency compared with yesterday.
- **Feed and water:** did intake drop?
- **Dead or weak birds:** how many, where, and since when?

## Record, do not guess
Write what you see in the daily log. If several birds show the same signs, or deaths rise, contact a veterinarian.`,
      fr: `## Avant d'entrer
Écoutez : un silence inhabituel, de la toux ou des cris de détresse méritent d'être notés.

## Regardez
- **Comportement :** les oiseaux sont-ils actifs, bien répartis, mangent-ils et boivent-ils ?
- **Respiration :** bec ouvert, râles, éternuements ?
- **Fientes :** couleur et consistance par rapport à la veille.
- **Aliment et eau :** la consommation a-t-elle baissé ?
- **Oiseaux morts ou faibles :** combien, où, et depuis quand ?

## Notez, ne devinez pas
Écrivez ce que vous voyez dans le registre du jour. Si plusieurs oiseaux montrent les mêmes signes ou si la mortalité augmente, contactez un vétérinaire.`
    },
    warnings: [VET_WARNING],
    checklist: [
      { en: "Listened before entering", fr: "Écouté avant d'entrer" },
      { en: "Behaviour, breathing and droppings checked", fr: "Comportement, respiration et fientes vérifiés" },
      { en: "Deaths counted and recorded", fr: "Morts comptés et enregistrés" }
    ]
  },
  {
    slug: "droppings-guide",
    section: "observation",
    order: 2,
    alertLevel: "caution",
    tags: ["droppings", "fientes"],
    symptoms: ["diarrhea", "diarrhée", "bloody droppings", "fientes sanglantes", "green droppings", "fientes vertes", "white droppings", "fientes blanches"],
    title: { en: "Reading droppings (observation only)", fr: "Observer les fientes (observation uniquement)" },
    summary: {
      en: "Changes in droppings are useful clues to report, not a diagnosis.",
      fr: "Les changements de fientes sont des indices à signaler, pas un diagnostic."
    },
    body: {
      en: `## Normal droppings
Firm brown or grey with a white cap, plus softer caecal droppings a few times a day.

## Changes worth recording
| What you see | What to note |
|---|---|
| Very watery | Heat? Sudden feed or water change? How many birds? |
| Blood or mucus | Age of birds, litter condition, number affected |
| Greenish | Are birds still eating? Other signs? |
| Whitish and watery | Depression, ruffled feathers, deaths? |

Take a photo, note the date and number of birds, and share it with your veterinarian. Several conditions can cause the same change.`,
      fr: `## Fientes normales
Fermes, brunes ou grises avec un capuchon blanc, plus quelques fientes cæcales plus molles par jour.

## Changements à noter
| Ce que vous voyez | À noter |
|---|---|
| Très liquides | Chaleur ? Changement d'aliment ou d'eau ? Combien d'oiseaux ? |
| Sang ou mucus | Âge des oiseaux, état de la litière, nombre touché |
| Verdâtres | Les oiseaux mangent-ils encore ? Autres signes ? |
| Blanchâtres et liquides | Abattement, plumes ébouriffées, mortalité ? |

Prenez une photo, notez la date et le nombre d'oiseaux, et montrez-la à votre vétérinaire. Plusieurs affections peuvent provoquer le même changement.`
    },
    warnings: [VET_WARNING]
  },

  // ───────────────────────────── Prevention & Biosecurity ─────────────────────────────
  {
    slug: "vaccination-plan",
    section: "prevention",
    order: 1,
    tags: ["vaccination", "vaccin", "programme"],
    title: { en: "Building a vaccination plan", fr: "Construire un programme de vaccination" },
    summary: {
      en: "An example to discuss with your veterinarian. Local programmes differ.",
      fr: "Un exemple à discuter avec votre vétérinaire. Les programmes locaux varient."
    },
    body: {
      en: `## Example only
| Usual timing | Disease often covered |
|---|---|
| Day 1 (hatchery) | Marek's disease |
| Around day 7–10 | Newcastle (first dose) |
| Around day 14 | Gumboro (first dose) |
| Around day 21–24 | Newcastle / Gumboro boosters |
| Layers, 6–8 weeks and later | Fowl pox and further boosters |

**Your veterinarian sets the real programme** based on local diseases, the vaccines available and your chicks' origin.

## Good vaccination practice
- Keep vaccines cold and protected from sunlight.
- Use clean water without chlorine for water vaccines.
- Record each vaccination in PoultryHub so reminders appear on the flock page.`,
      fr: `## Exemple uniquement
| Moment habituel | Maladie souvent couverte |
|---|---|
| Jour 1 (couvoir) | Maladie de Marek |
| Vers les jours 7–10 | Newcastle (1re dose) |
| Vers le jour 14 | Gumboro (1re dose) |
| Vers les jours 21–24 | Rappels Newcastle / Gumboro |
| Pondeuses, 6–8 semaines et plus | Variole aviaire et rappels |

**Votre vétérinaire fixe le vrai programme** selon les maladies locales, les vaccins disponibles et l'origine de vos poussins.

## Bonnes pratiques
- Conservez les vaccins au froid et à l'abri du soleil.
- Utilisez une eau propre sans chlore pour les vaccins dans l'eau.
- Enregistrez chaque vaccination dans PoultryHub pour voir les rappels sur la page du lot.`
    },
    warnings: [
      {
        en: "This schedule is an example. Follow your veterinarian and the vaccine label.",
        fr: "Ce calendrier est un exemple. Suivez votre vétérinaire et la notice du vaccin."
      }
    ]
  },
  {
    slug: "biosecurity-basics",
    section: "prevention",
    order: 2,
    tags: ["biosecurity", "biosécurité", "rodents", "rongeurs", "visitors"],
    title: { en: "Biosecurity basics", fr: "Les bases de la biosécurité" },
    summary: {
      en: "Keep diseases out: people, vehicles, new birds, wild birds and rodents.",
      fr: "Empêcher les maladies d'entrer : personnes, véhicules, nouveaux oiseaux, oiseaux sauvages et rongeurs."
    },
    body: {
      en: `## People and vehicles
Limit visitors, keep a visitor book, use a footbath or dedicated boots at each house entrance, and wash hands.

## New birds
Buy from trusted sources and keep new birds apart (quarantine) for about 2 weeks.

## Wild birds and rodents
Close gaps with netting, store feed in closed containers, remove spilled feed, and set up a regular rodent control plan.

## Dead birds
Remove them every day and dispose of them safely (burial or incineration), away from the houses.`,
      fr: `## Personnes et véhicules
Limitez les visites, tenez un registre des visiteurs, utilisez un pédiluve ou des bottes dédiées à l'entrée de chaque bâtiment, et lavez-vous les mains.

## Nouveaux oiseaux
Achetez auprès de sources fiables et gardez les nouveaux oiseaux à part (quarantaine) environ 2 semaines.

## Oiseaux sauvages et rongeurs
Fermez les ouvertures avec du grillage, stockez l'aliment dans des contenants fermés, ramassez l'aliment renversé et mettez en place une lutte régulière contre les rongeurs.

## Oiseaux morts
Retirez-les chaque jour et éliminez-les de façon sûre (enfouissement ou incinération), loin des bâtiments.`
    },
    checklist: [
      { en: "Footbath refreshed", fr: "Pédiluve renouvelé" },
      { en: "Visitor book filled in", fr: "Registre des visiteurs rempli" },
      { en: "Rodent bait stations checked", fr: "Postes d'appâtage contre les rongeurs vérifiés" }
    ]
  },

  // ───────────────────────────── Treatment Principles ─────────────────────────────
  {
    slug: "responsible-medication-use",
    section: "treatment",
    order: 1,
    alertLevel: "caution",
    tags: ["antibiotics", "antibiotiques", "withdrawal", "délai d'attente", "medication"],
    title: { en: "Using medicines responsibly", fr: "Utiliser les médicaments de façon responsable" },
    summary: {
      en: "Right product, right dose, right duration, prescribed by a veterinarian.",
      fr: "Le bon produit, la bonne dose, la bonne durée, prescrits par un vétérinaire."
    },
    body: {
      en: `## Principles
- Treat only after advice from a veterinarian, ideally after a confirmed cause.
- Follow the prescribed dose and **complete** the course.
- Respect the **withdrawal period**: no eggs or meat sold before it ends.
- Do not use antibiotics to "prevent" disease or to boost growth.

## Why it matters
Misused antibiotics stop working (antimicrobial resistance) and residues in eggs or meat can harm consumers.

## Keep a treatment record
Product, batch number, dose, dates, birds treated and the end of the withdrawal period. Use the vaccination & treatment records in PoultryHub.`,
      fr: `## Principes
- Traitez uniquement sur avis d'un vétérinaire, idéalement après confirmation de la cause.
- Respectez la dose prescrite et **terminez** le traitement.
- Respectez le **délai d'attente** : pas de vente d'œufs ni de viande avant la fin.
- N'utilisez pas d'antibiotiques pour « prévenir » ni pour accélérer la croissance.

## Pourquoi c'est important
Les antibiotiques mal utilisés cessent d'agir (antibiorésistance) et les résidus dans les œufs ou la viande peuvent nuire aux consommateurs.

## Tenez un registre de traitement
Produit, numéro de lot, dose, dates, oiseaux traités et fin du délai d'attente. Utilisez les registres vaccination et traitement de PoultryHub.`
    },
    warnings: [NO_SELF_MEDICATION]
  },

  // ───────────────────────────── Follow-up & Recovery ─────────────────────────────
  {
    slug: "health-issue-follow-up",
    section: "followup",
    order: 1,
    tags: ["follow-up", "suivi", "recovery", "guérison"],
    title: { en: "Following up a health problem", fr: "Suivre un problème de santé" },
    summary: {
      en: "Track the flock daily until things are back to normal.",
      fr: "Suivre le lot chaque jour jusqu'au retour à la normale."
    },
    body: {
      en: `## Every day during the problem
- Count deaths and sick birds.
- Note feed and water intake, and egg production for layers.
- Write the treatment given, if any, and who advised it.

## Signs of recovery
Deaths fall back to normal, birds eat and drink normally, droppings return to normal, laying recovers.

## Close the case
Review with your veterinarian what happened and what to change (vaccination, cleaning, ventilation) before the next flock.`,
      fr: `## Chaque jour pendant le problème
- Comptez les morts et les oiseaux malades.
- Notez la consommation d'aliment et d'eau, et la ponte pour les pondeuses.
- Écrivez le traitement donné, le cas échéant, et qui l'a conseillé.

## Signes de guérison
La mortalité revient à la normale, les oiseaux mangent et boivent normalement, les fientes redeviennent normales, la ponte reprend.

## Clôturer le cas
Revoyez avec votre vétérinaire ce qui s'est passé et ce qu'il faut changer (vaccination, nettoyage, ventilation) avant le prochain lot.`
    },
    checklist: [
      { en: "Deaths and sick birds counted today", fr: "Morts et malades comptés aujourd'hui" },
      { en: "Treatment and adviser written down", fr: "Traitement et conseiller notés" }
    ]
  },

  // ───────────────────────────── Emergency ─────────────────────────────
  {
    slug: "when-to-seek-help",
    section: "emergency",
    order: 1,
    alertLevel: "urgent",
    tags: ["emergency", "urgence", "veterinarian", "vétérinaire"],
    symptoms: ["sudden death", "mort subite", "high mortality", "forte mortalité", "swollen head", "tête enflée", "paralysis", "paralysie"],
    title: { en: "When to call a veterinarian right away", fr: "Quand appeler un vétérinaire immédiatement" },
    summary: {
      en: "Clear warning signs that need professional help today.",
      fr: "Des signes d'alerte clairs qui demandent une aide professionnelle aujourd'hui."
    },
    body: {
      en: `## 🔴 Call today if you see
- Deaths clearly higher than usual over 24 hours (for example more than double your normal daily deaths).
- Many birds sick at the same time, or the problem spreads from house to house.
- Swollen heads, blue combs, twisted necks or paralysis.
- A sharp, sudden drop in feed, water or egg production.

## 🟠 Call within 1–2 days if
- A few birds show the same signs for more than 2 days.
- Growth or laying stays below normal without clear reason.

## While you wait
Isolate sick birds, stop visits and bird movements, keep records and photos, and do not start antibiotics on your own.`,
      fr: `## 🔴 Appelez aujourd'hui si vous voyez
- Une mortalité nettement plus élevée que d'habitude sur 24 heures (par exemple plus du double de vos morts habituels par jour).
- Beaucoup d'oiseaux malades en même temps, ou le problème passe d'un bâtiment à l'autre.
- Têtes enflées, crêtes bleues, torticolis ou paralysie.
- Une chute brutale de l'aliment, de l'eau ou de la ponte.

## 🟠 Appelez sous 1 à 2 jours si
- Quelques oiseaux montrent les mêmes signes depuis plus de 2 jours.
- La croissance ou la ponte reste en dessous de la normale sans raison claire.

## En attendant
Isolez les malades, arrêtez visites et mouvements d'oiseaux, gardez registres et photos, et ne commencez pas d'antibiotiques de vous-même.`
    },
    warnings: [VET_WARNING, NO_SELF_MEDICATION]
  },

  // ───────────────────────────── Checklists ─────────────────────────────
  {
    slug: "daily-housing-checklist",
    section: "checklists",
    order: 1,
    tags: ["checklist", "daily", "quotidien"],
    title: { en: "Daily house checklist", fr: "Check-list quotidienne du bâtiment" },
    summary: {
      en: "Tick these every morning and evening.",
      fr: "À cocher chaque matin et chaque soir."
    },
    body: {
      en: "Use this list during your morning and evening rounds. Anything you cannot tick is a task for today.",
      fr: "Utilisez cette liste lors de vos tournées du matin et du soir. Tout ce qui n'est pas coché est une tâche du jour."
    },
    checklist: [
      { en: "Birds active and evenly spread", fr: "Oiseaux actifs et bien répartis" },
      { en: "Water clean and available in every drinker", fr: "Eau propre et disponible dans chaque abreuvoir" },
      { en: "Feed available and fresh", fr: "Aliment disponible et frais" },
      { en: "Temperature right for the birds' age", fr: "Température adaptée à l'âge" },
      { en: "No strong ammonia smell", fr: "Pas de forte odeur d'ammoniac" },
      { en: "Wet litter removed", fr: "Litière humide retirée" },
      { en: "Dead birds removed and counted", fr: "Oiseaux morts retirés et comptés" },
      { en: "Eggs collected (layers)", fr: "Œufs ramassés (pondeuses)" },
      { en: "Daily log entered in PoultryHub", fr: "Registre du jour saisi dans PoultryHub" }
    ]
  },
  {
    slug: "biosecurity-checklist",
    section: "checklists",
    order: 2,
    tags: ["checklist", "biosecurity", "biosécurité", "weekly"],
    title: { en: "Weekly biosecurity checklist", fr: "Check-list biosécurité hebdomadaire" },
    summary: {
      en: "A short weekly review to keep diseases out.",
      fr: "Un court contrôle hebdomadaire pour garder les maladies dehors."
    },
    body: {
      en: "Go through this list once a week with everyone who works on the farm.",
      fr: "Passez cette liste une fois par semaine avec toutes les personnes qui travaillent à la ferme."
    },
    checklist: [
      { en: "Footbaths filled with fresh disinfectant", fr: "Pédiluves remplis de désinfectant frais" },
      { en: "Fences, nets and doors intact", fr: "Clôtures, filets et portes en bon état" },
      { en: "No sign of rodents; bait stations checked", fr: "Aucun signe de rongeurs ; appâts vérifiés" },
      { en: "Feed stored closed and off the floor", fr: "Aliment stocké fermé et surélevé" },
      { en: "Visitor book up to date", fr: "Registre des visiteurs à jour" },
      { en: "Dead-bird disposal area clean", fr: "Zone d'élimination des cadavres propre" },
      { en: "Vaccination and treatment records up to date", fr: "Registres de vaccination et traitement à jour" }
    ]
  }
];
