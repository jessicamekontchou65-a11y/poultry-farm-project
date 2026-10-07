import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { schemaNames } from "../database/schema-names";
import { CampayService, CampayStatus } from "../payments/campay.service";
import {
  applyMortality,
  calculateEggProduction,
  calculateOrderItem
} from "./domain.rules";

export type AuthUser = {
  id: string;
  roles: string[];
};

const ORDER_STATUSES = new Set([
  "pending",
  "confirmed",
  "processing",
  "ready",
  "delivered",
  "cancelled",
  "rejected"
]);
const PAYMENT_STATUSES = new Set(["pending", "paid", "failed", "refunded"]);
const CAMPAY_METHODS = new Set(["mtn_mobile_money", "orange_money", "mobile_money"]);

function campayToPaymentStatus(status: CampayStatus) {
  if (status === "SUCCESSFUL") return "paid";
  if (status === "FAILED") return "failed";
  return "pending";
}

const CAMEROON_REGION_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  adamawa: { latitude: 7.32, longitude: 13.58 },
  centre: { latitude: 3.87, longitude: 11.52 },
  east: { latitude: 4.58, longitude: 13.68 },
  "far north": { latitude: 10.59, longitude: 14.32 },
  littoral: { latitude: 4.05, longitude: 9.77 },
  north: { latitude: 9.33, longitude: 13.4 },
  northwest: { latitude: 6.0, longitude: 10.25 },
  west: { latitude: 5.48, longitude: 10.42 },
  south: { latitude: 2.92, longitude: 11.15 },
  southwest: { latitude: 4.16, longitude: 9.24 }
};

@Injectable()
export class DomainService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly campay: CampayService
  ) {}

  async createBatch(user: AuthUser, farmId: string, body: Record<string, any>) {
    await this.assertFarmAccess(user, farmId);
    const initialQuantity = Number(body.initialQuantity);
    if (!Number.isFinite(initialQuantity) || initialQuantity < 0) {
      throw new BadRequestException("Initial quantity must be zero or greater");
    }

    const poultryType = String(body.poultryType || "").trim();
    const allowedTypes = [
      "broiler",
      "layer",
      "chick",
      "cockerel",
      "local",
      "hybrid",
      "breeder",
      "other"
    ];
    if (!allowedTypes.includes(poultryType)) {
      throw new BadRequestException("Invalid poultry / flock type");
    }

    const name = String(body.name || "").trim();
    const batchCode = String(body.batchCode || "").trim();
    if (!name || !batchCode) {
      throw new BadRequestException("Flock name and batch code are required");
    }

    if (!body.startDate) {
      throw new BadRequestException("Placement / start date is required");
    }

    const batch = await this.model(schemaNames.PoultryBatch).create({
      farmId,
      name,
      batchCode,
      poultryType,
      breed: body.breed ? String(body.breed).trim() : undefined,
      purpose: body.purpose ? String(body.purpose).trim() : undefined,
      startingAgeDays:
        body.startingAgeDays === undefined || body.startingAgeDays === ""
          ? undefined
          : Number(body.startingAgeDays),
      housing: body.housing ? String(body.housing).trim() : undefined,
      initialQuantity,
      currentQuantity: initialQuantity,
      startDate: new Date(body.startDate),
      expectedMaturityDate: body.expectedMaturityDate
        ? new Date(body.expectedMaturityDate)
        : undefined,
      status: body.status ?? "active",
      notes: body.notes ? String(body.notes).trim() : undefined
    });

    return { data: batch };
  }

  async listFarmBatches(user: AuthUser, farmId: string, query: Record<string, any>) {
    await this.assertFarmAccess(user, farmId);
    return this.list(schemaNames.PoultryBatch, { ...query, farmId });
  }

  async getBatch(user: AuthUser, batchId: string) {
    const batch = await this.assertBatchAccess(user, batchId, { allowInactive: true });
    const farm = await this.findById(schemaNames.Farm, String(batch.farmId));
    return {
      data: {
        ...batch.toObject(),
        farm: {
          _id: farm._id,
          name: farm.name,
          city: farm.city,
          region: farm.region,
          location: farm.location,
          verificationStatus: farm.verificationStatus,
          status: farm.status
        }
      }
    };
  }

  async updateBatch(user: AuthUser, batchId: string, body: Record<string, any>) {
    const batch = await this.assertBatchAccess(user, batchId, { allowInactive: true });

    const allowedTypes = [
      "broiler",
      "layer",
      "chick",
      "cockerel",
      "local",
      "hybrid",
      "breeder",
      "other"
    ];

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) throw new BadRequestException("Flock name cannot be empty");
      batch.name = name;
    }
    if (body.batchCode !== undefined) {
      const batchCode = String(body.batchCode).trim();
      if (!batchCode) throw new BadRequestException("Batch code cannot be empty");
      batch.batchCode = batchCode;
    }
    if (body.poultryType !== undefined) {
      const poultryType = String(body.poultryType).trim();
      if (!allowedTypes.includes(poultryType)) {
        throw new BadRequestException("Invalid poultry / flock type");
      }
      batch.poultryType = poultryType;
    }
    if (body.breed !== undefined) batch.breed = String(body.breed).trim() || undefined;
    if (body.purpose !== undefined) batch.purpose = String(body.purpose).trim() || undefined;
    if (body.housing !== undefined) batch.housing = String(body.housing).trim() || undefined;
    if (body.notes !== undefined) batch.notes = String(body.notes).trim() || undefined;
    if (body.startingAgeDays !== undefined && body.startingAgeDays !== "") {
      const age = Number(body.startingAgeDays);
      if (!Number.isFinite(age) || age < 0) {
        throw new BadRequestException("Starting age must be zero or greater");
      }
      batch.startingAgeDays = age;
    }
    if (body.startDate !== undefined) batch.startDate = new Date(body.startDate);
    if (body.expectedMaturityDate !== undefined) {
      batch.expectedMaturityDate = body.expectedMaturityDate
        ? new Date(body.expectedMaturityDate)
        : undefined;
    }
    if (body.status !== undefined) {
      const allowedStatus = ["active", "completed", "sold", "cancelled", "lost"];
      if (!allowedStatus.includes(String(body.status))) {
        throw new BadRequestException("Invalid flock status");
      }
      batch.status = String(body.status);
    }

    // initialQuantity is historical; only allow increase of currentQuantity via explicit field
    // when correcting stock — never silently rewrite mortality history in Phase 1
    if (body.currentQuantity !== undefined) {
      const qty = Number(body.currentQuantity);
      if (!Number.isFinite(qty) || qty < 0) {
        throw new BadRequestException("Current bird count must be zero or greater");
      }
      batch.currentQuantity = qty;
    }

    await batch.save();
    return { data: batch };
  }

  async updateFarm(user: AuthUser, farmId: string, body: Record<string, any>) {
    const farm = await this.assertFarmAccess(user, farmId);
    const blocked = new Set([
      "ownerId",
      "verificationStatus",
      "rejectionReason",
      "_id",
      "createdAt",
      "updatedAt"
    ]);
    for (const [key, value] of Object.entries(body)) {
      if (blocked.has(key)) continue;
      (farm as any)[key] = value;
    }
    await farm.save();
    return { data: farm };
  }

  async softDeleteFarm(user: AuthUser, farmId: string) {
    const farm = await this.assertFarmAccess(user, farmId);
    farm.status = "inactive";
    await farm.save();
    return { data: farm };
  }

  /**
   * Farm Management hub context: owned farms + flocks for selectors.
   */
  async getFarmOpsContext(user: AuthUser) {
    const farms = await this.model(schemaNames.Farm)
      .find({ ownerId: user.id, status: { $ne: "deleted" } })
      .sort({ createdAt: -1 })
      .lean();

    const farmIds = farms.map((f: any) => f._id);
    const flocks: any[] = farmIds.length
      ? await this.model(schemaNames.PoultryBatch)
          .find({ farmId: { $in: farmIds } })
          .sort({ createdAt: -1 })
          .lean()
      : [];

    const flocksByFarm = new Map<string, any[]>();
    for (const flock of flocks) {
      const key = String(flock.farmId);
      flocksByFarm.set(key, [...(flocksByFarm.get(key) ?? []), flock]);
    }

    return {
      data: {
        farms: farms.map((farm: any) => ({
          ...farm,
          flockCount: (flocksByFarm.get(String(farm._id)) ?? []).length,
          activeFlockCount: (flocksByFarm.get(String(farm._id)) ?? []).filter(
            (f) => f.status === "active"
          ).length,
          flocks: flocksByFarm.get(String(farm._id)) ?? []
        }))
      }
    };
  }

  /**
   * Day summary for Farm Management dashboard (Phase 1).
   * Aggregates existing record collections for the selected farm/flock/date.
   */
  async getFarmOpsDaySummary(
    user: AuthUser,
    query: { farmId?: string; batchId?: string; date?: string; includeRecords?: string | boolean }
  ) {
    const farmId = String(query.farmId || "").trim();
    const batchId = String(query.batchId || "").trim();
    if (!farmId) throw new BadRequestException("farmId is required");
    if (!batchId) throw new BadRequestException("batchId (flock) is required");

    const farm = await this.assertFarmAccess(user, farmId);
    const batch = await this.assertBatchAccess(user, batchId, { allowInactive: true });
    if (String(batch.farmId) !== farmId) {
      throw new BadRequestException("Selected flock does not belong to this farm");
    }

    const day = this.parseDayBounds(query.date);
    const dateFilter = { $gte: day.start, $lte: day.end };
    const includeRecords =
      query.includeRecords === true ||
      query.includeRecords === "1" ||
      query.includeRecords === "true";

    const [eggRows, feedRows, mortRows, expenseRows, vaccRows] = await Promise.all([
      this.model(schemaNames.EggProductionRecord)
        .find({ batchId, date: dateFilter })
        .sort({ createdAt: 1 })
        .lean(),
      this.model(schemaNames.FeedingRecord)
        .find({ batchId, feedingDate: dateFilter })
        .sort({ createdAt: 1 })
        .lean(),
      this.model(schemaNames.MortalityRecord)
        .find({ batchId, date: dateFilter })
        .sort({ createdAt: 1 })
        .lean(),
      this.model(schemaNames.Expense)
        .find({
          ownerId: user.id,
          date: dateFilter,
          $or: [{ batchId }, { farmId, batchId: { $exists: false } }, { farmId, batchId: null }]
        })
        .sort({ createdAt: 1 })
        .lean(),
      this.model(schemaNames.VaccinationRecord)
        .find({
          batchId,
          $or: [{ scheduledDate: dateFilter }, { completedDate: dateFilter }]
        })
        .sort({ createdAt: 1 })
        .lean()
    ]);

    const eggsToday = eggRows.reduce(
      (sum: number, row: any) => sum + Number(row.eggsCollected || 0),
      0
    );
    const mortalityToday = mortRows.reduce(
      (sum: number, row: any) => sum + Number(row.numberOfDeaths || 0),
      0
    );
    const feedKgToday = feedRows.reduce((sum: number, row: any) => {
      const qty = Number(row.quantity || 0);
      const unit = String(row.unit || "kg");
      if (unit === "kg") return sum + qty;
      if (unit === "ton") return sum + qty * 1000;
      if (unit === "bag") return sum + qty * 50;
      return sum + qty;
    }, 0);
    const expensesToday = expenseRows.reduce(
      (sum: number, row: any) => sum + Number(row.amount || 0),
      0
    );

    const currentBirds = Number(batch.currentQuantity || 0);
    const birdsStartOfDay = currentBirds + mortalityToday;
    const eggProductionRate =
      currentBirds > 0 ? Number(((eggsToday / currentBirds) * 100).toFixed(1)) : 0;
    const mortalityRate =
      birdsStartOfDay > 0
        ? Number(((mortalityToday / birdsStartOfDay) * 100).toFixed(2))
        : 0;
    const feedPerBird =
      currentBirds > 0 ? Number((feedKgToday / currentBirds).toFixed(3)) : 0;

    const flocks = await this.model(schemaNames.PoultryBatch)
      .find({ farmId })
      .sort({ createdAt: -1 })
      .lean();

    return {
      data: {
        date: day.iso,
        farm: {
          _id: farm._id,
          name: farm.name,
          city: farm.city,
          region: farm.region,
          location: farm.location,
          farmType: farm.farmType,
          verificationStatus: farm.verificationStatus,
          status: farm.status
        },
        flock: {
          _id: batch._id,
          name: batch.name,
          batchCode: batch.batchCode,
          poultryType: batch.poultryType,
          breed: batch.breed,
          purpose: batch.purpose,
          housing: batch.housing,
          initialQuantity: batch.initialQuantity,
          currentQuantity: batch.currentQuantity,
          startDate: batch.startDate,
          status: batch.status,
          notes: batch.notes
        },
        summary: {
          currentBirds,
          birdsStartOfDay,
          eggsToday,
          mortalityToday,
          mortalityRate,
          mortalityRateDenominator: "birds at start of day (current + today's deaths)",
          feedKgToday: Number(feedKgToday.toFixed(2)),
          feedPerBird,
          expensesToday,
          eggProductionRate,
          feedConsumedKg: Number(feedKgToday.toFixed(2)),
          vaccinationsToday: vaccRows.length,
          feedBagNote:
            "Bag quantities in 'bag' are converted at 50 kg/bag for display only."
        },
        flocks,
        recordCounts: {
          eggs: eggRows.length,
          feeding: feedRows.length,
          mortality: mortRows.length,
          expenses: expenseRows.length,
          health: vaccRows.length
        },
        ...(includeRecords
          ? {
              records: {
                eggs: eggRows,
                feeding: feedRows,
                mortality: mortRows,
                expenses: expenseRows,
                health: vaccRows
              }
            }
          : {})
      }
    };
  }

  private parseDayBounds(dateInput?: string) {
    const base = dateInput ? new Date(dateInput) : new Date();
    if (Number.isNaN(base.getTime())) {
      throw new BadRequestException("Invalid date");
    }
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);
    const iso = start.toISOString().slice(0, 10);
    return { start, end, iso };
  }

  async closeBatch(user: AuthUser, batchId: string) {
    const batch = await this.assertBatchAccess(user, batchId);
    batch.status = "completed";
    await batch.save();
    return { data: batch };
  }

  async createFeedingRecord(user: AuthUser, batchId: string, body: Record<string, any>) {
    const batch = await this.assertBatchAccess(user, batchId);
    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException("Feed quantity must be greater than zero");
    }

    const feedType = String(body.feedType || "").trim();
    if (!feedType) throw new BadRequestException("Feed type is required");

    const unit = String(body.unit || "kg");
    const allowedUnits = ["kg", "bag", "ton", "gram", "other"];
    if (!allowedUnits.includes(unit)) {
      throw new BadRequestException("Invalid feed unit");
    }

    const feedingDate = body.feedingDate || body.date || new Date();
    const birdsCount =
      body.birdsCount === undefined || body.birdsCount === ""
        ? Number(batch.currentQuantity)
        : Number(body.birdsCount);
    if (!Number.isFinite(birdsCount) || birdsCount < 0) {
      throw new BadRequestException("Birds count must be zero or greater");
    }

    const record = await this.model(schemaNames.FeedingRecord).create({
      farmId: String(batch.farmId),
      batchId,
      feedType,
      quantity,
      unit,
      cost: Number(body.cost ?? 0) || 0,
      birdsCount,
      feedingSessions: Math.max(1, Number(body.feedingSessions ?? 1) || 1),
      feedingDate: new Date(feedingDate),
      recordedBy: user.id,
      notes: body.notes ? String(body.notes).trim() : undefined
    });
    return { data: record };
  }

  async listBatchRecords(user: AuthUser, modelName: string, batchId: string, query: Record<string, any>) {
    await this.assertBatchAccess(user, batchId);
    return this.list(modelName, { ...query, batchId });
  }

  async createMortalityRecord(user: AuthUser, batchId: string, body: Record<string, any>) {
    const batch = await this.assertBatchAccess(user, batchId);
    const farm = await this.findById(schemaNames.Farm, String(batch.farmId));
    const numberOfDeaths = Number(body.numberOfDeaths);

    const nextCurrentQuantity = applyMortality(Number(batch.currentQuantity), numberOfDeaths);
    const cause = String(body.cause || "Unknown").trim() || "Unknown";
    const suspectedDisease = this.normalizeDisease(body.suspectedDisease);
    const severity = this.normalizeSeverity(body.severity, numberOfDeaths, Number(batch.currentQuantity));
    const locationSnapshot = this.buildLocationSnapshot(farm);
    const date = body.date ? new Date(body.date) : new Date();

    const record = await this.model(schemaNames.MortalityRecord).create({
      farmId: String(batch.farmId),
      batchId,
      numberOfDeaths,
      cause,
      suspectedDisease,
      deathDescription: body.deathDescription ? String(body.deathDescription).trim() : undefined,
      symptoms: this.normalizeSymptoms(body.symptoms),
      severity,
      publicHealthAlert: this.shouldPublishHealthAlert(suspectedDisease, numberOfDeaths, severity),
      locationSnapshot,
      date,
      actionTaken: body.actionTaken ? String(body.actionTaken).trim() : undefined,
      recordedBy: user.id,
      notes: body.notes ? String(body.notes).trim() : undefined
    });

    batch.currentQuantity = nextCurrentQuantity;
    await batch.save();

    return {
      data: {
        record,
        batch
      }
    };
  }

  async outbreakHeatmap(query: Record<string, any>) {
    const disease = this.normalizeDisease(query.disease);
    const days = Math.min(Math.max(Number(query.days ?? 30), 1), 180);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter: Record<string, any> = {
      publicHealthAlert: true,
      suspectedDisease: { $exists: true, $ne: "" },
      date: { $gte: since }
    };

    if (disease) {
      filter.suspectedDisease = disease;
    }

    const records = (await this.model(schemaNames.MortalityRecord)
      .find(filter)
      .sort({ date: -1 })
      .limit(500)
      .lean()) as any[];

    const pointsByLocation = new Map<string, any>();
    const diseaseSummary = new Map<string, any>();

    for (const record of records) {
      const diseaseName = record.suspectedDisease;
      const snapshot = record.locationSnapshot ?? {};
      const coordinates = snapshot.coordinates ?? this.approximateCoordinates(snapshot.region, snapshot.city);
      if (!coordinates) {
        continue;
      }

      const locationKey = [
        diseaseName,
        snapshot.region ?? "Unknown region",
        snapshot.city ?? "Unknown city",
        coordinates.latitude.toFixed(2),
        coordinates.longitude.toFixed(2)
      ].join("|");

      const current = pointsByLocation.get(locationKey) ?? {
        disease: diseaseName,
        location: snapshot.location,
        city: snapshot.city,
        region: snapshot.region,
        country: snapshot.country ?? "Cameroon",
        coordinates,
        reports: 0,
        deaths: 0,
        latestDate: record.date,
        severity: "low",
        alertLevel: "watch"
      };

      current.reports += 1;
      current.deaths += Number(record.numberOfDeaths ?? 0);
      current.latestDate = new Date(record.date) > new Date(current.latestDate) ? record.date : current.latestDate;
      current.severity = this.maxSeverity(current.severity, record.severity);
      current.alertLevel = this.calculateAlertLevel(current.deaths, current.reports, current.severity);
      pointsByLocation.set(locationKey, current);

      const summary = diseaseSummary.get(diseaseName) ?? {
        disease: diseaseName,
        reports: 0,
        deaths: 0,
        affectedLocations: new Set<string>(),
        latestDate: record.date,
        alertLevel: "watch"
      };
      summary.reports += 1;
      summary.deaths += Number(record.numberOfDeaths ?? 0);
      summary.affectedLocations.add(`${snapshot.city ?? "Unknown city"}, ${snapshot.region ?? "Unknown region"}`);
      summary.latestDate = new Date(record.date) > new Date(summary.latestDate) ? record.date : summary.latestDate;
      summary.alertLevel = this.calculateAlertLevel(summary.deaths, summary.reports, record.severity);
      diseaseSummary.set(diseaseName, summary);
    }

    const summaries = Array.from(diseaseSummary.values()).map((summary) => ({
      ...summary,
      affectedLocations: Array.from(summary.affectedLocations)
    }));

    return {
      data: {
        disease: disease ?? "all",
        windowDays: days,
        generatedAt: new Date(),
        points: Array.from(pointsByLocation.values()),
        summaries
      }
    };
  }

  async createVaccinationRecord(user: AuthUser, batchId: string, body: Record<string, any>) {
    const batch = await this.assertBatchAccess(user, batchId);
    const vaccineName = String(body.vaccineName || body.productName || "").trim();
    if (!vaccineName) {
      throw new BadRequestException("Product / vaccine name is required");
    }

    const scheduledDate = body.scheduledDate || body.date || new Date();
    const treatmentType = String(body.treatmentType || "vaccination");
    const allowedTypes = ["vaccination", "medication", "treatment", "other"];
    if (!allowedTypes.includes(treatmentType)) {
      throw new BadRequestException("Invalid treatment type");
    }

    const status = body.status ?? (body.markCompleted ? "completed" : "scheduled");
    const record = await this.model(schemaNames.VaccinationRecord).create({
      farmId: String(batch.farmId),
      batchId,
      treatmentType,
      vaccineName,
      diseasePrevented: body.diseasePrevented || body.purpose
        ? String(body.diseasePrevented || body.purpose).trim()
        : undefined,
      scheduledDate: new Date(scheduledDate),
      completedDate:
        status === "completed"
          ? new Date(body.completedDate || scheduledDate)
          : body.completedDate
            ? new Date(body.completedDate)
            : undefined,
      status,
      cost: body.cost !== undefined && body.cost !== "" ? Number(body.cost) : undefined,
      quantityUsed:
        body.quantityUsed !== undefined && body.quantityUsed !== ""
          ? Number(body.quantityUsed)
          : undefined,
      unit: body.unit ? String(body.unit).trim() : undefined,
      birdsTreated:
        body.birdsTreated !== undefined && body.birdsTreated !== ""
          ? Number(body.birdsTreated)
          : Number(batch.currentQuantity),
      administrationMethod: body.administrationMethod
        ? String(body.administrationMethod).trim()
        : undefined,
      supplier: body.supplier ? String(body.supplier).trim() : undefined,
      productBatchNumber: body.productBatchNumber
        ? String(body.productBatchNumber).trim()
        : undefined,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      nextScheduledDate: body.nextScheduledDate
        ? new Date(body.nextScheduledDate)
        : undefined,
      administeredBy: body.administeredBy
        ? String(body.administeredBy).trim()
        : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined
    });
    return { data: record };
  }

  async createEggProductionRecord(user: AuthUser, batchId: string, body: Record<string, any>) {
    const batch = await this.assertBatchAccess(user, batchId);

    const goodEggs = Number(body.goodEggs ?? 0);
    const crackedEggs = Number(body.crackedEggs ?? 0);
    const dirtyEggs = Number(body.dirtyEggs ?? 0);
    const brokenEggs = Number(body.brokenEggs ?? 0);
    const rejectedEggs = Number(body.rejectedEggs ?? 0);
    const hasBreakdown =
      body.goodEggs !== undefined ||
      body.crackedEggs !== undefined ||
      body.dirtyEggs !== undefined ||
      body.brokenEggs !== undefined ||
      body.rejectedEggs !== undefined;

    let eggsCollected = Number(body.eggsCollected ?? 0);
    let damagedEggs = Number(body.damagedEggs ?? 0);

    if (hasBreakdown) {
      const parts = [goodEggs, crackedEggs, dirtyEggs, brokenEggs, rejectedEggs];
      if (parts.some((n) => !Number.isFinite(n) || n < 0 || !Number.isInteger(n))) {
        throw new BadRequestException("Egg counts must be whole numbers zero or greater");
      }
      eggsCollected = parts.reduce((sum, n) => sum + n, 0);
      damagedEggs = crackedEggs + dirtyEggs + brokenEggs + rejectedEggs;
      if (body.eggsCollected !== undefined && Number(body.eggsCollected) !== eggsCollected) {
        throw new BadRequestException(
          "Total eggs must equal good + cracked + dirty + broken + rejected"
        );
      }
    }

    const eggTotals = calculateEggProduction({
      eggsCollected,
      damagedEggs,
      eggsSold: Number(body.eggsSold ?? 0)
    });

    if (!Number.isInteger(eggTotals.eggsCollected)) {
      throw new BadRequestException("Egg counts must be whole numbers");
    }

    const date = body.date ? new Date(body.date) : new Date();
    const birdsCount =
      body.birdsCount === undefined || body.birdsCount === ""
        ? Number(batch.currentQuantity)
        : Number(body.birdsCount);

    const record = await this.model(schemaNames.EggProductionRecord).create({
      farmId: String(batch.farmId),
      batchId,
      date,
      ...eggTotals,
      birdsCount: Number.isFinite(birdsCount) ? birdsCount : Number(batch.currentQuantity),
      goodEggs: hasBreakdown ? goodEggs : undefined,
      crackedEggs: hasBreakdown ? crackedEggs : undefined,
      dirtyEggs: hasBreakdown ? dirtyEggs : undefined,
      brokenEggs: hasBreakdown ? brokenEggs : undefined,
      rejectedEggs: hasBreakdown ? rejectedEggs : undefined,
      collectionSession: body.collectionSession || "full_day",
      recordedBy: user.id,
      notes: body.notes ? String(body.notes).trim() : undefined
    });
    return { data: record };
  }

  async createExpense(user: AuthUser, body: Record<string, any>) {
    if (body.farmId) await this.assertFarmAccess(user, String(body.farmId));
    if (body.batchId) await this.assertBatchAccess(user, String(body.batchId));
    if (body.shopId) await this.assertShopAccess(user, String(body.shopId));

    const quantity =
      body.quantity !== undefined && body.quantity !== "" ? Number(body.quantity) : undefined;
    const unitPrice =
      body.unitPrice !== undefined && body.unitPrice !== "" ? Number(body.unitPrice) : undefined;

    let amount = Number(body.amount);
    if (
      (body.amount === undefined || body.amount === "") &&
      quantity !== undefined &&
      unitPrice !== undefined
    ) {
      amount = quantity * unitPrice;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException("Expense amount must be zero or greater");
    }
    if (quantity !== undefined && (!Number.isFinite(quantity) || quantity < 0)) {
      throw new BadRequestException("Quantity must be zero or greater");
    }
    if (unitPrice !== undefined && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
      throw new BadRequestException("Unit price must be zero or greater");
    }

    const category = String(body.category || "").trim();
    if (!category) throw new BadRequestException("Expense category is required");

    const expense = await this.model(schemaNames.Expense).create({
      ownerId: user.id,
      farmId: body.farmId || undefined,
      shopId: body.shopId || undefined,
      batchId: body.batchId || undefined,
      category,
      amount,
      quantity,
      unit: body.unit ? String(body.unit).trim() : undefined,
      unitPrice,
      paymentMethod: body.paymentMethod ? String(body.paymentMethod).trim() : undefined,
      supplier: body.supplier ? String(body.supplier).trim() : undefined,
      date: body.date ? new Date(body.date) : new Date(),
      description: body.description ? String(body.description).trim() : undefined,
      receiptImage: body.receiptImage || undefined
    });
    return { data: expense };
  }

  async completeVaccination(user: AuthUser, id: string, body: Record<string, any>) {
    const record = await this.findById(schemaNames.VaccinationRecord, id);
    await this.assertBatchAccess(user, String(record.batchId));
    record.status = "completed";
    record.completedDate = body.completedDate ? new Date(body.completedDate) : new Date();
    if (body.cost !== undefined) record.cost = Number(body.cost);
    if (body.administeredBy) record.administeredBy = body.administeredBy;
    if (body.notes) record.notes = body.notes;
    await record.save();
    return { data: record };
  }

  async createFarmSale(user: AuthUser, body: Record<string, any>) {
    await this.assertFarmAccess(user, String(body.farmId));
    if (body.batchId) await this.assertBatchAccess(user, String(body.batchId));

    const quantity = Number(body.quantity);
    const unitPrice = Number(body.unitPrice);
    if (quantity <= 0 || unitPrice < 0) {
      throw new BadRequestException("Sale quantity and unit price are invalid");
    }

    const sale = await this.model(schemaNames.FarmSale).create({
      ...body,
      totalAmount: quantity * unitPrice
    });
    return { data: sale };
  }

  async getCart(user: AuthUser) {
    const cart = await this.getOrCreateCart(user.id);
    return { data: cart };
  }

  async addCartItem(user: AuthUser, body: Record<string, any>) {
    const product = await this.findById(schemaNames.Product, String(body.productId));
    if (product.approvalStatus !== "approved" || product.status !== "available") {
      throw new BadRequestException("Only approved available products can be added to cart");
    }

    const quantity = Number(body.quantity ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException("Cart quantity must be greater than zero");
    }
    if (quantity > Number(product.quantity)) {
      throw new BadRequestException("Cart quantity exceeds product stock");
    }

    const cart = await this.getOrCreateCart(user.id);
    const existing = cart.items.find((item: any) => String(item.productId) === String(product._id));
    if (existing) {
      const nextQuantity = Number(existing.quantity) + quantity;
      if (nextQuantity > Number(product.quantity)) {
        throw new BadRequestException("Cart quantity exceeds product stock");
      }
      existing.quantity = nextQuantity;
    } else {
      cart.items.push({
        productId: product._id,
        sellerId: product.ownerId,
        farmId: product.farmId,
        shopId: product.shopId,
        quantity,
        unitPriceSnapshot: product.price,
        productNameSnapshot: product.name
      });
    }

    this.recalculateCart(cart);
    await cart.save();
    return { data: cart };
  }

  async updateCartItem(user: AuthUser, itemId: string, body: Record<string, any>) {
    const cart = await this.getOrCreateCart(user.id);
    const item = cart.items.id(itemId);
    if (!item) throw new NotFoundException("Cart item not found");

    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException("Cart quantity must be greater than zero");
    }

    const product = await this.findById(schemaNames.Product, String(item.productId));
    if (quantity > Number(product.quantity)) {
      throw new BadRequestException("Cart quantity exceeds product stock");
    }

    item.quantity = quantity;
    this.recalculateCart(cart);
    await cart.save();
    return { data: cart };
  }

  async removeCartItem(user: AuthUser, itemId?: string) {
    const cart = await this.getOrCreateCart(user.id);
    if (itemId) {
      cart.items.pull(itemId);
    } else {
      cart.items = [];
    }
    this.recalculateCart(cart);
    await cart.save();
    return { data: cart };
  }

  async createOrdersFromCart(user: AuthUser, body: Record<string, any>) {
    const cart = await this.getOrCreateCart(user.id);
    if (!cart.items.length) throw new BadRequestException("Cart is empty");

    const groups = new Map<string, any[]>();
    for (const item of cart.items) {
      const product = await this.findById(schemaNames.Product, String(item.productId));
      if (product.approvalStatus !== "approved" || product.status !== "available") {
        throw new BadRequestException(`${product.name} is not available`);
      }
      if (Number(item.quantity) > Number(product.quantity)) {
        throw new BadRequestException(`${product.name} does not have enough stock`);
      }
      const sellerId = String(product.ownerId);
      groups.set(sellerId, [...(groups.get(sellerId) ?? []), { item, product }]);
    }

    const orders = [];
    for (const [sellerId, entries] of groups) {
      const items = entries.map(({ item, product }) =>
        calculateOrderItem({
          productId: product._id,
          productName: product.name,
          requestedQuantity: Number(item.quantity),
          stockQuantity: Number(product.quantity),
          serverPrice: Number(product.price)
        })
      );
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const deliveryFee = Number(body.deliveryFee ?? 0);
      const deliveryMethod = String(body.deliveryMethod ?? "pickup_at_shop");
      const isPickup = deliveryMethod.startsWith("pickup") || body.fulfillmentMethod === "pickup";
      const order = await this.model(schemaNames.Order).create({
        customerId: user.id,
        sellerId,
        farmId: entries[0].product.farmId,
        shopId: entries[0].product.shopId,
        orderNumber: `PH-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        items,
        subtotal,
        deliveryFee: isPickup ? 0 : deliveryFee,
        totalAmount: subtotal + (isPickup ? 0 : deliveryFee),
        paymentStatus: "unpaid",
        orderStatus: "pending",
        deliveryMethod,
        fulfillmentMethod: isPickup ? "pickup" : "delivery",
        pickupStatus: isPickup ? "pending" : undefined,
        pickupLocation: isPickup
          ? String(body.pickupLocation || body.deliveryAddress || "")
          : undefined,
        deliveryAddress: body.deliveryAddress,
        notes: body.notes
      });

      for (const { item, product } of entries) {
        product.quantity = Number(product.quantity) - Number(item.quantity);
        if (product.quantity <= 0) product.status = "out_of_stock";
        await product.save();
      }
      orders.push(order);
    }

    cart.items = [];
    cart.subtotal = 0;
    await cart.save();

    return { data: orders };
  }

  async createPayment(user: AuthUser, body: Record<string, any>) {
    const order = await this.findById(schemaNames.Order, String(body.orderId));
    if (String(order.customerId) !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException("You cannot pay for this order");
    }

    const payment = await this.model(schemaNames.Payment).create({
      ...body,
      userId: user.id,
      amount: Number(order.totalAmount),
      currency: body.currency ?? "XAF",
      status: body.paymentMethod === "cash_on_delivery" ? "pending" : "pending"
    });

    order.paymentStatus = "pending";
    await order.save();
    return { data: payment };
  }

  async getOrderForUser(user: AuthUser, orderId: string) {
    const order = await this.findById(schemaNames.Order, orderId);
    const isParty = String(order.customerId) === user.id || String(order.sellerId) === user.id;
    if (!isParty && !this.isAdmin(user)) {
      throw new ForbiddenException("You cannot access this order");
    }
    return order;
  }

  async updateOrderStatus(user: AuthUser, orderId: string, nextStatus: unknown) {
    if (typeof nextStatus !== "string" || !ORDER_STATUSES.has(nextStatus)) {
      throw new BadRequestException("Invalid order status");
    }
    const order = await this.getOrderForUser(user, orderId);
    const isSeller = String(order.sellerId) === user.id;
    if (!isSeller && !this.isAdmin(user)) {
      // Customers may only cancel an order the seller has not started on.
      if (nextStatus !== "cancelled" || order.orderStatus !== "pending") {
        throw new ForbiddenException("Only the seller can update this order");
      }
    }
    order.orderStatus = nextStatus;
    await order.save();
    return { data: order };
  }

  async markPaymentCallback(body: Record<string, any>) {
    if (!PAYMENT_STATUSES.has(body.status)) {
      throw new BadRequestException("Invalid payment status");
    }
    const payment = await this.findById(schemaNames.Payment, String(body.paymentId));
    payment.transactionReference = body.transactionReference ?? payment.transactionReference;
    return { data: await this.applyPaymentStatus(payment, body.status, body.providerResponse ?? body) };
  }

  /** Starts a CamPay mobile money collection: the customer confirms on their phone. */
  async initiateCampayPayment(user: AuthUser, body: Record<string, any>) {
    if (!this.campay.isConfigured()) {
      throw new BadRequestException("Mobile money payments are not configured");
    }
    const order = await this.getOrderForUser(user, String(body.orderId));
    if (String(order.customerId) !== user.id) {
      throw new ForbiddenException("You cannot pay for this order");
    }
    if (order.paymentStatus === "paid") {
      throw new BadRequestException("This order is already paid");
    }
    const paymentMethod = CAMPAY_METHODS.has(body.paymentMethod) ? body.paymentMethod : "mobile_money";
    const phone = this.campay.normalizePhone(body.phone);

    const payment = await this.model(schemaNames.Payment).create({
      orderId: order._id,
      userId: user.id,
      amount: Number(order.totalAmount),
      currency: "XAF",
      paymentMethod,
      provider: "campay",
      status: "pending"
    });

    try {
      const collect = await this.campay.collect({
        amount: Number(order.totalAmount),
        phone,
        description: `PoultryHub order ${order.orderNumber}`,
        externalReference: String(payment._id)
      });
      payment.transactionReference = collect.reference;
      payment.providerResponse = {
        operator: collect.operator,
        ussdCode: collect.ussdCode,
        chargedAmount: collect.chargedAmount,
        simulated: collect.simulated
      };
      await payment.save();
    } catch (err) {
      payment.status = "failed";
      await payment.save();
      throw err;
    }

    order.paymentStatus = "pending";
    await order.save();
    return { data: payment };
  }

  /** Asks CamPay for the latest state of a payment (used while the customer waits). */
  async refreshCampayPayment(user: AuthUser, paymentId: string) {
    const payment = await this.findById(schemaNames.Payment, paymentId);
    if (String(payment.userId) !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException("You cannot access this payment");
    }
    if (payment.provider !== "campay" || !payment.transactionReference) {
      throw new BadRequestException("Not a mobile money payment");
    }
    if (payment.status !== "pending") {
      return { data: payment };
    }
    const transaction = await this.campay.getTransaction(payment.transactionReference);
    const { payment: updated } = await this.applyPaymentStatus(payment, campayToPaymentStatus(transaction.status), transaction);
    return { data: updated };
  }

  /** CamPay webhook: trusted only with a valid signature, then re-checked against the API. */
  async handleCampayWebhook(params: Record<string, any>) {
    if (!this.campay.verifyWebhookSignature(params.signature)) {
      throw new ForbiddenException("Invalid webhook signature");
    }
    const reference = String(params.reference ?? "");
    const payment = await this.model(schemaNames.Payment).findOne({ provider: "campay", transactionReference: reference });
    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.status !== "pending") return { data: { status: payment.status } };

    const transaction = await this.campay.getTransaction(reference);
    await this.applyPaymentStatus(payment, campayToPaymentStatus(transaction.status), transaction);
    return { data: { status: payment.status } };
  }

  private async applyPaymentStatus(payment: any, status: string, providerResponse: unknown) {
    // A settled payment is never moved back by a late or replayed notification.
    if (payment.status === "paid" && status !== "refunded") {
      const order = await this.findById(schemaNames.Order, String(payment.orderId));
      return { payment, order };
    }
    payment.status = status;
    payment.providerResponse = { ...(payment.providerResponse ?? {}), last: providerResponse };
    if (status === "paid") payment.paidAt = new Date();
    await payment.save();

    const order = await this.findById(schemaNames.Order, String(payment.orderId));
    order.paymentStatus = status === "pending" ? "pending" : status;
    await order.save();
    return { payment, order };
  }

  async createConversation(user: AuthUser, body: Record<string, any>) {
    const participantIds = Array.from(
      new Set([user.id, ...(Array.isArray(body.participantIds) ? body.participantIds : [])].map(String))
    );

    if (participantIds.length < 2) {
      throw new BadRequestException("A conversation needs at least one seller or recipient");
    }

    for (const participantId of participantIds) {
      if (!Types.ObjectId.isValid(participantId)) {
        throw new BadRequestException("Invalid conversation participant");
      }
      await this.findById(schemaNames.User, participantId);
    }

    const existing = await this.model(schemaNames.Conversation)
      .findOne({
        participantIds: { $all: participantIds.map((id) => new Types.ObjectId(id)), $size: participantIds.length }
      })
      .sort({ lastMessageAt: -1 });

    if (existing) {
      if (body.subject && !existing.subject) existing.subject = body.subject;
      if (body.relatedFarmId && !existing.relatedFarmId) existing.relatedFarmId = body.relatedFarmId;
      if (body.relatedShopId && !existing.relatedShopId) existing.relatedShopId = body.relatedShopId;
      existing.lastMessageAt = new Date();
      await existing.save();
      return { data: existing };
    }

    const conversation = await this.model(schemaNames.Conversation).create({
      ...body,
      participantIds,
      lastMessageAt: new Date()
    });
    return { data: conversation };
  }

  async listConversations(user: AuthUser, query: Record<string, any>) {
    return this.list(schemaNames.Conversation, { ...query, participantIds: user.id });
  }

  async listMessages(user: AuthUser, conversationId: string, query: Record<string, any>) {
    const conversation = await this.findById(schemaNames.Conversation, conversationId);
    if (!conversation.participantIds.map(String).includes(user.id) && !this.isAdmin(user)) {
      throw new ForbiddenException("You are not part of this conversation");
    }

    return this.list(schemaNames.Message, { ...query, conversationId });
  }

  async createMessage(user: AuthUser, conversationId: string, body: Record<string, any>) {
    const conversation = await this.findById(schemaNames.Conversation, conversationId);
    if (!conversation.participantIds.map(String).includes(user.id) && !this.isAdmin(user)) {
      throw new ForbiddenException("You are not part of this conversation");
    }
    const message = await this.model(schemaNames.Message).create({
      ...body,
      conversationId,
      senderId: user.id
    });
    conversation.lastMessageAt = new Date();
    await conversation.save();
    return { data: message };
  }

  async createReview(user: AuthUser, body: Record<string, any>) {
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException("Rating must be between 1 and 5");
    }
    const review = await this.model(schemaNames.Review).create({
      ...body,
      customerId: user.id,
      rating,
      status: "published"
    });
    return { data: review };
  }

  async markNotificationRead(user: AuthUser, id?: string) {
    if (id) {
      const notification = await this.findById(schemaNames.Notification, id);
      if (String(notification.userId) !== user.id && !this.isAdmin(user)) {
        throw new ForbiddenException("You cannot update this notification");
      }
      notification.readAt = new Date();
      await notification.save();
      return { data: notification };
    }

    await this.model(schemaNames.Notification).updateMany(
      { userId: user.id, readAt: { $exists: false } },
      { readAt: new Date() }
    );
    return { data: { readAll: true } };
  }

  private async getOrCreateCart(userId: string) {
    const model = this.model(schemaNames.Cart);
    return model.findOneAndUpdate(
      { customerId: userId },
      { $setOnInsert: { customerId: userId, items: [], subtotal: 0 } },
      { new: true, upsert: true }
    );
  }

  private recalculateCart(cart: any) {
    cart.subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + Number(item.quantity) * Number(item.unitPriceSnapshot),
      0
    );
  }

  private normalizeDisease(value: unknown) {
    if (typeof value !== "string") return undefined;
    const disease = value.trim().replace(/\s+/g, " ");
    if (!disease) return undefined;
    return disease
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  private normalizeSymptoms(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12);
    }
    return [];
  }

  private normalizeSeverity(value: unknown, deaths: number, currentQuantity: number) {
    if (typeof value === "string" && ["low", "medium", "high", "critical"].includes(value)) {
      return value;
    }

    const ratio = currentQuantity > 0 ? deaths / currentQuantity : 0;
    if (deaths >= 50 || ratio >= 0.2) return "critical";
    if (deaths >= 20 || ratio >= 0.1) return "high";
    if (deaths >= 5 || ratio >= 0.03) return "medium";
    return "low";
  }

  private shouldPublishHealthAlert(suspectedDisease: string | undefined, deaths: number, severity: string) {
    return Boolean(suspectedDisease) && (deaths >= 1 || ["medium", "high", "critical"].includes(severity));
  }

  private buildLocationSnapshot(farm: any) {
    return {
      location: farm.location,
      city: farm.city,
      region: farm.region,
      country: farm.country ?? "Cameroon",
      coordinates: farm.coordinates ?? this.approximateCoordinates(farm.region, farm.city)
    };
  }

  private approximateCoordinates(region?: string, city?: string) {
    const cityKey = String(city ?? "").trim().toLowerCase();
    const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
      bafoussam: { latitude: 5.48, longitude: 10.42 },
      bamenda: { latitude: 5.96, longitude: 10.15 },
      bandjoun: { latitude: 5.38, longitude: 10.41 },
      douala: { latitude: 4.05, longitude: 9.77 },
      edea: { latitude: 3.8, longitude: 10.13 },
      yaounde: { latitude: 3.87, longitude: 11.52 },
      mbandjock: { latitude: 4.45, longitude: 11.9 },
      kumba: { latitude: 4.64, longitude: 9.45 },
      buea: { latitude: 4.16, longitude: 9.24 },
      garoua: { latitude: 9.33, longitude: 13.4 },
      maroua: { latitude: 10.59, longitude: 14.32 }
    };
    if (cityCoordinates[cityKey]) return cityCoordinates[cityKey];

    const regionKey = String(region ?? "").trim().toLowerCase().replace(" region", "");
    return CAMEROON_REGION_COORDINATES[regionKey];
  }

  private maxSeverity(left = "low", right = "low") {
    const rank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    return rank[right] > rank[left] ? right : left;
  }

  private calculateAlertLevel(deaths: number, reports: number, severity = "low") {
    if (severity === "critical" || deaths >= 50 || reports >= 8) return "emergency";
    if (severity === "high" || deaths >= 20 || reports >= 4) return "outbreak";
    if (severity === "medium" || deaths >= 5 || reports >= 2) return "warning";
    return "watch";
  }

  private async assertFarmAccess(user: AuthUser, farmId: string) {
    const farm = await this.findById(schemaNames.Farm, farmId);
    if (String(farm.ownerId) !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException("You cannot manage this farm");
    }
    return farm;
  }

  async assertShopAccess(user: AuthUser, shopId: string) {
    const shop = await this.findById(schemaNames.Shop, shopId);
    if (String(shop.ownerId) !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException("You cannot manage this shop");
    }
    return shop;
  }

  async assertProductAccess(user: AuthUser, productId: string) {
    const product = await this.findById(schemaNames.Product, productId);
    if (String(product.ownerId) !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException("You cannot manage this product");
    }
    return product;
  }

  async assertBatchAccess(
    user: AuthUser,
    batchId: string,
    options?: { allowInactive?: boolean }
  ) {
    const batch = await this.findById(schemaNames.PoultryBatch, batchId);
    await this.assertFarmAccess(user, String(batch.farmId));
    if (!options?.allowInactive && batch.status !== "active") {
      throw new BadRequestException("Only active batches can receive records");
    }
    return batch;
  }

  private async findById(modelName: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid id");
    const record = await this.model(modelName).findById(id);
    if (!record) throw new NotFoundException(`${modelName} record not found`);
    return record;
  }

  private async list(modelName: string, query: Record<string, any>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;
    const filter = { ...query };
    delete filter.page;
    delete filter.limit;
    const model = this.model(modelName);
    const [data, total] = await Promise.all([
      model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      model.countDocuments(filter)
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  private model(name: string) {
    return this.connection.model(name);
  }

  isAdmin(user: AuthUser) {
    return user.roles.includes("admin") || user.roles.includes("super_admin");
  }
}
