import assert from "node:assert/strict";
import test from "node:test";
import {
  applyMortality,
  calculateEggProduction,
  calculateOrderItem
} from "../src/resources/domain.rules";

test("mortality decreases current quantity", () => {
  assert.equal(applyMortality(100, 7), 93);
});

test("mortality cannot exceed current quantity", () => {
  assert.throws(() => applyMortality(5, 6), /cannot exceed/);
});

test("egg production calculates remaining eggs", () => {
  assert.deepEqual(
    calculateEggProduction({
      eggsCollected: 120,
      damagedEggs: 5,
      eggsSold: 90
    }),
    {
      eggsCollected: 120,
      damagedEggs: 5,
      eggsSold: 90,
      remainingEggs: 25
    }
  );
});

test("eggs sold cannot exceed available eggs", () => {
  assert.throws(
    () =>
      calculateEggProduction({
        eggsCollected: 20,
        damagedEggs: 4,
        eggsSold: 18
      }),
    /cannot exceed/
  );
});

test("order item uses server price and validates stock", () => {
  assert.deepEqual(
    calculateOrderItem({
      productId: "product-1",
      productName: "Egg tray",
      requestedQuantity: 3,
      stockQuantity: 10,
      serverPrice: 2500
    }),
    {
      productId: "product-1",
      productName: "Egg tray",
      quantity: 3,
      unitPrice: 2500,
      totalPrice: 7500
    }
  );
});

test("order item rejects quantity above stock", () => {
  assert.throws(
    () =>
      calculateOrderItem({
        productId: "product-1",
        productName: "Egg tray",
        requestedQuantity: 11,
        stockQuantity: 10,
        serverPrice: 2500
      }),
    /enough stock/
  );
});
