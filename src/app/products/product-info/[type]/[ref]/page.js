export const revalidate = 60;

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

async function fetchItems(type, ref) {
  // ВАЖНО: В продакшене внутри Docker используем localhost!
  const baseUrl =
    process.env.NODE_ENV === "production" && typeof window === "undefined"
      ? "http://localhost:3008" // порт tereasticks.ru контейнера
      : ""; // в браузере или разработке - относительный путь

  try {
    return await safeFetch(
      `${baseUrl}/api/products/getproductinfo/${type}/${ref}`,
      {
        next: { revalidate: 60 },
      },
    );
  } catch (error) {
    console.error(`Fetch error for ${type}/${ref}:`, error.message);
    throw new Error("Ошибка загрузки товаров");
  }
}

// общий загрузчик
async function getItems(params) {
  const { type, ref } = await params; // await params!
  return fetchItems(type, ref);
}

export async function generateMetadata({ params }) {
  let items;

  try {
    items = await getItems(params);
  } catch (e) {
    console.error("Metadata fetch error:", e);
    return {
      title: "Купить IQOS стики | Terea Sticks",
      description: "Оригинальные стики IQOS с доставкой по Москве",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Купить ${items.name} с доставкой по Москве`,
    description:
      items.description || `Купить ${items.name} в магазине Terea Sticks`,
    alternates: {
      canonical: `https://tereasticks.ru/products/product-info/${items.type}/${items.ref}`,
    },
    openGraph: {
      title: `Купить ${items.name} с доставкой по Москве`,
      description:
        items.description || `Купить ${items.name} в магазине Terea Sticks`,
      url: `https://tereasticks.ru/products/product-info/${items.type}/${items.ref}`,
      images: [
        {
          url: items.image
            ? `https://tereasticks.ru/images/${items.image}`
            : `https://tereasticks.ru/og-image.png`,
          alt: items.name,
        },
      ],
    },
  };
}

export default async function Page({ params }) {
  let items;

  try {
    items = await getItems(params);
  } catch (e) {
    console.error("Page fetch error:", e);
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
            Товар временно недоступен
          </h1>
          <p style={{ marginBottom: "1.5rem", color: "#666" }}>
            Не удалось загрузить информацию о товаре. Пожалуйста, попробуйте
            позже.
          </p>
          <a
            href="/products"
            style={{
              display: "inline-block",
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              textDecoration: "none",
            }}
          >
            Вернуться в каталог
          </a>
        </div>
      </div>
    );
  }

  return <ClientFilters items={items} />;
}
