import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatBody = { messages: ChatMessage[]; context?: unknown; locale?: "en" | "ru" | "uz" };

// ── Provider resolution ────────────────────────────────────────────────────────
// Set AI_PROVIDER=gemini or AI_PROVIDER=openrouter in root .env.
// If omitted, auto-detected from whichever key is present.
// Set AI_MODEL to override the default model for either provider.

type ProviderConfig = { provider: "gemini" | "openrouter"; model: string; apiKey: string };

function resolveProvider(): ProviderConfig | null {
  const explicit = (process.env.AI_PROVIDER ?? "").toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;
  const modelOverride = process.env.AI_MODEL;

  if (explicit === "openrouter" || (!explicit && !geminiKey && orKey)) {
    if (!orKey) return null;
    return { provider: "openrouter", model: modelOverride || "google/gemini-2.0-flash-exp:free", apiKey: orKey };
  }
  if (explicit === "gemini" || (!explicit && geminiKey)) {
    if (!geminiKey) return null;
    return { provider: "gemini", model: modelOverride || "gemini-2.0-flash", apiKey: geminiKey };
  }
  return null;
}

// ── System prompt ──────────────────────────────────────────────────────────────

function languageName(locale: string | undefined) {
  if (locale === "ru") return "Russian";
  if (locale === "uz") return "Uzbek (Latin script)";
  return "English";
}

function buildSystemPrompt(locale: string | undefined, context: unknown) {
  const lang = languageName(locale);
  const ctx = context && typeof context === "object" ? context : {};
  return [
    "You are SQB Copilot, an AI assistant inside SQB Business OS — an ERP platform for Uzbek SMB owners.",
    "The current user is a small/medium business owner or staff member viewing their company workspace.",
    "You have read-only access to their live ERP data, attached below as JSON under ERP_CONTEXT.",
    "",
    "Answering rules:",
    `- Always respond in ${lang}.`,
    "- Be concise. Lead with the answer in 1–2 sentences. Then add specifics with numbers and references.",
    '- All money is in UZS. Format millions as e.g. "86.4M UZS" and exact amounts with non-breaking thousands like "1 240 000 UZS". Never use $.',
    "- When citing data, name the specific SKU, invoice number, customer, vendor, or month from ERP_CONTEXT.",
    "- If the question requires data not in ERP_CONTEXT, say what you would need and where in the app the user can find it (Inventory, Cash flow, Bills, Credit & Financing).",
    '- Never invent SKUs, customers, invoice IDs, or amounts. If unsure, say "I don\'t see that in your ERP yet."',
    "- For financing or loan questions, cite the user's pre-qualified amount and credit score from ERP_CONTEXT when relevant.",
    "- Do not produce raw JSON in your reply unless the user explicitly asks for it. Use plain prose with short bullet points where helpful.",
    "- Keep replies under ~250 words unless the user asks for more depth.",
    "",
    "ERP_CONTEXT:",
    JSON.stringify(ctx, null, 2),
  ].join("\n");
}

// ── Route handler ──────────────────────────────────────────────────────────────

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

function upstreamError(message: string) {
  return NextResponse.json({ message }, { status: 502 });
}

export async function POST(request: Request) {
  const cfg = resolveProvider();
  if (!cfg) {
    return NextResponse.json(
      {
        message:
          "Copilot is not configured. Add GEMINI_API_KEY or OPENROUTER_API_KEY (and optionally AI_PROVIDER, AI_MODEL) to the root .env file.",
      },
      { status: 503 },
    );
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return badRequest("Invalid JSON.");
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return badRequest("`messages` must be a non-empty array.");
  }
  const last = body.messages[body.messages.length - 1];
  if (!last || last.role !== "user" || typeof last.content !== "string" || !last.content.trim()) {
    return badRequest("Last message must be a non-empty user message.");
  }

  const systemPrompt = buildSystemPrompt(body.locale, body.context);
  const encoder = new TextEncoder();

  // ── Gemini ──────────────────────────────────────────────────────────────────
  if (cfg.provider === "gemini") {
    const genAi = new GoogleGenerativeAI(cfg.apiKey);
    const genModel = genAi.getGenerativeModel({ model: cfg.model, systemInstruction: systemPrompt });
    const history = body.messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const chat = genModel.startChat({ history });

    // Eagerly start the request so quota/auth errors surface before we open the stream.
    let geminiResult;
    try {
      geminiResult = await chat.sendMessageStream(last.content);
    } catch (err) {
      return upstreamError(`Gemini error: ${err instanceof Error ? err.message : String(err)}`);
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of geminiResult.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ── OpenRouter (OpenAI-compatible SSE) ───────────────────────────────────────
  const allMessages = [
    { role: "system", content: systemPrompt },
    ...body.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let orRes: Response;
  try {
    orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SQB Business OS Copilot",
      },
      body: JSON.stringify({ model: cfg.model, stream: true, messages: allMessages }),
    });
  } catch (err) {
    return upstreamError(`OpenRouter network error: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!orRes.ok || !orRes.body) {
    const errText = await orRes.text().catch(() => orRes.statusText);
    let detail = errText;
    try {
      const parsed = JSON.parse(errText) as { error?: { message?: string } };
      detail = parsed.error?.message ?? errText;
    } catch {
      /* raw text is fine */
    }
    return upstreamError(`OpenRouter ${orRes.status}: ${detail}`);
  }

  const orBody = orRes.body;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = orBody.getReader();
      const dec = new TextDecoder();
      let buf = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            } catch {
              /* skip malformed SSE chunk */
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
