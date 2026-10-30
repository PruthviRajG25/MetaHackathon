import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { connectDB } from "@/lib/db";
import { PurchaseHistory } from "@/models/PurchaseHistory";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const query = session.householdId
      ? { householdId: session.householdId }
      : { userId: session.userId };

    const purchases = await PurchaseHistory.find(query).sort({ purchaseDate: -1 }).limit(100).lean();

    // Calculate monthly spending summary
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let currentMonthSpending = 0;
    let totalSpending = 0;
    const categoryTotals: Record<string, number> = {};

    for (const p of purchases) {
      const pDate = new Date(p.purchaseDate);
      totalSpending += p.price || 0;

      if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
        currentMonthSpending += p.price || 0;
      }

      categoryTotals[p.category] = (categoryTotals[p.category] || 0) + (p.price || 0);
    }

    return NextResponse.json({
      purchases,
      summary: {
        currentMonthSpending: Math.round(currentMonthSpending * 100) / 100,
        totalSpending: Math.round(totalSpending * 100) / 100,
        categoryTotals,
        purchaseCount: purchases.length,
      },
    });
  } catch (error: any) {
    console.error("Fetch purchases error:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await connectDB();

    const purchase = await PurchaseHistory.create({
      ...body,
      userId: session.userId,
      householdId: session.householdId,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
    });

    return NextResponse.json({ success: true, purchase });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create purchase record" }, { status: 500 });
  }
}
