import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHouseholdDocument extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  currency: string;
  householdSize: number;
  createdAt: Date;
  updatedAt: Date;
}

const HouseholdSchema = new Schema<IHouseholdDocument>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    currency: { type: String, default: "USD" },
    householdSize: { type: Number, default: 2, min: 1 },
  },
  { timestamps: true }
);

export const Household: Model<IHouseholdDocument> =
  mongoose.models.Household || mongoose.model<IHouseholdDocument>("Household", HouseholdSchema);
