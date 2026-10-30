"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Store,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { GROCERY_CATEGORIES, UNITS, GroceryCategory, UnitType, IReceiptItem } from "@/types";

export default function ScanReceiptPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    storeName: string;
    purchaseDate: string;
    totalAmount: number;
    currency: string;
    items: (IReceiptItem & { selected: boolean })[];
    sourceModel: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      setErrorMessage("");
      setReceiptData(null);
      setSaveSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUseDemoReceipt = () => {
    const demoReceiptImg = "/images/sample-receipt.svg";
    setReceiptImage(demoReceiptImg);
    setReceiptData(null);
    setErrorMessage("");
  };

  const handleProcessReceipt = async () => {
    if (!receiptImage) return;
    setIsProcessing(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/ai/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: receiptImage.startsWith("data:") ? receiptImage : undefined,
          imageUrl: !receiptImage.startsWith("data:") ? receiptImage : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Receipt parsing failed");

      setReceiptData({
        ...data.data,
        items: data.data.items.map((i: any) => ({ ...i, selected: true })),
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse receipt with Meta AI.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleItemToggle = (index: number) => {
    if (!receiptData) return;
    const updated = [...receiptData.items];
    updated[index].selected = !updated[index].selected;
    setReceiptData({ ...receiptData, items: updated });
  };

  const handleFieldChange = (index: number, field: keyof IReceiptItem, value: any) => {
    if (!receiptData) return;
    const updated = [...receiptData.items];
    updated[index] = { ...updated[index], [field]: value };
    // auto update total price if quantity or unitPrice changed
    if (field === "quantity" || field === "unitPrice") {
      const q = field === "quantity" ? Number(value) : updated[index].quantity;
      const p = field === "unitPrice" ? Number(value) : updated[index].unitPrice || 0;
      updated[index].totalPrice = Math.round(q * p * 100) / 100;
    }
    setReceiptData({ ...receiptData, items: updated });
  };

  const handleConfirmAndSave = async () => {
    if (!receiptData) return;
    const confirmedItems = receiptData.items.filter((i) => i.selected && i.name.trim().length > 0);
    if (confirmedItems.length === 0) {
      setErrorMessage("Please select at least one item from the receipt.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      // 1. Commit items to inventory and purchase history simultaneously
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: confirmedItems.map((i) => ({
            name: i.name.trim(),
            category: i.category || "Other",
            quantity: Number(i.quantity) || 1,
            unit: i.unit || "items",
            packageSize: i.packageSize || null,
            minThreshold: 1,
            purchasePrice: i.unitPrice || 0,
            source: "receipt_scan",
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to save items to inventory.");

      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/purchases");
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to commit receipt data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
          Meta Muse Spark Receipt Interpreter
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          Receipt Scanning &amp; Price Ledger
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Upload grocery store receipts. Meta Muse Spark extracts item names, unit prices,
          total spending, and store details. Items sync directly to inventory and your monthly budget.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
          <span>
            Receipt logged successfully! Inventory quantities and purchase records updated.
          </span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-64 bg-white"
          >
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <Receipt className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-stone-800">Select or Drag Receipt Slip</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              Supports supermarket checkout slips, register receipts, or e-commerce invoices.
            </p>
            <Button size="sm" variant="outline" className="mt-4 pointer-events-none text-xs">
              Browse Receipt
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>Need a sample receipt?</span>
            <button
              onClick={handleUseDemoReceipt}
              className="text-emerald-700 font-semibold hover:underline"
            >
              Load Sample Grocery Slip &rarr;
            </button>
          </div>
        </div>

        {/* Preview & Scanner */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Receipt Preview
            </h3>

            {receiptImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-video bg-stone-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receiptImage}
                  alt="Receipt preview"
                  className="w-full h-full object-contain p-2"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-100 aspect-video bg-stone-50 flex flex-col items-center justify-center text-stone-400 text-xs">
                <Receipt className="h-8 w-8 mb-2 text-stone-300" />
                Select receipt image to preview
              </div>
            )}
          </div>

          <div className="pt-6 space-y-3">
            <Button
              onClick={handleProcessReceipt}
              disabled={!receiptImage || isProcessing}
              isLoading={isProcessing}
              className="w-full h-12 text-sm font-bold shadow-md shadow-emerald-700/20"
            >
              <Sparkles className="h-4 w-4" />
              {isProcessing ? "Meta Muse Spark is Parsing Receipt..." : "Interpret Receipt with AI"}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Only extracts visible line items. Never invents missing totals.
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Receipt Items Verification */}
      {receiptData && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-stone-900">Extracted Receipt Items</h2>
                <Badge variant="success">{receiptData.items.length} line items</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-2">
                <span className="flex items-center gap-1 font-semibold text-stone-900">
                  <Store className="h-3.5 w-3.5 text-emerald-700" />
                  {receiptData.storeName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  {receiptData.purchaseDate}
                </span>
                <span>•</span>
                <span className="font-bold text-emerald-800">
                  Total: {formatCurrency(receiptData.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">Include</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {receiptData.items.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      item.selected ? "bg-white" : "bg-stone-50/70 opacity-60"
                    }`}
                  >
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleItemToggle(idx)}
                        className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                      />
                    </td>

                    <td className="py-3 px-3 min-w-40">
                      <Input
                        value={item.name}
                        onChange={(e) => handleFieldChange(idx, "name", e.target.value)}
                        className="h-8 text-xs font-semibold"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={item.category || "Other"}
                        onChange={(e) => handleFieldChange(idx, "category", e.target.value)}
                        className="h-8 rounded-lg border border-stone-200 px-2 text-xs bg-white text-stone-800"
                      >
                        {GROCERY_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-3">
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={item.quantity}
                        onChange={(e) => handleFieldChange(idx, "quantity", Number(e.target.value))}
                        className="h-8 w-16 text-xs"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice || 0}
                        onChange={(e) =>
                          handleFieldChange(idx, "unitPrice", Number(e.target.value))
                        }
                        className="h-8 w-20 text-xs"
                      />
                    </td>

                    <td className="py-3 px-3 font-bold text-stone-900">
                      {formatCurrency(item.totalPrice || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handleProcessReceipt} className="text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Retry Parsing
            </Button>

            <Button
              onClick={handleConfirmAndSave}
              isLoading={isSaving}
              className="font-bold text-xs px-6"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save Receipt &amp; Update Inventory (
              {receiptData.items.filter((i) => i.selected).length} items)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
