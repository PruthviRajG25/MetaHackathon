import { z } from "zod";
import { GROCERY_CATEGORIES, UNITS } from "@/types";

export const ScanImagePayloadSchema = z.object({
  imageUrl: z.string().optional(),
  imageBase64: z.string().optional(),
  householdId: z.string().optional(),
}).refine(data => data.imageUrl || data.imageBase64, {
  message: "Either imageUrl or imageBase64 must be provided",
});

export const DetectedItemSchema = z.object({
  name: z.string().min(1),
  brand: z.string().nullable().optional(),
  category: z.enum(GROCERY_CATEGORIES as [string, ...string[]]),
  packageSize: z.string().nullable().optional(),
  quantity: z.number().default(1),
  unit: z.enum(UNITS as [string, ...string[]]).default("items"),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});

export const GroceryScanResponseSchema = z.object({
  items: z.array(DetectedItemSchema),
  rawSummary: z.string().optional(),
});

export const ReceiptItemSchema = z.object({
  name: z.string().min(1),
  category: z.enum(GROCERY_CATEGORIES as [string, ...string[]]).optional().default("Other"),
  quantity: z.number().default(1),
  unit: z.enum(UNITS as [string, ...string[]]).default("items"),
  packageSize: z.string().optional(),
  unitPrice: z.number().default(0),
  totalPrice: z.number().default(0),
});

export const ReceiptScanResponseSchema = z.object({
  storeName: z.string().default("Grocery Store"),
  purchaseDate: z.string().optional(),
  totalAmount: z.number().default(0),
  currency: z.string().default("USD"),
  items: z.array(ReceiptItemSchema),
});

export const PantryDetectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().nullable().optional(),
  category: z.enum(GROCERY_CATEGORIES as [string, ...string[]]),
  boundingBox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(), // [ymin, xmin, ymax, xmax]
  confidence: z.number().min(0).max(1),
  needsStockCheck: z.boolean(),
  isDuplicate: z.boolean(),
  estimatedCount: z.number().default(1),
});

export const PantryAnalysisResponseSchema = z.object({
  sceneSummary: z.string(),
  detectedItems: z.array(PantryDetectionSchema),
  recommendations: z.array(z.string()).optional(),
});

export const VoiceInputPayloadSchema = z.object({
  transcript: z.string().min(1),
  householdId: z.string().optional(),
});

export const VoiceParsedResponseSchema = z.object({
  rawTranscript: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      brand: z.string().nullable().optional(),
      category: z.enum(GROCERY_CATEGORIES as [string, ...string[]]),
      quantity: z.number().default(1),
      unit: z.enum(UNITS as [string, ...string[]]).default("items"),
      action: z.enum(["add", "restock", "consume"]).default("add"),
    })
  ),
});
