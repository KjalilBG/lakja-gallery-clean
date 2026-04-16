import { FinanceOwner, FinanceTransactionStatus, FinanceTransactionType } from "@prisma/client";

type ClaudeSuggestion = {
  owner?: FinanceOwner;
  type?: FinanceTransactionType;
  category?: string;
  description?: string;
  alias?: string;
  memoryNote?: string;
  confidence?: string;
  status?: FinanceTransactionStatus;
};

function hasAnthropicConfig() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export async function suggestFinanceClassification(input: {
  rawMessage: string;
  draft: {
    owner: FinanceOwner;
    type: FinanceTransactionType;
    category: string;
    description: string;
    alias?: string;
    memoryNote?: string;
    confidence: string;
    status: FinanceTransactionStatus;
  };
  memoryRules: Array<{ alias: string; category: string; type: FinanceTransactionType; owner: FinanceOwner | null; notes: string | null }>;
  availableCategories?: Array<{ label: string; owner: FinanceOwner | null }>;
}) {
  if (!hasAnthropicConfig()) return null;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      max_tokens: 300,
      system:
        "Eres un clasificador financiero. Devuelve JSON puro con owner, type, category, description, alias, memoryNote, confidence, status. Usa owner in [LAKJA,KJALIL,KK], type in [INCOME,EXPENSE,SPECIAL,HONORARIOS_KJALIL,HONORARIOS_TERCEROS], status in [CONFIRMED,NEEDS_REVIEW]. No inventes montos. Si recibes availableCategories, usa una de esas categorías y no inventes otra. Si la evidencia no es sólida, mantén NEEDS_REVIEW.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  rawMessage: input.rawMessage,
                  currentDraft: input.draft,
                  memoryRules: input.memoryRules.slice(0, 20),
                  availableCategories: input.availableCategories?.slice(0, 50)
                },
                null,
                2
              )
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) return null;

  const data = await response.json();
  const text = data?.content?.find?.((item: { type?: string }) => item.type === "text")?.text;
  if (!text) return null;

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]) as ClaudeSuggestion;
  } catch {
    return null;
  }
}
