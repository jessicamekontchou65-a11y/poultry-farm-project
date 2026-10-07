import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { KNOWLEDGE_SECTIONS } from "../knowledge/knowledge.constants";
import { Schema as MongooseSchema, Types } from "mongoose";
import { schemaNames } from "./schema-names";

const objectId = { type: MongooseSchema.Types.ObjectId };
const optionalObjectId = { ...objectId, required: false };

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  email: string;

  @Prop({ trim: true, unique: true, sparse: true })
  phone?: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop()
  avatar?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  region?: string;

  @Prop({ default: "Cameroon" })
  country: string;

  @Prop({ type: [String], default: ["customer"], index: true })
  roles: string[];

  @Prop({ enum: ["active", "inactive", "suspended"], default: "active" })
  status: string;

  @Prop({ default: false })
  isVerified: boolean;

  /** Official proof document (data URL) for farmer/shopkeeper registration */
  @Prop()
  verificationDocument?: string;

  @Prop()
  verificationDocumentName?: string;

  @Prop()
  verificationDocumentMimeType?: string;

  @Prop({
    enum: ["not_required", "pending", "approved", "rejected"],
    default: "not_required"
  })
  roleVerificationStatus: string;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

@Schema({ timestamps: true })
export class Farm {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    enum: [
      "broiler",
      "layer",
      "chick_production",
      "egg_production",
      "mixed_poultry",
      "local_chicken"
    ]
  })
  farmType: string;

  @Prop({ required: true })
  location: string;

  @Prop()
  city?: string;

  @Prop()
  region?: string;

  @Prop({ default: "Cameroon" })
  country: string;

  @Prop({ type: { latitude: Number, longitude: Number }, required: false })
  coordinates?: { latitude: number; longitude: number };

  @Prop()
  phone?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ enum: ["pending", "approved", "rejected"], default: "pending", index: true })
  verificationStatus: string;

  @Prop()
  rejectionReason?: string;

  /** Official document proving farm legitimacy (required on create) */
  @Prop()
  verificationDocument?: string;

  @Prop()
  verificationDocumentName?: string;

  @Prop()
  openingHours?: string;

  @Prop({ default: true })
  pickupAvailable: boolean;

  @Prop({ enum: ["active", "inactive", "suspended", "deleted"], default: "active", index: true })
  status: string;
}

export const FarmSchema = SchemaFactory.createForClass(Farm);
FarmSchema.index({ ownerId: 1, status: 1 });
FarmSchema.index({ verificationStatus: 1, status: 1 });

@Schema({ timestamps: true })
export class PoultryBatch {
  @Prop({ ...objectId, required: true, ref: schemaNames.Farm, index: true })
  farmId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, trim: true, index: true })
  batchCode: string;

  @Prop({
    required: true,
    enum: ["broiler", "layer", "chick", "cockerel", "local", "hybrid", "breeder", "other"],
    index: true
  })
  poultryType: string;

  @Prop()
  breed?: string;

  /** Production purpose, e.g. eggs, meat, breeding, dual */
  @Prop()
  purpose?: string;

  /** Age in days when flock was placed */
  @Prop({ min: 0 })
  startingAgeDays?: number;

  /** House / pen / location label within the farm */
  @Prop()
  housing?: string;

  @Prop({ required: true, min: 0 })
  initialQuantity: number;

  @Prop({ required: true, min: 0 })
  currentQuantity: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  expectedMaturityDate?: Date;

  @Prop({ enum: ["active", "completed", "sold", "cancelled", "lost"], default: "active", index: true })
  status: string;

  @Prop()
  notes?: string;
}

export const PoultryBatchSchema = SchemaFactory.createForClass(PoultryBatch);
PoultryBatchSchema.index({ farmId: 1, status: 1 });

@Schema({ timestamps: true })
export class FeedingRecord {
  @Prop({ ...objectId, required: true, ref: schemaNames.Farm, index: true })
  farmId: Types.ObjectId;

  @Prop({ ...objectId, required: true, ref: schemaNames.PoultryBatch, index: true })
  batchId: Types.ObjectId;

  @Prop({ required: true })
  feedType: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, enum: ["kg", "bag", "ton", "other"] })
  unit: string;

  @Prop({ min: 0, default: 0 })
  cost: number;

  @Prop({ min: 0 })
  birdsCount?: number;

  @Prop({ min: 1, default: 1 })
  feedingSessions?: number;

  @Prop({ required: true, index: true })
  feedingDate: Date;

  @Prop({ ...objectId, required: true, ref: schemaNames.User })
  recordedBy: Types.ObjectId;

  @Prop()
  notes?: string;
}

export const FeedingRecordSchema = SchemaFactory.createForClass(FeedingRecord);
FeedingRecordSchema.index({ batchId: 1, feedingDate: -1 });

@Schema({ timestamps: true })
export class MortalityRecord {
  @Prop({ ...objectId, required: true, ref: schemaNames.Farm, index: true })
  farmId: Types.ObjectId;

  @Prop({ ...objectId, required: true, ref: schemaNames.PoultryBatch, index: true })
  batchId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  numberOfDeaths: number;

  @Prop({ required: true })
  cause: string;

  @Prop({ type: String, trim: true, index: true })
  suspectedDisease?: string;

  @Prop({ type: String })
  deathDescription?: string;

  @Prop({ type: [String], default: [] })
  symptoms: string[];

  @Prop({ type: String, enum: ["low", "medium", "high", "critical"], default: "medium", index: true })
  severity: string;

  @Prop({ default: false, index: true })
  publicHealthAlert: boolean;

  @Prop({
    type: {
      location: String,
      city: String,
      region: String,
      country: String,
      coordinates: { latitude: Number, longitude: Number }
    },
    required: false
  })
  locationSnapshot?: {
    location?: string;
    city?: string;
    region?: string;
    country?: string;
    coordinates?: { latitude: number; longitude: number };
  };

  @Prop({ required: true, index: true })
  date: Date;

  @Prop()
  actionTaken?: string;

  @Prop({ ...objectId, required: true, ref: schemaNames.User })
  recordedBy: Types.ObjectId;

  @Prop()
  notes?: string;
}

export const MortalityRecordSchema = SchemaFactory.createForClass(MortalityRecord);
MortalityRecordSchema.index({ batchId: 1, date: -1 });
MortalityRecordSchema.index({ suspectedDisease: 1, date: -1 });
MortalityRecordSchema.index({ publicHealthAlert: 1, suspectedDisease: 1, date: -1 });

@Schema({ timestamps: true })
export class VaccinationRecord {
  @Prop({ ...objectId, required: true, ref: schemaNames.Farm, index: true })
  farmId: Types.ObjectId;

  @Prop({ ...objectId, required: true, ref: schemaNames.PoultryBatch, index: true })
  batchId: Types.ObjectId;

  @Prop({
    enum: ["vaccination", "medication", "treatment", "other"],
    default: "vaccination",
    index: true
  })
  treatmentType: string;

  @Prop({ required: true })
  vaccineName: string;

  @Prop()
  diseasePrevented?: string;

  @Prop({ required: true, index: true })
  scheduledDate: Date;

  @Prop()
  completedDate?: Date;

  @Prop({ enum: ["scheduled", "completed", "missed", "cancelled"], default: "scheduled", index: true })
  status: string;

  @Prop({ min: 0 })
  cost?: number;

  @Prop({ min: 0 })
  quantityUsed?: number;

  @Prop()
  unit?: string;

  @Prop({ min: 0 })
  birdsTreated?: number;

  @Prop()
  administrationMethod?: string;

  @Prop()
  supplier?: string;

  @Prop()
  productBatchNumber?: string;

  @Prop()
  expiryDate?: Date;

  @Prop()
  nextScheduledDate?: Date;

  @Prop()
  administeredBy?: string;

  @Prop()
  notes?: string;
}

export const VaccinationRecordSchema = SchemaFactory.createForClass(VaccinationRecord);
VaccinationRecordSchema.index({ batchId: 1, scheduledDate: 1 });

@Schema({ timestamps: true })
export class EggProductionRecord {
  @Prop({ ...objectId, required: true, ref: schemaNames.Farm, index: true })
  farmId: Types.ObjectId;

  @Prop({ ...objectId, required: true, ref: schemaNames.PoultryBatch, index: true })
  batchId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true, min: 0 })
  eggsCollected: number;

  @Prop({ default: 0, min: 0 })
  damagedEggs: number;

  @Prop({ default: 0, min: 0 })
  eggsSold: number;

  @Prop({ default: 0, min: 0 })
  remainingEggs: number;

  /** Optional quality breakdown (Phase 2) */
  @Prop({ min: 0 })
  birdsCount?: number;

  @Prop({ min: 0 })
  goodEggs?: number;

  @Prop({ min: 0 })
  crackedEggs?: number;

  @Prop({ min: 0 })
  dirtyEggs?: number;

  @Prop({ min: 0 })
  brokenEggs?: number;

  @Prop({ min: 0 })
  rejectedEggs?: number;

  @Prop({ enum: ["morning", "afternoon", "evening", "full_day", "other"], default: "full_day" })
  collectionSession?: string;

  @Prop({ ...objectId, ref: schemaNames.User })
  recordedBy?: Types.ObjectId;

  @Prop()
  notes?: string;
}

export const EggProductionRecordSchema = SchemaFactory.createForClass(EggProductionRecord);
EggProductionRecordSchema.index({ batchId: 1, date: -1 });

@Schema({ timestamps: true })
export class Expense {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  ownerId: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Farm, index: true })
  farmId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Shop, index: true })
  shopId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.PoultryBatch, index: true })
  batchId?: Types.ObjectId;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ min: 0 })
  quantity?: number;

  @Prop()
  unit?: string;

  @Prop({ min: 0 })
  unitPrice?: number;

  @Prop()
  paymentMethod?: string;

  @Prop()
  supplier?: string;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop()
  description?: string;

  @Prop()
  receiptImage?: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

@Schema({ timestamps: true })
export class FarmSale {
  @Prop({ ...objectId, required: true, ref: schemaNames.Farm, index: true })
  farmId: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.PoultryBatch, index: true })
  batchId?: Types.ObjectId;

  @Prop({ required: true })
  productType: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop()
  buyerName?: string;

  @Prop()
  paymentMethod?: string;

  @Prop({ required: true, index: true })
  saleDate: Date;

  @Prop()
  notes?: string;
}

export const FarmSaleSchema = SchemaFactory.createForClass(FarmSale);

@Schema({ timestamps: true })
export class Shop {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  location: string;

  @Prop()
  city?: string;

  @Prop()
  region?: string;

  @Prop({ default: "Cameroon" })
  country: string;

  @Prop()
  phone?: string;

  @Prop()
  logo?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ enum: ["pending", "approved", "rejected"], default: "pending", index: true })
  verificationStatus: string;

  @Prop()
  rejectionReason?: string;

  /** Official document proving shop legitimacy (required on create) */
  @Prop()
  verificationDocument?: string;

  @Prop()
  verificationDocumentName?: string;

  @Prop()
  openingHours?: string;

  @Prop({ default: true })
  pickupAvailable: boolean;

  @Prop({ type: { latitude: Number, longitude: Number }, required: false })
  coordinates?: { latitude: number; longitude: number };

  @Prop({ enum: ["active", "inactive", "suspended", "deleted"], default: "active", index: true })
  status: string;
}

export const ShopSchema = SchemaFactory.createForClass(Shop);
ShopSchema.index({ ownerId: 1, status: 1 });
ShopSchema.index({ verificationStatus: 1, status: 1 });

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop({ ...optionalObjectId, ref: schemaNames.Category })
  parentId?: Types.ObjectId;

  @Prop()
  icon?: string;

  @Prop({ enum: ["active", "inactive"], default: "active", index: true })
  status: string;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

@Schema({ timestamps: true })
export class Product {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  ownerId: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Farm, index: true })
  farmId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Shop, index: true })
  shopId?: Types.ObjectId;

  @Prop({ required: true, enum: ["farm_product", "shop_product"], index: true })
  productType: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ ...objectId, required: true, ref: schemaNames.Category, index: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ enum: ["available", "out_of_stock", "hidden"], default: "available", index: true })
  status: string;

  @Prop({ enum: ["pending", "approved", "rejected"], default: "pending", index: true })
  approvalStatus: string;

  @Prop()
  rejectionReason?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ approvalStatus: 1, status: 1, categoryId: 1 });

const CartItemSchema = new MongooseSchema(
  {
    productId: { ...objectId, ref: schemaNames.Product, required: true },
    sellerId: { ...objectId, ref: schemaNames.User, required: true },
    farmId: { ...optionalObjectId, ref: schemaNames.Farm },
    shopId: { ...optionalObjectId, ref: schemaNames.Shop },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceSnapshot: { type: Number, required: true, min: 0 },
    productNameSnapshot: { type: String, required: true }
  },
  { _id: true }
);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true, unique: true })
  customerId: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: unknown[];

  @Prop({ default: 0, min: 0 })
  subtotal: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

const OrderItemSchema = new MongooseSchema(
  {
    productId: { ...objectId, ref: schemaNames.Product, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

@Schema({ timestamps: true })
export class Order {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  customerId: Types.ObjectId;

  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  sellerId: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Farm, index: true })
  farmId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Shop, index: true })
  shopId?: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  orderNumber: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: unknown[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  deliveryFee: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ enum: ["unpaid", "pending", "paid", "failed", "refunded"], default: "unpaid", index: true })
  paymentStatus: string;

  @Prop({
    enum: ["pending", "confirmed", "processing", "ready", "delivered", "cancelled", "rejected"],
    default: "pending",
    index: true
  })
  orderStatus: string;

  @Prop()
  deliveryMethod?: string;

  @Prop({ enum: ["delivery", "pickup"], default: "delivery" })
  fulfillmentMethod?: string;

  @Prop({
    enum: ["pending", "confirmed", "ready_for_pickup", "picked_up", "cancelled"],
    required: false
  })
  pickupStatus?: string;

  @Prop()
  pickupLocation?: string;

  @Prop()
  deliveryAddress?: string;

  @Prop()
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

@Schema({ timestamps: true })
export class Payment {
  @Prop({ ...objectId, required: true, ref: schemaNames.Order, index: true })
  orderId: Types.ObjectId;

  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: "XAF" })
  currency: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ index: true })
  transactionReference?: string;

  @Prop()
  provider?: string;

  @Prop({ enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true })
  status: string;

  @Prop({ type: Object })
  providerResponse?: Record<string, unknown>;

  @Prop()
  paidAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

@Schema({ timestamps: true })
export class Notification {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: Object })
  data?: Record<string, unknown>;

  @Prop({ index: true })
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, readAt: 1 });

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: schemaNames.User, default: [], index: true })
  participantIds: Types.ObjectId[];

  @Prop()
  subject?: string;

  @Prop({ ...optionalObjectId, ref: schemaNames.Order })
  relatedOrderId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Farm })
  relatedFarmId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Shop })
  relatedShopId?: Types.ObjectId;

  @Prop({ index: true })
  lastMessageAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

@Schema({ timestamps: true })
export class Message {
  @Prop({ ...objectId, required: true, ref: schemaNames.Conversation, index: true })
  conversationId: Types.ObjectId;

  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  body: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: schemaNames.User, default: [] })
  readBy: Types.ObjectId[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

@Schema({ timestamps: true })
export class Review {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  customerId: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Product, index: true })
  productId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Farm, index: true })
  farmId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Shop, index: true })
  shopId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Order })
  orderId?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment?: string;

  @Prop({ enum: ["published", "hidden", "flagged"], default: "published", index: true })
  status: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

@Schema({ timestamps: true })
export class MediaAsset {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop()
  publicId?: string;

  @Prop({ enum: ["local", "cloudinary", "other"], default: "local" })
  storageProvider: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ enum: ["image", "video"] })
  kind?: string;

  @Prop({ required: true, min: 0 })
  sizeBytes: number;

  @Prop()
  entityType?: string;

  @Prop({ ...optionalObjectId })
  entityId?: Types.ObjectId;

  @Prop({ enum: ["public", "private"], default: "private" })
  visibility: string;
}

export const MediaAssetSchema = SchemaFactory.createForClass(MediaAsset);

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  actorId: Types.ObjectId;

  @Prop({ required: true })
  actorRole: string;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: true, index: true })
  entityType: string;

  @Prop({ ...objectId, required: true, index: true })
  entityId: Types.ObjectId;

  @Prop({ type: Object })
  before?: Record<string, unknown>;

  @Prop({ type: Object })
  after?: Record<string, unknown>;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ actorId: 1, createdAt: -1 });

@Schema({ timestamps: true })
export class SystemSetting {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  value: unknown;

  @Prop({ default: false })
  isSecret: boolean;

  @Prop()
  description?: string;
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);

// ─── Community / Social Platform ────────────────────────────────────────────

@Schema({ timestamps: true })
export class Post {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true, enum: ["farmer", "shopkeeper", "customer", "admin", "super_admin"] })
  authorRole: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  content: string;

  /** Image URLs, kept for older clients; mirrors `media`. */
  @Prop({ type: [String], default: [] })
  mediaUrls: string[];

  /** Uploaded photos and videos, in display order. */
  @Prop({
    type: [
      {
        _id: false,
        url: { type: String, required: true },
        kind: { type: String, enum: ["image", "video"], required: true },
        mimeType: String,
        assetId: { type: MongooseSchema.Types.ObjectId, ref: schemaNames.MediaAsset }
      }
    ],
    default: []
  })
  media: { url: string; kind: "image" | "video"; mimeType?: string; assetId?: Types.ObjectId }[];

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ ...optionalObjectId, ref: schemaNames.Product, index: true })
  productId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Farm, index: true })
  farmId?: Types.ObjectId;

  @Prop({ ...optionalObjectId, ref: schemaNames.Shop, index: true })
  shopId?: Types.ObjectId;

  @Prop()
  locationLabel?: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: schemaNames.User }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: schemaNames.User }], default: [] })
  saves: Types.ObjectId[];

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ default: false })
  isHidden: boolean;

  @Prop()
  hiddenReason?: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({ createdAt: -1 });
PostSchema.index({ tags: 1, createdAt: -1 });
PostSchema.index({ authorId: 1, createdAt: -1 });

@Schema({ timestamps: true })
export class Comment {
  @Prop({ ...objectId, required: true, ref: schemaNames.Post, index: true })
  postId: Types.ObjectId;

  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  content: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: schemaNames.User }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ ...optionalObjectId, ref: schemaNames.Comment })
  parentCommentId?: Types.ObjectId;

  @Prop({ default: false })
  isHidden: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({ postId: 1, createdAt: 1 });

@Schema({ timestamps: true })
export class PostFollow {
  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  followerId: Types.ObjectId;

  @Prop({ ...objectId, required: true, ref: schemaNames.User, index: true })
  followingId: Types.ObjectId;
}

export const PostFollowSchema = SchemaFactory.createForClass(PostFollow);
PostFollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });


@Schema({ _id: false })
export class LocalizedText {
  @Prop({ default: "" })
  en: string;

  @Prop({ default: "" })
  fr: string;
}
const LocalizedTextSchema = SchemaFactory.createForClass(LocalizedText);

@Schema({ _id: false })
export class KnowledgeReference {
  @Prop({ required: true })
  title: string;

  @Prop()
  url?: string;
}
const KnowledgeReferenceSchema = SchemaFactory.createForClass(KnowledgeReference);

/** Educational content for the Poultry Knowledge Center, editable by admins. */
@Schema({ timestamps: true })
export class KnowledgeArticle {
  @Prop({ required: true, unique: true, trim: true, lowercase: true, index: true })
  slug: string;

  @Prop({ required: true, enum: KNOWLEDGE_SECTIONS, index: true })
  section: string;

  @Prop({ type: LocalizedTextSchema, required: true })
  title: LocalizedText;

  @Prop({ type: LocalizedTextSchema, required: true })
  summary: LocalizedText;

  /** Markdown body. */
  @Prop({ type: LocalizedTextSchema, required: true })
  body: LocalizedText;

  /** Observable signs people search for, in both languages (e.g. "coughing", "toux"). */
  @Prop({ type: [String], default: [] })
  symptoms: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  /** Empty means the article applies to every poultry type. */
  @Prop({ type: [String], default: [] })
  poultryTypes: string[];

  @Prop({ min: 0 })
  minAgeDays?: number;

  @Prop({ min: 0 })
  maxAgeDays?: number;

  @Prop({ enum: ["info", "caution", "urgent"], default: "info", index: true })
  alertLevel: string;

  @Prop({ type: [LocalizedTextSchema], default: [] })
  warnings: LocalizedText[];

  @Prop({ type: [LocalizedTextSchema], default: [] })
  checklist: LocalizedText[];

  @Prop({ type: [KnowledgeReferenceSchema], default: [] })
  references: KnowledgeReference[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ enum: ["draft", "published"], default: "published", index: true })
  status: string;

  @Prop({ default: 0 })
  order: number;

  /** Lower-cased, accent-free copy of the searchable text, maintained by the service. */
  @Prop({ select: false, index: true })
  searchText?: string;

  @Prop({ ...optionalObjectId, ref: schemaNames.User })
  updatedBy?: Types.ObjectId;
}

export const KnowledgeArticleSchema = SchemaFactory.createForClass(KnowledgeArticle);
KnowledgeArticleSchema.index({ section: 1, status: 1, order: 1 });

export const schemaDefinitions = [
  { name: schemaNames.User, schema: UserSchema },
  { name: schemaNames.Farm, schema: FarmSchema },
  { name: schemaNames.PoultryBatch, schema: PoultryBatchSchema },
  { name: schemaNames.FeedingRecord, schema: FeedingRecordSchema },
  { name: schemaNames.MortalityRecord, schema: MortalityRecordSchema },
  { name: schemaNames.VaccinationRecord, schema: VaccinationRecordSchema },
  { name: schemaNames.EggProductionRecord, schema: EggProductionRecordSchema },
  { name: schemaNames.Expense, schema: ExpenseSchema },
  { name: schemaNames.FarmSale, schema: FarmSaleSchema },
  { name: schemaNames.Shop, schema: ShopSchema },
  { name: schemaNames.Category, schema: CategorySchema },
  { name: schemaNames.Product, schema: ProductSchema },
  { name: schemaNames.Cart, schema: CartSchema },
  { name: schemaNames.Order, schema: OrderSchema },
  { name: schemaNames.Payment, schema: PaymentSchema },
  { name: schemaNames.Notification, schema: NotificationSchema },
  { name: schemaNames.Conversation, schema: ConversationSchema },
  { name: schemaNames.Message, schema: MessageSchema },
  { name: schemaNames.Review, schema: ReviewSchema },
  { name: schemaNames.MediaAsset, schema: MediaAssetSchema },
  { name: schemaNames.AuditLog, schema: AuditLogSchema },
  { name: schemaNames.SystemSetting, schema: SystemSettingSchema },
  { name: schemaNames.Post, schema: PostSchema },
  { name: schemaNames.Comment, schema: CommentSchema },
  { name: schemaNames.PostFollow, schema: PostFollowSchema },
  { name: schemaNames.KnowledgeArticle, schema: KnowledgeArticleSchema }
];
