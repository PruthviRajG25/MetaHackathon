"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GROCERY_CATEGORIES, UNITS, GroceryCategory, UnitType, DetectedGroceryItem } from "@/types";

export default function ScanGroceriesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    items: DetectedGroceryItem[];
    rawSummary: string;
    sourceModel: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage("Image file exceeds 8MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setErrorMessage("");
      setScanResult(null);
      setSaveSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUseDemoImage = () => {
    const sampleGroceryImage = "/images/sample-groceries.svg";
    setImagePreview(sampleGroceryImage);
    setScanResult(null);
    setErrorMessage("");
  };

  const handleTriggerScan = async () => {
    if (!imagePreview) return;
    setIsScanning(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/ai/scan-groceries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imagePreview.startsWith("data:") ? imagePreview : undefined,
          imageUrl: !imagePreview.startsWith("data:") ? imagePreview : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Grocery scan failed");

      setScanResult(data.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to recognize grocery items.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleItemToggle = (index: number) => {
    if (!scanResult) return;
    const updated = [...scanResult.items];
    updated[index].selected = !updated[index].selected;
    setScanResult({ ...scanResult, items: updated });
  };

  const handleItemFieldChange = (index: number, field: keyof DetectedGroceryItem, value: any) => {
    if (!scanResult) return;
    const updated = [...scanResult.items];
    updated[index] = { ...updated[index], [field]: value };
    setScanResult({ ...scanResult, items: updated });
  };

  const handleRemoveItem = (index: number) => {
    if (!scanResult) return;
    const updated = scanResult.items.filter((_, i) => i !== index);
    setScanResult({ ...scanResult, items: updated });
  };

  const handleAddNewManualRow = () => {
    if (!scanResult) return;
    const newItem: DetectedGroceryItem = {
      id: `manual-${Date.now()}`,
      name: "",
      brand: null,
      category: "Cooking essentials",
      packageSize: "1 unit",
      quantity: 1,
      unit: "items",
      confidence: 1.0,
      selected: true,
    };
    setScanResult({ ...scanResult, items: [...scanResult.items, newItem] });
  };

  const handleSaveConfirmedToInventory = async () => {
    if (!scanResult) return;
    const confirmedItems = scanResult.items.filter((i) => i.selected && i.name.trim().length > 0);
    if (confirmedItems.length === 0) {
      setErrorMessage("Please select at least one item to save to inventory.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: confirmedItems.map((i) => ({
            name: i.name.trim(),
            brand: i.brand || null,
            category: i.category,
            quantity: Number(i.quantity) || 1,
            unit: i.unit,
            packageSize: i.packageSize || null,
            minThreshold: 1,
            purchasePrice: i.estimatedPrice || null,
            source: "photo_scan",
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save items");

      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/inventory");
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to commit items to inventory.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
          Meta Muse Spark Vision Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          AI Grocery Photo Recognition
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Capture or upload photos of your groceries on the kitchen counter. Meta Muse Spark detects
          visible products, packaging, and quantities with mandatory human confirmation before saving.
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
            Confirmed items have been saved to your household inventory! Redirecting to inventory...
          </span>
        </div>
      )}

      {/* Image Upload Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Dropzone */}
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
              <UploadCloud className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-stone-800">Select or Drag Grocery Photo</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              Supports JPG, PNG, or WebP. Take a photo of bags or unpackaged groceries.
            </p>
            <Button size="sm" variant="outline" className="mt-4 pointer-events-none text-xs">
              <Camera className="h-3.5 w-3.5" /> Choose Photo
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>Don&apos;t have a photo ready?</span>
            <button
              onClick={handleUseDemoImage}
              className="text-emerald-700 font-semibold hover:underline"
            >
              Load Demo Grocery Basket &rarr;
            </button>
          </div>
        </div>

        {/* Preview & Action Panel */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Image Preview
            </h3>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-video bg-stone-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Grocery preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-100 aspect-video bg-stone-50 flex flex-col items-center justify-center text-stone-400 text-xs">
                <Package className="h-8 w-8 mb-2 text-stone-300" />
                Upload an image to preview
              </div>
            )}
          </div>

          <div className="pt-6 space-y-3">
            <Button
              onClick={handleTriggerScan}
              disabled={!imagePreview || isScanning}
              isLoading={isScanning}
              className="w-full h-12 text-sm font-bold shadow-md shadow-emerald-700/20"
            >
              <Sparkles className="h-4 w-4" />
              {isScanning ? "Meta Muse Spark is Analyzing..." : "Run AI Grocery Perception"}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Does not assume hidden contents of opaque containers
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Interface (Mandatory Step 8 & 9) */}
      {scanResult && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900">
                  Verification &amp; Confirmation Table
                </h2>
                <Badge variant="success">{scanResult.items.length} detected</Badge>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Model: <span className="font-semibold text-stone-700">{scanResult.sourceModel}</span>.
                Review and modify names, quantities, and categories before committing.
              </p>
            </div>

            <Button size="sm" variant="outline" onClick={handleAddNewManualRow} className="text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Missing Item
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">Include</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Qty &amp; Unit</th>
                  <th className="py-2.5 px-3">Pkg Size</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-2 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {scanResult.items.map((item, idx) => (
                  <tr
                    key={item.id || idx}
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

                    <td className="py-3 px-3 min-w-36">
                      <Input
                        value={item.name}
                        onChange={(e) => handleItemFieldChange(idx, "name", e.target.value)}
                        placeholder="Product Name"
                        className="h-8 text-xs font-semibold"
                      />
                    </td>

                    <td className="py-3 px-3 min-w-28">
                      <Input
                        value={item.brand || ""}
                        onChange={(e) => handleItemFieldChange(idx, "brand", e.target.value)}
                        placeholder="Brand or null"
                        className="h-8 text-xs text-stone-600"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={item.category}
                        onChange={(e) => handleItemFieldChange(idx, "category", e.target.value)}
                        className="h-8 rounded-lg border border-stone-200 px-2 text-xs bg-white text-stone-800 focus:ring-1 focus:ring-emerald-600"
                      >
                        {GROCERY_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemFieldChange(idx, "quantity", Number(e.target.value))
                          }
                          className="h-8 w-16 text-xs"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemFieldChange(idx, "unit", e.target.value)}
                          className="h-8 rounded-lg border border-stone-200 px-1.5 text-xs bg-white text-stone-800"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="py-3 px-3 min-w-24">
                      <Input
                        value={item.packageSize || ""}
                        onChange={(e) => handleItemFieldChange(idx, "packageSize", e.target.value)}
                        placeholder="e.g. 1 gal, 500g"
                        className="h-8 text-xs"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-xs font-mono font-semibold text-emerald-700">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </td>

                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded text-stone-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={handleTriggerScan} className="text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Recognition
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleSaveConfirmedToInventory}
                isLoading={isSaving}
                className="w-full sm:w-auto font-bold text-xs px-6"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm &amp; Update Inventory (
                {scanResult.items.filter((i) => i.selected).length} items)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
