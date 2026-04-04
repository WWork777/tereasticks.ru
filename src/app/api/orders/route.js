// app/api/orders/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verifyChallenge } from "@/lib/challenge";

const normalizePhone = (p) => (p || "").replace(/\D/g, "");

// Track recent orders by phone to prevent rapid duplicates
const recentOrders = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of recentOrders) {
    if (now - ts > 60_000) recentOrders.delete(key);
  }
}, 60_000);

export async function POST(request) {
  try {
    const { limited } = rateLimit(request, { windowMs: 60_000, max: 5, prefix: "orders" });
    if (limited) return rateLimitResponse();

    // User-Agent check — bots often have empty or generic UA
    const ua = request.headers.get('user-agent') || '';
    if (!ua || ua.length < 10 || /^(curl|wget|python|httpie|postman|insomnia)/i.test(ua)) {
      return NextResponse.json({ success: true, message: "Заказ успешно сохранен" }, { status: 200 });
    }

    const orderData = await request.json();

    // Bot protection: honeypot check
    if (orderData.website) {
      return NextResponse.json({ success: true, message: "Заказ успешно сохранен" }, { status: 200 });
    }

    // PoW verification
    const pow = orderData._pow;
    if (!pow || !pow.challengeId || pow.nonce === undefined) {
      return NextResponse.json(
        { error: "Ошибка проверки безопасности. Обновите страницу." },
        { status: 403 }
      );
    }
    const { valid, reason } = verifyChallenge(pow.challengeId, pow.nonce);
    if (!valid) {
      return NextResponse.json(
        { error: reason === 'expired' ? "Время проверки истекло. Обновите страницу." : "Ошибка проверки безопасности." },
        { status: 403 }
      );
    }

    // Server-side timing check
    const clientTs = orderData._ts;
    if (clientTs && (Date.now() - clientTs) < 3000) {
      return NextResponse.json({ success: true, message: "Заказ успешно сохранен" }, { status: 200 });
    }

    // Strip internal fields before processing
    delete orderData._pow;
    delete orderData._ts;
    delete orderData.website;

    if (!orderData.customer_name || !orderData.phone_number) {
      return NextResponse.json(
        { error: "Отсутствуют обязательные поля: customer_name и phone_number" },
        { status: 400 },
      );
    }

    // Нормализуем телефон к виду +71111111111
    const digits = normalizePhone(orderData.phone_number);
    const phoneE164 = `+${digits}`;

    // Duplicate order detection — same phone within 60s
    const dupeKey = `phone:${phoneE164}`;
    const lastOrder = recentOrders.get(dupeKey);
    if (lastOrder && (Date.now() - lastOrder) < 60_000) {
      return NextResponse.json(
        { error: "Заказ с этим номером уже был отправлен. Подождите минуту." },
        { status: 429 }
      );
    }
    recentOrders.set(dupeKey, Date.now());

    // Считаем, сколько заказов УЖЕ есть с этим телефоном
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM Orders WHERE phone_number = ?",
      [phoneE164],
    );
    const previous = Number(rows?.[0]?.cnt ?? 0);
    const is_first_order = previous === 0 ? 1 : 0;

    // Сохраняем заказ напрямую в базу данных
    const [result] = await pool.query(
      `INSERT INTO Orders (
        customer_name, phone_number, is_delivery, city, address,
        total_amount, is_first_order,
        status, contact_method, telegram_username, pickup_date, pickup_time, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?)
      RETURNING id`,
      [
        (orderData.customer_name || '').slice(0, 200),
        phoneE164,
        orderData.is_delivery ? 1 : 0,
        (orderData.city || '').slice(0, 200),
        (orderData.address || '').slice(0, 500),
        orderData.total_amount || 0,
        is_first_order,
        (orderData.contact_method || 'whatsapp').slice(0, 20),
        (orderData.telegram_username || '').slice(0, 50),
        orderData.pickup_date || null,
        orderData.pickup_time || null,
        (orderData.comment || '').slice(0, 1000),
      ]
    );

    const orderId = result?.[0]?.id;

    // Сохраняем товары в ordered_products
    const items = orderData.ordered_items || [];
    for (const item of items) {
      await pool.query(
        `INSERT INTO ordered_products (product_name, quantity, price_at_time_of_order, order_id)
         VALUES (?, ?, ?, ?)`,
        [
          (item.product_name || '').slice(0, 500),
          item.quantity || 1,
          item.price_at_time_of_order || 0,
          orderId,
        ]
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Заказ успешно сохранен",
        orderId,
        is_first_order,
        previous_orders_count: previous,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error saving order:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при сохранении заказа" },
      { status: 500 },
    );
  }
}
