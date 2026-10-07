/** The ten fixed sections of the Poultry Knowledge Center, in display order. */
export const KNOWLEDGE_SECTIONS = [
  "production",
  "feeding",
  "housing",
  "health",
  "observation",
  "prevention",
  "treatment",
  "followup",
  "emergency",
  "checklists"
] as const;

export type KnowledgeSection = (typeof KNOWLEDGE_SECTIONS)[number];
