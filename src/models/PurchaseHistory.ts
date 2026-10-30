import mongoose, { Schema, Document, Model } from "mongoose";
import { GROCERY_CATEGORIES, UNITS, GroceryCategory, UnitType } from "@/types";

export interface IPurchaseHistoryDocument extends Document {
  userId: mongoose.Types.ObjectId;
  householdId?: mongoose.Types.ObjectId;
  itemId?: mongoose.Types.ObjectId;
  productName: string;
  brand?: string | null;
  category: GroceryCategory;
  quantity: number;
  unit: UnitType;
  price: number;
  storeName?: string;
  purchaseDate: Date;
  receiptId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PurchaseHistorySchema = new Schema<IPurchaseHistoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
    itemId: { type: Schema.Types.ObjectId, ref: "InventoryItem" },
    productName: { type: String, required: true, trim: true, index: true },
    brand: { type: String, trim: true, default: null },
    category: {
      type: String,
      enum: GROCERY_CATEGORIES,
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 0.1 },
    unit: { type: String, enum: UNITS, default: "items" },
    price: { type: Number, required: true, min: 0 },
    storeName: { type: String, trim: true },
    purchaseDate: { type: Date, default: Date.now, index: true },
    receiptId: { type: Schema.Types.ObjectId, ref: "Receipt" },
  },
  { timestamps: true }
);

export const PurchaseHistory: Model<IPurchaseHistoryDocument> =
  mongoose.models.PurchaseHistory ||
  mongoose.model<IPurchaseHistoryDocument>("PurchaseHistory", PurchaseHistorySchema);
