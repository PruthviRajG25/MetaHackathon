"use client";

import { useState, useEffect } from "react";
import {
  History,
  DollarSign,
  TrendingUp,
  Calendar,
  Store,
  Tag,
  Plus,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IPurchaseHistory } from "@/types";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<IPurchaseHistory[]>([]);
  const [summary, setSummary] = useState({
    currentMonthSpending: 0,
    totalSpending: 0,
    categoryTotals: {} as Record<string, number>,
    purchaseCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/purchases");
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categoryEntries = Object.entries(summary.categoryTotals || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          Purchase History &amp; Monthly Spending
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Detailed ledger of household grocery expenditures, store totals, and category breakdowns.
        </p>
      </div>

      {/* Spending Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase font-bold text-emerald-800">
              Current Month Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-950">
              {formatCurrency(summary.currentMonthSpending)}
            </div>
            <p className="text-xs text-stone-500 mt-1">Recorded supermarket checkouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase font-bold text-stone-500">
              All-Time Grocery Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-stone-900">
              {formatCurrency(summary.totalSpending)}
            </div>
            <p className="text-xs text-stone-500 mt-1">{summary.purchaseCount} purchase entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase font-bold text-stone-500">
              Average Item Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-stone-900">
              {summary.purchaseCount > 0
                ? formatCurrency(summary.totalSpending / summary.purchaseCount)
                : "$0.00"}
            </div>
            <p className="text-xs text-stone-500 mt-1">Across all categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Spending Breakdown */}
      {categoryEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b border-stone-100">
            <CardTitle className="text-sm font-bold text-stone-900">
              Spending by Grocery Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryEntries.map(([cat, amount]) => {
                const percent =
                  summary.totalSpending > 0
                    ? Math.round((amount / summary.totalSpending) * 100)
                    : 0;
                return (
                  <div key={cat} className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-stone-800">{cat}</span>
                      <span className="font-bold text-emerald-800">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      {percent}% of overall groceries
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Ledger Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900">Recorded Purchases</h2>
          <Badge variant="outline">{purchases.length} logged</Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">Loading purchase ledger...</div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center">
            <History className="h-10 w-10 text-stone-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-stone-800">No purchases recorded yet</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Scan receipts or mark items as purchased in your shopping checklist to track spending.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Store</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-4 text-right">Price Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-stone-900">{p.productName}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-600">
                      {p.storeName || "Supermarket"}
                    </td>
                    <td className="py-3 px-3">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="py-3 px-3 text-stone-500">{formatDate(p.purchaseDate)}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-800">
                      {formatCurrency(p.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
