import ClientFilters from "./client";

export const metadataBase = new URL(
  process.env.NODE_ENV === "production"
    ? "https://iluma-store.ru"
    : "http://localhost:3000",
);

export async function generateMetadata() {
  const title = "Аксессуары для IQOS ILUMA — Купить в Москве";
  const description =
    "Аксессуары для IQOS ILUMA в Москве. Чехлы, зарядки, уход за устройством. Оригинал.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://tereasticks.ru/products/aksessuary-dlya-iqos-iluma`,
    },
    openGraph: {
      title,
      description,
      url: `https://tereasticks.ru/products/aksessuary-dlya-iqos-iluma`,
      type: "website",
      images: [
        {
          url: `/favicon/og-image.png`,
          width: 512,
          height: 512,
          alt: "Iluma Store — аксессуары для IQOS ILUMA",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/favicon/og-image.png"],
    },
  };
}

export default function Page() {
  return (
    <div className="products-container">
      <h1 className="page-title">
        Аксессуары для IQOS ILUMA купить в Москве и России
      </h1>
      <ClientFilters apiUrl="/api/products/getdevices" />
    </div>
  );
}
