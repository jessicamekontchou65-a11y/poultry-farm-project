import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  Eye,
  HeartPulse,
  Home,
  type LucideIcon,
  Pill,
  RefreshCcw,
  ShieldCheck,
  Wheat
} from "lucide-react";

export type Localized = { en: string; fr: string };

export type KnowledgeSummary = {
  _id: string;
  slug: string;
  section: SectionKey;
  title: Localized;
  summary: Localized;
  symptoms: string[];
  tags: string[];
  poultryTypes: string[];
  minAgeDays?: number | null;
  maxAgeDays?: number | null;
  alertLevel: "info" | "caution" | "urgent";
  status: "draft" | "published";
  order: number;
  updatedAt?: string;
};

export type KnowledgeArticle = KnowledgeSummary & {
  body: Localized;
  warnings: Localized[];
  checklist: Localized[];
  references: { title: string; url?: string }[];
  images: string[];
  related?: Pick<KnowledgeSummary, "slug" | "title" | "summary" | "alertLevel">[];
};

export type SectionKey =
  | "production"
  | "feeding"
  | "housing"
  | "health"
  | "observation"
  | "prevention"
  | "treatment"
  | "followup"
  | "emergency"
  | "checklists";

export const SECTIONS: Record<SectionKey, { icon: LucideIcon; title: Localized; description: Localized }> = {
  production: {
    icon: Activity,
    title: { en: "Production", fr: "Production" },
    description: {
      en: "Broilers, layers, chicks, growth stages and performance indicators.",
      fr: "Chair, pondeuses, poussins, stades de croissance et indicateurs."
    }
  },
  feeding: {
    icon: Wheat,
    title: { en: "Feeding & Nutrition", fr: "Alimentation & nutrition" },
    description: {
      en: "Feed stages, schedules, water and common feeding problems.",
      fr: "Phases d'aliment, rations, eau et problèmes fréquents."
    }
  },
  housing: {
    icon: Home,
    title: { en: "Housing & Environment", fr: "Bâtiment & environnement" },
    description: {
      en: "Temperature, ventilation, litter and cleaning.",
      fr: "Température, ventilation, litière et nettoyage."
    }
  },
  health: {
    icon: HeartPulse,
    title: { en: "Health & Diseases", fr: "Santé & maladies" },
    description: {
      en: "An educational library. It never replaces a veterinarian.",
      fr: "Une bibliothèque éducative. Elle ne remplace jamais un vétérinaire."
    }
  },
  observation: {
    icon: Eye,
    title: { en: "Diagnosis & Observation", fr: "Diagnostic & observation" },
    description: {
      en: "What to look at and record — without guessing a diagnosis.",
      fr: "Quoi observer et noter — sans deviner un diagnostic."
    }
  },
  prevention: {
    icon: ShieldCheck,
    title: { en: "Prevention & Biosecurity", fr: "Prévention & biosécurité" },
    description: {
      en: "Vaccination plans, cleaning, rodent control and visitors.",
      fr: "Vaccination, nettoyage, lutte contre les rongeurs et visiteurs."
    }
  },
  treatment: {
    icon: Pill,
    title: { en: "Treatment Principles", fr: "Principes de traitement" },
    description: {
      en: "Responsible medicine use, withdrawal periods and records.",
      fr: "Usage responsable des médicaments, délais d'attente et registres."
    }
  },
  followup: {
    icon: RefreshCcw,
    title: { en: "Follow-up & Recovery", fr: "Suivi & guérison" },
    description: {
      en: "Track a health problem until the flock is back to normal.",
      fr: "Suivre un problème jusqu'au retour à la normale."
    }
  },
  emergency: {
    icon: AlertTriangle,
    title: { en: "Emergency – Get Help", fr: "Urgence – demander de l'aide" },
    description: {
      en: "Clear signs that need a veterinarian today.",
      fr: "Les signes qui demandent un vétérinaire aujourd'hui."
    }
  },
  checklists: {
    icon: ClipboardCheck,
    title: { en: "Poultry Checklists", fr: "Check-lists" },
    description: {
      en: "Daily house and weekly biosecurity checklists.",
      fr: "Check-lists quotidiennes et biosécurité hebdomadaire."
    }
  }
};

export const SECTION_ORDER = Object.keys(SECTIONS) as SectionKey[];

/** Quick searches for common observable signs. */
export const SYMPTOM_CHIPS: Localized[] = [
  { en: "Coughing", fr: "Toux" },
  { en: "Diarrhea", fr: "Diarrhée" },
  { en: "Sneezing", fr: "Éternuements" },
  { en: "Sudden death", fr: "Mort subite" },
  { en: "Drop in egg production", fr: "Baisse de ponte" },
  { en: "Ruffled feathers", fr: "Plumes ébouriffées" },
  { en: "Bloody droppings", fr: "Fientes sanglantes" },
  { en: "Twisted neck", fr: "Torticolis" },
  { en: "Panting", fr: "Halètement" },
  { en: "Not eating", fr: "Perte d'appétit" }
];

export const POULTRY_TYPES = ["broiler", "layer", "chick", "cockerel", "local", "hybrid", "breeder", "other"];

/** Picks the viewer's language, falling back to the other one. */
export function pick(text: Localized | undefined, lang: string) {
  if (!text) return "";
  return (lang === "fr" ? text.fr || text.en : text.en || text.fr) ?? "";
}

export function isSectionKey(value: string): value is SectionKey {
  return value in SECTIONS;
}
