import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { ForbiddenException } from "@nestjs/common";
import { ResourcesController } from "../src/resources/resources.controller";
import type { AuthUser, DomainService } from "../src/resources/domain.service";
import type { ResourcesService } from "../src/resources/resources.service";

const customer: AuthUser = { id: "u1", roles: ["customer"] };
const admin: AuthUser = { id: "a1", roles: ["admin"] };

function setup() {
  const calls: Array<{ op: string; resource: string; payload?: unknown }> = [];
  const resources = {
    list: async (resource: string) => (calls.push({ op: "list", resource }), { data: [] }),
    findOne: async (resource: string, id: string) => {
      calls.push({ op: "findOne", resource });
      return { data: { _id: id, fullName: "Ama", email: "a@x.cm", address: "secret street" } };
    },
    create: async (resource: string, payload: unknown) => (calls.push({ op: "create", resource, payload }), { data: payload }),
    update: async (resource: string, _id: string, payload: unknown) =>
      (calls.push({ op: "update", resource, payload }), { data: payload }),
    remove: async (resource: string) => (calls.push({ op: "remove", resource }), { data: {} })
  } as unknown as ResourcesService;
  const domain = {
    isAdmin: (user: AuthUser) => user.roles.includes("admin") || user.roles.includes("super_admin"),
    assertBatchAccess: async (user: AuthUser) => {
      if (user.id !== "farmer") throw new ForbiddenException("not yours");
    }
  } as unknown as DomainService;
  return { controller: new ResourcesController(resources, domain), calls };
}

test("guests and customers cannot list private collections", async () => {
  const { controller } = setup();
  assert.throws(() => controller.list(null, "users", {}), ForbiddenException);
  assert.throws(() => controller.list(customer, "payments", {}), ForbiddenException);
});

test("public catalog stays readable without a token", async () => {
  const { controller, calls } = setup();
  await controller.list(null, "products", {});
  assert.deepEqual(calls[0], { op: "list", resource: "products" });
});

test("another user's profile is reduced to public fields", async () => {
  const { controller } = setup();
  const result = await controller.findOne(customer, "users", "other");
  assert.equal((result.data as Record<string, unknown>).address, undefined);
  assert.equal((result.data as Record<string, unknown>).fullName, "Ama");
});

test("users cannot grant themselves admin", async () => {
  const { controller } = setup();
  await assert.rejects(
    controller.update(customer, "users", "u1", { roles: ["customer", "admin"] }),
    ForbiddenException
  );
});

test("self profile update keeps only editable fields", async () => {
  const { controller, calls } = setup();
  await controller.update(customer, "users", "u1", {
    fullName: "New",
    status: "active",
    isVerified: true,
    roles: ["customer", "farmer"]
  });
  assert.deepEqual(calls[0].payload, { fullName: "New", roles: ["customer", "farmer"] });
});

test("users cannot edit someone else's account", async () => {
  const { controller } = setup();
  await assert.rejects(controller.update(customer, "users", "u2", { fullName: "x" }), ForbiddenException);
});

test("batches are editable only by their farm owner", async () => {
  const { controller, calls } = setup();
  await assert.rejects(controller.update(customer, "batches", "b1", { currentQuantity: 1 }), ForbiddenException);
  await controller.update({ id: "farmer", roles: ["farmer"] }, "batches", "b1", { currentQuantity: 5, farmId: "f2" });
  assert.deepEqual(calls[0].payload, { currentQuantity: 5 });
});

test("only admins create or delete through the generic API", async () => {
  const { controller } = setup();
  assert.throws(() => controller.create(customer, "orders", {}), ForbiddenException);
  assert.throws(() => controller.remove(customer, "farms", "f1"), ForbiddenException);
  await controller.remove(admin, "farms", "f1");
});

test("admins cannot write password hashes directly", async () => {
  const { controller, calls } = setup();
  await controller.update(admin, "users", "u1", { status: "suspended", passwordHash: "x" });
  assert.deepEqual(calls[0].payload, { status: "suspended" });
});
