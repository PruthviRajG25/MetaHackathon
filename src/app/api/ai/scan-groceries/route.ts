import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { ScanImagePayloadSchema } from "@/lib/validations/ai";
import { recognizeGroceriesFromImage } from "@/lib/ai/grocery-recognition";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit AI scans to prevent quota exhaustion
    const rateCheck = checkRateLimit(`scan_groceries_${session.userId}`, 20, 60 * 1000);
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

    // Call Meta Muse Spark Vision engine
    const recognitionResult = await recognizeGroceriesFromImage(imageSource);

    return NextResponse.json({
      success: true,
      data: recognitionResult,
    });
  } catch (error: any) {
    console.error("Grocery scan error:", error);
    return NextResponse.json(
      { error: "Failed to recognize grocery items. Please try again." },
      { status: 500 }
    );
  }
}
