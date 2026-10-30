import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { connectDB } from "@/lib/db";
import { Invitation } from "@/models/Invitation";
import { HouseholdMember } from "@/models/HouseholdMember";
import { User } from "@/models/User";
import { InviteMemberSchema, RespondInviteSchema } from "@/lib/validations/household";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Check if this is responding to an invite
    if (body.action && body.token) {
      const validated = RespondInviteSchema.safeParse(body);
      if (!validated.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

      await connectDB();
      const invite = await Invitation.findOne({
        token: validated.data.token,
        status: "pending",
        expiresAt: { $gt: new Date() },
      });

      if (!invite) {
        return NextResponse.json({ error: "Invitation expired or invalid" }, { status: 400 });
      }

      if (validated.data.action === "accept") {
        invite.status = "accepted";
        await invite.save();

        await HouseholdMember.create({
          householdId: invite.householdId,
          userId: session.userId,
          role: invite.role,
        });

        await User.findByIdAndUpdate(session.userId, { householdId: invite.householdId });

        return NextResponse.json({ success: true, message: "Joined household successfully!" });
      } else {
        invite.status = "expired";
        await invite.save();
        return NextResponse.json({ success: true, message: "Invitation declined" });
      }
    }

    // Creating a new invite
    const validated = InviteMemberSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (!session.householdId) {
      return NextResponse.json({ error: "You must belong to a household first" }, { status: 400 });
    }

    await connectDB();

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      householdId: session.householdId,
      inviterId: session.userId,
      email: validated.data.email.toLowerCase(),
      role: validated.data.role,
      token,
      expiresAt,
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || ""}/household?inviteToken=${token}`;

    return NextResponse.json({
      success: true,
      message: "Invitation generated successfully",
      invitation: {
        id: invitation._id.toString(),
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        inviteLink,
      },
    });
  } catch (error: any) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Failed to process invitation" }, { status: 500 });
  }
}
