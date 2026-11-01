// Приём заявок с сайта: пересылает их в Telegram и (если настроено) в Bitrix24.
// Рассчитано на Yandex Cloud Functions (среда Node.js 18+), ставится один раз, см. README.
//
// Переменные окружения функции:
//   TELEGRAM_BOT_TOKEN  токен бота от @BotFather
//   TELEGRAM_CHAT_ID    куда слать заявки (id чата или группы)
//   BITRIX_WEBHOOK_URL  необязательно: входящий вебхук Bitrix24 вида https://<портал>.bitrix24.ru/rest/1/<ключ>/
//   ALLOWED_ORIGIN      адрес сайта, например https://ternov-capital.ru (через запятую можно несколько)

const limit = (s, n) => String(s || '').trim().slice(0, n);
const html = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const cors = (origin) => {
  const allowed = (process.env.ALLOWED_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
  const ok = !allowed.length || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin || '*' : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
};

const reply = (statusCode, headers, body) => ({ statusCode, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function toTelegram(lead) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = process.env;
  if (!token || !chat) return;
  const text = [
    '<b>Новая заявка с сайта</b>',
    `Услуга: ${html(lead.service)}`,
    `Имя: ${html(lead.name)}`,
    `Контакт: ${html(lead.contact)}`,
    lead.message && `Задача: ${html(lead.message)}`,
    lead.source && `Блок сайта: ${html(lead.source)}`,
    lead.page && `Страница: ${html(lead.page)}`,
  ].filter(Boolean).join('\n');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!res.ok) throw new Error('telegram ' + res.status);
}

async function toBitrix(lead) {
  const url = process.env.BITRIX_WEBHOOK_URL;
  if (!url) return;
  const isPhone = /\d{5,}/.test(lead.contact.replace(/\D/g, ''));
  const fields = {
    TITLE: `Заявка с сайта: ${lead.service}`,
    NAME: lead.name,
    SOURCE_ID: 'WEB',
    SOURCE_DESCRIPTION: `${lead.service} (блок: ${lead.source})`,
    COMMENTS: [lead.message, `Контакт: ${lead.contact}`, `Страница: ${lead.page}`].filter(Boolean).join('\n'),
  };
  if (isPhone) fields.PHONE = [{ VALUE: lead.contact, VALUE_TYPE: 'WORK' }];
  const res = await fetch(url.replace(/\/?$/, '/') + 'crm.lead.add.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error('bitrix ' + res.status);
}

module.exports.handler = async (event) => {
  const origin = event.headers?.Origin || event.headers?.origin || '';
  const headers = cors(origin);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, headers, { ok: false });

  let data;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    data = JSON.parse(raw || '{}');
  } catch {
    return reply(400, headers, { ok: false, error: 'bad json' });
  }

  // Скрытое поле: живой человек его не заполняет
  if (data.website) return reply(200, headers, { ok: true });

  const lead = {
    name: limit(data.name, 100),
    contact: limit(data.contact, 100),
    message: limit(data.message, 2000),
    service: limit(data.service, 200) || 'Не указана',
    source: limit(data.source, 100),
    page: limit(data.page, 300),
  };
  if (!lead.name || lead.contact.length < 5 || data.consent !== true) {
    return reply(422, headers, { ok: false, error: 'invalid' });
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, BITRIX_WEBHOOK_URL } = process.env;
  if (!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) && !BITRIX_WEBHOOK_URL) {
    console.error('Не настроены TELEGRAM_* или BITRIX_WEBHOOK_URL');
    return reply(500, headers, { ok: false });
  }

  const results = await Promise.allSettled([toTelegram(lead), toBitrix(lead)]);
  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((r) => console.error(r.reason));
  // Заявка не потеряна, если дошла хотя бы в одно место
  if (failed.length === results.length) return reply(502, headers, { ok: false });
  return reply(200, headers, { ok: true });
};
