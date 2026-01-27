export const dynamic = "force-dynamic";
import ClientFilters from "./client";

// Безопасный fetch с таймаутом
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function fetchItems() {
  // ВАЖНО: В продакшене внутри Docker используем localhost!
  const baseUrl =
    process.env.NODE_ENV === "production" && typeof window === "undefined"
      ? "http://localhost:3008" // порт tereasticks.ru контейнера
      : ""; // в браузере или разработке - относительный путь

  try {
    return await safeFetch(`${baseUrl}/api/products/getiqos`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("Fetch error for iqos devices:", error.message);
    throw new Error("Ошибка загрузки товаров");
  }
}

export async function generateMetadata() {
  const title =
    "Купить устройства IQOS ILUMA в TereaSticks с доставкой по Москве";

  return {
    title,
    description:
      "Каталог устройств IQOS ILUMA с доставкой по Москве. Лучший выбор вкусов и брендов!",
    alternates: {
      canonical: `https://tereasticks.ru/products/ustrojstva-iqos-iluma`,
    },
    openGraph: {
      title: "Купить устройства IQOS ILUMA в TereaSticks с доставкой по Москве", // Исправил Iluma-store → TereaSticks
      description:
        "Каталог устройств IQOS ILUMA с доставкой по Москве. Лучший выбор вкусов и брендов!", // Исправил "устройствв" → "устройств"
      url: `https://tereasticks.ru/products/ustrojstva-iqos-iluma`,
      images: [
        {
          url: `https://tereasticks.ru/favicon/web-app-manifest-512x512.png`,
          alt: `Устройства IQOS ILUMA`,
        },
      ],
    },
  };
}

export default async function Page() {
  let items = [];

  try {
    items = await fetchItems();
  } catch (error) {
    console.error("Page fetch error:", error);

    // ✅ Возвращаем полноценный компонент ошибки
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            Ошибка загрузки каталога устройств
          </h1>
          <p style={{ marginBottom: "1.5rem", color: "#666" }}>
            Не удалось загрузить список устройств IQOS ILUMA. Пожалуйста,
            попробуйте позже.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              textDecoration: "none",
            }}
          >
            На главную
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="products-container">
      <h1 className="page-title">
        Оригинальные устройства IQOS ILUMA — купить в Москве и России
      </h1>
      <ClientFilters items={items} />
    </div>
  );
}
