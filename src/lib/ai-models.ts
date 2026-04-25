export const DEFAULT_MODEL = "gemini-3.1-pro-preview";
export const LIGHT_MODEL = "gemini-3.1-flash-lite-preview";

export const AI_MODELS = [
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    description: "Most capable model",
    badge: "Pro",
    tokenCost: 15,
  },
  {
    id: "gemini-3.1-flash-lite-preview",
    name: "Gemini 3.1 Flash Lite",
    description: "Fast and lightweight",
    badge: "Lite",
    tokenCost: 5,
  },
  {
    id: "gemini-3.0-flash",
    name: "Gemini 3 Flash",
    description: "Balanced performance",
    badge: "Flash",
    tokenCost: 7,
  },
] as const;

export type AIModelId = (typeof AI_MODELS)[number]["id"];

export const VALID_MODEL_IDS = AI_MODELS.map(
  (m) => m.id,
) as unknown as string[];

/** Look up the token cost for a model ID, defaulting to the Pro cost */
export function getModelTokenCost(modelId: string): number {
  const model = AI_MODELS.find((m) => m.id === modelId);
  return model?.tokenCost ?? AI_MODELS[0].tokenCost;
}

