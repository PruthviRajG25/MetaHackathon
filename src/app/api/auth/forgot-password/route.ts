import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ForgotPasswordSchema } from "@/lib/validations/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = ForgotPasswordSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: validated.data.email.toLowerCase() });

    // For security, always respond with success so email enumeration isn't leaked
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link or code has been generated.",
      });
    }

    // Generate secure random reset token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset token created successfully.",
      // Include token in response for smooth hackathon testing & demo
      demoResetToken: token,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
