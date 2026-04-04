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
    return await safeFetch(`${baseUrl}/api/products/getterea`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("Fetch error for terea sticks:", error.message);
    throw new Error("Ошибка загрузки товаров");
  }
}

export async function generateMetadata() {
  const title = "Купить стики Terea в Москве с доставкой";

  return {
    title,
    description:
      "Купить стики Terea с доставкой по Москве. Лучший выбор вкусов и брендов!",
    alternates: {
      canonical: `https://tereasticks.ru/products/stiki-terea-dlya-iqos-iluma`,
    },
    openGraph: {
      title,
      description:
        "Купить стики Terea с доставкой по Москве. Лучший выбор вкусов и брендов!",
      url: `https://tereasticks.ru/products/stiki-terea-dlya-iqos-iluma`,
      images: [
        {
          url: `https://tereasticks.ru/favicon/web-app-manifest-512x512.png`,
          alt: `Стики Terea`,
        },
      ],
    },
  };
}

export default async function Page() {
  return (
    <div className="products-container">
      <h1 className="page-title">
        Купить стики Terea для IQOS ILUMA в Москве и России
      </h1>
      <ClientFilters apiUrl="/api/products/getterea" />
    </div>
  );
}
