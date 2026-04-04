"use client";
import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      const age = Date.now() - parsed.timestamp;
      const threeHours = 60 * 60 * 1000;
      if (age < threeHours) {
        setCartItems(parsed.items);
      } else {
        localStorage.removeItem("cart");
      }
    }
  }, []);

  const saveCartToStorage = (items) => {
    const cartData = { items, timestamp: Date.now() };
    localStorage.setItem("cart", JSON.stringify(cartData));
  };

  const addToCart = (
    product,
    quantityType = "Блок",
    quantity = 1,
    setQuantity,
  ) => {
    const price =
      quantityType === "Блок"
        ? Number(product.price)
        : quantityType === "Пачка"
          ? Number(product.pricePack)
          : Number(product.price);

    const productId = `${product.id} - ${quantityType || "default"}`;
    const existingProduct = cartItems.find((item) => item.id === productId);
    const image = quantityType === "Пачка" ? product.imagePack : product.image;

    let updatedCart;
    if (existingProduct) {
      updatedCart = cartItems.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + quantity,
              price: (item.quantity + quantity) * price,
            }
          : item,
      );
    } else {
      updatedCart = [
        ...cartItems,
        {
          id: productId,
          name: product.name,
          price: price * quantity,
          type: quantityType || "default",
          image: image,
          quantity,
        },
      ];
    }

    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
    if (setQuantity) setQuantity(1);
  };

  const calculateTotalPrice = () => {
    return cartItems.reduce((total, item) => total + Number(item.price), 0);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  // НОВАЯ ФУНКЦИЯ ОТПРАВКИ
  const sendOrder = async (customerInfo, powData) => {
    try {
      const payload = {
        ...customerInfo,
        ordered_items: cartItems,
        total_amount: calculateTotalPrice(),
        _pow: powData, // Данные защиты (challengeId, nonce)
        _ts: Date.now(),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        clearCart();
        return { success: true, orderId: result.orderId };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: "Ошибка сети" };
    }
  };

  const addOne = (productId) => {
    const updatedCart = cartItems.map((item) => {
      if (item.id === productId) {
        const unitPrice = item.price / item.quantity;
        return {
          ...item,
          quantity: item.quantity + 1,
          price: unitPrice * (item.quantity + 1),
        };
      }
      return item;
    });
    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const deleteOne = (productId) => {
    const updatedCart = cartItems
      .map((item) => {
        if (item.id === productId && item.quantity > 1) {
          const unitPrice = item.price / item.quantity;
          return {
            ...item,
            quantity: item.quantity - 1,
            price: unitPrice * (item.quantity - 1),
          };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter((item) => item.id !== productId);
    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const hasSticks = () => cartItems.some((item) => item.type !== "default");

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        addOne,
        deleteOne,
        calculateTotalPrice,
        hasSticks,
        sendOrder, // Прокидываем функцию
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
