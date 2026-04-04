import pg from "pg";

const { Pool, types } = pg;

// NUMERIC → number, BIGINT → number
types.setTypeParser(1700, parseFloat);
types.setTypeParser(20, Number);

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Маппинг lowercase → camelCase для столбцов PostgreSQL
const COL_MAP = { imagepack: "imagePack", pricepack: "pricePack" };
function mapRow(row) {
  const out = {};
  for (const k in row) out[COL_MAP[k] || k] = row[k];
  return out;
}

// Адаптер: конвертирует ?-плейсхолдеры → $1, $2, ...
// и возвращает [rows] для совместимости с API routes
const db = {
  async query(sql, params) {
    let idx = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
    const result = await pool.query(pgSql, params);
    return [result.rows.map(mapRow)];
  },
  end: () => pool.end(),
};

export default db;
