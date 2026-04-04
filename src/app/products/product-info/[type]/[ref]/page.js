export const revalidate = 3600;
import ClientFilters from "./client";

// Утилита для безопасного fetch
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function fetchItems(type, ref) {
  // ВАЖНО: Использовать внутренний адрес!
  // Определить адрес в зависимости от среды
  const isProd = process.env.NODE_ENV === "production";
  const baseUrl = isProd
    ? "http://localhost:3001" // Заменить на реальный IP контейнера
    : "http://localhost:3000";

  try {
    return await safeFetch(
      `${baseUrl}/api/products/getproductinfo/${type}/${ref}`,
      { next: { revalidate: 3600 } },
    );
  } catch (error) {
    console.error(`Fetch error for ${type}/${ref}:`, error.message);
    throw new Error("Ошибка загрузки товаров");
  }
}

export async function generateMetadata({ params }) {
  const { type, ref } = await params;

  try {
    const items = await fetchItems(type, ref);
    return {
      title: `Купить ${items.name} с доставкой по России`,
      description: items.description || `Купить ${items.name}`,
      alternates: {
        canonical: `https://tereasticks.ru/products/product-info/${type}/${ref}`,
      },
      openGraph: {
        title: `Купить ${items.name} с доставкой по России`,
        description: items.description || `Купить ${items.name}`,
        url: `https://tereasticks.ru/products/product-info/${type}/${ref}`,
        images: [
          {
            url: `https://tereasticks.ru/favicon/og-image.png`,
            alt: items.name,
          },
        ],
      },
    };
  } catch (error) {
    console.error("generateMetadata error:", error);
    return {
      title: "Товар не найден | Iluma Store",
      description: "Товар не найден",
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({ params }) {
  const { type, ref } = await params;

  try {
    const items = await fetchItems(type, ref);
    return <ClientFilters items={items} />;
  } catch (error) {
    console.error(`Page error for ${type}/${ref}:`, error);
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-4">Товар не найден</h1>
        <p>К сожалению, не удалось загрузить информацию о товаре.</p>
        <a
          href="/products"
          className="text-blue-500 hover:underline mt-4 inline-block"
        >
          Вернуться к каталогу
        </a>
      </div>
    );
  }
}
