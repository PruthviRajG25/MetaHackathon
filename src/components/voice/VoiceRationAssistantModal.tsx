"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  Trash2,
  Plus,
  Radio,
  RotateCcw,
  Sliders,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GROCERY_CATEGORIES, UNITS, GroceryCategory, UnitType } from "@/types";

interface VoiceRationItem {
  name: string;
  brand: string | null;
  category: GroceryCategory;
  quantity: number;
  unit: UnitType;
  action: "add" | "restock" | "consume";
}

interface VoiceRationAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  autoStartMicrophone?: boolean;
}

export function VoiceRationAssistantModal({
  isOpen,
  onClose,
  onSuccess,
  autoStartMicrophone = false,
}: VoiceRationAssistantModalProps) {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedItems, setParsedItems] = useState<VoiceRationItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSpeechSupported(false);
      }
    }
  }, []);

  // Auto-start microphone if requested upon opening
  useEffect(() => {
    if (isOpen && autoStartMicrophone && !isRecording && isSpeechSupported) {
      startListening();
    }
  }, [isOpen, autoStartMicrophone, isSpeechSupported]);

  // Clean up recognition on unmount or close
  useEffect(() => {
    if (!isOpen && isRecording) {
      stopListening();
    }
  }, [isOpen]);

  const startListening = () => {
    setErrorMessage("");
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Microphone recognition is not supported in this browser. Please type your ration items.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + " ";
        }
        setTranscript(currentTranscript.trim());
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone permission was denied. Please allow microphone access in your browser bar.");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleMic = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleParseVoice = async (textToParse?: string) => {
    const statement = textToParse || transcript;
    if (!statement.trim()) {
      setErrorMessage("Please speak or enter a ration statement first.");
      return;
    }

    if (isRecording) {
      stopListening();
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/ai/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: statement }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse voice statement");

      setParsedItems(data.data.items);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse voice statements.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateItemField = (index: number, field: keyof VoiceRationItem, value: any) => {
    if (!parsedItems) return;
    const updated = [...parsedItems];
    updated[index] = { ...updated[index], [field]: value };
    setParsedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (!parsedItems) return;
    setParsedItems(parsedItems.filter((_, i) => i !== index));
  };

  const handleAddNewItem = () => {
    if (!parsedItems) return;
    setParsedItems([
      ...parsedItems,
      {
        name: "New Ration Item",
        brand: null,
        category: "Grains and rice",
        quantity: 1,
        unit: "kg",
        action: "add",
      },
    ]);
  };

  const handleConfirmAndSave = async () => {
    if (!parsedItems || parsedItems.length === 0) return;
    setIsSaving(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: parsedItems.map((i) => ({
            name: i.name,
            brand: i.brand,
            category: i.category,
            quantity: Number(i.quantity) || 1,
            unit: i.unit,
            minThreshold: 1,
            source: "voice",
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to commit items to inventory.");

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to commit items to inventory.");
    } finally {
      setIsSaving(false);
    }
  };

  const setSampleTranscriptAndParse = (sampleText: string) => {
    setTranscript(sampleText);
    setParsedItems(null);
    setErrorMessage("");
    handleParseVoice(sampleText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200/80 my-6 animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Glow ambient background aura */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-stone-900">
                  Voice Ration Assistant
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Meta Voice AI
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Speak your monthly grocery staples, pulses, flours, and ration items.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Centerpiece Interactive Microphone Hero */}
        <div className="relative my-6 py-6 px-4 rounded-3xl bg-gradient-to-b from-stone-50 via-emerald-50/20 to-teal-50/30 border border-stone-200/80 text-center flex flex-col items-center justify-center">
          {/* Animated concentric pulse waves when recording */}
          <div className="relative mb-4">
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="absolute -inset-3 rounded-full bg-teal-500/20 animate-pulse" />
              </>
            )}

            {/* Main Interactive Mic Button */}
            <button
              type="button"
              onClick={handleToggleMic}
              className={`relative z-10 h-20 w-20 sm:h-24 sm:w-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer ${
                isRecording
                  ? "bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 text-white scale-105 shadow-rose-500/40 ring-8 ring-rose-400/30"
                  : "bg-gradient-to-tr from-emerald-600 via-emerald-700 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:scale-105 shadow-emerald-700/30 ring-8 ring-emerald-400/20 hover:ring-emerald-400/40"
              }`}
              title={isRecording ? "Click to stop microphone" : "Click to activate microphone and speak"}
            >
              {isRecording ? (
                <MicOff className="h-9 w-9 sm:h-10 sm:w-10 animate-pulse" />
              ) : (
                <Mic className="h-9 w-9 sm:h-10 sm:w-10" />
              )}
            </button>
          </div>

          {/* Dynamic Voice Status Heading */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isRecording ? "bg-rose-500 animate-ping" : "bg-emerald-500"
                }`}
              />
              <span className="text-sm font-extrabold text-stone-900">
                {isRecording
                  ? "Listening to your voice..."
                  : "Click the Microphone to Activate Voice"}
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {isRecording
                ? "Speak items freely: e.g. '10 kg atta, 5 kg basmati rice, 2 kg toor dal, 1 litre oil...'"
                : "Tap the mic icon above and speak your grocery or monthly ration supplies"}
            </p>
          </div>

          {/* Equalizer Waveform Bars when recording */}
          {isRecording && (
            <div className="mt-4 flex items-center justify-center gap-1.5 h-10">
              <span className="w-1.5 bg-emerald-500 rounded-full animate-voice-wave-1" />
              <span className="w-1.5 bg-teal-500 rounded-full animate-voice-wave-2" />
              <span className="w-1.5 bg-cyan-500 rounded-full animate-voice-wave-3" />
              <span className="w-1.5 bg-emerald-400 rounded-full animate-voice-wave-4" />
              <span className="w-1.5 bg-teal-400 rounded-full animate-voice-wave-5" />
              <span className="w-1.5 bg-cyan-400 rounded-full animate-voice-wave-6" />
              <span className="w-1.5 bg-emerald-500 rounded-full animate-voice-wave-7" />
              <span className="w-1.5 bg-teal-500 rounded-full animate-voice-wave-8" />
            </div>
          )}
        </div>

        {/* Live Transcript Display Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
              Live Spoken Transcript
            </label>
            {transcript && (
              <button
                type="button"
                onClick={() => setTranscript("")}
                className="text-[11px] text-stone-400 hover:text-stone-700 underline"
              >
                Clear text
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="Your spoken words will appear here in real-time, or you can type directly..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white placeholder:text-stone-400 shadow-sm"
            />
          </div>
        </div>

        {/* Quick-Click Ration Prompts */}
        <div className="mt-4 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Or Click a Quick Ration Preset:
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                setSampleTranscriptAndParse(
                  "I bought 10 kg wheat flour, 5 kg basmati rice, 2 kg sugar, and 2 litres sunflower oil"
                )
              }
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 text-[11px] font-semibold transition-all hover:scale-[1.02] flex items-center gap-1.5"
            >
              <span>🌾</span>
              <span>Monthly Ration (10kg Atta, 5kg Rice, 2L Oil)</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setSampleTranscriptAndParse(
                  "Restocked 2 kg toor dal, 1 kg chana dal, 1 kg table salt, and 500 grams tea leaves"
                )
              }
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 text-[11px] font-semibold transition-all hover:scale-[1.02] flex items-center gap-1.5"
            >
              <span>🫘</span>
              <span>Pulses &amp; Spices (Toor Dal, Salt, Tea)</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setSampleTranscriptAndParse(
                  "Used 1 litre cooking oil and finished 2 kg sugar"
                )
              }
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-[11px] font-semibold transition-all hover:scale-[1.02] flex items-center gap-1.5"
            >
              <span>🍳</span>
              <span>Consumption (Used 1L Oil, 2kg Sugar)</span>
            </button>
          </div>
        </div>

        {/* Parse Action Button */}
        <div className="mt-5">
          <Button
            onClick={() => handleParseVoice()}
            isLoading={isProcessing}
            disabled={!transcript.trim() || isProcessing}
            className="w-full h-12 text-sm font-bold shadow-md shadow-emerald-700/20 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800"
          >
            <Sparkles className="h-4 w-4" />
            {isProcessing ? "Meta Voice AI is Parsing Products..." : "Parse Ration Products with Meta AI"}
          </Button>
        </div>

        {/* Parsed Ration Items Table for Confirmation */}
        {parsedItems && (
          <div className="mt-6 pt-5 border-t border-stone-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  Identified Ration Items ({parsedItems.length})
                </h3>
                <p className="text-[11px] text-stone-500">
                  Verify extracted quantities and units before saving to household inventory.
                </p>
              </div>

              <Button size="sm" variant="outline" onClick={handleAddNewItem} className="text-xs h-8">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] tracking-wider font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-2 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {parsedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-2.5 px-3 min-w-36">
                        <Input
                          value={item.name}
                          onChange={(e) => handleUpdateItemField(idx, "name", e.target.value)}
                          className="h-8 text-xs font-bold"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItemField(idx, "category", e.target.value)}
                          className="h-8 rounded-xl border border-stone-200 px-2 text-xs bg-white text-stone-800"
                        >
                          {GROCERY_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2.5 px-3">
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItemField(idx, "quantity", Number(e.target.value))
                          }
                          className="h-8 w-16 text-xs font-semibold"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <select
                          value={item.unit}
                          onChange={(e) => handleUpdateItemField(idx, "unit", e.target.value)}
                          className="h-8 rounded-xl border border-stone-200 px-2 text-xs bg-white text-stone-800 font-medium"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2.5 px-3">
                        <Badge
                          variant={item.action === "consume" ? "warning" : "success"}
                          className="text-[10px]"
                        >
                          {item.action === "consume" ? "Consume" : "Restock"}
                        </Badge>
                      </td>

                      <td className="py-2.5 px-2 text-right">
                        <button
                          type="button"
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

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setParsedItems(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAndSave}
                isLoading={isSaving}
                size="sm"
                className="font-bold text-xs px-6 shadow-sm shadow-emerald-700/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm &amp; Update Inventory ({parsedItems.length} items)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
