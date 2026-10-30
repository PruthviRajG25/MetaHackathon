import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Household } from "@/models/Household";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let dbUser: any = null;
    let household: any = null;

    try {
      await connectDB();
      if (session.userId && session.userId.length === 24) {
        dbUser = await User.findById(session.userId).select("-passwordHash -verificationToken -resetPasswordToken").lean();
        if (dbUser?.householdId) {
          household = await Household.findById(dbUser.householdId).lean();
        }
      }
    } catch (dbErr) {
      console.warn("Non-fatal DB lookup issue in /api/auth/me:", dbErr);
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser ? dbUser._id.toString() : session.userId,
        name: dbUser?.name || session.name,
        email: dbUser?.email || session.email,
        preferences: dbUser?.preferences || { currency: "USD", householdSize: 2 },
        householdId: dbUser?.householdId ? dbUser.householdId.toString() : session.householdId,
        household: household
          ? {
              id: household._id.toString(),
              name: household.name,
              currency: household.currency || "USD",
              householdSize: household.householdSize || 2,
            }
          : {
              id: session.householdId || "h_default",
              name: "Pro's Household",
              currency: "USD",
              householdSize: 2,
            },
      },
    });
  } catch (error: any) {
    console.error("Get session error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
