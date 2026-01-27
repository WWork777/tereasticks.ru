export const dynamic = "force-dynamic";
import ClientFilters from "./client";

// Безопасный fetch с таймаутом
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

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
  // ВАЖНО: В Docker используем localhost, в браузере - относительный путь
  const baseUrl =
    process.env.NODE_ENV === "production" && typeof window === "undefined"
      ? "http://localhost:3008" // порт tereasticks.ru
      : "";

  try {
    return await safeFetch(`${baseUrl}/api/products/getiqos`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("Fetch error for iqos products:", error.message);
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
      canonical: `https://tereasticks.ru/products/iqosexclusive`,
    },
    openGraph: {
      title,
      description:
        "Каталог устройств IQOS ILUMA с доставкой по Москве. Лучший выбор вкусов и брендов!",
      url: `https://tereasticks.ru/products/iqosexclusive`,
      images: [
        {
          url: `https://tereasticks.ru/favicon/web-app-manifest-512x512.png`, // добавил расширение
          alt: `IQOS ILUMA устройства`,
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
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Ошибка загрузки каталога
          </h1>
          <p className="text-gray-600 mb-6">
            Не удалось загрузить список устройств. Пожалуйста, попробуйте позже.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
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
        Аксессуары для IQOS ILUMA в Москве и России
      </h1>
      <ClientFilters items={items} />
    </div>
  );
}
