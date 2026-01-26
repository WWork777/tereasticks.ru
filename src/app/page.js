import Image from "next/image";
import "./main.scss";
import Hero from "../../components/Home/Hero/Hero";
import Poster from "../../components/Home/Poster/Poster";
import Preview from "../../components/Home/Preview/Preview";
import About from "../../components/Home/About/About";
import New from "../../components/Home/New/New";
import Exclusive from "../../components/Home/Exclusive/Exclusive";
import Reviews from "../../components/Home/Reviews/Reviews";
import ModalManager from "../../components/ModalManager/ModalManager";

export const metadata = {
  title: "Стики Terea и Iqos iluma — купить в Москве с доставкой | Iluma Store",
  description:
    "Купить IQOS Iluma и стики Terea с доставкой по Москве и России. Оригинальные устройства, акции, скидки и гарантия качества в Iluma Store.",
  alternates: {
    canonical: "https://tereasticks.ru",
  },
  openGraph: {
    title:
      "Стики Terea и Iqos iluma — купить в Москве с доставкой | Iluma Store",
    description:
      "Купить IQOS Iluma и стики Terea с доставкой по Москве и России. Оригинальные устройства, акции, скидки и гарантия качества в Iluma Store.",
    url: "https://tereasticks.ru",
    type: "website",
    images: [
      {
        url: "https://tereasticks.ru/favicon/og-image.png", // обязательно PNG или JPG
        width: 512,
        height: 512,
        alt: "Iluma Store — IQOS Iluma и стики Terea",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Стики Terea и Iqos iluma — купить в Москве с доставкой | Iluma Store",
    description:
      "Купить IQOS Iluma и стики Terea с доставкой по Москве и России. Оригинальные устройства, акции, скидки и гарантия качества.",
    images: ["https://tereasticks.ru/favicon/og-image.png"],
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            name: "Iluma Store",
            url: "https://tereasticks.ru",
            description:
              "Официальный магазин IQOS Iluma и стиков Terea с доставкой по России",
            address: {
              "@type": "PostalAddress",
              addressCountry: "RU",
              addressLocality: "Москва",
            },
          }),
        }}
      />
      <main>
        <section>
          <Hero />
        </section>
        <section>
          <Poster />
        </section>
        <section>
          <Preview />
        </section>

        <section>
          <Exclusive />
        </section>

        <section>
          <New />
        </section>

        <section>
          <About />
        </section>

        <section>
          <Reviews />
        </section>
      </main>

      {/* <ModalManager /> */}
    </>
  );
}
