// app/api/check-orders/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const normalizePhone = (p) => (p || "").replace(/\D/g, ""); // только цифры

export async function GET(request) {
  try {
    const { limited } = rateLimit(request, { windowMs: 60_000, max: 10, prefix: "check-orders" });
    if (limited) return rateLimitResponse();

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const digits = normalizePhone(phone);
    if (!digits) {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }

    // В базе у тебя хранится с плюсом: +71111111111
    const phoneE164 = `+${digits}`;

    // 1) считаем кол-во заказов
    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM Orders WHERE phone_number = ?",
      [phoneE164],
    );

    const cnt = Number(countRows?.[0]?.cnt ?? 0);

    return NextResponse.json({
      is_first_order: cnt === 0,
      previous_orders_count: cnt,
      total_orders: cnt,
      phone: phoneE164,
    });
  } catch (error) {
    console.error("Error checking order in DB:", error);
    return NextResponse.json(
      {
        is_first_order: true,
        previous_orders_count: 0,
        error: "Ошибка при проверке заказов в базе",
      },
      { status: 200 },
    );
  }
}
