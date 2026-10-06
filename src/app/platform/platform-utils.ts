export function getRoleBadgeLabel(role: string, lang: string): string {
  const map: Record<string, [string, string]> = {
    farmer: ["Farmer", "Éleveur"],
    shopkeeper: ["Shopkeeper", "Boutiquier"],
    customer: ["Customer", "Client"],
    admin: ["Admin", "Admin"],
    super_admin: ["Super Admin", "Super Admin"],
  };
  const entry = map[role] ?? map.customer;
  return lang === "en" ? entry[0] : entry[1];
}
