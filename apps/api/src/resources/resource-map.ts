import { schemaNames, SchemaName } from "../database/schema-names";

export const resourceMap: Record<string, SchemaName> = {
  users: schemaNames.User,
  farms: schemaNames.Farm,
  batches: schemaNames.PoultryBatch,
  "feeding-records": schemaNames.FeedingRecord,
  "mortality-records": schemaNames.MortalityRecord,
  "vaccination-records": schemaNames.VaccinationRecord,
  "egg-production-records": schemaNames.EggProductionRecord,
  expenses: schemaNames.Expense,
  "farm-sales": schemaNames.FarmSale,
  shops: schemaNames.Shop,
  categories: schemaNames.Category,
  products: schemaNames.Product,
  carts: schemaNames.Cart,
  orders: schemaNames.Order,
  payments: schemaNames.Payment,
  notifications: schemaNames.Notification,
  conversations: schemaNames.Conversation,
  messages: schemaNames.Message,
  reviews: schemaNames.Review,
  media: schemaNames.MediaAsset,
  "audit-logs": schemaNames.AuditLog,
  settings: schemaNames.SystemSetting
};

export const publicResources = new Set([
  "farms",
  "shops",
  "products",
  "categories",
  "reviews"
]);

export const protectedResources = new Set([
  "users",
  "carts",
  "orders",
  "payments",
  "notifications",
  "conversations",
  "messages",
  "expenses",
  "farm-sales",
  "feeding-records",
  "mortality-records",
  "vaccination-records",
  "egg-production-records",
  "audit-logs",
  "settings"
]);
