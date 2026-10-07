export type ApiList<T> = {
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiSingle<T> = {
  data: T;
};

export type User = {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  roles: string[];
  status: string;
  isVerified?: boolean;
  roleVerificationStatus?: "not_required" | "pending" | "approved" | "rejected";
};

export type Farm = {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  farmType: string;
  location: string;
  city?: string;
  region?: string;
  country?: string;
  phone?: string;
  images?: string[];
  verificationStatus: "pending" | "approved" | "rejected";
  status: string;
  rejectionReason?: string;
  openingHours?: string;
  pickupAvailable?: boolean;
  coordinates?: { latitude: number; longitude: number };
};

/** Flock = PoultryBatch in the API */
export type PoultryBatch = {
  _id: string;
  farmId: string;
  name: string;
  batchCode: string;
  poultryType: string;
  breed?: string;
  purpose?: string;
  startingAgeDays?: number;
  housing?: string;
  initialQuantity: number;
  currentQuantity: number;
  startDate: string;
  expectedMaturityDate?: string;
  status: "active" | "completed" | "sold" | "cancelled" | "lost" | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FarmWithFlocks = Farm & {
  flockCount?: number;
  activeFlockCount?: number;
  flocks?: PoultryBatch[];
};

export type FarmOpsDaySummary = {
  date: string;
  farm: Pick<
    Farm,
    "_id" | "name" | "city" | "region" | "location" | "farmType" | "verificationStatus" | "status"
  > & { _id: string };
  flock: PoultryBatch;
  summary: {
    currentBirds: number;
    eggsToday: number;
    mortalityToday: number;
    feedKgToday: number;
    expensesToday: number;
    eggProductionRate: number;
    feedConsumedKg: number;
    vaccinationsToday: number;
    mortalityRate?: number;
    feedPerBird?: number;
    feedBagNote?: string;
  };
  flocks: PoultryBatch[];
  recordCounts: {
    eggs: number;
    feeding: number;
    mortality: number;
    expenses: number;
    health: number;
  };
  records?: {
    eggs?: any[];
    feeding?: any[];
    mortality?: any[];
    expenses?: any[];
    health?: any[];
  };
};

export type Shop = {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  location: string;
  city?: string;
  region?: string;
  country?: string;
  phone?: string;
  logo?: string;
  images?: string[];
  verificationStatus: "pending" | "approved" | "rejected";
  status: string;
  rejectionReason?: string;
  coordinates?: { latitude: number; longitude: number };
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  status: string;
};

export type Product = {
  _id: string;
  ownerId: string;
  farmId?: string;
  shopId?: string;
  productType: "farm_product" | "shop_product";
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  quantity: number;
  unit: string;
  images?: string[];
  status: string;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
};

export type DashboardOverview = {
  farms?: number;
  shops?: number;
  products?: number;
  orders?: number;
  expenses?: number;
  farmSales?: number;
  unreadNotifications?: number;
  totalUsers?: number;
  totalFarms?: number;
  totalShops?: number;
  totalProducts?: number;
  totalOrders?: number;
  pendingFarms?: number;
  pendingShops?: number;
  pendingProducts?: number;
};

export type AuthResponse = {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
};

export type Review = {
  _id?: string;
  productId: string;
  userId?: string;
  customerName?: string;
  rating: number;
  comment: string;
  createdAt?: string;
};
