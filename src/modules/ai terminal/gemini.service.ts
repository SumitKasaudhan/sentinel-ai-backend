import env from "../../config/env";

const GEMINI_MODEL = env.GEMINI_MODEL || "gemini-2.0-flash";

export const askGemini = async (
  systemPrompt: string,
  userMessage: string
): Promise<string> => {
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "AI engine is not configured. GEMINI_API_KEY missing."
    );
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n---\nDATA:\n${userMessage}` }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error("GEMINI API ERROR:", res.status, errText);
    throw new Error(`AI engine error (${res.status})`);
  }

  const data = await res.json();

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: any) => p.text)
    ?.join("\n");

  if (!text) throw new Error("AI engine returned an empty response");

  return text.trim();
};