import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verifyChallenge } from "@/lib/challenge";

const normalizePhone = (p) => (p || "").replace(/\D/g, "");

const recentOrders = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of recentOrders) {
    if (now - ts > 60_000) recentOrders.delete(key);
  }
}, 60_000);

export async function POST(request) {
  try {
    const { limited } = rateLimit(request, {
      windowMs: 60_000,
      max: 5,
      prefix: "orders",
    });
    if (limited) return rateLimitResponse();

    const orderData = await request.json();

    // Защита от ботов
    const pow = orderData._pow;
    if (!pow || !pow.challengeId || pow.nonce === undefined) {
      return NextResponse.json(
        { error: "Ошибка безопасности." },
        { status: 403 },
      );
    }
    const { valid } = verifyChallenge(pow.challengeId, pow.nonce);
    if (!valid)
      return NextResponse.json({ error: "Ошибка проверки." }, { status: 403 });

    const digits = normalizePhone(orderData.phone_number);
    const phoneE164 = `+${digits}`;

    // 1. Считаем количество ПРЕДЫДУЩИХ заказов в базе
    const [historyRows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM Orders WHERE phone_number = ?",
      [phoneE164],
    );
    const previousCount = Number(historyRows?.[0]?.cnt ?? 0);
    const isFirst = previousCount === 0;
    const currentOrderNumber = previousCount + 1; // Текущий заказ по счету

    // 2. Сохраняем заказ в базу
    const [result] = await pool.query(
      `INSERT INTO Orders (
                customer_name, phone_number, is_delivery, city, address,
                total_amount, is_first_order, status, contact_method, 
                telegram_username, pickup_date, pickup_time, comment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?)
            RETURNING id`,
      [
        (orderData.customer_name || "").slice(0, 200),
        phoneE164,
        orderData.is_delivery ? 1 : 0,
        (orderData.city || "").slice(0, 200),
        (orderData.address || "").slice(0, 500),
        orderData.total_amount || 0,
        isFirst ? 1 : 0,
        (orderData.contact_method || "whatsapp").slice(0, 20),
        (orderData.telegram_username || "").slice(0, 50),
        orderData.pickup_date || null,
        orderData.pickup_time || null,
        (orderData.comment || "").slice(0, 1000),
      ],
    );

    const orderId = result?.[0]?.id;

    // 3. Сохраняем товары и формируем список для сообщения
    const items = orderData.ordered_items || [];
    let itemsText = "";
    for (const item of items) {
      await pool.query(
        `INSERT INTO ordered_products (product_name, quantity, price_at_time_of_order, order_id)
                 VALUES (?, ?, ?, ?)`,
        [item.name, item.quantity, item.price, orderId],
      );
      itemsText += `- ${item.name} (${item.type}) x${item.quantity}: ${item.price} ₽\n`;
    }

    // 4. Формируем заголовок (Новый клиент или Повторный заказ)
    const headerStatus = isFirst
      ? "🔥 НОВЫЙ КЛИЕНТ 🔥"
      : `📋 Повторный заказ (${currentOrderNumber}-й по счету)`;

    const tgName = orderData.telegram_username
      ? `@${orderData.telegram_username.replace(/^@/, "")}`
      : "не указан";

    // 5. Итоговое сообщение в Telegram
    const message = `Заказ с сайта tereasticks.ru

${headerStatus}

Имя: ${orderData.customer_name}
Телефон: ${phoneE164}
Telegram: ${tgName}
Способ доставки: ${orderData.is_delivery ? "Доставка" : "Самовывоз"}
Город: ${orderData.city}
Адрес: ${orderData.address}
${orderData.comment ? `Комментарий: ${orderData.comment}\n` : ""}
Корзина:
${itemsText}
Общая сумма: ${orderData.total_amount} ₽`;

    // Отправка
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          // parse_mode не используем Markdown, чтобы спецсимволы не ломали текст,
          // либо используйте MarkdownV2 с экранированием.
        }),
      });
    }

    return NextResponse.json({ success: true, orderId }, { status: 200 });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 },
    );
  }
}
