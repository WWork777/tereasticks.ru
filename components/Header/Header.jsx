"use client";
import "./Header.scss";
import React, { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartContext } from "@/cart/add/cart";
import Image from "next/image";

export default function Header() {
  const openButtonRef = useRef(null);
  const router = useRouter();
  const { cartItems } = useContext(CartContext);

  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isFixed, setIsFixed] = useState(true);

  // Обработка клика по ссылке в мобильном меню (закрытие меню + переход)
  const handleLinkClick = (e, href) => {
    e.preventDefault();
    if (openButtonRef.current) {
      openButtonRef.current.click(); // Симулируем клик для закрытия через Bootstrap
    }
    router.push(href);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      if (currentScrollTop > lastScrollTop && currentScrollTop > 80) {
        // Скроллим вниз - скрываем
        setIsFixed(false);
      } else {
        // Скроллим вверх - показываем
        setIsFixed(true);
      }
      setLastScrollTop(currentScrollTop <= 0 ? 0 : currentScrollTop);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollTop]);

  return (
    <>
      <header className={`${isFixed ? "" : "absolute"}`}>
        <Link href="/" className="logo-container">
          <Image
            src={"/Header/Ilumalogo2.svg"}
            alt="ilumastorelogo"
            width={100}
            height={100}
          />
          <div className="name">
            <span>ТереяСтикс</span>
          </div>
        </Link>

        {/* Десктопное меню */}
        <div className="menu">
          <Link href="/products/ustrojstva-iqos-iluma">Устройства</Link>
          <Link href="/blog">Блог</Link>
          <Link href="/products/stiki-terea-dlya-iqos-iluma">Стики</Link>
          <Link href="/products/aksesuary-dlya-iqos-iluma">Аксессуары</Link>
          <Link href="/products">Каталог</Link>
        </div>

        <div className="cart-menu">
          {/* Корзина */}
          <button
            className="basket btn-primary position-relative"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="white"
              className="bi bi-cart2"
              viewBox="0 0 16 16"
            >
              <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5zM3.14 5l1.25 5h8.22l1.25-5H3.14zM5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" />
            </svg>
            {cartItems.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {cartItems.length}
              </span>
            )}
          </button>

          {/* Бургер-кнопка */}
          <button
            ref={openButtonRef}
            id="btn-menu"
            className="btn-menu"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasRight"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              className="bi bi-list"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Мобильное меню (Offcanvas) */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="offcanvasRight"
      >
        <div className="offcanvas-header">
          <button
            type="button"
            className="btn-close header-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          <div className="menu">
            <div className="logo-container" style={{ marginBottom: "20px" }}>
              <Image
                src={"/Header/Ilumalogo2.svg"}
                alt="logo"
                width={80}
                height={80}
              />
              <div className="name">
                <span>ТереяСтикс</span>
              </div>
            </div>

            <Link
              className="link-close"
              href="/products/ustrojstva-iqos-iluma"
              onClick={(e) =>
                handleLinkClick(e, "/products/ustrojstva-iqos-iluma")
              }
            >
              Устройства
            </Link>
            <Link
              className="link-close"
              href="/blog"
              onClick={(e) => handleLinkClick(e, "/blog")}
            >
              Блог
            </Link>
            <Link
              className="link-close"
              href="/products/stiki-terea-dlya-iqos-iluma"
              onClick={(e) =>
                handleLinkClick(e, "/products/stiki-terea-dlya-iqos-iluma")
              }
            >
              Стики
            </Link>
            <Link
              className="link-close"
              href="/products/aksesuary-dlya-iqos-iluma"
              onClick={(e) =>
                handleLinkClick(e, "/products/aksesuary-dlya-iqos-iluma")
              }
            >
              Аксессуары
            </Link>
            <Link
              className="link-close"
              href="/products"
              onClick={(e) => handleLinkClick(e, "/products")}
            >
              Каталог
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
