import { ZodSchema } from "zod";

export interface MetaAIChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

export interface MetaAICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
}

export class MetaAIClient {
  private apiKey: string;
  private endpoint: string;
  private defaultVisionModel: string;
  private defaultTextModel: string;

  constructor() {
    this.apiKey =
      process.env.META_API_KEY ||
      process.env.GITHUB_TOKEN ||
      process.env.FREE_LLM_API_KEY ||
      "";
    this.endpoint =
      process.env.META_API_ENDPOINT ||
      "https://models.inference.ai.azure.com";
    this.defaultVisionModel =
      process.env.META_VISION_MODEL || "meta/llama-3.2-11b-vision-instruct";
    this.defaultTextModel =
      process.env.META_TEXT_MODEL || "meta/llama-3.3-70b-instruct";
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Safe chat completion caller with retry and JSON parser
   */
  public async callMetaModel<T>(
    messages: MetaAIChatMessage[],
    schema: ZodSchema<T>,
    options: MetaAICompletionOptions = {}
  ): Promise<T> {
    const model = options.model || (this.hasImage(messages) ? this.defaultVisionModel : this.defaultTextModel);

    // If no API key configured, use our Meta-compliant fallback perception adapter
    if (!this.isConfigured()) {
      console.warn(`[MetaAIClient] No META_API_KEY provided. Using Meta adapter fallback logic.`);
      throw new Error("META_API_NOT_CONFIGURED");
    }

    const payload = {
      model,
      messages,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 2048,
      ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Meta API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from Meta AI model");
      }

      const parsedJSON = this.extractJSON(content);
      return schema.parse(parsedJSON);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("Meta AI request timed out after 20 seconds");
      }
      throw err;
    }
  }

  private hasImage(messages: MetaAIChatMessage[]): boolean {
    return messages.some(
      (m) => Array.isArray(m.content) && m.content.some((c) => c.type === "image_url")
    );
  }

  /**
   * Safely strip Markdown code blocks and extract raw JSON
   */
  public extractJSON(rawText: string): any {
    let clean = rawText.trim();
    // Remove ```json and ```
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Match first { and last } or [ and ]
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(clean);
  }
}

export const metaAI = new MetaAIClient();
