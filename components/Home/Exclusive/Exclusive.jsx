"use client";
import "./Exclusive.scss";
import "../New/New.scss";
import { useEffect, useState, useContext } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { CartContext } from "@/cart/add/cart";
import Link from "next/link";

import "swiper/css";
import "swiper/css/navigation";

const AgeVerificationModal = ({ isOpen, onConfirm, onClose }) => {
  const [showError, setShowError] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setShowError(false);
  };

  const handleUnderage = () => {
    setShowError(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="age-modal-overlay" onClick={onClose}>
      <div className="age-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Подтверждение возраста</h3>
        <p>Вам есть 18 лет?</p>
        {showError && (
          <p className="age-error">
            Доступ запрещен. Контент только для лиц старше 18 лет.
          </p>
        )}
        <div className="age-modal-buttons">
          <button onClick={handleConfirm} className="age-confirm">
            Да, мне есть 18
          </button>
          <button onClick={handleUnderage} className="age-deny">
            Нет, мне меньше 18
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ item }) => {
  const { addToCart } = useContext(CartContext);
  const [activeButton, setActiveButton] = useState(
    item.pricePack === null ? "Блок" : "Пачка",
  );
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(
    item.pricePack === null ? item.image : item.imagePack,
  );

  const handleClick = (button) => {
    setActiveButton(button);
    if (button === "Блок") {
      setCurrentImage(item.image);
    } else if (button === "Пачка") {
      setCurrentImage(item.imagePack);
    }
  };

  return (
    <div className="product-card">
      {item.pricePack === null ? (
        <img src={item.image} alt={item.name} width={100} height={100} />
      ) : item.type === "terea" ? (
        <img src={currentImage} alt={item.name} width={100} height={100} />
      ) : (
        <img src={item.image} alt={item.name} width={100} height={100} />
      )}

      {item.nalichie === 1 ? (
        <Link href={`/products/product-info/${item.type}/${item.ref}`}>
          <h2 className="product-name">{item.name}</h2>
        </Link>
      ) : (
        <h2 className="product-name">{item.name}</h2>
      )}

      {item.nalichie === 1 && (
        <>
          {item.type === "iqos" ||
          item.type === "devices" ||
          item.type === "exclusive" ? (
            ""
          ) : (
            <div className="switch">
              {item.pricePack !== null && (
                <button
                  onClick={() => handleClick("Пачка")}
                  className={`switch-button ${activeButton === "Пачка" ? "active" : ""}`}
                >
                  Пачка
                </button>
              )}
              <button
                onClick={() => handleClick("Блок")}
                className={`switch-button ${activeButton === "Блок" ? "active" : ""}`}
              >
                Блок
              </button>
            </div>
          )}
        </>
      )}

      <div className="product-info">
        {item.nalichie === 1 ? (
          <>
            {item.type === "iqos" ||
            item.type === "devices" ||
            item.type === "exclusive" ? (
              <p className="product-price">{item.price} ₽</p>
            ) : (
              <p className="product-price">
                {activeButton === "Блок" ? item.price : item.pricePack} ₽
              </p>
            )}
            {item.type === "iqos" ||
            item.type === "devices" ||
            (item.type === "exclusive" && item.pricePack !== null) ? (
              <button
                className="product-button"
                onClick={() => addToCart(item, "", quantity, setQuantity)}
              >
                В корзину
              </button>
            ) : (
              <button
                className="product-button"
                onClick={() =>
                  addToCart(item, activeButton, quantity, setQuantity)
                }
              >
                В корзину
              </button>
            )}
          </>
        ) : (
          <p className="product-price">Нет в наличии</p>
        )}
      </div>
    </div>
  );
};

export default function Exclusive() {
  const [items, setItems] = useState([]);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ageVerified = localStorage.getItem("ageVerified") === "true";
    setIsAgeVerified(ageVerified);
    fetchExclusive();
  }, []);

  const fetchExclusive = async () => {
    try {
      // Используем относительный путь, который работает в браузере
      const res = await fetch("/api/products/gethit");
      const data = await res.json();

      if (res.ok) {
        // Собираем все товары в один массив
        const combinedItems = [
          ...(data.terea || []),
          ...(data.iqos || []),
          ...(data.devices || []), // Исправил device на devices (как в API)
        ];
        setItems(combinedItems);
      }
    } catch (error) {
      console.error("Ошибка загрузки хитов:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgeVerification = () => {
    localStorage.setItem("ageVerified", "true");
    setIsAgeVerified(true);
    setShowAgeModal(false);
    // Генерируем событие, чтобы другие компоненты узнали об обновлении
    window.dispatchEvent(new Event("ageVerified"));
  };

  // Фильтруем только те, что в наличии
  const availableItems = items.filter((item) => item.nalichie === 1);

  if (loading) return <div className="loader">Загрузка хитов...</div>;
  if (availableItems.length === 0) return null; // Не показываем секцию, если пусто

  return (
    <>
      <div id="popular" className="new exclusive">
        <h2>Хит продаж</h2>
        <Swiper
          slidesPerView={"auto"}
          spaceBetween={30}
          navigation={{
            nextEl: ".swiper-button-next-new",
            prevEl: ".swiper-button-prev-new",
          }}
          modules={[Navigation]}
          className="promo-catalog"
        >
          {availableItems.map((item) => (
            <SwiperSlide key={`${item.type}-${item.id}`}>
              <ProductCard
                item={item}
                isAgeVerified={isAgeVerified}
                onImageClick={() => setShowAgeModal(true)}
              />
            </SwiperSlide>
          ))}
          <button className="swiper-button-prev-new"></button>
          <button className="swiper-button-next-new"></button>
        </Swiper>
      </div>

      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeVerification}
        onClose={() => setShowAgeModal(false)}
      />
    </>
  );
}
