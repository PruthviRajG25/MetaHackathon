import { IInventoryItem, GroceryCategory } from "@/types";

export interface StockStatus {
  status: "ok" | "low" | "critical" | "expired";
  daysUntilExpiry: number | null;
  depletionDaysEstimate: number | null;
  suggestedRestockQuantity: number;
}

// Average daily consumption estimates per adult household member
const DEFAULT_CATEGORY_CONSUMPTION_PER_DAY: Record<GroceryCategory, number> = {
  "Dairy": 0.25, // e.g. 0.25L or 0.25 pack
  "Fruits": 0.5,
  "Vegetables": 0.5,
  "Grains and rice": 0.2, // kg
  "Cooking essentials": 0.05,
  "Snacks": 0.3,
  "Beverages": 0.5,
  "Personal care": 0.02,
  "Cleaning supplies": 0.02,
  "Other": 0.1,
};

export function evaluateStockStatus(
  item: {
    quantity: number;
    minThreshold: number;
    category: GroceryCategory;
    expiryDate?: string | Date | null;
    lastPurchasedDate?: string | Date | null;
  },
  householdSize: number = 2
): StockStatus {
  const now = new Date();
  let daysUntilExpiry: number | null = null;
  let status: "ok" | "low" | "critical" | "expired" = "ok";

  // Check Expiry
  if (item.expiryDate) {
    const exp = new Date(item.expiryDate);
    const diffMs = exp.getTime() - now.getTime();
    daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      status = "expired";
    }
  }

  // Check Thresholds if not already expired
  if (status !== "expired") {
    if (item.quantity <= 0) {
      status = "critical";
    } else if (item.quantity <= item.minThreshold) {
      status = "low";
    }
  }

  // Calculate estimated daily consumption
  const baseCategoryRate = DEFAULT_CATEGORY_CONSUMPTION_PER_DAY[item.category] || 0.1;
  const householdDailyRate = baseCategoryRate * Math.max(1, householdSize);

  let depletionDaysEstimate: number | null = null;
  if (item.quantity > 0 && householdDailyRate > 0) {
    depletionDaysEstimate = Math.max(1, Math.round(item.quantity / householdDailyRate));
  } else if (item.quantity <= 0) {
    depletionDaysEstimate = 0;
  }

  // Suggested Restock Quantity: (MinThreshold * 2) - CurrentQuantity (or at least 1)
  const targetBuffer = Math.max(item.minThreshold * 2, 2);
  const suggestedRestockQuantity = Math.max(1, Math.round((targetBuffer - Math.max(0, item.quantity)) * 10) / 10);

  return {
    status,
    daysUntilExpiry,
    depletionDaysEstimate,
    suggestedRestockQuantity,
  };
}
