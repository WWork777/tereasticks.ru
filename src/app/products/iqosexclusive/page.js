export const dynamic = "force-dynamic";
export const revalidate = 60;
import ClientFilters from "./client";
import db from "@/lib/db"; // Импортируем твой адаптер БД

export const metadataBase = new URL(
  process.env.NODE_ENV === "production"
    ? "https://iluma-store.ru"
    : "http://localhost:3000",
);

// Функция получения данных напрямую из Postgres
async function getIqosExclusiveData() {
  try {
    // Сравниваем exclusive с 1 (число), а не с true (булево)
    const [rows] = await db.query('SELECT * FROM "iqos" WHERE exclusive = 1');
    return rows;
  } catch (error) {
    console.error("Database connection error in Exclusive page:", error);
    throw error;
  }
}

export async function generateMetadata() {
  const title =
    "Купить эксклюзивные устройства IQOS ILUMA с доставкой по России";
  const desc =
    "Каталог лимитированных устройств IQOS ILUMA с доставкой по всей России. Лучший выбор эксклюзивных моделей!";

  return {
    title,
    description: desc,
    alternates: {
      canonical: `https://tereasticks.ru/products/iqosexclusive`,
    },
    openGraph: {
      title,
      description: desc,
      url: `https://tereasticks.ru/products/iqosexclusive`,
      images: [
        {
          url: `/favicon/og-image.png`,
          alt: `Ilumastore`,
        },
      ],
    },
  };
}

export default async function Page() {
  let items = [];

  try {
    // Получаем данные напрямую из БД без лишних API-запросов
    items = await getIqosExclusiveData();
  } catch (error) {
    console.error("Page error:", error);
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Ошибка загрузки данных</h1>
        <p>Не удалось загрузить информацию об устройствах напрямую из базы.</p>
        <a
          href="/products"
          style={{ color: "blue", textDecoration: "underline" }}
        >
          Вернуться в каталог
        </a>
      </div>
    );
  }

  return (
    <div className="products-container">
      <ClientFilters items={items} />
    </div>
  );
}
