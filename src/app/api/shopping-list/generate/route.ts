import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";
import { connectDB } from "@/lib/db";
import { InventoryItem } from "@/models/InventoryItem";
import { ShoppingList } from "@/models/ShoppingList";
import { Household } from "@/models/Household";
import {
  generateRestockRecommendations,
  convertRecommendationsToShoppingListItems,
} from "@/lib/inventory/restock-engine";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    let householdSize = 2;
    if (session.householdId) {
      const household = await Household.findById(session.householdId);
      if (household && household.householdSize) {
        householdSize = household.householdSize;
      }
    }

    const query = session.householdId
      ? { householdId: session.householdId }
      : { userId: session.userId };

    const items = await InventoryItem.find(query).lean();

    // Run deterministic Restock Engine
    const recommendations = generateRestockRecommendations(items as any, householdSize);
    const newRestockItems = convertRecommendationsToShoppingListItems(recommendations);

    // Fetch or create active shopping list
    const listQuery: any = session.householdId
      ? { householdId: session.householdId, status: "active" }
      : { userId: session.userId, status: "active" };

    let list: any = await ShoppingList.findOne(listQuery);
    if (!list) {
      list = await ShoppingList.create({
        userId: session.userId,
        householdId: session.householdId,
        name: "Weekly Household Shopping",
        status: "active",
        budget: 150,
        items: [],
      });
    }

    // Merge recommendations without duplicating existing unpurchased items
    const existingUnpurchasedNames = new Set(
      list.items
        .filter((i: any) => !i.isPurchased)
        .map((i: any) => i.name.toLowerCase().trim())
    );

    const itemsToAdd = newRestockItems.filter(
      (newItem) => !existingUnpurchasedNames.has(newItem.name.toLowerCase().trim())
    );

    list.items.push(...(itemsToAdd as any));
    await list.save();

    return NextResponse.json({
      success: true,
      addedCount: itemsToAdd.length,
      recommendationsCount: recommendations.length,
      list,
    });
  } catch (error: any) {
    console.error("Auto restock error:", error);
    return NextResponse.json({ error: "Failed to generate restock recommendations" }, { status: 500 });
  }
}
