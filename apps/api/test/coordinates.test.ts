import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import { parseCoordinates } from "../src/common/coordinates";

test("keeps valid coordinates, rounded to about a metre", () => {
  assert.deepEqual(parseCoordinates({ latitude: "4.0511234", longitude: 9.7679876 }), { latitude: 4.05112, longitude: 9.76799 });
});

test("distinguishes 'not sent' from 'cleared'", () => {
  assert.equal(parseCoordinates(undefined), undefined);
  assert.equal(parseCoordinates(null), null);
});

test("rejects out-of-range or malformed values", () => {
  assert.throws(() => parseCoordinates({ latitude: 91, longitude: 9 }), BadRequestException);
  assert.throws(() => parseCoordinates({ latitude: 4, longitude: -181 }), BadRequestException);
  assert.throws(() => parseCoordinates({ latitude: "abc", longitude: 9 }), BadRequestException);
  assert.throws(() => parseCoordinates("4,9"), BadRequestException);
});
