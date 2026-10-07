import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { schemaNames } from "../database/schema-names";
import { KNOWLEDGE_SECTIONS } from "./knowledge.constants";
import type { AuthUser } from "../resources/domain.service";
import { KNOWLEDGE_SEED } from "./knowledge.seed";

const DAY_MS = 24 * 60 * 60 * 1000;
const ALERT_LEVELS = new Set(["info", "caution", "urgent"]);
const STATUSES = new Set(["draft", "published"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Sections whose advice depends on a flock's type and age.
const FLOCK_SECTIONS = ["production", "feeding", "housing", "health", "prevention"];
const LIST_FIELDS = "slug section title summary symptoms tags poultryTypes minAgeDays maxAgeDays alertLevel status order updatedAt";

type Localized = { en: string; fr: string };

/** Lower-case and strip accents so "diarrhée", "Diarrhee" and "DIARRHÉE" all match. */
export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    try {
      const existing = await this.articles().estimatedDocumentCount();
      if (existing > 0) return;
      await this.articles().insertMany(
        KNOWLEDGE_SEED.map((article) => ({ ...article, status: "published", searchText: this.searchTextFor(article) }))
      );
      this.logger.log(`Seeded ${KNOWLEDGE_SEED.length} Knowledge Center articles`);
    } catch (err) {
      this.logger.warn(`Knowledge Center seed skipped: ${err instanceof Error ? err.message : err}`);
    }
  }

  async sections() {
    const counts = await this.articles().aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$section", count: { $sum: 1 } } }
    ]);
    const bySection = new Map(counts.map((row: any) => [row._id, row.count]));
    return { data: KNOWLEDGE_SECTIONS.map((key) => ({ key, count: bySection.get(key) ?? 0 })) };
  }

  async list(query: { section?: string; q?: string; poultryType?: string }, includeDrafts = false) {
    const filter: Record<string, any> = includeDrafts ? {} : { status: "published" };
    if (query.section) {
      if (!KNOWLEDGE_SECTIONS.includes(query.section as any)) throw new BadRequestException("Unknown section");
      filter.section = query.section;
    }
    if (query.poultryType) {
      filter.$or = [{ poultryTypes: { $size: 0 } }, { poultryTypes: String(query.poultryType) }];
    }

    const q = normalizeSearch(String(query.q ?? "")).slice(0, 80);
    if (q) {
      // Every word must appear somewhere (title, summary, body, symptoms, tags, both languages).
      filter.$and = q
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({ searchText: { $regex: escapeRegex(word) } }));
    }

    const data = await this.articles()
      .find(filter)
      .select(LIST_FIELDS)
      .sort({ section: 1, order: 1, createdAt: 1 })
      .limit(200)
      .lean();

    // Keep the Knowledge Center's section order rather than alphabetical.
    const sectionRank = (section: string) => KNOWLEDGE_SECTIONS.indexOf(section as any);
    data.sort((a: any, b: any) => sectionRank(a.section) - sectionRank(b.section) || a.order - b.order);
    return { data };
  }

  async get(slug: string, includeDrafts = false) {
    const filter: Record<string, unknown> = { slug: String(slug).toLowerCase() };
    if (!includeDrafts) filter.status = "published";
    const article = await this.articles().findOne(filter).lean();
    if (!article) throw new NotFoundException("Article not found");

    const related = await this.articles()
      .find({ section: (article as any).section, status: "published", slug: { $ne: (article as any).slug } })
      .select("slug title summary alertLevel")
      .sort({ order: 1 })
      .limit(4)
      .lean();
    return { data: { ...article, related } };
  }

  /**
   * Advice tied to the user's own active flocks: articles matching each flock's type
   * and age, upcoming vaccinations, and a warning when deaths jump.
   */
  async forMyFlocks(user: AuthUser) {
    const farms = await this.model(schemaNames.Farm)
      .find({ ownerId: user.id, status: { $ne: "deleted" } })
      .select("_id name")
      .lean();
    if (!farms.length) return { data: [] };

    const farmNames = new Map(farms.map((farm: any) => [String(farm._id), farm.name]));
    const batches = await this.model(schemaNames.PoultryBatch)
      .find({ farmId: { $in: farms.map((farm: any) => farm._id) }, status: "active" })
      .select("farmId name batchCode poultryType breed startDate startingAgeDays currentQuantity")
      .sort({ startDate: -1 })
      .limit(10)
      .lean();

    const now = Date.now();
    const data = await Promise.all(
      batches.map(async (batch: any) => {
        const ageDays =
          Number(batch.startingAgeDays ?? 0) + Math.max(0, Math.floor((now - new Date(batch.startDate).getTime()) / DAY_MS));

        const [articles, vaccinationsDue, recentDeaths] = await Promise.all([
          this.articles()
            .find({
              status: "published",
              section: { $in: FLOCK_SECTIONS },
              $and: [
                { $or: [{ poultryTypes: { $size: 0 } }, { poultryTypes: batch.poultryType }] },
                { $or: [{ minAgeDays: null }, { minAgeDays: { $lte: ageDays } }] },
                { $or: [{ maxAgeDays: null }, { maxAgeDays: { $gte: ageDays } }] },
                // Generic articles are always available; recommend the ones targeted at this flock.
                { $or: [{ "poultryTypes.0": { $exists: true } }, { minAgeDays: { $ne: null } }, { maxAgeDays: { $ne: null } }] }
              ]
            })
            .select("slug section title summary alertLevel")
            .sort({ order: 1 })
            .limit(5)
            .lean(),
          this.model(schemaNames.VaccinationRecord)
            .find({ batchId: batch._id, status: "scheduled", scheduledDate: { $lte: new Date(now + 3 * DAY_MS) } })
            .select("vaccineName scheduledDate treatmentType")
            .sort({ scheduledDate: 1 })
            .limit(5)
            .lean(),
          this.model(schemaNames.MortalityRecord)
            .find({ batchId: batch._id, date: { $gte: new Date(now - 8 * DAY_MS) } })
            .select("numberOfDeaths date")
            .lean()
        ]);

        return {
          batch: {
            _id: batch._id,
            name: batch.name,
            batchCode: batch.batchCode,
            farmName: farmNames.get(String(batch.farmId)),
            poultryType: batch.poultryType,
            breed: batch.breed,
            ageDays,
            currentQuantity: batch.currentQuantity
          },
          articles,
          vaccinationsDue,
          mortalityAlert: this.mortalityAlert(recentDeaths as any[], Number(batch.currentQuantity ?? 0), now)
        };
      })
    );

    return { data };
  }

  /** Compact list of published guides for the assistant's prompt. */
  async guideIndex(lang: string) {
    const rows = await this.articles()
      .find({ status: "published" })
      .select("slug section title")
      .sort({ section: 1, order: 1 })
      .limit(60)
      .lean();
    return rows.map((row: any) => ({
      slug: row.slug,
      section: row.section,
      title: (lang === "fr" ? row.title?.fr || row.title?.en : row.title?.en || row.title?.fr) ?? row.slug
    }));
  }

  /** Published guides whose listed signs appear in a free-text message (for offline answers). */
  async matchSymptoms(message: string, limit = 4) {
    const text = normalizeSearch(message);
    if (!text) return [];
    const rows = await this.articles()
      .find({ status: "published", "symptoms.0": { $exists: true } })
      .select("slug title symptoms alertLevel order")
      .lean();
    const rank = { urgent: 0, caution: 1, info: 2 } as Record<string, number>;
    return rows
      .map((row: any) => ({
        row,
        hits: (row.symptoms as string[]).filter((symptom) => text.includes(normalizeSearch(symptom))).length
      }))
      .filter((match) => match.hits > 0)
      .sort((a, b) => b.hits - a.hits || (rank[a.row.alertLevel] ?? 2) - (rank[b.row.alertLevel] ?? 2))
      .slice(0, limit)
      .map((match) => match.row as { slug: string; title: { en: string; fr: string } });
  }

  // ───────────── Admin ─────────────

  async create(user: AuthUser, body: Record<string, any>) {
    const article = this.validate(body, true);
    try {
      const created = await this.articles().create({ ...article, updatedBy: user.id, searchText: this.searchTextFor(article) });
      return { data: created.toObject() };
    } catch (err: any) {
      if (err?.code === 11000) throw new ConflictException("An article with this slug already exists");
      throw err;
    }
  }

  async update(user: AuthUser, id: string, body: Record<string, any>) {
    this.assertId(id);
    const existing = await this.articles().findById(id).lean();
    if (!existing) throw new NotFoundException("Article not found");
    const patch = this.validate({ ...existing, ...body }, false);
    try {
      const data = await this.articles()
        .findByIdAndUpdate(id, { ...patch, updatedBy: user.id, searchText: this.searchTextFor(patch) }, { new: true, runValidators: true })
        .lean();
      return { data };
    } catch (err: any) {
      if (err?.code === 11000) throw new ConflictException("An article with this slug already exists");
      throw err;
    }
  }

  async remove(id: string) {
    this.assertId(id);
    const deleted = await this.articles().findByIdAndDelete(id).lean();
    if (!deleted) throw new NotFoundException("Article not found");
    return { data: { id, deleted: true } };
  }

  /** Whitelists and checks every field an admin can set. */
  private validate(body: Record<string, any>, isNew: boolean) {
    const localized = (value: any, field: string, required: boolean, max: number): Localized => {
      const en = typeof value?.en === "string" ? value.en.trim().slice(0, max) : "";
      const fr = typeof value?.fr === "string" ? value.fr.trim().slice(0, max) : "";
      if (required && !en && !fr) throw new BadRequestException(`${field} is required in English or French`);
      return { en, fr };
    };
    const localizedList = (value: any, max: number) =>
      (Array.isArray(value) ? value : [])
        .map((item) => localized(item, "item", false, max))
        .filter((item) => item.en || item.fr)
        .slice(0, 30);
    const strings = (value: any, max: number) =>
      (Array.isArray(value) ? value : [])
        .filter((item) => typeof item === "string")
        .map((item: string) => item.trim().slice(0, max))
        .filter(Boolean)
        .slice(0, 40);
    const safeUrl = (value: unknown) => {
      if (typeof value !== "string" || !value.trim()) return undefined;
      try {
        const url = new URL(value.trim());
        return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
      } catch {
        return undefined;
      }
    };
    const age = (value: unknown) => {
      if (value === null || value === undefined || value === "") return null;
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) throw new BadRequestException("Age limits must be positive numbers of days");
      return Math.round(n);
    };

    const slug = String(body.slug ?? "").trim().toLowerCase();
    if (!SLUG_PATTERN.test(slug)) {
      throw new BadRequestException("Slug must use lowercase letters, numbers and dashes (e.g. water-management)");
    }
    if (!KNOWLEDGE_SECTIONS.includes(body.section)) throw new BadRequestException("Unknown section");

    const minAgeDays = age(body.minAgeDays);
    const maxAgeDays = age(body.maxAgeDays);
    if (minAgeDays !== null && maxAgeDays !== null && minAgeDays > maxAgeDays) {
      throw new BadRequestException("Minimum age cannot be greater than maximum age");
    }

    return {
      slug,
      section: body.section,
      title: localized(body.title, "Title", true, 160),
      summary: localized(body.summary, "Summary", true, 400),
      body: localized(body.body, "Content", true, 20000),
      symptoms: strings(body.symptoms, 60).map((s) => s.toLowerCase()),
      tags: strings(body.tags, 40).map((s) => s.toLowerCase()),
      poultryTypes: strings(body.poultryTypes, 30),
      minAgeDays,
      maxAgeDays,
      alertLevel: ALERT_LEVELS.has(body.alertLevel) ? body.alertLevel : "info",
      warnings: localizedList(body.warnings, 500),
      checklist: localizedList(body.checklist, 200),
      references: (Array.isArray(body.references) ? body.references : [])
        .map((ref: any) => ({ title: String(ref?.title ?? "").trim().slice(0, 200), url: safeUrl(ref?.url) }))
        .filter((ref: { title: string }) => ref.title)
        .slice(0, 15),
      images: strings(body.images, 1000).map(safeUrl).filter(Boolean).slice(0, 8) as string[],
      status: STATUSES.has(body.status) ? body.status : isNew ? "draft" : "published",
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0
    };
  }

  private searchTextFor(article: {
    title: Localized;
    summary: Localized;
    body: Localized;
    symptoms?: string[];
    tags?: string[];
  }) {
    return normalizeSearch(
      [
        article.title.en,
        article.title.fr,
        article.summary.en,
        article.summary.fr,
        article.body.en,
        article.body.fr,
        ...(article.symptoms ?? []),
        ...(article.tags ?? [])
      ].join(" ")
    );
  }

  private mortalityAlert(records: Array<{ numberOfDeaths: number; date: Date }>, currentQuantity: number, now: number) {
    const last24h = records
      .filter((record) => new Date(record.date).getTime() >= now - DAY_MS)
      .reduce((total, record) => total + Number(record.numberOfDeaths ?? 0), 0);
    const previousWeek = records
      .filter((record) => new Date(record.date).getTime() < now - DAY_MS)
      .reduce((total, record) => total + Number(record.numberOfDeaths ?? 0), 0);
    const usualPerDay = previousWeek / 7;
    const flockShare = currentQuantity > 0 ? last24h / (currentQuantity + last24h) : 0;

    // More than double the usual daily deaths (and at least 3), or over 1% of the flock in a day.
    if ((last24h >= 3 && last24h > usualPerDay * 2) || flockShare > 0.01) {
      return { deathsLast24h: last24h, usualPerDay: Math.round(usualPerDay * 10) / 10, articleSlug: "when-to-seek-help" };
    }
    return null;
  }

  private assertId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid id");
  }

  private articles() {
    return this.model(schemaNames.KnowledgeArticle);
  }

  private model(name: string) {
    return this.connection.model(name);
  }
}
