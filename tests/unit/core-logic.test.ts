/**
 * RepeatLess AI - Core Logic & Security Test Suite
 * Validates deterministic restocking engine, stock calculator, AI schema validations, and rate-limiting.
 */

import { evaluateStockStatus } from "../../src/lib/inventory/stock-calculator";
import { generateRestockRecommendations } from "../../src/lib/inventory/restock-engine";
import {
  GroceryScanResponseSchema,
  ReceiptScanResponseSchema,
} from "../../src/lib/validations/ai";
import { checkRateLimit } from "../../src/lib/security/rate-limit";
import { IInventoryItem } from "../../src/types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${msg}`);
    failed++;
  }
}

console.log("\n🧪 Running RepeatLess AI Test Suite...\n");

// 1. Stock Calculation Tests
console.log("--- 1. Deterministic Stock Status & Expiry Tests ---");
const testItemOk = {
  quantity: 5,
  minThreshold: 2,
  category: "Dairy" as const,
};
const evalOk = evaluateStockStatus(testItemOk, 2);
assert(evalOk.status === "ok", "Healthy stock evaluates to status: 'ok'");

const testItemLow = {
  quantity: 1,
  minThreshold: 2,
  category: "Dairy" as const,
};
const evalLow = evaluateStockStatus(testItemLow, 2);
assert(evalLow.status === "low", "Stock at or below minThreshold evaluates to 'low'");
assert(evalLow.suggestedRestockQuantity >= 3, "Restock quantity suggests buffer replenishing");

const testItemCritical = {
  quantity: 0,
  minThreshold: 1,
  category: "Cooking essentials" as const,
};
const evalCritical = evaluateStockStatus(testItemCritical, 2);
assert(evalCritical.status === "critical", "Zero quantity evaluates to 'critical'");

const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
const testItemExpired = {
  quantity: 3,
  minThreshold: 1,
  category: "Dairy" as const,
  expiryDate: expiredDate,
};
const evalExpired = evaluateStockStatus(testItemExpired, 2);
assert(evalExpired.status === "expired", "Past expiry date flags item as 'expired'");

// 2. Restocking Engine Tests
console.log("\n--- 2. Restock Recommendation Engine Tests ---");
const mockInventory: IInventoryItem[] = [
  {
    _id: "1",
    userId: "u1",
    name: "Olive Oil",
    category: "Cooking essentials",
    quantity: 0.2,
    unit: "litre",
    minThreshold: 1,
    source: "manual",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "2",
    userId: "u1",
    name: "Basmati Rice",
    category: "Grains and rice",
    quantity: 10,
    unit: "kg",
    minThreshold: 2,
    source: "manual",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "3",
    userId: "u1",
    name: "Greek Yogurt",
    category: "Dairy",
    quantity: 0,
    unit: "items",
    minThreshold: 2,
    source: "manual",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const recs = generateRestockRecommendations(mockInventory, 2);
assert(recs.length === 2, "Generates restock recommendations only for depleted/low items");
assert(recs[0].item.name === "Greek Yogurt", "Highest priority (critical out of stock) placed first");

// 3. AI Zod Schema Validation Tests
console.log("\n--- 3. Meta AI Response Validation Tests ---");
const validGroceryOutput = {
  items: [
    {
      name: "Organic Milk",
      brand: "Horizon",
      category: "Dairy",
      packageSize: "1 Gallon",
      quantity: 1,
      unit: "bottle",
      confidence: 0.96,
      notes: "Gallon jug clearly visible",
    },
  ],
  rawSummary: "Identified milk",
};
const parsedGrocery = GroceryScanResponseSchema.safeParse(validGroceryOutput);
assert(parsedGrocery.success, "Valid Meta Muse Spark grocery output passes Zod schema");

const invalidGroceryOutput = {
  items: [
    {
      name: "Mystery Item",
      category: "InvalidCategoryName", // Invalid category
      confidence: 1.5, // Exceeds 1.0 limit
    },
  ],
};
const parsedInvalid = GroceryScanResponseSchema.safeParse(invalidGroceryOutput);
assert(!parsedInvalid.success, "Malformed or out-of-range AI output is strictly rejected by Zod");

// 4. Receipt Schema Validation
console.log("\n--- 4. Receipt Parsing Validation Tests ---");
const validReceiptOutput = {
  storeName: "Trader Joe's",
  purchaseDate: "2026-10-30",
  totalAmount: 14.5,
  currency: "USD",
  items: [
    {
      name: "Bananas",
      category: "Fruits",
      quantity: 2,
      unit: "items",
      unitPrice: 0.99,
      totalPrice: 1.98,
    },
  ],
};
const parsedReceipt = ReceiptScanResponseSchema.safeParse(validReceiptOutput);
assert(parsedReceipt.success, "Valid Meta Muse Spark receipt extraction passes schema");

// 5. Rate Limiting Tests
console.log("\n--- 5. Security Rate Limiting Tests ---");
const testIp = "test_user_ip_rate_check";
let rateLimitHit = false;
for (let i = 0; i < 6; i++) {
  const res = checkRateLimit(testIp, 5, 1000);
  if (!res.success) {
    rateLimitHit = true;
    break;
  }
}
assert(rateLimitHit, "Rate limiter prevents brute-force attempts after threshold");

console.log(`\n========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
