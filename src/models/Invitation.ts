import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvitationDocument extends Document {
  householdId: mongoose.Types.ObjectId;
  inviterId: mongoose.Types.ObjectId;
  email: string;
  role: "owner" | "member";
  token: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: Date;
  createdAt: Date;
}

const InvitationSchema = new Schema<IInvitationDocument>(
  {
    householdId: { type: Schema.Types.ObjectId, ref: "Household", required: true, index: true },
    inviterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ["owner", "member"], default: "member" },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "accepted", "expired"], default: "pending" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Invitation: Model<IInvitationDocument> =
  mongoose.models.Invitation ||
  mongoose.model<IInvitationDocument>("Invitation", InvitationSchema);
