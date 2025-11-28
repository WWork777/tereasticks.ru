import Image from "next/image";
import "./main.scss";
import Hero from "../../components/Home/Hero/Hero";
import Poster from "../../components/Home/Poster/Poster";
import Preview from "../../components/Home/Preview/Preview";
import About from "../../components/Home/About/About";
import New from "../../components/Home/New/New";
import Exclusive from "../../components/Home/Exclusive/Exclusive";
import Reviews from "../../components/Home/Reviews/Reviews";

export const metadata = {
  title: "Купить стики Terea с доставкой по Москве | TereaSticks",
  description:
    "Оригинальные стики Terea для IQOS Iluma с доставкой по Москве – уникальные вкусы и индукционное нагревание",
  alternates: {
    canonical: `https://tereasticks.ru`,
  },
  openGraph: {
    title: `Купить стики Terea с доставкой по Москве | TereaSticks`,
    description: `Оригинальные стики Terea для IQOS Iluma с доставкой по Москве – уникальные вкусы и индукционное нагревание`,
    url: `https://tereasticks.ru`,
    images: [
      {
        url: `/favicon/web-app-manifest-512x512`,
        alt: `Ilumastore`,
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      <h1 className="hidden-h1">
        IQOS Iluma и стики Terea недорого и с доставкой по всей России
      </h1>
      <Hero />
      <Poster />
      <Preview />
      <Exclusive />
      <New />
      <About />
      <Reviews />
    </>
  );
}
