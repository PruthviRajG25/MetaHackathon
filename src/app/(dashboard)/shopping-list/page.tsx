"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  CheckCircle2,
  Trash2,
  DollarSign,
  AlertCircle,
  Sparkles,
  Tag,
  Check,
  X,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { GROCERY_CATEGORIES, UNITS, GroceryCategory, UnitType, IShoppingList, IShoppingListItem } from "@/types";

export default function ShoppingListPage() {
  const [shoppingList, setShoppingList] = useState<IShoppingList | null>(null);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // New item form
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Cooking essentials" as GroceryCategory,
    quantity: 1,
    unit: "items" as UnitType,
    estimatedPrice: "",
    priority: "medium" as "high" | "medium" | "low",
  });

  const [budgetInput, setBudgetInput] = useState<number>(150);
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  useEffect(() => {
    fetchShoppingList();
  }, []);

  const fetchShoppingList = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shopping-list");
      if (res.ok) {
        const data = await res.json();
        setShoppingList(data.list);
        setEstimatedTotal(data.estimatedTotal || 0);
        if (data.list?.budget) setBudgetInput(data.list.budget);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAutoRestock = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/shopping-list/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setShoppingList(data.list);
        fetchShoppingList();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_item",
          item: {
            name: newItem.name.trim(),
            category: newItem.category,
            quantity: Number(newItem.quantity) || 1,
            unit: newItem.unit,
            estimatedPrice: newItem.estimatedPrice ? Number(newItem.estimatedPrice) : 0,
            priority: newItem.priority,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShoppingList(data.list);
        setIsAddingItem(false);
        setNewItem({
          name: "",
          category: "Cooking essentials",
          quantity: 1,
          unit: "items",
          estimatedPrice: "",
          priority: "medium",
        });
        fetchShoppingList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePurchased = async (item: IShoppingListItem) => {
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_purchased",
          item: { _id: item._id },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShoppingList(data.list);
        fetchShoppingList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_item",
          item: { _id: itemId },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShoppingList(data.list);
        fetchShoppingList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearPurchased = async () => {
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_purchased" }),
      });
      if (res.ok) {
        const data = await res.json();
        setShoppingList(data.list);
        fetchShoppingList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBudget = async () => {
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_budget", budget: Number(budgetInput) }),
      });
      if (res.ok) {
        setIsEditingBudget(false);
        fetchShoppingList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group unpurchased and purchased
  const unpurchasedItems = shoppingList?.items.filter((i) => !i.isPurchased) || [];
  const purchasedItems = shoppingList?.items.filter((i) => i.isPurchased) || [];

  // Group unpurchased items by category
  const groupedByCategory: Record<string, IShoppingListItem[]> = {};
  for (const item of unpurchasedItems) {
    if (!groupedByCategory[item.category]) groupedByCategory[item.category] = [];
    groupedByCategory[item.category].push(item);
  }

  const budget = shoppingList?.budget || 150;
  const budgetPercent = Math.min(100, Math.round((estimatedTotal / (budget || 1)) * 100));

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            Household Shopping List
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Predictive restocking checklists. Marking items purchased automatically updates your inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRunAutoRestock}
            isLoading={isGenerating}
            className="text-xs font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Auto-Restock Engine
          </Button>
          <Button size="md" onClick={() => setIsAddingItem(true)} className="text-xs font-semibold">
            <Plus className="h-4 w-4" />
            Add Custom Item
          </Button>
        </div>
      </div>

      {/* Budget & Spend Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estimated Trip Cost */}
        <Card className="border-stone-200">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase font-bold text-stone-500">
              Estimated Trip Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-800">
              {formatCurrency(estimatedTotal)}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">Calculated from past purchase prices</p>
          </CardContent>
        </Card>

        {/* Budget Tracker */}
        <Card className="md:col-span-2 border-stone-200">
          <CardHeader className="pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold text-stone-500">
              Trip Budget Monitor
            </CardTitle>
            {isEditingBudget ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(Number(e.target.value))}
                  className="h-7 w-20 text-xs"
                />
                <Button size="sm" onClick={handleSaveBudget} className="h-7 text-xs px-2">
                  Save
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingBudget(true)}
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                Set Budget: {formatCurrency(budget)}
              </button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-stone-600 font-medium">
                <span>{budgetPercent}% of budget planned</span>
                <span>
                  {formatCurrency(estimatedTotal)} / {formatCurrency(budget)}
                </span>
              </div>
              <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetPercent > 90 ? "bg-rose-500" : "bg-emerald-600"
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Item Add Form Drawer/Box */}
      {isAddingItem && (
        <form
          onSubmit={handleAddItem}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Add Item to Shopping Checklist
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">Product Name *</label>
              <Input
                required
                placeholder="e.g. Sliced Sourdough, Apples"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value as GroceryCategory })
                }
                className="w-full h-10 rounded-xl border border-stone-200 bg-white px-2.5 text-xs text-stone-800"
              >
                {GROCERY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Priority</label>
              <select
                value={newItem.priority}
                onChange={(e) =>
                  setNewItem({ ...newItem, priority: e.target.value as any })
                }
                className="w-full h-10 rounded-xl border border-stone-200 bg-white px-2.5 text-xs text-stone-800"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs pt-1">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Quantity</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Unit</label>
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value as UnitType })}
                className="w-full h-10 rounded-xl border border-stone-200 bg-white px-2.5 text-xs text-stone-800"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Est. Price ($)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="2.99"
                value={newItem.estimatedPrice}
                onChange={(e) => setNewItem({ ...newItem, estimatedPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingItem(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Item
            </Button>
          </div>
        </form>
      )}

      {/* Main Shopping List - Grouped by Category */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-sm">Loading shopping list...</div>
        ) : unpurchasedItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-sm">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800">All Restock Items Purchased!</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Your household list is clear. Click below to run the deterministic Restock Engine on current inventory.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRunAutoRestock}
              isLoading={isGenerating}
              className="mt-4"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Check Inventory &amp; Restock
            </Button>
          </div>
        ) : (
          Object.entries(groupedByCategory).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {category}
                </span>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                  {items.length} items
                </Badge>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-sm">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="p-3.5 px-4 flex items-center justify-between hover:bg-stone-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.isPurchased}
                        onChange={() => handleTogglePurchased(item)}
                        className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 h-4 w-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-stone-900">{item.name}</span>
                          {item.brand && (
                            <span className="text-xs text-stone-400">({item.brand})</span>
                          )}
                          {item.priority === "high" && (
                            <Badge variant="danger" className="text-[9px] py-0 px-1.5">
                              High Priority
                            </Badge>
                          )}
                          {item.isAutoGenerated && (
                            <Badge variant="success" className="text-[9px] py-0 px-1.5">
                              Auto-Restock
                            </Badge>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-stone-400 mt-0.5">{item.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-bold text-stone-800">
                        {item.quantity} {item.unit}
                      </span>
                      {item.estimatedPrice ? (
                        <span className="text-stone-500 font-mono">
                          {formatCurrency(item.estimatedPrice * item.quantity)}
                        </span>
                      ) : null}
                      <button
                        onClick={() => handleRemoveItem(item._id!)}
                        className="p-1 rounded text-stone-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Purchased Items Section */}
        {purchasedItems.length > 0 && (
          <div className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                Purchased in this run ({purchasedItems.length})
              </span>
              <button
                onClick={handleClearPurchased}
                className="text-xs text-stone-400 hover:text-stone-700 underline"
              >
                Clear completed items
              </button>
            </div>

            <div className="bg-stone-50 rounded-2xl border border-stone-200 divide-y divide-stone-200/60 overflow-hidden">
              {purchasedItems.map((item) => (
                <div
                  key={item._id}
                  className="p-3 px-4 flex items-center justify-between opacity-70 line-through text-stone-500 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => handleTogglePurchased(item)}
                      className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                    />
                    <span>{item.name}</span>
                  </div>
                  <span>
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
