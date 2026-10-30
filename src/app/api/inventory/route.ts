import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { connectDB } from "@/lib/db";
import { InventoryItem } from "@/models/InventoryItem";
import { PurchaseHistory } from "@/models/PurchaseHistory";
import { InventoryItemSchema, BulkInventoryConfirmSchema } from "@/lib/validations/inventory";
import { evaluateStockStatus } from "@/lib/inventory/stock-calculator";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const filterStatus = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    await connectDB();

    // Query condition: match user's household or user ID
    const query: any = session.householdId
      ? { householdId: session.householdId }
      : { userId: session.userId };

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    // Determine sort
    const sortObj: any = {};
    if (["name", "quantity", "lastPurchasedDate", "expiryDate", "updatedAt"].includes(sortBy)) {
      sortObj[sortBy] = sortOrder;
    } else {
      sortObj.updatedAt = -1;
    }

    const items = await InventoryItem.find(query).sort(sortObj).lean();

    // Augment items with calculated status and depletion estimation
    const enriched = items.map((item: any) => {
      const evaluation = evaluateStockStatus({
        quantity: item.quantity,
        minThreshold: item.minThreshold,
        category: item.category,
        expiryDate: item.expiryDate,
        lastPurchasedDate: item.lastPurchasedDate,
      });

      return {
        ...item,
        status: evaluation.status,
        daysUntilExpiry: evaluation.daysUntilExpiry,
        depletionDaysEstimate: evaluation.depletionDaysEstimate,
        suggestedRestockQuantity: evaluation.suggestedRestockQuantity,
      };
    });

    // Post-filter by status if requested
    const filtered = filterStatus && filterStatus !== "all"
      ? enriched.filter((i) => i.status === filterStatus)
      : enriched;

    return NextResponse.json({
      items: filtered,
      total: filtered.length,
    });
  } catch (error: any) {
    console.error("Fetch inventory error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    // Check if this is a bulk confirm from AI scanner
    if (body.items && Array.isArray(body.items)) {
      const bulkValid = BulkInventoryConfirmSchema.safeParse(body);
      if (!bulkValid.success) {
        return NextResponse.json(
          { error: "Validation failed", details: bulkValid.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const createdItems = [];
      for (const rawItem of bulkValid.data.items) {
        // Upsert or insert into inventory
        const existing = await InventoryItem.findOne({
          name: { $regex: new RegExp(`^${rawItem.name}$`, "i") },
          ...(session.householdId ? { householdId: session.householdId } : { userId: session.userId }),
        });

        if (existing) {
          existing.quantity += rawItem.quantity;
          if (rawItem.purchasePrice) existing.purchasePrice = rawItem.purchasePrice;
          if (rawItem.expiryDate) existing.expiryDate = new Date(rawItem.expiryDate);
          existing.lastPurchasedDate = new Date();
          await existing.save();
          createdItems.push(existing);
        } else {
          const newItem = await InventoryItem.create({
            ...rawItem,
            category: rawItem.category as any,
            unit: rawItem.unit as any,
            userId: session.userId as any,
            householdId: session.householdId as any,
            lastPurchasedDate: new Date(),
            expiryDate: rawItem.expiryDate ? new Date(rawItem.expiryDate) : null,
          });
          createdItems.push(newItem);
        }

        // If price is recorded, log to purchase history
        if (rawItem.purchasePrice && rawItem.purchasePrice > 0) {
          await PurchaseHistory.create({
            userId: session.userId as any,
            householdId: session.householdId as any,
            productName: rawItem.name,
            brand: rawItem.brand || null,
            category: rawItem.category as any,
            quantity: rawItem.quantity,
            unit: rawItem.unit as any,
            price: rawItem.purchasePrice * rawItem.quantity,
            purchaseDate: new Date(),
          });
        }
      }

      return NextResponse.json({
        success: true,
        count: createdItems.length,
        items: createdItems,
      });
    }

    // Single item creation
    const validated = InventoryItemSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const itemData = validated.data;
    const newItem: any = await InventoryItem.create({
      ...itemData,
      category: itemData.category as any,
      unit: itemData.unit as any,
      userId: session.userId as any,
      householdId: session.householdId as any,
      lastPurchasedDate: itemData.lastPurchasedDate ? new Date(itemData.lastPurchasedDate) : new Date(),
      expiryDate: itemData.expiryDate ? new Date(itemData.expiryDate) : null,
    });

    // Record purchase history if price specified
    if (itemData.purchasePrice && itemData.purchasePrice > 0) {
      await PurchaseHistory.create({
        userId: session.userId as any,
        householdId: session.householdId as any,
        itemId: newItem._id,
        productName: newItem.name,
        brand: newItem.brand || null,
        category: newItem.category as any,
        quantity: newItem.quantity,
        unit: newItem.unit as any,
        price: itemData.purchasePrice * newItem.quantity,
        purchaseDate: newItem.lastPurchasedDate,
      });
    }

    return NextResponse.json({
      success: true,
      item: newItem,
    });
  } catch (error: any) {
    console.error("Create inventory item error:", error);
    return NextResponse.json({ error: "Failed to save inventory item" }, { status: 500 });
  }
}
