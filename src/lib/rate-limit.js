// src/lib/rate-limit.js

// Простой in-memory rate limiter для Next.js API routes
const rateLimitStore = new Map();

// Периодическая очистка устаревших записей (каждые 5 минут)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.start > 300_000) {
      rateLimitStore.delete(key);
    }
  }
}, 300_000);

/**
 * @param {Request} request
 * @param {object} options
 * @param {number} options.windowMs - Окно в мс (по умолчанию 60000)
 * @param {number} options.max - Макс запросов в окно (по умолчанию 20)
 * @param {string} [options.prefix] - Префикс для разделения лимитов разных эндпоинтов
 * @returns {{ limited: boolean, remaining: number }}
 */
export function rateLimit(request, { windowMs = 60_000, max = 20, prefix = "" } = {}) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.start > windowMs) {
    rateLimitStore.set(key, { start: now, count: 1 });
    return { limited: false, remaining: max - 1 };
  }

  entry.count++;
  if (entry.count > max) {
    return { limited: true, remaining: 0 };
  }

  return { limited: false, remaining: max - entry.count };
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Слишком много запросов. Попробуйте позже." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    },
  );
}
