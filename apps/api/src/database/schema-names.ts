export const schemaNames = {
  User: "User",
  Farm: "Farm",
  PoultryBatch: "PoultryBatch",
  FeedingRecord: "FeedingRecord",
  MortalityRecord: "MortalityRecord",
  VaccinationRecord: "VaccinationRecord",
  EggProductionRecord: "EggProductionRecord",
  Expense: "Expense",
  FarmSale: "FarmSale",
  Shop: "Shop",
  Category: "Category",
  Product: "Product",
  Cart: "Cart",
  Order: "Order",
  Payment: "Payment",
  Notification: "Notification",
  Conversation: "Conversation",
  Message: "Message",
  Review: "Review",
  MediaAsset: "MediaAsset",
  AuditLog: "AuditLog",
  SystemSetting: "SystemSetting",
  Post: "Post",
  Comment: "Comment",
  PostFollow: "PostFollow"
} as const;

export type SchemaName = (typeof schemaNames)[keyof typeof schemaNames];
