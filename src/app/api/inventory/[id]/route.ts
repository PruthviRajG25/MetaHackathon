import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { connectDB } from "@/lib/db";
import { InventoryItem } from "@/models/InventoryItem";
import { InventoryItemSchema } from "@/lib/validations/inventory";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const item = await InventoryItem.findById(id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Authorization check
    if (
      item.userId.toString() !== session.userId &&
      (!session.householdId || item.householdId?.toString() !== session.householdId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const validated = InventoryItemSchema.partial().safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();
    const item = await InventoryItem.findById(id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Ownership check
    if (
      item.userId.toString() !== session.userId &&
      (!session.householdId || item.householdId?.toString() !== session.householdId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates: any = { ...validated.data };
    if (updates.expiryDate !== undefined) {
      updates.expiryDate = updates.expiryDate ? new Date(updates.expiryDate) : null;
    }
    if (updates.lastPurchasedDate !== undefined) {
      updates.lastPurchasedDate = new Date(updates.lastPurchasedDate);
    }

    Object.assign(item, updates);
    await item.save();

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("Update item error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const item = await InventoryItem.findById(id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Ownership check
    if (
      item.userId.toString() !== session.userId &&
      (!session.householdId || item.householdId?.toString() !== session.householdId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await InventoryItem.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error: any) {
    console.error("Delete item error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
