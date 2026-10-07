import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import { KnowledgeService, normalizeSearch } from "../src/knowledge/knowledge.service";
import { KNOWLEDGE_SEED } from "../src/knowledge/knowledge.seed";
import { KNOWLEDGE_SECTIONS } from "../src/knowledge/knowledge.constants";

const admin = { id: "507f1f77bcf86cd799439011", roles: ["admin"] };

function service() {
  const created: any[] = [];
  const connection = {
    model: () => ({
      create: async (doc: any) => (created.push(doc), { toObject: () => doc })
    })
  };
  return { knowledge: new KnowledgeService(connection as any), created };
}

const valid = {
  slug: "heat-stress",
  section: "housing",
  title: { fr: "Stress thermique" },
  summary: { fr: "Résumé" },
  body: { fr: "## Texte" }
};

test("search text ignores case and accents", () => {
  assert.equal(normalizeSearch("  Diarrhée VERTE "), "diarrhee verte");
});

test("seed content is complete and uses known sections", () => {
  const slugs = new Set<string>();
  for (const article of KNOWLEDGE_SEED) {
    assert.ok(KNOWLEDGE_SECTIONS.includes(article.section as any), article.slug);
    assert.ok(article.title.en && article.title.fr, `${article.slug} needs both titles`);
    assert.ok(article.body.en && article.body.fr, `${article.slug} needs both bodies`);
    assert.ok(!slugs.has(article.slug), `duplicate slug ${article.slug}`);
    slugs.add(article.slug);
  }
  // Every section of the Knowledge Center has starter content.
  for (const section of KNOWLEDGE_SECTIONS) {
    assert.ok(KNOWLEDGE_SEED.some((a) => a.section === section), `no content for ${section}`);
  }
});

test("health guides carry a no-diagnosis warning", () => {
  for (const article of KNOWLEDGE_SEED.filter((a) => a.section === "health")) {
    assert.ok(article.warnings?.length, `${article.slug} needs a warning`);
  }
});

test("new articles default to draft and keep only safe image URLs", async () => {
  const { knowledge, created } = service();
  await knowledge.create(admin, { ...valid, images: ["javascript:alert(1)", "https://example.org/a.png"] });
  assert.equal(created[0].status, "draft");
  assert.deepEqual(created[0].images, ["https://example.org/a.png"]);
  assert.match(created[0].searchText, /stress thermique/);
});

test("rejects bad slugs, unknown sections and inverted age ranges", async () => {
  const { knowledge } = service();
  await assert.rejects(knowledge.create(admin, { ...valid, slug: "Bad Slug" }), BadRequestException);
  await assert.rejects(knowledge.create(admin, { ...valid, section: "gossip" }), BadRequestException);
  await assert.rejects(knowledge.create(admin, { ...valid, minAgeDays: 30, maxAgeDays: 10 }), BadRequestException);
  await assert.rejects(knowledge.create(admin, { ...valid, title: { en: "", fr: "" } }), BadRequestException);
});
