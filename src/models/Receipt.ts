import mongoose, { Schema, Document, Model } from "mongoose";
import { GROCERY_CATEGORIES, UNITS, GroceryCategory, UnitType } from "@/types";

export interface IReceiptDocument extends Document {
  userId: mongoose.Types.ObjectId;
  householdId?: mongoose.Types.ObjectId;
  storeName?: string;
  purchaseDate: Date;
  totalAmount: number;
  currency: string;
  items: Array<{
    name: string;
    category?: GroceryCategory;
    quantity: number;
    unit?: UnitType;
    packageSize?: string;
    unitPrice?: number;
    totalPrice?: number;
    matchedInventoryItemId?: mongoose.Types.ObjectId;
  }>;
  imageUrl?: string;
  status: "pending_confirmation" | "confirmed";
  createdAt: Date;
}

const ReceiptItemSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: GROCERY_CATEGORIES, default: "Other" },
    quantity: { type: Number, default: 1 },
    unit: { type: String, enum: UNITS, default: "items" },
    packageSize: { type: String },
    unitPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    matchedInventoryItemId: { type: Schema.Types.ObjectId, ref: "InventoryItem" },
  },
  { _id: false }
);

const ReceiptSchema = new Schema<IReceiptDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
    storeName: { type: String, trim: true, default: "Grocery Store" },
    purchaseDate: { type: Date, default: Date.now },
    totalAmount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "USD" },
    items: [ReceiptItemSchema],
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ["pending_confirmation", "confirmed"],
      default: "pending_confirmation",
    },
  },
  { timestamps: true }
);

export const Receipt: Model<IReceiptDocument> =
  mongoose.models.Receipt || mongoose.model<IReceiptDocument>("Receipt", ReceiptSchema);
