export const dynamic = "force-dynamic";
import ClientFilters from "./client";
import db from "@/lib/db"; // Импортируем твой адаптер БД

// Настройка метаданных
export const metadataBase = new URL(
  process.env.NODE_ENV === "production"
    ? "https://iluma-store.ru"
    : "http://localhost:3000",
);

export async function generateMetadata() {
  const title = "Купить стики Heets в ТереяСтикс с доставкой по России";
  return {
    title,
    description:
      "Каталог стиков Heets с доставкой по всей России. Лучший выбор вкусов и брендов!",
    alternates: {
      canonical: `https://tereasticks.ru/products/heets`,
    },
    openGraph: {
      title,
      description: "Каталог стиков Heets с доставкой по всей России.",
      url: `https://tereasticks.ru/products/heets`,
      images: [{ url: `/favicon/og-image.png`, alt: `Ilumastore` }],
    },
  };
}

// Функция получения данных напрямую из Postgres
async function getHeetsData() {
  try {
    // ВНИМАНИЕ: Проверь имя таблицы в БД.
    // Если таблица называется Terea, пишем "Terea". Если Heets — пишем "Heets".
    // Двойные кавычки обязательны для соблюдения регистра в PostgreSQL.
    const [rows] = await db.query('SELECT * FROM "terea"');
    return rows;
  } catch (error) {
    console.error("Database connection error in Heets page:", error);
    throw error; // Пробрасываем ошибку в блок catch компонента
  }
}

export default async function Page() {
  let items = [];

  try {
    // Получаем данные напрямую без посредника в виде API маршрута
    items = await getHeetsData();
  } catch (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Ошибка загрузки данных</h1>
        <p>
          Не удалось подключиться к базе данных. Проверьте настройки
          подключения.
        </p>
        <a
          href="/products"
          style={{ color: "blue", textDecoration: "underline" }}
        >
          Вернуться в каталог
        </a>
      </div>
    );
  }

  // Если данных нет (пустой массив)
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Товары не найдены</h1>
        <p>На данный момент в категории Heets нет доступных товаров.</p>
        <a href="/" style={{ color: "blue" }}>
          На главную
        </a>
      </div>
    );
  }

  return (
    <div className="products-container">
      {/* Скрытый заголовок для SEO, если нужно */}
      <h1
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        Стики Heets для IQOS
      </h1>
      <ClientFilters items={items} />
    </div>
  );
}
