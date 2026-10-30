import { z } from "zod";
import { GROCERY_CATEGORIES, UNITS } from "@/types";

export const InventoryItemSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  brand: z.string().max(100).nullable().optional(),
  category: z.enum(GROCERY_CATEGORIES as [string, ...string[]]),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  unit: z.enum(UNITS as [string, ...string[]]),
  packageSize: z.string().max(50).nullable().optional(),
  minThreshold: z.number().min(0).default(1),
  lastPurchasedDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).nullable().optional(),
  purchasePrice: z.number().min(0).nullable().optional(),
  source: z.enum(["manual", "photo_scan", "receipt_scan", "pantry_scan", "voice"]).default("manual"),
  notes: z.string().max(500).optional(),
  barcode: z.string().max(50).optional(),
});

export const BulkInventoryConfirmSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      brand: z.string().nullable().optional(),
      category: z.enum(GROCERY_CATEGORIES as [string, ...string[]]),
      quantity: z.number().min(0.1),
      unit: z.enum(UNITS as [string, ...string[]]),
      packageSize: z.string().nullable().optional(),
      minThreshold: z.number().min(0).default(1),
      purchasePrice: z.number().min(0).nullable().optional(),
      expiryDate: z.string().nullable().optional(),
      source: z.enum(["manual", "photo_scan", "receipt_scan", "pantry_scan", "voice"]).default("photo_scan"),
    })
  ),
});

export const StockAdjustmentSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().min(0),
  reason: z.enum(["consumed", "spoiled", "restocked", "manual_audit"]).optional(),
});
