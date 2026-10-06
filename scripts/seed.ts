import "reflect-metadata";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { schemaDefinitions } from "../apps/api/src/database/schemas";
import { schemaNames } from "../apps/api/src/database/schema-names";

const rootDir = path.resolve(__dirname, "..");
const mongoUri =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/poultryhub";
const password = "PoultryHub@2026";

const image = {
  farm: "/images/seed/modern-poultry-farm.png",
  eggs: "/images/seed/eggs-poultry-products.png",
  shop: "/images/seed/shop-supplies.png",
  chicks: "/images/seed/chicks-layer-farm.png",
  hero: "/images/poultryhub-hero.png"
};

function nowMinus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function nowPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function model(name: string) {
  return mongoose.connection.model(name);
}

async function main() {
  for (const definition of schemaDefinitions) {
    if (!mongoose.models[definition.name]) {
      mongoose.model(definition.name, definition.schema);
    }
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected to ${mongoUri}`);

  await Promise.all(
    Object.values(schemaNames).map((name) => model(name).deleteMany({}))
  );
  console.log("Cleared existing PoultryHub seed data.");

  const passwordHash = await bcrypt.hash(password, 12);
  const users = await model(schemaNames.User).insertMany([
    {
      fullName: "Anderson Super Admin",
      email: "superadmin@poultryhub.cm",
      phone: "+237600000001",
      passwordHash,
      roles: ["customer", "admin", "super_admin"],
      status: "active",
      isVerified: true,
      city: "Douala",
      region: "Littoral",
      country: "Cameroon"
    },
    {
      fullName: "Grace Nsame",
      email: "farmer.grace@poultryhub.cm",
      phone: "+237600000002",
      passwordHash,
      roles: ["customer", "farmer"],
      status: "active",
      isVerified: true,
      city: "Bafoussam",
      region: "West",
      country: "Cameroon"
    },
    {
      fullName: "Emmanuel Tabe",
      email: "farmer.emmanuel@poultryhub.cm",
      phone: "+237600000003",
      passwordHash,
      roles: ["customer", "farmer"],
      status: "active",
      isVerified: true,
      city: "Yaounde",
      region: "Centre",
      country: "Cameroon"
    },
    {
      fullName: "Amina Poultry Supplies",
      email: "shop.amina@poultryhub.cm",
      phone: "+237600000004",
      passwordHash,
      roles: ["customer", "shopkeeper"],
      status: "active",
      isVerified: true,
      city: "Douala",
      region: "Littoral",
      country: "Cameroon"
    },
    {
      fullName: "Victor AgroVet",
      email: "shop.victor@poultryhub.cm",
      phone: "+237600000005",
      passwordHash,
      roles: ["customer", "shopkeeper"],
      status: "active",
      isVerified: true,
      city: "Bamenda",
      region: "North-West",
      country: "Cameroon"
    },
    {
      fullName: "Linda Restaurant Buyer",
      email: "customer.linda@poultryhub.cm",
      phone: "+237600000006",
      passwordHash,
      roles: ["customer"],
      status: "active",
      isVerified: true,
      city: "Douala",
      region: "Littoral",
      country: "Cameroon"
    },
    {
      fullName: "Paul Egg Wholesaler",
      email: "customer.paul@poultryhub.cm",
      phone: "+237600000007",
      passwordHash,
      roles: ["customer"],
      status: "active",
      isVerified: true,
      city: "Limbe",
      region: "South-West",
      country: "Cameroon"
    },
    {
      fullName: "Pending Farm Applicant",
      email: "pending.farmer@poultryhub.cm",
      phone: "+237600000008",
      passwordHash,
      roles: ["customer", "farmer"],
      status: "active",
      isVerified: false,
      city: "Edea",
      region: "Littoral",
      country: "Cameroon"
    }
  ]);

  const [superAdmin, farmerGrace, farmerEmmanuel, shopAmina, shopVictor, customerLinda, customerPaul, pendingFarmer] = users;

  const categories = await model(schemaNames.Category).insertMany([
    { name: "Eggs", slug: "eggs", description: "Fresh table eggs and trays.", status: "active", sortOrder: 1, icon: "egg" },
    { name: "Live Chickens", slug: "live-chickens", description: "Broilers, layers, cockerels, and local birds.", status: "active", sortOrder: 2, icon: "bird" },
    { name: "Chicks", slug: "chicks", description: "Day-old chicks and young poultry.", status: "active", sortOrder: 3, icon: "sprout" },
    { name: "Feed", slug: "feed", description: "Starter, grower, finisher, and layer feed.", status: "active", sortOrder: 4, icon: "wheat" },
    { name: "Vaccines and Medicine", slug: "vaccines-medicine", description: "Vaccines, vitamins, and medication.", status: "active", sortOrder: 5, icon: "shield" },
    { name: "Equipment", slug: "equipment", description: "Feeders, drinkers, cages, trays, and tools.", status: "active", sortOrder: 6, icon: "tool" }
  ]);
  const categoryBySlug = Object.fromEntries(categories.map((category: any) => [category.slug, category]));

  const farms = await model(schemaNames.Farm).insertMany([
    {
      ownerId: farmerGrace._id,
      name: "Nsame Golden Layers",
      description: "Layer farm focused on fresh table eggs for Douala and Bafoussam buyers.",
      farmType: "layer",
      location: "Bafoussam outskirts, West Region",
      city: "Bafoussam",
      region: "West",
      country: "Cameroon",
      coordinates: { latitude: 5.48, longitude: 10.42 },
      phone: "+237600000002",
      images: [image.farm, image.eggs],
      verificationStatus: "approved",
      status: "active"
    },
    {
      ownerId: farmerEmmanuel._id,
      name: "Tabe Broiler House",
      description: "Fast-growing broiler farm supplying restaurants and households.",
      farmType: "broiler",
      location: "Mbankomo road, Centre Region",
      city: "Yaounde",
      region: "Centre",
      country: "Cameroon",
      coordinates: { latitude: 3.87, longitude: 11.52 },
      phone: "+237600000003",
      images: [image.farm, image.hero],
      verificationStatus: "approved",
      status: "active"
    },
    {
      ownerId: farmerGrace._id,
      name: "Nsame Chick Nursery",
      description: "Clean brooder facility for chicks and young layers.",
      farmType: "chick_production",
      location: "Bandjoun, West Region",
      city: "Bandjoun",
      region: "West",
      country: "Cameroon",
      coordinates: { latitude: 5.38, longitude: 10.41 },
      phone: "+237600000002",
      images: [image.chicks],
      verificationStatus: "approved",
      status: "active"
    },
    {
      ownerId: pendingFarmer._id,
      name: "Edea Local Chicken Project",
      description: "Pending verification local chicken farm.",
      farmType: "local_chicken",
      location: "Edea rural road",
      city: "Edea",
      region: "Littoral",
      country: "Cameroon",
      coordinates: { latitude: 3.8, longitude: 10.13 },
      phone: "+237600000008",
      images: [image.farm],
      verificationStatus: "pending",
      status: "active"
    }
  ]);
  const [layerFarm, broilerFarm, chickFarm, pendingFarm] = farms;

  const shops = await model(schemaNames.Shop).insertMany([
    {
      ownerId: shopAmina._id,
      name: "Amina Poultry Supplies",
      description: "Feed, vitamins, drinkers, feeders, and egg trays in Douala.",
      location: "Akwa, Douala",
      city: "Douala",
      region: "Littoral",
      country: "Cameroon",
      phone: "+237600000004",
      logo: image.shop,
      images: [image.shop],
      verificationStatus: "approved",
      status: "active"
    },
    {
      ownerId: shopVictor._id,
      name: "Victor AgroVet Bamenda",
      description: "Vaccines, medicines, and farm tools for poultry producers.",
      location: "Commercial Avenue, Bamenda",
      city: "Bamenda",
      region: "North-West",
      country: "Cameroon",
      phone: "+237600000005",
      logo: image.shop,
      images: [image.shop, image.chicks],
      verificationStatus: "approved",
      status: "active"
    },
    {
      ownerId: shopAmina._id,
      name: "Amina Hatchery Counter",
      description: "Pending second shop for chick pre-orders.",
      location: "Bonaberi, Douala",
      city: "Douala",
      region: "Littoral",
      country: "Cameroon",
      phone: "+237600000004",
      logo: image.chicks,
      images: [image.chicks],
      verificationStatus: "pending",
      status: "active"
    }
  ]);
  const [aminaShop, victorShop] = shops;

  const batches = await model(schemaNames.PoultryBatch).insertMany([
    {
      farmId: layerFarm._id,
      name: "Layer Batch L-2026-01",
      batchCode: "L-2026-01",
      poultryType: "layer",
      breed: "Isa Brown",
      initialQuantity: 1200,
      currentQuantity: 1168,
      startDate: nowMinus(140),
      expectedMaturityDate: nowMinus(30),
      status: "active",
      notes: "Main producing layer flock."
    },
    {
      farmId: broilerFarm._id,
      name: "Broiler Batch B-2026-07",
      batchCode: "B-2026-07",
      poultryType: "broiler",
      breed: "Cobb 500",
      initialQuantity: 850,
      currentQuantity: 824,
      startDate: nowMinus(28),
      expectedMaturityDate: nowPlus(14),
      status: "active",
      notes: "Restaurant supply batch."
    },
    {
      farmId: chickFarm._id,
      name: "Chick Batch C-2026-03",
      batchCode: "C-2026-03",
      poultryType: "chick",
      breed: "Sasso",
      initialQuantity: 2000,
      currentQuantity: 1960,
      startDate: nowMinus(8),
      expectedMaturityDate: nowPlus(35),
      status: "active",
      notes: "Nursery batch for young farmers."
    }
  ]);
  const [layerBatch, broilerBatch, chickBatch] = batches;

  await model(schemaNames.FeedingRecord).insertMany([
    { farmId: layerFarm._id, batchId: layerBatch._id, feedType: "layer_mash", quantity: 22, unit: "bag", cost: 330000, feedingDate: nowMinus(5), recordedBy: farmerGrace._id, notes: "Weekly feed stock." },
    { farmId: layerFarm._id, batchId: layerBatch._id, feedType: "corn_mix", quantity: 140, unit: "kg", cost: 56000, feedingDate: nowMinus(2), recordedBy: farmerGrace._id, notes: "Supplement mix." },
    { farmId: broilerFarm._id, batchId: broilerBatch._id, feedType: "finisher", quantity: 18, unit: "bag", cost: 288000, feedingDate: nowMinus(3), recordedBy: farmerEmmanuel._id, notes: "Finisher feed." },
    { farmId: chickFarm._id, batchId: chickBatch._id, feedType: "starter", quantity: 12, unit: "bag", cost: 192000, feedingDate: nowMinus(1), recordedBy: farmerGrace._id, notes: "Starter feed." }
  ]);

  await model(schemaNames.MortalityRecord).insertMany([
    {
      farmId: layerFarm._id,
      batchId: layerBatch._id,
      numberOfDeaths: 8,
      cause: "disease",
      suspectedDisease: "Newcastle",
      deathDescription: "Sudden deaths with twisted necks, coughing, and greenish diarrhea reported over two mornings.",
      symptoms: ["twisted neck", "coughing", "green diarrhea"],
      severity: "high",
      publicHealthAlert: true,
      locationSnapshot: {
        location: layerFarm.location,
        city: layerFarm.city,
        region: layerFarm.region,
        country: layerFarm.country,
        coordinates: layerFarm.coordinates
      },
      date: nowMinus(20),
      actionTaken: "Isolated affected house and contacted veterinarian.",
      recordedBy: farmerGrace._id,
      notes: "Newcastle watch response."
    },
    {
      farmId: broilerFarm._id,
      batchId: broilerBatch._id,
      numberOfDeaths: 6,
      cause: "disease",
      suspectedDisease: "Gumboro",
      deathDescription: "Weak birds with ruffled feathers and watery droppings after stress period.",
      symptoms: ["ruffled feathers", "watery droppings", "weakness"],
      severity: "medium",
      publicHealthAlert: true,
      locationSnapshot: {
        location: broilerFarm.location,
        city: broilerFarm.city,
        region: broilerFarm.region,
        country: broilerFarm.country,
        coordinates: broilerFarm.coordinates
      },
      date: nowMinus(18),
      actionTaken: "Separated weak birds and reviewed vaccination history.",
      recordedBy: farmerEmmanuel._id,
      notes: "Early batch stress."
    },
    {
      farmId: chickFarm._id,
      batchId: chickBatch._id,
      numberOfDeaths: 15,
      cause: "disease",
      suspectedDisease: "Newcastle",
      deathDescription: "Chicks died in clustered pens near the brooder after respiratory signs.",
      symptoms: ["respiratory signs", "clustered deaths", "lethargy"],
      severity: "high",
      publicHealthAlert: true,
      locationSnapshot: {
        location: chickFarm.location,
        city: chickFarm.city,
        region: chickFarm.region,
        country: chickFarm.country,
        coordinates: chickFarm.coordinates
      },
      date: nowMinus(3),
      actionTaken: "Adjusted brooder temperature and started veterinary escalation.",
      recordedBy: farmerGrace._id,
      notes: "Nearby Newcastle pattern."
    }
  ]);

  await model(schemaNames.VaccinationRecord).insertMany([
    { farmId: layerFarm._id, batchId: layerBatch._id, vaccineName: "Newcastle Booster", diseasePrevented: "Newcastle", scheduledDate: nowPlus(4), status: "scheduled", cost: 45000, administeredBy: "Dr. Mballa", notes: "Upcoming booster." },
    { farmId: broilerFarm._id, batchId: broilerBatch._id, vaccineName: "Gumboro", diseasePrevented: "Gumboro", scheduledDate: nowMinus(12), completedDate: nowMinus(12), status: "completed", cost: 38000, administeredBy: "Dr. Etoundi", notes: "Completed on schedule." },
    { farmId: chickFarm._id, batchId: chickBatch._id, vaccineName: "Marek", diseasePrevented: "Marek disease", scheduledDate: nowMinus(7), completedDate: nowMinus(7), status: "completed", cost: 52000, administeredBy: "Hatchery team", notes: "Day-old vaccination." }
  ]);

  await model(schemaNames.EggProductionRecord).insertMany(
    Array.from({ length: 12 }, (_, index) => {
      const collected = 860 + index * 7;
      const damaged = index % 3 === 0 ? 14 : 9;
      const sold = 700 + index * 8;
      return {
        farmId: layerFarm._id,
        batchId: layerBatch._id,
        date: nowMinus(12 - index),
        eggsCollected: collected,
        damagedEggs: damaged,
        eggsSold: sold,
        remainingEggs: collected - damaged - sold,
        notes: "Daily egg production seed record."
      };
    })
  );

  await model(schemaNames.Expense).insertMany([
    { ownerId: farmerGrace._id, farmId: layerFarm._id, batchId: layerBatch._id, category: "feed", amount: 330000, date: nowMinus(5), description: "Layer mash purchase.", receiptImage: image.shop },
    { ownerId: farmerEmmanuel._id, farmId: broilerFarm._id, batchId: broilerBatch._id, category: "medicine", amount: 42000, date: nowMinus(8), description: "Vitamins and anti-stress.", receiptImage: image.shop },
    { ownerId: shopAmina._id, shopId: aminaShop._id, category: "transport", amount: 85000, date: nowMinus(6), description: "Feed delivery logistics.", receiptImage: image.shop },
    { ownerId: shopVictor._id, shopId: victorShop._id, category: "equipment", amount: 240000, date: nowMinus(9), description: "Drinkers and feeder stock.", receiptImage: image.shop }
  ]);

  await model(schemaNames.FarmSale).insertMany([
    { farmId: layerFarm._id, batchId: layerBatch._id, productType: "eggs", quantity: 120, unit: "tray", unitPrice: 2500, totalAmount: 300000, buyerName: "Linda Restaurant Buyer", paymentMethod: "mobile_money", saleDate: nowMinus(2), notes: "Restaurant weekly egg supply." },
    { farmId: broilerFarm._id, batchId: broilerBatch._id, productType: "live_chicken", quantity: 80, unit: "bird", unitPrice: 4200, totalAmount: 336000, buyerName: "Paul Egg Wholesaler", paymentMethod: "cash", saleDate: nowMinus(1), notes: "Pre-booked broilers." }
  ]);

  const products = await model(schemaNames.Product).insertMany([
    { ownerId: farmerGrace._id, farmId: layerFarm._id, productType: "farm_product", name: "Fresh Egg Tray - Grade A", description: "Clean fresh eggs from approved layer farm.", categoryId: categoryBySlug.eggs._id, price: 2500, quantity: 180, unit: "tray", images: [image.eggs], status: "available", approvalStatus: "approved" },
    { ownerId: farmerEmmanuel._id, farmId: broilerFarm._id, productType: "farm_product", name: "Live Broiler Chicken", description: "Healthy broilers ready for restaurant and household orders.", categoryId: categoryBySlug["live-chickens"]._id, price: 4300, quantity: 260, unit: "bird", images: [image.farm], status: "available", approvalStatus: "approved" },
    { ownerId: farmerGrace._id, farmId: chickFarm._id, productType: "farm_product", name: "Sasso Day-Old Chicks", description: "Healthy chicks from clean nursery batch.", categoryId: categoryBySlug.chicks._id, price: 650, quantity: 900, unit: "chick", images: [image.chicks], status: "available", approvalStatus: "approved" },
    { ownerId: shopAmina._id, shopId: aminaShop._id, productType: "shop_product", name: "Broiler Finisher Feed", description: "High-energy finisher feed for broilers.", categoryId: categoryBySlug.feed._id, price: 16000, quantity: 75, unit: "bag", images: [image.shop], status: "available", approvalStatus: "approved" },
    { ownerId: shopAmina._id, shopId: aminaShop._id, productType: "shop_product", name: "Plastic Chick Feeder", description: "Durable feeder for chicks and young birds.", categoryId: categoryBySlug.equipment._id, price: 3500, quantity: 42, unit: "piece", images: [image.shop], status: "available", approvalStatus: "approved" },
    { ownerId: shopVictor._id, shopId: victorShop._id, productType: "shop_product", name: "Newcastle Vaccine Pack", description: "Cold-chain vaccine pack for poultry vaccination schedules.", categoryId: categoryBySlug["vaccines-medicine"]._id, price: 12000, quantity: 30, unit: "pack", images: [image.shop], status: "available", approvalStatus: "approved" },
    { ownerId: shopVictor._id, shopId: victorShop._id, productType: "shop_product", name: "Vitamin Booster Bottle", description: "Vitamin supplement for poultry stress recovery.", categoryId: categoryBySlug["vaccines-medicine"]._id, price: 4500, quantity: 55, unit: "bottle", images: [image.shop], status: "available", approvalStatus: "approved" },
    { ownerId: pendingFarmer._id, farmId: pendingFarm._id, productType: "farm_product", name: "Pending Local Chicken Listing", description: "Product awaiting admin approval.", categoryId: categoryBySlug["live-chickens"]._id, price: 5500, quantity: 20, unit: "bird", images: [image.farm], status: "hidden", approvalStatus: "pending" }
  ]);

  const [eggProduct, broilerProduct, chickProduct, feedProduct, feederProduct, vaccineProduct] = products;

  const cart = await model(schemaNames.Cart).create({
    customerId: customerPaul._id,
    items: [
      { productId: eggProduct._id, sellerId: farmerGrace._id, farmId: layerFarm._id, quantity: 2, unitPriceSnapshot: eggProduct.price, productNameSnapshot: eggProduct.name },
      { productId: feedProduct._id, sellerId: shopAmina._id, shopId: aminaShop._id, quantity: 1, unitPriceSnapshot: feedProduct.price, productNameSnapshot: feedProduct.name }
    ],
    subtotal: eggProduct.price * 2 + feedProduct.price
  });

  const orders = await model(schemaNames.Order).insertMany([
    {
      customerId: customerLinda._id,
      sellerId: farmerGrace._id,
      farmId: layerFarm._id,
      orderNumber: "PH-SEED-0001",
      items: [{ productId: eggProduct._id, productName: eggProduct.name, quantity: 10, unitPrice: eggProduct.price, totalPrice: eggProduct.price * 10 }],
      subtotal: eggProduct.price * 10,
      deliveryFee: 2500,
      totalAmount: eggProduct.price * 10 + 2500,
      paymentStatus: "paid",
      orderStatus: "delivered",
      deliveryMethod: "home_delivery",
      deliveryAddress: "Bonapriso, Douala",
      notes: "Delivered to restaurant kitchen."
    },
    {
      customerId: customerPaul._id,
      sellerId: shopAmina._id,
      shopId: aminaShop._id,
      orderNumber: "PH-SEED-0002",
      items: [
        { productId: feedProduct._id, productName: feedProduct.name, quantity: 3, unitPrice: feedProduct.price, totalPrice: feedProduct.price * 3 },
        { productId: feederProduct._id, productName: feederProduct.name, quantity: 4, unitPrice: feederProduct.price, totalPrice: feederProduct.price * 4 }
      ],
      subtotal: feedProduct.price * 3 + feederProduct.price * 4,
      deliveryFee: 3000,
      totalAmount: feedProduct.price * 3 + feederProduct.price * 4 + 3000,
      paymentStatus: "pending",
      orderStatus: "processing",
      deliveryMethod: "pickup_at_shop",
      deliveryAddress: "Akwa, Douala",
      notes: "Buyer will pick up at shop."
    },
    {
      customerId: customerLinda._id,
      sellerId: farmerEmmanuel._id,
      farmId: broilerFarm._id,
      orderNumber: "PH-SEED-0003",
      items: [{ productId: broilerProduct._id, productName: broilerProduct.name, quantity: 25, unitPrice: broilerProduct.price, totalPrice: broilerProduct.price * 25 }],
      subtotal: broilerProduct.price * 25,
      deliveryFee: 5000,
      totalAmount: broilerProduct.price * 25 + 5000,
      paymentStatus: "unpaid",
      orderStatus: "confirmed",
      deliveryMethod: "home_delivery",
      deliveryAddress: "Bastos, Yaounde",
      notes: "Confirmed for weekend delivery."
    }
  ]);

  await model(schemaNames.Payment).insertMany([
    { orderId: orders[0]._id, userId: customerLinda._id, amount: orders[0].totalAmount, currency: "XAF", paymentMethod: "mtn_mobile_money", transactionReference: "MTN-SEED-001", provider: "mtn_mobile_money", status: "paid", providerResponse: { seed: true }, paidAt: nowMinus(1) },
    { orderId: orders[1]._id, userId: customerPaul._id, amount: orders[1].totalAmount, currency: "XAF", paymentMethod: "cash_on_delivery", transactionReference: "COD-SEED-002", provider: "cash", status: "pending", providerResponse: { seed: true } }
  ]);

  await model(schemaNames.Notification).insertMany([
    { userId: farmerGrace._id, type: "order_created", title: "New egg order", body: "Linda Restaurant Buyer placed an order for 10 egg trays.", data: { orderId: orders[0]._id } },
    { userId: shopAmina._id, type: "low_stock", title: "Feed stock watch", body: "Broiler Finisher Feed has active marketplace demand.", data: { productId: feedProduct._id } },
    { userId: farmerGrace._id, type: "vaccination_due", title: "Vaccination due soon", body: "Newcastle Booster is scheduled in 4 days.", data: { batchId: layerBatch._id } },
    { userId: superAdmin._id, type: "farm_approved", title: "Seed farms ready", body: "Approved seed farms and shops are available for demo." }
  ]);

  const conversations = await model(schemaNames.Conversation).insertMany([
    { participantIds: [customerLinda._id, farmerGrace._id], subject: "Egg delivery confirmation", relatedOrderId: orders[0]._id, relatedFarmId: layerFarm._id, lastMessageAt: nowMinus(1) },
    { participantIds: [customerPaul._id, shopAmina._id], subject: "Feed pickup time", relatedOrderId: orders[1]._id, relatedShopId: aminaShop._id, lastMessageAt: nowMinus(2) }
  ]);

  await model(schemaNames.Message).insertMany([
    { conversationId: conversations[0]._id, senderId: customerLinda._id, body: "Please deliver before 10 AM tomorrow.", attachments: [], readBy: [customerLinda._id] },
    { conversationId: conversations[0]._id, senderId: farmerGrace._id, body: "Confirmed. The trays are packed and ready.", attachments: [], readBy: [customerLinda._id, farmerGrace._id] },
    { conversationId: conversations[1]._id, senderId: shopAmina._id, body: "Your feed order is ready for pickup at Akwa.", attachments: [], readBy: [shopAmina._id] }
  ]);

  await model(schemaNames.Review).insertMany([
    { customerId: customerLinda._id, productId: eggProduct._id, farmId: layerFarm._id, orderId: orders[0]._id, rating: 5, comment: "Clean trays and reliable delivery.", status: "published" },
    { customerId: customerPaul._id, productId: feedProduct._id, shopId: aminaShop._id, orderId: orders[1]._id, rating: 4, comment: "Good product availability and quick response.", status: "published" },
    { customerId: customerLinda._id, productId: vaccineProduct._id, shopId: victorShop._id, rating: 5, comment: "Clear advice and careful cold chain handling.", status: "published" }
  ]);

  await model(schemaNames.MediaAsset).insertMany([
    { ownerId: farmerGrace._id, url: image.farm, storageProvider: "local", mimeType: "image/png", sizeBytes: 2200000, entityType: "farm", entityId: layerFarm._id, visibility: "public" },
    { ownerId: farmerGrace._id, url: image.eggs, storageProvider: "local", mimeType: "image/png", sizeBytes: 2100000, entityType: "product", entityId: eggProduct._id, visibility: "public" },
    { ownerId: shopAmina._id, url: image.shop, storageProvider: "local", mimeType: "image/png", sizeBytes: 2000000, entityType: "shop", entityId: aminaShop._id, visibility: "public" },
    { ownerId: farmerGrace._id, url: image.chicks, storageProvider: "local", mimeType: "image/png", sizeBytes: 2100000, entityType: "product", entityId: chickProduct._id, visibility: "public" }
  ]);

  await model(schemaNames.AuditLog).insertMany([
    { actorId: superAdmin._id, actorRole: "super_admin", action: "seed.database", entityType: "System", entityId: superAdmin._id, after: { message: "Seeded PoultryHub demo database" }, ipAddress: "127.0.0.1", userAgent: "seed-script" },
    { actorId: superAdmin._id, actorRole: "super_admin", action: "farm.approved", entityType: "Farm", entityId: layerFarm._id, after: { verificationStatus: "approved" }, ipAddress: "127.0.0.1", userAgent: "seed-script" },
    { actorId: superAdmin._id, actorRole: "super_admin", action: "product.approved", entityType: "Product", entityId: eggProduct._id, after: { approvalStatus: "approved" }, ipAddress: "127.0.0.1", userAgent: "seed-script" }
  ]);

  await model(schemaNames.SystemSetting).insertMany([
    { key: "currency", value: "XAF", isSecret: false, description: "Default platform currency." },
    { key: "country", value: "Cameroon", isSecret: false, description: "Default operating country." },
    { key: "farmApprovalRequired", value: true, isSecret: false, description: "Farms require admin approval." },
    { key: "shopApprovalRequired", value: true, isSecret: false, description: "Shops require admin approval." },
    { key: "productApprovalRequired", value: true, isSecret: false, description: "Products require admin approval." },
    { key: "defaultCommissionRate", value: 0, isSecret: false, description: "Default marketplace commission rate." }
  ]);

  const creds = `# PoultryHub Seed Credentials

Generated by \`npm run seed\`.

All seeded accounts use this password:

\`\`\`txt
${password}
\`\`\`

| Role | Name | Email | Phone |
| ---- | ---- | ----- | ----- |
${users
  .map((user: any) => `| ${user.roles.join(", ")} | ${user.fullName} | ${user.email} | ${user.phone ?? ""} |`)
  .join("\n")}

## Suggested Test Flow

1. Log in as \`superadmin@poultryhub.cm\` to approve pending farms, shops, and products.
2. Log in as \`farmer.grace@poultryhub.cm\` to inspect farms, batches, egg production, mortality, vaccinations, expenses, and sales.
3. Log in as \`shop.amina@poultryhub.cm\` to inspect shop products and seller orders.
4. Log in as \`customer.linda@poultryhub.cm\` to browse marketplace orders, messages, payments, and reviews.
`;

  fs.writeFileSync(path.join(rootDir, "creds.md"), creds);

  console.log(`Seed complete:
  users: ${users.length}
  categories: ${categories.length}
  farms: ${farms.length}
  shops: ${shops.length}
  batches: ${batches.length}
  products: ${products.length}
  cart items: ${cart.items.length}
  orders: ${orders.length}
  credentials: creds.md
`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
