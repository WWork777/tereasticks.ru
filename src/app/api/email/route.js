// src/app/api/email/route.js
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    // Извлекаем данные из тела запроса
    const body = await req.json();

    // Получаем текст сообщения из поля 'text'
    const { text } = body;

    // Валидация
    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "Текст сообщения обязателен" },
        { status: 400 },
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: "Сообщение слишком длинное" },
        { status: 400 },
      );
    }

    // Конфигурация SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.yandex.ru",
      port: 465,
      secure: true,
      auth: {
        user: "sersur42@yandex.ru",
        pass: "xidetvxcflvenyqk",
      },
    });

    const to = "ww9200073@gmail.com";
    const from = "sersur42@yandex.ru";

    // Извлекаем информацию из текста
    let subject = "Заявка с сайта tereasticks.ru";
    let customerName = "Клиент";

    // Поиск имени в тексте
    const nameMatch = text.match(/Имя:\s*(.+?)(?:\n|$)/);
    if (nameMatch && nameMatch[1]) {
      customerName = nameMatch[1].trim();
    }

    // Поиск нового/повторного клиента
    if (text.includes("НОВЫЙ КЛИЕНТ") || text.includes("🔥 НОВЫЙ КЛИЕНТ 🔥")) {
      subject = `🔥 НОВЫЙ КЛИЕНТ: ${customerName} - tereasticks.ru`;
    } else {
      subject = `Заявка от ${customerName} - tereasticks.ru`;
    }

    // Форматируем текст для HTML с сохранением переносов
    const formattedText = escapeHtml(text)
      .replace(/\n/g, "<br>")
      .replace(/🔥/g, "🔥")
      .replace(/📋/g, "📋")
      .replace(/✅/g, "✅")
      .replace(/⚠️/g, "⚠️")
      .replace(/❗️/g, "❗️")
      .replace(/❌/g, "❌")
      .replace(/😊/g, "😊");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
            }
            .email-container {
              max-width: 600px;
              margin: 20px auto;
              background-color: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .email-header {
              background: #2f2d2e;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .email-header a {
              all: unset;
            }
            .email-header h2 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
              color: white !important;
            }
            .email-content {
              padding: 25px;
            }
            .order-info {
              background-color: #f8f9fa;
              border-left: 4px solid #2f2d2e;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .order-details {
              background-color: #f6f6f6;
              padding: 20px;
              border-radius: 8px;
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
              white-space: pre-wrap;
              word-wrap: break-word;
              overflow-x: auto;
              font-size: 14px;
              line-height: 1.5;
              border: 1px solid #e9ecef;
            }
            .customer-badge {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .new-customer {
              background-color: #ff6b6b;
              color: white;
            }
            .returning-customer {
              background-color: #4ecdc4;
              color: white;
            }
            .footer {
              margin-top: 25px;
              padding-top: 15px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 12px;
              text-align: center;
            }
            .label {
              font-weight: bold;
              color: #555;
              min-width: 120px;
              display: inline-block;
            }
            .info-row {
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h2>Заявка с сайта tereasticks.ru</h2>
            </div>
            
            <div class="email-content">
              ${
                text.includes("🔥 НОВЫЙ КЛИЕНТ 🔥")
                  ? '<div class="customer-badge new-customer">🔥 НОВЫЙ КЛИЕНТ 🔥</div>'
                  : text.includes("📋 Повторный заказ")
                    ? '<div class="customer-badge returning-customer">📋 ПОВТОРНЫЙ ЗАКАЗ</div>'
                    : ""
              }
              
              <div class="order-info">
                <div class="info-row">
                  <span class="label">Имя:</span>
                  <span>${escapeHtml(customerName)}</span>
                </div>
                
                ${(() => {
                  const phoneMatch = text.match(
                    /Телефон:\s*\+?(\d[\d\s\-\(\)]+)/,
                  );
                  return phoneMatch
                    ? `
                    <div class="info-row">
                      <span class="label">Телефон:</span>
                      <span>${escapeHtml(phoneMatch[1])}</span>
                    </div>
                  `
                    : "";
                })()}
                
                ${(() => {
                  const telegramMatch = text.match(/Telegram:\s*(@?[\w\d_]+)/);
                  return telegramMatch
                    ? `
                    <div class="info-row">
                      <span class="label">Telegram:</span>
                      <span>${escapeHtml(telegramMatch[1])}</span>
                    </div>
                  `
                    : "";
                })()}
                
                ${(() => {
                  const methodMatch = text.match(
                    /Способ доставки:\s*(.+?)(?:\n|$)/,
                  );
                  return methodMatch
                    ? `
                    <div class="info-row">
                      <span class="label">Доставка:</span>
                      <span>${escapeHtml(methodMatch[1])}</span>
                    </div>
                  `
                    : "";
                })()}
              </div>
              
              <h3 style="margin-top: 25px; margin-bottom: 10px;">Детали заказа:</h3>
              <div class="order-details">
                ${formattedText}
              </div>
              
              <div class="footer">
                <p>Отправлено с сайта tereasticks.ru</p>
                <p>${new Date().toLocaleString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      to,
      from: `"tereasticks.ru" <${from}>`,
      subject,
      // text, // plain text версия
      html,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Content-Transfer-Encoding": "quoted-printable",
        "X-Mailer": "tereasticks.ru Contact Form",
      },
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      ok: true,
      message: "Письмо успешно отправлено",
    });
  } catch (err) {
    console.error("EMAIL_SEND_ERROR:", err);

    let errorMessage = "Ошибка отправки письма";

    if (err.code === "EAUTH") {
      errorMessage = "Ошибка авторизации почтового сервера";
    } else if (err.code === "ECONNECTION") {
      errorMessage = "Не удалось подключиться к почтовому серверу";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 },
    );
  }
}

// Функция для экранирования HTML
function escapeHtml(s) {
  if (s == null) return "";
  const str = String(s);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Опционально: поддержка других HTTP методов
export async function GET() {
  return NextResponse.json(
    {
      error: "Метод GET не поддерживается",
      info: "Для отправки письма используйте POST запрос с JSON телом: { text: 'сообщение' }",
    },
    { status: 405 },
  );
}
