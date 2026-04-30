export const DEFAULT_MODEL = "gemini-2.5-pro";
export const LIGHT_MODEL = "gemini-3.1-flash-lite-preview";

export const AI_MODEL_PROVIDERS = {
  gemini: {
    label: "Gemini",
    models: [
      {
        id: "gemini-3.1-pro-preview",
        name: "Gemini 3.1 Pro",
        description: "Most capable model",
        badge: "Pro+",
        tokenCost: 30,
      },
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        description: "Balanced capability and cost",
        badge: "Pro",
        tokenCost: 15,
      },
      {
        id: "gemini-3-flash-preview",
        name: "Gemini 3 Flash",
        description: "Balanced performance",
        badge: "Flash",
        tokenCost: 7,
      },
      {
        id: "gemini-3.1-flash-lite-preview",
        name: "Gemini 3.1 Flash Lite",
        description: "Fast and lightweight",
        badge: "Lite",
        tokenCost: 5,
      },
    ],
  },
  openai: {
    label: "OpenAI",
    models: [
      {
        id: "gpt-4",
        name: "GPT-5.5",
        description: "Most capable model",
        badge: "Pro+",
        tokenCost: 30,
      },
      {
        id: "gpt-5.4-pro",
        name: "GPT-5.4 Pro",
        description: "Balanced capability and cost",
        badge: "Pro",
        tokenCost: 15,
      },
    ],
  },
} as const;

export const AI_MODELS = Object.values(AI_MODEL_PROVIDERS).flatMap(
  (provider) => [...provider.models],
);

export type AIModelId = (typeof AI_MODELS)[number]["id"];

export const VALID_MODEL_IDS = AI_MODELS.map(
  (m) => m.id,
) as unknown as string[];

export function getModelWithProvider(modelId: string) {
  for (const provider of Object.values(AI_MODEL_PROVIDERS)) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) return { model, providerLabel: provider.label };
  }

  return {
    model: AI_MODEL_PROVIDERS.gemini.models[0],
    providerLabel: AI_MODEL_PROVIDERS.gemini.label,
  };
}

/** Look up the token cost for a model ID, defaulting to the Pro cost */
export function getModelTokenCost(modelId: string): number {
  const model = AI_MODELS.find((m) => m.id === modelId);
  return model?.tokenCost ?? AI_MODELS[0].tokenCost;
}
