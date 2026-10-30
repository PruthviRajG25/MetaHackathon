"use client";

import { useState, useRef } from "react";
import {
  ScanLine,
  UploadCloud,
  Sparkles,
  AlertTriangle,
  Copy,
  Eye,
  CheckCircle2,
  RefreshCw,
  Plus,
  ShieldCheck,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DetectedPantryItem } from "@/types";

export default function PantryIntelligencePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pantryImage, setPantryImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pantryData, setPantryData] = useState<{
    sceneSummary: string;
    detectedItems: DetectedPantryItem[];
    recommendations: string[];
    sourceModel: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingStockItem, setUpdatingStockItem] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPantryImage(reader.result as string);
      setPantryData(null);
      setErrorMessage("");
    };
    reader.readAsDataURL(file);
  };

  const handleUseDemoPantry = () => {
    const samplePantry = "/images/sample-pantry.svg";
    setPantryImage(samplePantry);
    setPantryData(null);
    setErrorMessage("");
  };

  const handleAnalyzePantry = async () => {
    if (!pantryImage) return;
    setIsAnalyzing(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/ai/pantry-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: pantryImage.startsWith("data:") ? pantryImage : undefined,
          imageUrl: !pantryImage.startsWith("data:") ? pantryImage : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pantry analysis failed");

      setPantryData(data.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze pantry image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickSyncToInventory = async (item: DetectedPantryItem) => {
    setUpdatingStockItem(item.id);
    try {
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          brand: item.brand || null,
          category: item.category,
          quantity: item.estimatedCount,
          unit: "items",
          minThreshold: 1,
          source: "pantry_scan",
        }),
      });
      // Toggle local confirmation
      if (pantryData) {
        const updated = pantryData.detectedItems.map((i) =>
          i.id === item.id ? { ...i, selected: false } : i
        );
        setPantryData({ ...pantryData, detectedItems: updated });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStockItem(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
          Meta SAM 3.1 Object Segmentation + Muse Spark
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          Visual Pantry &amp; Shelf Intelligence
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Take a wide photo of your refrigerator, cupboard, or pantry shelves. Meta SAM 3.1
          segments visual object instances, identifies duplicate purchases, and flags opaque jars for manual checking.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {errorMessage}
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
              <ScanLine className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-stone-800">Select or Drag Pantry Shelf Photo</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              Capture shelves, spice racks, fridge doors, or pantry organization bins.
            </p>
            <Button size="sm" variant="outline" className="mt-4 pointer-events-none text-xs">
              Choose Shelf Photo
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>Don&apos;t have a shelf photo?</span>
            <button
              onClick={handleUseDemoPantry}
              className="text-emerald-700 font-semibold hover:underline"
            >
              Load Sample Pantry Shelf &rarr;
            </button>
          </div>
        </div>

        {/* Spatial Segmentation Preview Canvas */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Spatial Perception View
            </h3>

            {pantryImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-video bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pantryImage}
                  alt="Pantry view"
                  className="w-full h-full object-cover"
                />

                {/* Render SAM 3.1 Bounding Overlays */}
                {pantryData?.detectedItems.map((item, idx) => {
                  if (!item.boundingBox) return null;
                  const [ymin, xmin, ymax, xmax] = item.boundingBox;
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        top: `${ymin}%`,
                        left: `${xmin}%`,
                        width: `${xmax - xmin}%`,
                        height: `${ymax - ymin}%`,
                      }}
                      className="absolute border-2 border-emerald-500 bg-emerald-500/20 rounded-md transition-all pointer-events-none"
                    >
                      <span className="absolute -top-5 left-0 text-[9px] font-bold bg-emerald-900 text-white px-1.5 py-0.5 rounded shadow">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-100 aspect-video bg-stone-50 flex flex-col items-center justify-center text-stone-400 text-xs">
                <ScanLine className="h-8 w-8 mb-2 text-stone-300" />
                Upload shelf photo to view segmentation
              </div>
            )}
          </div>

          <div className="pt-6 space-y-3">
            <Button
              onClick={handleAnalyzePantry}
              disabled={!pantryImage || isAnalyzing}
              isLoading={isAnalyzing}
              className="w-full h-12 text-sm font-bold shadow-md shadow-emerald-700/20"
            >
              <Sparkles className="h-4 w-4" />
              {isAnalyzing
                ? "Meta SAM 3.1 is Segmenting Objects..."
                : "Analyze Pantry Scene & Objects"}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Respects privacy: processes images securely server-side.
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Insights & Detected Items */}
      {pantryData && (
        <div className="space-y-6">
          {/* Scene Summary and Recommendations Card */}
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-700" />
                Scene Analysis &amp; Household Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                {pantryData.sceneSummary}
              </p>

              {pantryData.recommendations.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Actionable Insights:
                  </span>
                  {pantryData.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detected Objects Grid */}
          <div>
            <h2 className="text-base font-bold text-stone-900 mb-3">
              Identified Shelf Objects (Meta SAM 3.1)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pantryData.detectedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-xs text-stone-900 leading-tight">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-mono font-semibold text-emerald-700">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-400 mt-1">
                      {item.brand ? item.brand : "Unspecified Brand"} • {item.category}
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {item.isDuplicate && (
                        <Badge variant="warning" className="text-[10px] py-0 px-1.5">
                          <Copy className="h-2.5 w-2.5 mr-1" /> Duplicate ({item.estimatedCount}x)
                        </Badge>
                      )}
                      {item.needsStockCheck && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-800 border-amber-300 bg-amber-50">
                          <Eye className="h-2.5 w-2.5 mr-1" /> Check Level (Opaque)
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={item.selected ? "primary" : "secondary"}
                    onClick={() => handleQuickSyncToInventory(item)}
                    isLoading={updatingStockItem === item.id}
                    className="w-full text-xs h-8"
                  >
                    {item.selected ? (
                      <>
                        <Plus className="h-3 w-3" /> Sync to Inventory
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Synced
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
