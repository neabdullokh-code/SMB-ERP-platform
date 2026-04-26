import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatBody = { messages: ChatMessage[]; context?: unknown; locale?: "ru" | "en" };

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

function buildSystemPrompt(locale: string | undefined, context: unknown) {
  const ctx = context && typeof context === "object" ? context : {};

  if (locale === "ru" || !locale) {
    return [
      "Ты — SQB Bank Copilot, ИИ-ассистент для сотрудников банка СКБ внутри платформы SQB Business OS.",
      "Текущий пользователь — кредитный офицер, менеджер по рискам или руководитель банковского подразделения.",
      "У тебя есть доступ только для чтения к актуальным данным портфеля банка, прикреплённым ниже в виде JSON под BANK_CONTEXT.",
      "",
      "Правила ответа:",
      "- Всегда отвечай на русском языке.",
      "- Будь кратким. Начинай с вывода в 1–2 предложениях, затем добавляй конкретику с цифрами.",
      '- Все суммы в UZS. Миллиарды — "2,4 млрд сум", миллионы — "86,4 млн сум". Не используй $.',
      "- Ссылайся на конкретных клиентов (tenantName), отрасли, регионы и ID заявок из BANK_CONTEXT.",
      "- Для кредитных решений опирайся на кредитный рейтинг (creditScore), рекомендацию ИИ (recommendedAction/aiRec) и факторы риска из BANK_CONTEXT.",
      "- Если данных недостаточно, скажи какие именно нужны и где в системе их найти (Портфель, Очередь заявок, Алерты, Аналитика).",
      '- Никогда не выдумывай клиентов, суммы или ID. Если данных нет — скажи: «Этого нет в текущем контексте портфеля.»',
      "- Не выводи сырой JSON. Отвечай прозой с короткими маркированными списками.",
      "- Никогда не упоминай технические UUID и системные идентификаторы (формат 00000000-0000-...). Используй только читаемые названия: имена клиентов, номера заявок (LA-XXXX), названия отраслей.",
      "- Markdown отображается в интерфейсе: используй **жирный** для ключевых цифр и выводов, * для маркированных списков.",
      "- Держи ответ в пределах ~250 слов, если пользователь не просит подробнее.",
      "",
      "BANK_CONTEXT:",
      JSON.stringify(ctx, null, 2),
    ].join("\n");
  }

  return [
    "You are SQB Bank Copilot, an AI assistant for SQB bank staff inside the SQB Business OS platform.",
    "The current user is a credit officer, risk manager, or bank department head.",
    "You have read-only access to the bank's live portfolio data, attached below as JSON under BANK_CONTEXT.",
    "",
    "Answering rules:",
    "- Always respond in English.",
    "- Be concise. Lead with the finding in 1–2 sentences, then add specifics with numbers.",
    '- All money is in UZS. Billions as "2.4B UZS", millions as "86.4M UZS". Never use $.',
    "- Reference specific tenants (tenantName), industries, regions, and application IDs from BANK_CONTEXT.",
    "- For credit decisions, cite the credit score, AI recommendation (recommendedAction/aiRec), and risk factors from BANK_CONTEXT.",
    "- If data is insufficient, say what's needed and where to find it (Portfolio, Credit Queue, Alerts, Analytics).",
    '- Never invent tenants, amounts, or IDs. If data is missing, say "That is not in the current portfolio context."',
    "- Do not output raw JSON. Use plain prose with short bullet points.",
    "- Never mention raw UUIDs or technical system identifiers (format 00000000-0000-...). Use only human-readable names: tenant names, application IDs (LA-XXXX), industry names.",
    "- Markdown renders in the UI: use **bold** for key numbers and findings, * for bullet lists.",
    "- Keep replies under ~250 words unless the user asks for more depth.",
    "",
    "BANK_CONTEXT:",
    JSON.stringify(ctx, null, 2),
  ].join("\n");
}

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
      { message: "Copilot не настроен. Добавьте GEMINI_API_KEY или OPENROUTER_API_KEY в корневой .env файл." },
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

    let streamResult: Awaited<ReturnType<typeof chat.sendMessageStream>>;
    try {
      streamResult = await chat.sendMessageStream(last.content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return upstreamError(`Gemini error: ${msg}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
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

  // ── OpenRouter ───────────────────────────────────────────────────────────────
  const orMessages = [
    { role: "system", content: systemPrompt },
    ...body.messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://sqb.uz",
      "X-Title": "SQB Bank Copilot",
    },
    body: JSON.stringify({ model: cfg.model, messages: orMessages, stream: true }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return upstreamError(`OpenRouter ${res.status}: ${detail}`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") { controller.close(); return; }
            try {
              const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            } catch { /* skip malformed chunk */ }
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
