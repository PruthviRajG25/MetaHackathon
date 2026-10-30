import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Household } from "@/models/Household";
import { HouseholdMember } from "@/models/HouseholdMember";
import { hashPassword, setSessionCookie } from "@/lib/security/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { RegisterSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rateCheck = checkRateLimit(`register_${ip}`, 5, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validatedData = RegisterSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedData.data;

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      emailVerified: true, // Auto-verified for smooth hackathon demo
      preferences: {
        currency: "USD",
        lowStockAlerts: true,
        autoRestockThresholdDays: 3,
        householdSize: 2,
      },
    });

    // Create default Household for the new user
    const household = await Household.create({
      name: `${name.split(" ")[0]}'s Household`,
      ownerId: newUser._id,
      currency: "USD",
      householdSize: 2,
    });

    // Create household member relationship
    await HouseholdMember.create({
      householdId: household._id,
      userId: newUser._id,
      role: "owner",
    });

    // Update user with household reference
    newUser.householdId = household._id as any;
    await newUser.save();

    // Set secure HTTP-only session cookie
    const sessionPayload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      householdId: household._id.toString(),
      role: "owner" as const,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        householdId: household._id.toString(),
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
