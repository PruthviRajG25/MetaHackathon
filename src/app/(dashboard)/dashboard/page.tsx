"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Camera,
  Receipt,
  ScanLine,
  Plus,
  RefreshCw,
  ArrowRight,
  Clock,
  DollarSign,
  ChevronRight,
  Layers,
  CheckCircle2,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoiceRationAssistantModal } from "@/components/voice/VoiceRationAssistantModal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IInventoryItem, IPurchaseHistory, IShoppingList } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; householdName?: string } | null>(null);
  const [inventory, setInventory] = useState<IInventoryItem[]>([]);
  const [purchases, setPurchases] = useState<IPurchaseHistory[]>([]);
  const [shoppingList, setShoppingList] = useState<IShoppingList | null>(null);
  const [spendingSummary, setSpendingSummary] = useState({ currentMonthSpending: 0, totalSpending: 0 });
  const [generatingRestock, setGeneratingRestock] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Session
      const sessionRes = await fetch("/api/auth/me");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setUser({
          name: sessionData.user?.name || "Household Manager",
          householdName: sessionData.user?.household?.name || "Our Household",
        });
      }

      // 2. Inventory
      const invRes = await fetch("/api/inventory");
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData.items || []);
      }

      // 3. Purchases
      const purchRes = await fetch("/api/purchases");
      if (purchRes.ok) {
        const purchData = await purchRes.json();
        setPurchases(purchData.purchases || []);
        if (purchData.summary) {
          setSpendingSummary({
            currentMonthSpending: purchData.summary.currentMonthSpending || 0,
            totalSpending: purchData.summary.totalSpending || 0,
          });
        }
      }

      // 4. Shopping List
      const shopRes = await fetch("/api/shopping-list");
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        setShoppingList(shopData.list);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRestock = async () => {
    setGeneratingRestock(true);
    try {
      const res = await fetch("/api/shopping-list/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setShoppingList(data.list);
        router.push("/shopping-list");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingRestock(false);
    }
  };

  // Metrics
  const totalItems = inventory.length;
  const runningLowItems = inventory.filter((i) => i.status === "low" || i.status === "critical");
  const expiredItems = inventory.filter((i) => i.status === "expired");
  const pendingRestockCount = runningLowItems.length + expiredItems.length;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  for (const item of inventory) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }
  const categoryList = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Welcome & Household Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700 text-emerald-200 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            Meta Muse Spark Intelligence Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome home, {user?.name.split(" ")[0]}!
          </h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Managing <span className="font-semibold text-white">{user?.householdName}</span>. Your pantry is being monitored for intelligent replenishment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleGenerateRestock}
            isLoading={generatingRestock}
            className="bg-white text-emerald-900 hover:bg-emerald-50 border-0 font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Auto-Restock Engine
          </Button>
          <Link href="/scan-groceries">
            <Button
              variant="outline"
              size="md"
              className="bg-emerald-800/80 hover:bg-emerald-800 text-white border-emerald-700"
            >
              <Camera className="h-4 w-4" />
              Scan Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Action Dock */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
          Quick Restocking Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
          <Link
            href="/scan-groceries"
            className="group p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Camera className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-stone-900">Scan Groceries</span>
            <span className="text-[11px] text-stone-500">Camera / Photo</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="group p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
              <Mic className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-emerald-950">Voice Ration</span>
            <span className="text-[11px] text-emerald-700 font-medium">Speak Staples</span>
          </button>

          <Link
            href="/scan-receipt"
            className="group p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Receipt className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-stone-900">Upload Receipt</span>
            <span className="text-[11px] text-stone-500">Auto-Extract Prices</span>
          </Link>

          <Link
            href="/inventory?action=new"
            className="group p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-stone-900">Add Manually</span>
            <span className="text-[11px] text-stone-500">Custom Item</span>
          </Link>

          <Link
            href="/pantry"
            className="group p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ScanLine className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-stone-900">Scan Pantry</span>
            <span className="text-[11px] text-stone-500">SAM 3.1 Vision</span>
          </Link>

          <Link
            href="/shopping-list"
            className="group p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center col-span-2 sm:col-span-1"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-stone-900">Shopping List</span>
            <span className="text-[11px] text-stone-500">
              {shoppingList?.items?.filter((i) => !i.isPurchased).length || 0} items needed
            </span>
          </Link>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total In Stock
            </CardTitle>
            <Package className="h-4 w-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-stone-900">{totalItems}</div>
            <p className="text-xs text-stone-500 mt-1">Household grocery items tracked</p>
          </CardContent>
        </Card>

        {/* Running Low */}
        <Card className={runningLowItems.length > 0 ? "border-amber-200 bg-amber-50/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Running Low
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-900">{runningLowItems.length}</div>
            <p className="text-xs text-amber-700 mt-1">Below minimum stock threshold</p>
          </CardContent>
        </Card>

        {/* Restock Urgency */}
        <Card className={pendingRestockCount > 0 ? "border-emerald-200 bg-emerald-50/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Restock Needed
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-900">{pendingRestockCount}</div>
            <p className="text-xs text-emerald-700 mt-1">
              {shoppingList?.items?.filter((i) => !i.isPurchased).length || 0} queued on shopping list
            </p>
          </CardContent>
        </Card>

        {/* Estimated Monthly Spend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">
              This Month Spend
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-stone-900">
              {formatCurrency(spendingSummary.currentMonthSpending)}
            </div>
            <p className="text-xs text-stone-500 mt-1">Recorded purchase totals</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Running Low Alert List & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Watchlist (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">Items Approaching Low Stock</h2>
              <Badge variant="warning">{runningLowItems.length} flagged</Badge>
            </div>
            <Link
              href="/inventory?status=low"
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              View all inventory &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-sm">
            {runningLowItems.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-stone-800">Your pantry is well stocked!</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  No items are currently below their minimum thresholds. Scan counter items after shopping to keep track.
                </p>
              </div>
            ) : (
              runningLowItems.slice(0, 5).map((item) => (
                <div key={item._id} className="p-4 flex items-center justify-between hover:bg-stone-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-stone-900">{item.name}</span>
                      {item.brand && <span className="text-xs text-stone-400">({item.brand})</span>}
                      <Badge variant={item.status === "critical" ? "danger" : "warning"}>
                        {item.status === "critical" ? "Out of stock" : "Low Stock"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                      <span>Category: {item.category}</span>
                      <span>•</span>
                      <span>
                        Current: <strong className="text-stone-800">{item.quantity} {item.unit}</strong> (Min: {item.minThreshold})
                      </span>
                    </div>
                  </div>

                  <Link href="/shopping-list">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Add to List
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Recent Purchases Feed */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-stone-900">Recent Purchases</h2>
              <Link href="/purchases" className="text-xs font-semibold text-emerald-700 hover:underline">
                View spending history &rarr;
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-sm">
              {purchases.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400">
                  No purchases recorded yet. Upload a receipt or scan groceries to log spending.
                </div>
              ) : (
                purchases.slice(0, 4).map((p) => (
                  <div key={p._id} className="p-3.5 px-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                    <div>
                      <span className="font-medium text-xs text-stone-900">{p.productName}</span>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        {p.quantity} {p.unit} • {p.storeName || "Grocery Store"} • {formatDate(p.purchaseDate)}
                      </div>
                    </div>
                    <span className="font-bold text-xs text-emerald-800">
                      {formatCurrency(p.price)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Active Shopping List Preview & Category Breakdown */}
        <div className="space-y-6">
          {/* Active Shopping List Card */}
          <Card className="border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white">
            <CardHeader className="pb-3 border-b border-emerald-100/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4 text-emerald-700" />
                  Active Shopping List
                </CardTitle>
                <Link
                  href="/shopping-list"
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Manage &rarr;
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {(!shoppingList?.items || shoppingList.items.length === 0) ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-stone-500 mb-3">No restock items on list.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateRestock}
                    isLoading={generatingRestock}
                    className="w-full text-xs"
                  >
                    Run Auto-Restock
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {shoppingList.items.filter((i) => !i.isPurchased).slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-stone-100"
                      >
                        <span className="font-medium text-stone-800 truncate">{item.name}</span>
                        <span className="text-stone-500 shrink-0 ml-2">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                    <span>Pending Items:</span>
                    <span>{shoppingList.items.filter((i) => !i.isPurchased).length}</span>
                  </div>

                  <Link href="/shopping-list" className="block pt-1">
                    <Button size="sm" className="w-full text-xs">
                      Open Full Shopping Checklist
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader className="pb-3 border-b border-stone-100">
              <CardTitle className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-700" />
                Inventory Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {categoryList.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center">No inventory logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {categoryList.slice(0, 6).map(([cat, count]) => {
                    const percentage = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-700 font-medium">{cat}</span>
                          <span className="text-stone-400">{count} items ({percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Voice Ration Assistant Modal */}
      <VoiceRationAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
