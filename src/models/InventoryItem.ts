import mongoose, { Schema, Document, Model } from "mongoose";
import { GROCERY_CATEGORIES, UNITS, GroceryCategory, UnitType } from "@/types";

export interface IInventoryItemDocument extends Document {
  userId: mongoose.Types.ObjectId;
  householdId?: mongoose.Types.ObjectId;
  name: string;
  brand?: string | null;
  category: GroceryCategory;
  quantity: number;
  unit: UnitType;
  packageSize?: string | null;
  minThreshold: number;
  lastPurchasedDate?: Date;
  expiryDate?: Date | null;
  purchasePrice?: number | null;
  source: "manual" | "photo_scan" | "receipt_scan" | "pantry_scan" | "voice";
  notes?: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItemDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
    name: { type: String, required: true, trim: true, index: true },
    brand: { type: String, trim: true, default: null },
    category: {
      type: String,
      enum: GROCERY_CATEGORIES,
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: UNITS, default: "items" },
    packageSize: { type: String, trim: true, default: null },
    minThreshold: { type: Number, default: 1, min: 0 },
    lastPurchasedDate: { type: Date, default: Date.now, index: true },
    expiryDate: { type: Date, default: null, index: true },
    purchasePrice: { type: Number, min: 0, default: null },
    source: {
      type: String,
      enum: ["manual", "photo_scan", "receipt_scan", "pantry_scan", "voice"],
      default: "manual",
    },
    notes: { type: String, trim: true },
    barcode: { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound index for user item uniqueness search
InventoryItemSchema.index({ userId: 1, name: 1, category: 1 });
InventoryItemSchema.index({ householdId: 1, name: 1, category: 1 });

export const InventoryItem: Model<IInventoryItemDocument> =
  mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItemDocument>("InventoryItem", InventoryItemSchema);
