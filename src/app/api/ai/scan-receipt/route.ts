import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { ScanImagePayloadSchema } from "@/lib/validations/ai";
import { parseReceiptWithMetaAI } from "@/lib/ai/receipt-parser";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateCheck = checkRateLimit(`scan_receipt_${session.userId}`, 20, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "AI scan rate limit reached. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = ScanImagePayloadSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const imageSource = validated.data.imageBase64 || validated.data.imageUrl || "";

    const receiptResult = await parseReceiptWithMetaAI(imageSource);

    return NextResponse.json({
      success: true,
      data: receiptResult,
    });
  } catch (error: any) {
    console.error("Receipt scan error:", error);
    return NextResponse.json(
      { error: "Failed to parse receipt. Please verify image clarity and try again." },
      { status: 500 }
    );
  }
}
