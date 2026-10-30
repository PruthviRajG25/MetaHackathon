import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { ScanImagePayloadSchema } from "@/lib/validations/ai";
import { analyzePantryScene } from "@/lib/ai/pantry-analysis";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateCheck = checkRateLimit(`pantry_scan_${session.userId}`, 20, 60 * 1000);
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

    const analysisResult = await analyzePantryScene(imageSource);

    return NextResponse.json({
      success: true,
      data: analysisResult,
    });
  } catch (error: any) {
    console.error("Pantry analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze pantry image." },
      { status: 500 }
    );
  }
}
