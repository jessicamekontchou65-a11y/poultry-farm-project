import { BadRequestException } from "@nestjs/common";

export function applyMortality(currentQuantity: number, numberOfDeaths: number) {
  if (!Number.isFinite(numberOfDeaths) || numberOfDeaths <= 0) {
    throw new BadRequestException("Mortality quantity must be greater than zero");
  }

  if (numberOfDeaths > currentQuantity) {
    throw new BadRequestException("Mortality quantity cannot exceed current batch quantity");
  }

  return currentQuantity - numberOfDeaths;
}

export function calculateEggProduction(input: {
  eggsCollected: number;
  damagedEggs: number;
  eggsSold: number;
}) {
  const eggsCollected = Number(input.eggsCollected ?? 0);
  const damagedEggs = Number(input.damagedEggs ?? 0);
  const eggsSold = Number(input.eggsSold ?? 0);

  if (eggsCollected < 0 || damagedEggs < 0 || eggsSold < 0) {
    throw new BadRequestException("Egg quantities cannot be negative");
  }

  if (damagedEggs > eggsCollected) {
    throw new BadRequestException("Damaged eggs cannot exceed collected eggs");
  }

  const availableEggs = eggsCollected - damagedEggs;
  if (eggsSold > availableEggs) {
    throw new BadRequestException("Eggs sold cannot exceed available eggs");
  }

  return {
    eggsCollected,
    damagedEggs,
    eggsSold,
    remainingEggs: availableEggs - eggsSold
  };
}

export function calculateOrderItem(input: {
  productId: unknown;
  productName: string;
  requestedQuantity: number;
  stockQuantity: number;
  serverPrice: number;
}) {
  const quantity = Number(input.requestedQuantity);
  const stockQuantity = Number(input.stockQuantity);
  const unitPrice = Number(input.serverPrice);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new BadRequestException("Order quantity must be greater than zero");
  }

  if (quantity > stockQuantity) {
    throw new BadRequestException(`${input.productName} does not have enough stock`);
  }

  return {
    productId: input.productId,
    productName: input.productName,
    quantity,
    unitPrice,
    totalPrice: quantity * unitPrice
  };
}
