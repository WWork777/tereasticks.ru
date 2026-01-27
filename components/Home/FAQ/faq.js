"use client";

import { useState } from "react";
import Script from "next/script";
import styles from "./FAQ.module.scss";

export default function FAQ() {
  const faqs = [
    {
      question: "Что такое стики Terea?",
      answer:
        "Стики Terea — это табачные стики для устройств IQOS ILUMA. Они обеспечивают стабильный вкус, не требуют чистки и содержат встроенный металлический элемент.",
    },
    {
      question: "Для каких устройств подходят стики Terea?",
      answer:
        "Стики Terea совместимы только с IQOS ILUMA и IQOS ILUMA PRIME. Для других моделей IQOS они не подходят.",
    },
    {
      question: "Вы продаёте оригинальные стики Terea?",
      answer:
        "Да, в нашем магазине представлены только оригинальные стики Terea с акцизной маркой и заводской упаковкой.",
    },
    {
      question: "Какие вкусы стиков Terea самые популярные?",
      answer:
        "Наиболее популярные вкусы: Terea Regular, Terea Menthol, Terea Black Menthol, Terea Smooth Regular и Terea Dark Roast.",
    },
    {
      question: "Есть ли доставка стиков Terea?",
      answer:
        "Мы осуществляем быструю доставку стиков Terea по городу и регионам. Возможна доставка в день заказа.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className={styles.faq}>
      <h2 className={styles.title}>Часто задаваемые вопросы о стиках Terea</h2>

      {/* JSON-LD для SEO */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      <div className={styles.list}>
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`${styles.item} ${openIndex === index ? styles.active : ""}`}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            onMouseEnter={(e) => e.currentTarget.classList.add(styles.hover)}
            onMouseLeave={(e) => e.currentTarget.classList.remove(styles.hover)}
          >
            <button
              type="button"
              className={styles.question}
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex(openIndex === index ? null : index);
              }}
            >
              {faq.question}
              <span className={styles.icon}>
                {openIndex === index ? "−" : "+"}
              </span>
            </button>

            <p
              className={`${styles.answer} ${openIndex === index ? styles.open : ""}`}
            >
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
