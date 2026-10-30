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

    await connectDB();
    const user = await User.findById(session.userId).select("-passwordHash -verificationToken -resetPasswordToken");

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let household = null;
    if (user.householdId) {
      household = await Household.findById(user.householdId);
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        householdId: user.householdId?.toString(),
        household: household
          ? {
              id: household._id.toString(),
              name: household.name,
              currency: household.currency,
              householdSize: household.householdSize,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Get session error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
