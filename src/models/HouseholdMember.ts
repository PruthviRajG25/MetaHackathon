import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHouseholdMemberDocument extends Document {
  householdId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "owner" | "member";
  joinedAt: Date;
}

const HouseholdMemberSchema = new Schema<IHouseholdMemberDocument>(
  {
    householdId: { type: Schema.Types.ObjectId, ref: "Household", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["owner", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

HouseholdMemberSchema.index({ householdId: 1, userId: 1 }, { unique: true });

export const HouseholdMember: Model<IHouseholdMemberDocument> =
  mongoose.models.HouseholdMember ||
  mongoose.model<IHouseholdMemberDocument>("HouseholdMember", HouseholdMemberSchema);
