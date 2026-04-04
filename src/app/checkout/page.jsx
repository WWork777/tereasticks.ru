"use client";

import "./style.scss";
import { useContext, useRef, useState, useMemo } from "react";
import { CartContext } from "@/cart/add/cart";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import Link from "next/link";
import moscowCities from "./city.js";

// Создаем Set для быстрой проверки городов
const moscowCitiesSet = new Set(
  moscowCities.map((city) => city.toLowerCase().trim()),
);

const CheckoutPage = () => {
  const [selectedMethod, setSelectedMethod] = useState("delivery");
  const [loading, setLoading] = useState(false);

  // Состояния для защиты от ботов
  const [honeypot, setHoneypot] = useState("");
  const [formLoadedAt] = useState(() => Date.now());
  const [mouseMovements, setMouseMovements] = useState(0);

  const { cartItems, clearCart, calculateTotalPrice } = useContext(CartContext);

  const totalPrice = useMemo(
    () => calculateTotalPrice(),
    [cartItems, calculateTotalPrice],
  );
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    lastName: "",
    phoneNumber: "",
    telegram: "",
    city: "",
    streetAddress: "",
    comment: "",
  });

  const [errors, setErrors] = useState({});

  // Логика доступности полей
  const totalQuantity = cartItems
    .filter((item) => item.type === "Пачка")
    .reduce((acc, item) => acc + item.quantity, 0);
  const hasBlock = cartItems.some((item) => item.type === "Блок");
  const onlyPacksAndBlocks = cartItems.every(
    (item) => item.type === "Пачка" || item.type === "Блок",
  );

  const scrollToElement = (element) => {
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let firstErrorElement = null;

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Введите ваше имя";
      if (!firstErrorElement)
        firstErrorElement = document.getElementsByName("lastName")[0];
    }

    if (
      !formData.phoneNumber ||
      formData.phoneNumber.replace(/\D/g, "").length < 11
    ) {
      newErrors.phoneNumber = "Некорректный номер телефона";
      if (!firstErrorElement)
        firstErrorElement = document.querySelector(".react-tel-input input");
    }

    if (selectedMethod === "delivery" && !formData.city.trim()) {
      newErrors.city = "Введите ваш город";
      if (!firstErrorElement)
        firstErrorElement = document.getElementsByName("city")[0];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      scrollToElement(firstErrorElement);
      return false;
    }
    return true;
  };

  const solveChallenge = async () => {
    try {
      const res = await fetch("/api/challenge");
      const { id, salt, difficulty } = await res.json();
      const prefix = "0".repeat(difficulty);
      const encoder = new TextEncoder();

      for (let nonce = 0; nonce < 10_000_000; nonce++) {
        const data = encoder.encode(salt + ":" + nonce);
        const hashBuf = await crypto.subtle.digest("SHA-256", data);
        const hashHex = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        if (hashHex.startsWith(prefix)) {
          return { challengeId: id, nonce };
        }
      }
      return null;
    } catch (e) {
      console.error("PoW Error:", e);
      return null;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // 1. Проверка настроек сайта
    try {
      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      if (settingsData.settings?.accept_orders === "false") {
        alert(
          settingsData.settings?.orders_disabled_message ||
            "Приём заказов приостановлен.",
        );
        setLoading(false);
        return;
      }
    } catch (err) {}

    // 2. Анти-бот фильтры
    if (honeypot || Date.now() - formLoadedAt < 3000 || mouseMovements < 3) {
      setLoading(false);
      return;
    }

    if (validateForm()) {
      const pow = await solveChallenge();
      if (!pow) {
        alert("Ошибка безопасности. Пожалуйста, обновите страницу.");
        setLoading(false);
        return;
      }

      const phoneNorm = formData.phoneNumber.replace(/\D/g, "");
      const phoneE164 = `+${phoneNorm}`;
      const currentTotalPrice = calculateTotalPrice();
      const cleanTelegram = formData.telegram.trim().replace(/^@/, "");

      // Тексты для доп. уведомлений (Email/WhatsApp)
      const formattedCart = cartItems
        .map(
          (item) =>
            `- ${item.name} (${item.type || "обычный"}) x${item.quantity}: ${item.price} ₽`,
        )
        .join("\n");

      const isMoscowCity =
        formData.city &&
        moscowCitiesSet.has(formData.city.toLowerCase().trim());

      const reportMessage = `Новый заказ: ${formData.lastName}\nТел: ${phoneE164}\nГород: ${formData.city}\nКорзина:\n${formattedCart}\nСумма: ${currentTotalPrice} ₽`;

      try {
        // Запускаем доп. уведомления
        Promise.allSettled([
          fetch("/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: reportMessage }),
          }),
          (async () => {
            // ВОССТАНОВЛЕННАЯ ЛОГИКА WHATSAPP (КАК БЫЛО РАНЬШЕ)
            let autoReply = "";
            if (
              !isMoscowCity &&
              selectedMethod === "delivery" &&
              formData.city.trim()
            ) {
              autoReply = `Здравствуйте! Получили ваше бронирование \n\nВ регионы отправляем через CDEK. \n\nВсе посылки отправляются в день заказа.\nОтправка из Москвы ❗️\nНаложенным платежом не отправляем ❌❌❌\n\nОт Вас нужны следующие данные:\n\nФио \nТел получателя \nГород\nАдрес ближ пвз сдэк`;
            } else {
              autoReply = `Здравствуйте! \n\nПолучили ваше бронирование \n*❗️КОГДА И ПО КАКОМУ АДРЕСУ ВАМ УДОБНО ПОЛУЧИТЬ ЗАКАЗ?❗️*\n*❗️СТОИМОСТЬ ДОСТАВКИ ЗАВИСИТ ОТ АДРЕСА И БУДЕТ С ВАМИ СОГЛАСОВАНА❗️*`;
            }

            const waFull = `${autoReply}\n\n📦 СОСТАВ ЗАКАЗА:\n${formattedCart}\n\n💰 Сумма: ${currentTotalPrice} ₽\n\n👤 Имя: ${formData.lastName}\n🏙 Город: ${formData.city}`;

            await fetch(
              `https://api.green-api.com/waInstance1103290542/SendMessage/65dee4a31f1342768913a5557afc548591af648dffc44259a6`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chatId: `${phoneNorm}@c.us`,
                  message: waFull,
                }),
              },
            );
          })(),
        ]);

        // 3. ГЛАВНЫЙ ЗАПРОС: Сохранение в БД + Авто-отправка в Телеграм сервером
        const orderDataForDb = {
          customer_name: formData.lastName.trim(),
          phone_number: phoneE164,
          is_delivery: selectedMethod === "delivery" ? 1 : 0,
          city: formData.city.trim(),
          address:
            formData.streetAddress.trim() ||
            (selectedMethod === "delivery" ? "Доставка" : "Самовывоз"),
          total_amount: Number(currentTotalPrice),
          contact_method: "whatsapp",
          telegram_username: cleanTelegram,
          pickup_date: new Date().toLocaleDateString("ru-RU"),
          pickup_time: new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          comment: formData.comment.trim(),
          ordered_items: cartItems.map((item) => ({
            name: item.name,
            quantity: Number(item.quantity),
            price: Number(item.price),
            type: item.type || "обычный",
          })),
          website: honeypot,
          _pow: pow,
          _ts: formLoadedAt,
        };

        const dbRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderDataForDb),
        });

        const resData = await dbRes.json();

        if (dbRes.ok) {
          alert(
            `✅ Заказ №${resData.orderId} успешно оформлен!\nМенеджер свяжется с вами.`,
          );
          clearCart();
          window.location.href = "/";
        } else {
          alert(`⚠️ Ошибка: ${resData.error || "не удалось сохранить заказ"}`);
        }
      } catch (error) {
        console.error("Submit error:", error);
        alert("Произошла ошибка при отправке. Попробуйте еще раз.");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <div
      className="checkout-page"
      onMouseMove={() => setMouseMovements((c) => c + 1)}
    >
      <div className="checkout-form">
        <div className="plitka">
          <h1>Оформление заказа</h1>
          <h5>
            Уважаемые покупатели, заполните данные, менеджер свяжется с вами.
          </h5>
        </div>

        <form onSubmit={handleSubmit} ref={formRef}>
          <input
            type="text"
            style={{ display: "none" }}
            tabIndex="-1"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />

          <div className="checkout-name">
            <h4>Контактные данные</h4>
            <input
              type="text"
              name="lastName"
              placeholder="Ваше имя *"
              value={formData.lastName}
              onChange={handleInputChange}
            />
            {errors.lastName && <p className="error-msg">{errors.lastName}</p>}

            <input
              type="text"
              name="telegram"
              placeholder="Telegram (необязательно)"
              value={formData.telegram}
              onChange={handleInputChange}
              onFocus={() =>
                !formData.telegram &&
                setFormData((p) => ({ ...p, telegram: "@" }))
              }
            />

            <PhoneInput
              country={"ru"}
              value={formData.phoneNumber}
              onChange={(val) =>
                setFormData((p) => ({ ...p, phoneNumber: val }))
              }
              onlyCountries={["ru"]}
              placeholder="Введите номер телефона *"
              inputStyle={{ width: "100%", height: "45px" }}
            />
            {errors.phoneNumber && (
              <p className="error-msg">{errors.phoneNumber}</p>
            )}

            <input
              type="text"
              name="city"
              placeholder="Город *"
              value={formData.city}
              onChange={handleInputChange}
              disabled={onlyPacksAndBlocks && totalQuantity < 10 && !hasBlock}
            />
            {errors.city && <p className="error-msg">{errors.city}</p>}
          </div>
        </form>
      </div>

      <div className="checkout-table">
        <h4>Ваша корзина</h4>
        {cartItems.length > 0 ? (
          <>
            <ul className="cart-list">
              {cartItems.map((item) => (
                <li key={item.id} className="cart-item">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-image"
                  />
                  <div className="cart-item-info">
                    <p>
                      {item.name} {item.type !== "default" && `(${item.type})`}
                    </p>
                    <div className="price">
                      <p>Кол-во: {item.quantity}</p>
                      <p>{item.price} ₽</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="checkout-total">
              <p>Итого:</p>
              <p>{totalPrice} ₽</p>
            </div>

            <button
              className="submit-btn"
              onClick={() =>
                formRef.current.dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true }),
                )
              }
              disabled={loading}
            >
              {loading ? "Обработка..." : "Оформить заказ"}
            </button>

            <p className="bot-link">
              Или наш{" "}
              <Link href="https://t.me/ilumaStore_official_bot">
                Telegram бот
              </Link>
            </p>
          </>
        ) : (
          <h5 style={{ textAlign: "center", marginTop: "50px" }}>
            Корзина пуста
          </h5>
        )}
      </div>

      <style jsx>{`
        .error-msg {
          color: #ff4d4d;
          font-size: 13px;
          margin: -10px 0 10px 5px;
        }
        .submit-btn {
          width: 100%;
          padding: 16px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .bot-link {
          text-align: center;
          margin-top: 15px;
          font-size: 14px;
        }
        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-top: 10px;
          font-family: inherit;
          resize: none;
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;
