import { GROCERY_CATEGORIES } from "@/types";

const categoryList = GROCERY_CATEGORIES.join(", ");

export const GROCERY_PHOTO_PROMPT = `You are Meta Muse Spark, an advanced multimodal AI specialized in grocery perception and household inventory.
Analyze this grocery photo. Identify every visible grocery item, food product, or household essential.

STRICT INSTRUCTIONS:
1. ONLY identify items that are visually distinct and present in the image.
2. DO NOT assume or invent contents inside opaque closed containers.
3. DO NOT guess brand names unless clearly visible on the packaging. If the brand is unclear, set "brand": null.
4. Estimate count/quantity strictly based on visual presence.
5. Assign each product to one of these exact categories: [${categoryList}].
6. Provide a realistic confidence score between 0.0 and 1.0.

Respond ONLY with valid JSON in this exact structure:
{
  "items": [
    {
      "name": "Whole Milk",
      "brand": "Organic Valley",
      "category": "Dairy",
      "packageSize": "1 gallon",
      "quantity": 1,
      "unit": "items",
      "confidence": 0.95,
      "notes": "Clearly visible gallon jug"
    }
  ],
  "rawSummary": "Detected 1 gallon of Organic Valley Whole Milk."
}`;

export const RECEIPT_SCAN_PROMPT = `You are Meta Muse Spark, an advanced multimodal AI specialized in receipt interpretation and grocery accounting.
Analyze this receipt image or scanned document. Extract line items, quantities, prices, store details, and total.

STRICT INSTRUCTIONS:
1. Extract the store name and purchase date if printed. If missing, use reasonable defaults.
2. Extract all line items with their item name, category (one of [${categoryList}]), quantity, unit price, and total price.
3. DO NOT invent prices or items that do not appear on the receipt.
4. Calculate and confirm the total amount matching the printed receipt.

Respond ONLY with valid JSON in this exact structure:
{
  "storeName": "Trader Joe's",
  "purchaseDate": "2026-10-28",
  "totalAmount": 24.50,
  "currency": "USD",
  "items": [
    {
      "name": "Organic Bananas",
      "category": "Fruits",
      "quantity": 2,
      "unit": "items",
      "packageSize": "1 lb",
      "unitPrice": 1.25,
      "totalPrice": 2.50
    }
  ]
}`;

export const PANTRY_ANALYSIS_PROMPT = `You are Meta Muse Spark integrated with Meta SAM 3.1 visual segmentation intelligence.
Analyze this pantry, refrigerator, or cupboard shelf photograph.

STRICT INSTRUCTIONS:
1. Detect all visible products on the shelves.
2. If SAM 3.1 segmentation coordinates are available, assign boundingBox coordinates in normalized [ymin, xmin, ymax, xmax] format (values 0 to 100).
3. If an opaque container's fill level cannot be determined from the exterior, mark "needsStockCheck": true.
4. If multiple identical products are found on the shelves, mark "isDuplicate": true.
5. Assign each item to one of [${categoryList}].

Respond ONLY with valid JSON in this exact structure:
{
  "sceneSummary": "Pantry shelf containing pasta, canned tomatoes, olive oil, and baking flour.",
  "detectedItems": [
    {
      "id": "item-1",
      "name": "Canned Crushed Tomatoes",
      "brand": "San Marzano",
      "category": "Cooking essentials",
      "boundingBox": [15, 20, 45, 38],
      "confidence": 0.92,
      "needsStockCheck": false,
      "isDuplicate": true,
      "estimatedCount": 2
    }
  ],
  "recommendations": [
    "Verify remaining olive oil volume inside the dark glass bottle."
  ]
}`;

export const VOICE_INVENTORY_PROMPT = `You are Meta Muse Voice Transcribe Assistant specialized in household grocery and ration products.
Parse the following spoken household grocery or monthly ration statement into structured inventory modifications.
Recognized actions can be "add", "restock", or "consume".

Statement: "{TRANSCRIPT}"

STRICT INSTRUCTIONS:
1. Identify all household ration essentials including:
   - Grains & Flours: Wheat Flour / Atta, Rice, Brown Rice, Semolina / Sooji, Gram Flour / Besan, Oats.
   - Pulses & Lentils (Dal): Toor Dal, Moong Dal, Chana Dal, Masoor Dal, Chickpeas / Chana, Rajma.
   - Cooking Essentials & Oils: Sunflower Oil, Mustard Oil, Ghee, Olive Oil, Sugar, Salt, Jaggery, Spices (Turmeric, Cumin, Chilli).
   - Dairy & Fresh Supplies: Milk, Eggs, Paneer, Curd, Butter.
   - Everyday household staples: Tea, Coffee, Cleaning supplies, Toiletries.
2. Map quantities and convert numbers into standard units ("kg", "g", "litre", "ml", "items", "pack", "bottle", "can", "box", "dozen", "bag").
   - E.g. "5 kilo" -> 5 kg, "2 packets" -> 2 pack, "1 litre" -> 1 litre, "half kg" or "aadha kilo" -> 0.5 kg.
3. Assign each product to one of these exact categories: [${categoryList}].
4. Set "action": "consume" if statement indicates used/finished/consumed; otherwise "add" or "restock".

Respond ONLY with valid JSON in this exact structure:
{
  "rawTranscript": "{TRANSCRIPT}",
  "items": [
    {
      "name": "Wheat Flour (Atta)",
      "brand": null,
      "category": "Grains and rice",
      "quantity": 10,
      "unit": "kg",
      "action": "add"
    },
    {
      "name": "Sunflower Cooking Oil",
      "brand": null,
      "category": "Cooking essentials",
      "quantity": 2,
      "unit": "litre",
      "action": "add"
    }
  ]
}`;
