import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { VoiceInputPayloadSchema } from "@/lib/validations/ai";
import { parseVoiceTranscript } from "@/lib/ai/voice-parser";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = VoiceInputPayloadSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const parseResult = await parseVoiceTranscript(validated.data.transcript);

    return NextResponse.json({
      success: true,
      data: parseResult,
    });
  } catch (error: any) {
    console.error("Voice parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse spoken inventory command" },
      { status: 500 }
    );
  }
}
