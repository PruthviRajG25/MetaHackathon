import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { connectDB } from "@/lib/db";
import { Household } from "@/models/Household";
import { HouseholdMember } from "@/models/HouseholdMember";
import { User } from "@/models/User";
import { CreateHouseholdSchema } from "@/lib/validations/household";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    if (!session.householdId) {
      return NextResponse.json({ household: null, members: [] });
    }

    const household = await Household.findById(session.householdId);
    if (!household) {
      return NextResponse.json({ household: null, members: [] });
    }

    const members = await HouseholdMember.find({ householdId: household._id })
      .populate("userId", "name email avatar")
      .lean();

    return NextResponse.json({
      household,
      members: members.map((m: any) => ({
        id: m._id.toString(),
        userId: m.userId?._id?.toString(),
        name: m.userId?.name || "User",
        email: m.userId?.email || "",
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error: any) {
    console.error("Household fetch error:", error);
    return NextResponse.json({
      household: { name: "Pro's Household", currency: "USD", householdSize: 2 },
      members: [],
    });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = CreateHouseholdSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    let household;
    if (session.householdId) {
      household = await Household.findById(session.householdId);
      if (household) {
        household.name = validated.data.name;
        household.currency = validated.data.currency;
        household.householdSize = validated.data.householdSize;
        await household.save();
      }
    }

    if (!household) {
      household = await Household.create({
        name: validated.data.name,
        ownerId: session.userId,
        currency: validated.data.currency,
        householdSize: validated.data.householdSize,
      });

      await HouseholdMember.create({
        householdId: household._id,
        userId: session.userId,
        role: "owner",
      });

      await User.findByIdAndUpdate(session.userId, { householdId: household._id });
    }

    return NextResponse.json({ success: true, household });
  } catch (error: any) {
    console.error("Household update error:", error);
    return NextResponse.json({ error: "Failed to update household" }, { status: 500 });
  }
}
