import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  householdId?: mongoose.Types.ObjectId;
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  preferences: {
    currency: string;
    lowStockAlerts: boolean;
    autoRestockThresholdDays: number;
    householdSize: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String },
    avatar: { type: String },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    preferences: {
      currency: { type: String, default: "USD" },
      lowStockAlerts: { type: Boolean, default: true },
      autoRestockThresholdDays: { type: Number, default: 3 },
      householdSize: { type: Number, default: 2 },
    },
  },
  { timestamps: true }
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
