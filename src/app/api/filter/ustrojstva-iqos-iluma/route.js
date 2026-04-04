import db from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { category, search, sort, filters } = body;

    const { priceRange, colors, nalichie, models, exclusive, hit } = filters;

    let query = `
            SELECT Iqos.*, Iqos_category.category_name 
            FROM Iqos
            JOIN Iqos_category ON Iqos.id_category = Iqos_category.id
        `;

    const conditions = [];
    const params = [];

    if (priceRange) {
      conditions.push("price BETWEEN ? AND ?");
      params.push(priceRange.min, priceRange.max);
    }

    if (colors && colors.length > 0) {
      const placeholders = colors.map(() => "?").join(",");
      conditions.push(`color IN (${placeholders})`);
      params.push(...colors);
    }

    if (models && models.length > 0) {
      const placeholders = models.map(() => "?").join(",");
      conditions.push(`model IN (${placeholders})`);
      params.push(...models);
    }

    if (nalichie !== null && nalichie !== undefined) {
      conditions.push("nalichie = ?");
      params.push(nalichie === true ? 1 : 0); // Явное приведение к 1/0
    }

    if (exclusive !== null && exclusive !== undefined) {
      conditions.push("exclusive = ?");
      params.push(exclusive === true ? 1 : 0); // Явное приведение к 1/0
    }

    if (hit !== null && hit !== undefined) {
      conditions.push("hit = ?");
      params.push(hit === true ? 1 : 0); // Явное приведение к 1/0
    }

    if (category && category.length > 0) {
      const placeholders = category.map(() => "?").join(",");
      conditions.push(`category_name IN (${placeholders})`);
      params.push(...category);
    }

    if (search) {
      conditions.push(`name ILIKE ?`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    if (sort) {
      const sortOrder =
        sort === "ascending" ? "ASC" : sort === "descending" ? "DESC" : "ASC";
      query += ` ORDER BY price ${sortOrder}`;
    }

    const [rows] = await db.query(query, params);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ошибка выполнения запроса:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: "Ошибка выполнения запроса" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
