# D5 — AI Copilot Implementation Plan (SMB Surface)

## Context

The SMB surface of SQB Business OS already has a polished Copilot UI, but it is fully mocked: the chat thread is hardcoded localization data, no LLM is called, no history is persisted, and the floating "Ask Copilot" entry point exists only on the Dashboard. Other SMB pages (Inventory, Production, Services, Ledger, Invoices, Bills, Cash Flow, Reports, Credit & Financing) have no entry point at all.

This plan turns the Copilot into a real, usable assistant for the SMB owner role:

- **Real LLM responses** grounded in the user's ERP data (mock data feeds the model today; same shape will work when real APIs land).
- **Multi-thread chat** with creation, switching, and persistence across reloads.
- **Universal entry point** via a shared floating button on every SMB page except the Copilot itself.
- **Proper branding** — the model footer reads "SQB AI" instead of "Haiku 4.5".

Scope is **SMB roles only** (owner, company_admin, manager, operator). Bank surface is explicitly out of scope.

## Decisions (confirmed with user)

| Decision | Choice |
|---|---|
| LLM provider | **Gemini 2.0 Flash** via `@google/generative-ai` SDK |
| Backend host | **Next.js API route** in `apps/company-portal/app/api/copilot/` (thin BFF) |
| Persistence | **localStorage** keyed per tenant; no DB schema |

## Architecture

```
┌──────────────────────────────────────────────┐
│ Prototype (apps/company-portal/public/...)   │
│                                              │
│  smb-hero.jsx (Copilot page)                 │
│   ├─ Sidebar: thread list (from localStorage)│
│   ├─ Composer: real input → POST /api/copilot│
│   └─ Stream renderer: token-by-token         │
│                                              │
│  kit.jsx                                     │
│   └─ AskCopilotFAB (shared floating button)  │
│                                              │
│  smb-rest.jsx, smb-inventory.jsx,            │
│  smb-credit.jsx                              │
│   └─ render <AskCopilotFAB/> on every page   │
│                                              │
│  data.jsx (mock fixtures)                    │
│   └─ buildCopilotContext() helper            │
└────────────────────┬─────────────────────────┘
                     │ POST /api/copilot/chat
                     │ { messages, context, locale }
                     ▼
┌──────────────────────────────────────────────┐
│ Next.js API route (company-portal)           │
│  app/api/copilot/chat/route.ts               │
│   ├─ validate session cookie (existing util) │
│   ├─ build system prompt (locale-aware)      │
│   ├─ call Gemini 2.0 Flash (streaming)       │
│   └─ return ReadableStream / SSE             │
└──────────────────────────────────────────────┘
```

## Frontend Changes (Prototype JSX)

### 1. Shared `AskCopilotFAB` component → `kit.jsx`

Add a small component to `apps/company-portal/public/prototype/src/kit.jsx` (next to the existing icon set / Button):

```jsx
window.AskCopilotFAB = function AskCopilotFAB({ go, label = "Ask Copilot", target = "/smb/copilot" }) {
  return (
    <button
      onClick={() => go(target)}
      style={{ position:"fixed", right:24, bottom:24, zIndex: 60, /* same styling as current dashboard FAB */ }}
    >
      <Icon.Sparkle size={14}/> {label}
      <span className="kbd">⌘J</span>
    </button>
  );
};
```

Also wire **⌘J / Ctrl+J** keyboard shortcut globally (one `useEffect` inside `AskCopilotFAB` calling `go(target)`).

### 2. Replace inline FAB on Dashboard

In [smb-hero.jsx:302-314](apps/company-portal/public/prototype/src/smb-hero.jsx#L302-L314) replace the inline `<button>` with `<AskCopilotFAB go={go} label={t.askCopilot}/>`.

### 3. Add FAB to every other SMB page

Add `<AskCopilotFAB go={go} label={t.askCopilot}/>` to the bottom of each page render in:

- [smb-inventory.jsx](apps/company-portal/public/prototype/src/smb-inventory.jsx) — Inventory list, Inventory detail, Inventory scan
- [smb-rest.jsx](apps/company-portal/public/prototype/src/smb-rest.jsx) — Production, Production order, Services, Service WO, General Ledger, Invoices, Bills, Cash Flow, Reports, Team, Settings
- [smb-credit.jsx](apps/company-portal/public/prototype/src/smb-credit.jsx) — Credit & Financing

Do **not** render it on `/smb/copilot` itself.

### 4. Make the Copilot page dynamic

Rewrite the Copilot section in [smb-hero.jsx:319-686](apps/company-portal/public/prototype/src/smb-hero.jsx#L319-L686):

**State:**
```jsx
const [threads, setThreads]     = useState(() => loadThreadsFromLS(tenantId));
const [activeId, setActiveId]   = useState(() => threads[0]?.id ?? null);
const [draft, setDraft]         = useState("");
const [streaming, setStreaming] = useState(false);
```

**Helpers** (new file or top of `smb-hero.jsx`):
- `loadThreadsFromLS(tenantId)` / `saveThreadsToLS(tenantId, threads)`
- `newThread()` returns `{ id: uuid(), title: "New chat", messages: [], createdAt, updatedAt }`
- `groupThreadsByDate(threads)` → `{ today: [...], lastWeek: [...], older: [...] }`

**Sidebar:**
- Replace mock `Today / Last week` lists with `groupThreadsByDate(threads).map(...)`.
- Each thread row: click → `setActiveId(t.id)`; show title (auto-generated from first user message, truncated to ~40 chars).
- "+ New chat" button → `setThreads([newThread(), ...threads]); setActiveId(newId)`.

**Conversation pane:**
- Render `threads.find(t => t.id === activeId).messages` instead of static `t.thread`.
- Each message: `{ role: "user" | "assistant", content: string, ts: number }`.
- During streaming, the last assistant message's `content` updates in place.

**Composer:**
- Wire textarea to `draft` state. Submit on Enter (Shift+Enter = newline) or click Send.
- On submit: append user message, append empty assistant message, call `streamCopilot(...)`, save to LS at start and end.

**Branding fix:**
- Replace `Haiku 4.5 · grounded` at [smb-hero.jsx:673](apps/company-portal/public/prototype/src/smb-hero.jsx#L673) with `SQB AI · grounded`.
- Also check `t.groundedNote` in `COPILOT_I18N` (lines ~480) — ensure it references "SQB Copilot".

### 5. Building the context payload — `data.jsx`

Add a helper in [data.jsx](apps/company-portal/public/prototype/src/data.jsx):

```js
window.buildCopilotContext = function buildCopilotContext() {
  return {
    smb: SMB,                             // name, owner, region, employees
    inventory: PRODUCTS,                   // SKUs, stock, price, status
    finance: {
      revenue6mo: REVENUE_6MO,
      revenueLabels: REVENUE_LABELS,
      cashOnHand: "64.2M UZS",            // pulled from dashboard mock
      pendingOrders: 18,
    },
    activity: ACTIVITY,                    // last 6 events
    credit: { score: 81, preQualified: "240M UZS" },
    needsAttention: [
      { sku: "Sugar refined 50kg", stock: 86, min: 120 },
      { sku: "Laundry detergent 6kg", stock: 12, min: 40 },
      { sku: "Mineral water 1.5L", stock: 0, min: 0, status: "out_of_stock" },
      { invoice: "INV-1475", overdueDays: 8, customer: "Retail Centre" },
    ],
  };
};
```

When real ERP APIs land, swap this for `await fetch('/api/tenants/me/copilot-context')` — the shape stays the same, the system prompt doesn't change.

## Backend Changes (Next.js API route)

### 6. New file: `apps/company-portal/app/api/copilot/chat/route.ts`

```ts
import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { resolveSession } from "@/lib/auth";  // existing helper used by other routes

export const runtime = "nodejs";          // SDK uses Node APIs
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = (locale: string, ctx: any) => `
You are SQB Copilot, an AI assistant inside SQB Business OS — an ERP for Uzbek SMB owners.
Audience: ${ctx.smb?.owner ?? "the owner"} of ${ctx.smb?.name ?? "an SMB"} in ${ctx.smb?.region ?? "Uzbekistan"}.
You have read-only access to the user's live ERP data, attached below as JSON.

Answering rules:
- Respond in: ${locale === "ru" ? "Russian" : locale === "uz" ? "Uzbek (Latin)" : "English"}.
- Be concise. Lead with the answer; supporting numbers and SKU/invoice references go after.
- All money is UZS. Format as "86.4M UZS" or "1 240 000 UZS" — no decimals on millions.
- When citing data, name the specific SKU / invoice number / customer / month.
- If the question requires data not in the context, say what you'd need and where the user can find it (Inventory, Cash flow, Bills, etc.).
- Never invent SKUs, customers, or amounts. If unsure, say "I don't see that in your ERP yet."
- For credit/financing questions, mention the user's pre-qualified amount when relevant.

ERP context (JSON):
${JSON.stringify(ctx, null, 2)}
`.trim();

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (session.intent !== "smb_customer") return new Response("Forbidden", { status: 403 });

  const { messages, context, locale = "en" } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response("Copilot not configured", { status: 503 });

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT(locale, context),
  });

  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const lastUser = messages[messages.length - 1].content;

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastUser);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of result.stream) {
          controller.enqueue(encoder.encode(chunk.text()));
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
```

### 7. Frontend stream consumer — top of `smb-hero.jsx`

```js
async function streamCopilot({ messages, context, locale, onToken, onDone, onError }) {
  const res = await fetch("/api/copilot/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context, locale }),
  });
  if (!res.ok || !res.body) { onError(new Error(`HTTP ${res.status}`)); return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onToken(decoder.decode(value, { stream: true }));
  }
  onDone();
}
```

### 8. Auth helper

Use the existing session resolver shared with `/api/inventory/items`, `/api/audit/events`, etc. (look in `apps/company-portal/lib/` or `apps/company-portal/app/api/` siblings — same import the other routes already use). Reject if `session.intent !== "smb_customer"`.

### 9. Environment

Add to `apps/company-portal/.env.local.example`:

```
GEMINI_API_KEY=your_key_here
```

Document in [docs/D5_copilot/IMPLEMENTATION_PLAN.md](docs/D5_copilot/IMPLEMENTATION_PLAN.md) (this file) and root README that the key is required for Copilot to function — without it the API returns 503 and the UI shows a friendly fallback.

### 10. Dependency

Add to `apps/company-portal/package.json`:

```json
"@google/generative-ai": "^0.21.0"
```

## localStorage Schema

Key: `sqb.copilot.threads.<tenantId>`

```ts
{
  threads: Array<{
    id: string;              // uuid
    title: string;           // first user message, ≤40 chars
    messages: Array<{
      role: "user" | "assistant";
      content: string;
      ts: number;            // Date.now()
    }>;
    createdAt: number;
    updatedAt: number;
  }>;
  activeThreadId: string | null;
  version: 1;                // schema version, for future migrations
}
```

Cap at **50 threads** and **200 messages per thread** — drop oldest beyond that. Wrap reads in try/catch; reset to empty on parse failure.

## Critical Files

| File | Change |
|---|---|
| [apps/company-portal/public/prototype/src/kit.jsx](apps/company-portal/public/prototype/src/kit.jsx) | Add `AskCopilotFAB` shared component |
| [apps/company-portal/public/prototype/src/smb-hero.jsx](apps/company-portal/public/prototype/src/smb-hero.jsx) | Replace mock thread with dynamic state; add streaming; rebrand "Haiku 4.5" → "SQB AI"; replace inline FAB on Dashboard |
| [apps/company-portal/public/prototype/src/smb-rest.jsx](apps/company-portal/public/prototype/src/smb-rest.jsx) | Render `<AskCopilotFAB/>` on every SMB page |
| [apps/company-portal/public/prototype/src/smb-inventory.jsx](apps/company-portal/public/prototype/src/smb-inventory.jsx) | Render `<AskCopilotFAB/>` on every page variant |
| [apps/company-portal/public/prototype/src/smb-credit.jsx](apps/company-portal/public/prototype/src/smb-credit.jsx) | Render `<AskCopilotFAB/>` |
| [apps/company-portal/public/prototype/src/data.jsx](apps/company-portal/public/prototype/src/data.jsx) | Add `buildCopilotContext()` helper |
| **NEW** `apps/company-portal/app/api/copilot/chat/route.ts` | Streaming Gemini endpoint |
| `apps/company-portal/package.json` | Add `@google/generative-ai` |
| `apps/company-portal/.env.local.example` | Document `GEMINI_API_KEY` |

## Out of Scope (deferred)

- Bank-surface Copilot variant (different system prompt, different data context).
- Persisting threads to platform-api / Postgres.
- Tool/function-calling (e.g., "create invoice from chat") — stays advisory for now.
- Voice input, file attachments in chat.
- Wiring the prototype to live `/api/inventory/items` etc. — context still reads from `data.jsx` mocks. Swap is one line of `buildCopilotContext` when ready.

## Verification

1. **Setup**
   - `cd apps/company-portal && npm install` (picks up `@google/generative-ai`)
   - Add `GEMINI_API_KEY=...` to `apps/company-portal/.env.local`
   - `npm run dev` from repo root

2. **Floating button on every SMB page**
   - Log in as SMB owner. Visit Dashboard, Inventory, Production, Services, Ledger, Invoices, Bills, Cash flow, Reports, Credit & Financing — confirm "Ask Copilot" FAB is visible bottom-right on each.
   - Press ⌘J / Ctrl+J on any page — should navigate to `/smb/copilot`.
   - Visit `/smb/copilot` — FAB should NOT be rendered.

3. **Branding**
   - On Copilot page, composer footer reads "SQB AI · grounded" (not "Haiku 4.5"). Spot-check all 3 locales (UZ / RU / EN).

4. **Real LLM responses, grounded in ERP data**
   - In a fresh chat, ask: "Why is my cash tight this month?" → response references actual SKUs and amounts from `data.jsx` (e.g., Sugar refined 50kg, INV-1475, the 12.8% revenue change). It should NOT be the previous static mock.
   - Ask: "Which products are running out?" → response cites Sugar, Laundry detergent, Mineral water with their stock vs min.
   - Ask: "Am I eligible for a loan?" → response cites the 81/100 credit score and the 240M UZS pre-qualification.
   - Switch language to RU, ask the same question — response is in Russian.
   - Ask something with no ERP signal (e.g., "what's the weather?") — response declines gracefully.

5. **Multi-thread**
   - Click "+ New chat" — composer clears, sidebar shows new entry above old ones.
   - Switch between threads via sidebar — message pane swaps; composer stays per-thread.
   - Reload the page — threads persist; the previously active one is still selected.
   - Open DevTools → `localStorage.getItem('sqb.copilot.threads.<tenantId>')` — JSON matches schema.

6. **Streaming UX**
   - On send, the user message appears instantly; the assistant message fills in token-by-token.
   - During streaming, sidebar / nav remain responsive.

7. **Failure modes**
   - Unset `GEMINI_API_KEY`, restart, send a message → UI shows a friendly "Copilot is offline" message; no crash.
   - Log out → `/api/copilot/chat` returns 401; UI redirects to login.
   - Log in as `bank_staff` and try to hit `/api/copilot/chat` directly → 403.

8. **No regressions**
   - `npm run typecheck` and `npm run lint` from root pass.
   - All other SMB pages still render correctly (the FAB does not overlap critical UI on any page — verify on Inventory detail and Service WO which have their own bottom toolbars).
