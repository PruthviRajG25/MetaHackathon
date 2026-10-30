import { metaAI } from "./meta-client";
import { VOICE_INVENTORY_PROMPT } from "./prompts";
import { VoiceParsedResponseSchema } from "@/lib/validations/ai";
import { VoiceInventoryParseResult } from "@/types";

export async function parseVoiceTranscript(
  transcript: string
): Promise<VoiceInventoryParseResult> {
  const prompt = VOICE_INVENTORY_PROMPT.replace(/\{TRANSCRIPT\}/g, transcript);

  try {
    const aiResponse = await metaAI.callMetaModel(
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      VoiceParsedResponseSchema
    );

    return {
      rawTranscript: aiResponse.rawTranscript,
      items: aiResponse.items.map((i) => ({
        name: i.name,
        brand: i.brand || null,
        category: i.category as any,
        quantity: i.quantity,
        unit: i.unit as any,
        action: i.action,
      })),
    };
  } catch (error: any) {
    console.warn(`[MetaAI] Voice parse API failed (${error.message}). Running NLP rule-based parser.`);

    // Comprehensive Fallback NLP heuristic parser for Ration & Grocery products
    const lower = transcript.toLowerCase();
    const action: "add" | "restock" | "consume" =
      lower.includes("used") || lower.includes("finished") || lower.includes("consumed") || lower.includes("khatam")
        ? "consume"
        : lower.includes("bought") || lower.includes("purchased") || lower.includes("restock") || lower.includes("laya")
        ? "add"
        : "add";

    const items: VoiceInventoryParseResult["items"] = [];

    // Helper regex to extract quantity before or after product keyword
    const extractQuantity = (keywords: string[], defaultQty: number = 1, defaultUnit: any = "items") => {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          // Look for patterns like "5 kg", "2 litres", "10 kilo", "500g", "2 packs"
          const regex = new RegExp(`(?:(\\d+(?:\\.\\d+)?)\\s*(kg|kilo|kilos|g|gm|grams|litre|litres|liter|liters|l|ml|packet|packets|pack|packs|bottle|bottles|bag|bags|box|boxes|dozen)?\\s*(?:of\\s*)?)?${kw}`);
          const match = lower.match(regex);
          let qty = defaultQty;
          let unit: any = defaultUnit;

          if (match && match[1]) {
            qty = parseFloat(match[1]);
          } else if (lower.includes(`half kg ${kw}`) || lower.includes(`aadha kilo ${kw}`)) {
            qty = 0.5;
            unit = "kg";
          }

          if (match && match[2]) {
            const u = match[2];
            if (u.startsWith("kilo") || u === "kg") unit = "kg";
            else if (u.startsWith("g") || u === "gm") unit = "g";
            else if (u.startsWith("litre") || u.startsWith("liter") || u === "l") unit = "litre";
            else if (u === "ml") unit = "ml";
            else if (u.startsWith("pack")) unit = "pack";
            else if (u.startsWith("bottle")) unit = "bottle";
            else if (u.startsWith("bag")) unit = "bag";
            else if (u.startsWith("dozen")) unit = "dozen";
          }
          return { qty, unit };
        }
      }
      return null;
    };

    // Ration Staple 1: Wheat Flour / Atta
    const flourMatch = extractQuantity(["wheat flour", "atta", "flour"], 5, "kg");
    if (flourMatch) {
      items.push({
        name: "Wheat Flour (Atta)",
        brand: null,
        category: "Grains and rice",
        quantity: flourMatch.qty,
        unit: flourMatch.unit || "kg",
        action,
      });
    }

    // Ration Staple 2: Rice / Chawal
    const riceMatch = extractQuantity(["basmati rice", "white rice", "brown rice", "rice", "chawal"], 5, "kg");
    if (riceMatch) {
      items.push({
        name: "Rice (Chawal)",
        brand: null,
        category: "Grains and rice",
        quantity: riceMatch.qty,
        unit: riceMatch.unit || "kg",
        action,
      });
    }

    // Ration Staple 3: Pulses / Dal (Toor, Moong, Chana, Lentils)
    const toorDalMatch = extractQuantity(["toor dal", "tuvar dal", "arhar dal"], 2, "kg");
    if (toorDalMatch) {
      items.push({
        name: "Toor Dal (Arhar)",
        brand: null,
        category: "Grains and rice",
        quantity: toorDalMatch.qty,
        unit: toorDalMatch.unit || "kg",
        action,
      });
    }

    const moongDalMatch = extractQuantity(["moong dal", "mung dal", "chana dal", "masoor dal", "dal", "lentils"], 1, "kg");
    if (moongDalMatch && !toorDalMatch) {
      items.push({
        name: "Pulses / Dal",
        brand: null,
        category: "Grains and rice",
        quantity: moongDalMatch.qty,
        unit: moongDalMatch.unit || "kg",
        action,
      });
    }

    // Ration Staple 4: Cooking Oil / Ghee
    const oilMatch = extractQuantity(["sunflower oil", "mustard oil", "cooking oil", "vegetable oil", "olive oil", "oil", "tel"], 2, "litre");
    if (oilMatch) {
      items.push({
        name: "Cooking Oil",
        brand: null,
        category: "Cooking essentials",
        quantity: oilMatch.qty,
        unit: oilMatch.unit || "litre",
        action,
      });
    }

    const gheeMatch = extractQuantity(["desi ghee", "ghee"], 1, "kg");
    if (gheeMatch) {
      items.push({
        name: "Desi Ghee",
        brand: null,
        category: "Cooking essentials",
        quantity: gheeMatch.qty,
        unit: gheeMatch.unit || "kg",
        action,
      });
    }

    // Ration Staple 5: Sugar / Cheeni
    const sugarMatch = extractQuantity(["sugar", "cheeni", "jaggery", "gur"], 2, "kg");
    if (sugarMatch) {
      items.push({
        name: "Sugar (Cheeni)",
        brand: null,
        category: "Cooking essentials",
        quantity: sugarMatch.qty,
        unit: sugarMatch.unit || "kg",
        action,
      });
    }

    // Ration Staple 6: Salt / Namak
    const saltMatch = extractQuantity(["iodized salt", "rock salt", "salt", "namak"], 1, "pack");
    if (saltMatch) {
      items.push({
        name: "Iodized Table Salt",
        brand: null,
        category: "Cooking essentials",
        quantity: saltMatch.qty,
        unit: saltMatch.unit || "pack",
        action,
      });
    }

    // Ration Staple 7: Tea / Chai / Coffee
    const teaMatch = extractQuantity(["tea leaves", "tea powder", "chai patti", "tea", "coffee"], 0.5, "kg");
    if (teaMatch) {
      items.push({
        name: "Tea Leaves (Chai)",
        brand: null,
        category: "Beverages",
        quantity: teaMatch.qty,
        unit: teaMatch.unit || "g",
        action,
      });
    }

    // Dairy & Fresh Provisions: Milk, Eggs, Paneer
    const milkMatch = extractQuantity(["fresh milk", "whole milk", "milk", "doodh"], 2, "litre");
    if (milkMatch) {
      items.push({
        name: "Fresh Milk",
        brand: null,
        category: "Dairy",
        quantity: milkMatch.qty,
        unit: milkMatch.unit || "litre",
        action,
      });
    }

    const eggMatch = extractQuantity(["eggs", "egg", "ande"], 12, "items");
    if (eggMatch) {
      items.push({
        name: "Eggs",
        brand: null,
        category: "Dairy",
        quantity: eggMatch.qty,
        unit: eggMatch.unit || "items",
        action,
      });
    }

    // Fallback if none matched
    if (items.length === 0) {
      items.push({
        name: transcript.slice(0, 35),
        brand: null,
        category: "Other",
        quantity: 1,
        unit: "items",
        action,
      });
    }

    return {
      rawTranscript: transcript,
      items,
    };
  }
}
