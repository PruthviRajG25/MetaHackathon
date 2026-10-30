import { z } from "zod";

export const CreateHouseholdSchema = z.object({
  name: z.string().min(2, "Household name must be at least 2 characters").max(50),
  currency: z.string().max(5).default("USD"),
  householdSize: z.number().min(1).max(30).default(2),
});

export const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "member"]).default("member"),
});

export const RespondInviteSchema = z.object({
  token: z.string().min(1),
  action: z.enum(["accept", "decline"]),
});
