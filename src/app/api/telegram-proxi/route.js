// src/app/api/telegram-proxi/route.js

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Простой in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 минута
const RATE_LIMIT_MAX = 10; // макс запросов в окно

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();

    // Валидация: допускаем только text и parse_mode
    const text = typeof body.text === "string" ? body.text.slice(0, 4096) : "";
    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fixedBody = {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: body.parse_mode === "HTML" ? "HTML" : undefined,
    };

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fixedBody),
      },
    );

    if (!telegramResponse.ok) {
      console.error("Telegram API error:", await telegramResponse.text());
      return new Response(JSON.stringify({ error: "Telegram API error" }), {
        status: telegramResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await telegramResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
