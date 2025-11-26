// app/api/ai-chat/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type Short = "es" | "en" | "fr";
const DEFAULT_LOCALE_SHORT: Short = "en";

function shortFrom(v?: string | null): Short {
  const x = String(v || "").toLowerCase();
  if (x.startsWith("es")) return "es";
  if (x.startsWith("fr")) return "fr";
  return "en";
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;

    // Locale: primero body.locale, luego header x-locale, luego default
    const headerLocale = req.headers.get("x-locale");
    const short: Short =
      body?.locale ? shortFrom(body.locale) : shortFrom(headerLocale) || DEFAULT_LOCALE_SHORT;

    const {
      agentId = "default-agent",   // por si luego quieres loggear por agente
      role,
      message,
      userMessage,
      context = {},
      meta = {},
    } = body ?? {};

    // Mensaje del usuario
    const userMsgRaw =
      typeof message === "string" && message.trim()
        ? message
        : typeof userMessage === "string" && userMessage.trim()
        ? userMessage
        : "";

    const userMsg = userMsgRaw.trim();
    if (!userMsg) {
      return NextResponse.json(
        { ok: false, error: "Empty message" },
        { status: 400 }
      );
    }

    // Rol efectivo (si no mandas role, pone uno genérico)
    const effectiveRole =
      typeof role === "string" && role.trim()
        ? role.trim()
        : `Eres un asistente de IA que responde con precisión y claridad en el idioma "${short}".`;

    // Contexto: stringify controlado
    let contextText = "";
    if (context && typeof context === "object") {
      try {
        contextText = JSON.stringify(context, null, 2);
      } catch {
        contextText = String(context);
      }
    } else if (context != null) {
      contextText = String(context);
    }

    const system = [
      effectiveRole,
      'Usa EXCLUSIVAMENTE la información proporcionada en el objeto llamado "context".',
      'Si algo no está en "context", responde de forma honesta que no cuentas con esa información y sugiere confirmarlo en los canales oficiales o con el responsable del negocio.',
      "No inventes horarios, precios, políticas legales ni datos críticos que no veas explícitamente en el contexto.",
    ].join("\n\n");

    const contextPrompt = contextText
      ? `context JSON:\n${contextText}`
      : "context JSON: {}";

    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "system", content: contextPrompt },
        { role: "user",   content: userMsg },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim?.() || "";

    return NextResponse.json({
      ok: true,
      reply,
      locale: short,
      topic: meta?.topic ?? null,
      usage: completion.usage ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
