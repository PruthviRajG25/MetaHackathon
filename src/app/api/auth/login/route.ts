import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { HouseholdMember } from "@/models/HouseholdMember";
import { comparePassword, setSessionCookie } from "@/lib/security/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { LoginSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rateCheck = checkRateLimit(`login_${ip}`, 10, 60 * 1000); // 10 attempts per minute
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validatedData = LoginSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid credentials", details: validatedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = validatedData.data;

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Determine household role
    let role: "owner" | "member" = "owner";
    if (user.householdId) {
      const membership = await HouseholdMember.findOne({
        householdId: user.householdId,
        userId: user._id,
      });
      if (membership) {
        role = membership.role;
      }
    }

    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      householdId: user.householdId ? user.householdId.toString() : undefined,
      role,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        householdId: user.householdId?.toString(),
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
