export const dynamic = "force-dynamic";
import ClientFilters from "./client";

async function fetchItems() {
  const res = await fetch("https://iluma-store.ru/api/products/getiqos", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Ошибка загрузки товаров");
  return res.json();
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
      title: `Купить устройства IQOS ILUMA в TereaSticks с доставкой по Москве`,
      description: `Каталог устройств IQOS ILUMA с доставкой по Москве. Лучший выбор вкусов и брендов!`,
      url: `https://tereasticks.ru/products/iqosexclusive`,
      images: [
        {
          url: `/favicon/web-app-manifest-512x512`,
          alt: `Ilumastore`,
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
    console.error(error);
    return <p>Ошибка загрузки данных</p>;
  }

  return (
    <div className="products-container">
      <h1 style={{ position: "absolute", zIndex: "-9999" }}>
        Лимитированные Iqos Iluma
      </h1>
      <ClientFilters items={items} />
    </div>
  );
}
