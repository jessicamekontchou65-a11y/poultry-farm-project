import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { CampayService } from "../src/payments/campay.service";

function service(env: Record<string, string>) {
  const jwt = new JwtService({});
  return { campay: new CampayService(new ConfigService(env), jwt), jwt };
}

test("normalizes Cameroonian mobile numbers", () => {
  const { campay } = service({});
  assert.equal(campay.normalizePhone("677 12 34 56"), "237677123456");
  assert.equal(campay.normalizePhone("+237 699-000-111"), "237699000111");
  assert.throws(() => campay.normalizePhone("12345"), /valid Cameroonian/);
  assert.throws(() => campay.normalizePhone("237277123456"), /valid Cameroonian/);
});

test("caps charges in demo mode only", () => {
  assert.equal(service({ CAMPAY_USE_DEMO: "true", CAMPAY_DEMO_MAX_AMOUNT: "25" }).campay.chargeableAmount(15000), 25);
  assert.equal(service({ CAMPAY_USE_DEMO: "false", CAMPAY_DEMO_MAX_AMOUNT: "25" }).campay.chargeableAmount(15000), 15000);
});

test("accepts only webhook signatures made with the webhook key", () => {
  const { campay, jwt } = service({ CAMPAY_WEBHOOK_KEY: "webhook-key" });
  assert.equal(campay.verifyWebhookSignature(jwt.sign({ reference: "r1" }, { secret: "webhook-key" })), true);
  assert.equal(campay.verifyWebhookSignature(jwt.sign({ reference: "r1" }, { secret: "forged" })), false);
  assert.equal(campay.verifyWebhookSignature(undefined), false);
});

test("simulation mode resolves without calling CamPay", async () => {
  const { campay } = service({ CAMPAY_SIMULATION: "true" });
  const collect = await campay.collect({ amount: 500, phone: "237677123456", description: "t", externalReference: "p1" });
  assert.equal(collect.simulated, true);
  assert.equal((await campay.getTransaction(collect.reference)).status, "SUCCESSFUL");
});
