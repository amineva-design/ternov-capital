// Собирает сайт в папку _site из шаблона и текстов в content/*.json.
// Тексты, фото и документы редактируются через админку /admin.
// Запуск: node scripts/build.js  (на GitHub делается автоматически при каждом изменении)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, '_site');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'content', name + '.json'), 'utf8'));

const general = read('general');
const hero = read('hero');
const experience = read('experience');
const services = read('services');
const cases = read('cases');
const documents = read('documents');
const privacy = read('privacy');

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const text = (s = '') => esc(s).replace(/\n/g, '<br>');
const src = (p = '') => esc(p.replace(/^\//, ''));
const tel = (p = '') => 'tel:' + p.replace(/[^\d+]/g, '');
const pad = (n) => String(n).padStart(2, '0');
const isExternal = (url = '') => /^https?:/.test(url);
const linkAttrs = (url) => `href="${esc(url)}"${isExternal(url) ? ' target="_blank" rel="noopener"' : ''}`;

const img = (p, cls, label = 'Фото') => p
  ? `<div class="${cls}"><img src="${src(p)}" alt="" loading="lazy"></div>`
  : `<div class="${cls} ph"><span class="ph__label">${label}</span></div>`;

// Простая разметка для политики: ## заголовок, - пункт списка, пустая строка между абзацами
const markdown = (src = '') => {
  const out = [];
  let para = [];
  let list = [];
  const flush = () => {
    if (para.length) out.push(`<p>${para.map(esc).join('<br>')}</p>`);
    if (list.length) out.push(`<ul>${list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`);
    para = [];
    list = [];
  };
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith('## ')) { flush(); out.push(`<h2>${esc(line.slice(3))}</h2>`); }
    else if (line.startsWith('- ')) { if (para.length) flush(); list.push(line.slice(2)); }
    else { if (list.length) flush(); para.push(line); }
  }
  flush();
  return out.join('\n');
};

// Висячие предлоги: короткие слова и числа приклеиваются к следующему слову неразрывным пробелом.
// Работает только по видимому тексту, атрибуты и скрипты не трогает.
const shortWords = /(^|[\s(«"„>])([а-яё]{1,2}|без|для|над|под|при|про|или|что|как|это|все|из-за|из-под|не|ни|же)\s+/giu;
const noHanging = (s) => s
  .replace(shortWords, '$1$2\u00a0').replace(shortWords, '$1$2\u00a0')
  .replace(/(\d)\s+(?=[а-яёa-z₽%])/giu, '$1\u00a0')
  .replace(/\s+(—|–)/g, '\u00a0$1');
const typograph = (html) => html.replace(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)|([^<]+)/g,
  (m, tag, textPart) => tag || noHanging(textPart));

const fileInfo = (p) => {
  const ext = path.extname(p).slice(1).toLowerCase();
  let size = 0;
  try { size = fs.statSync(path.join(root, p.replace(/^\//, ''))).size; } catch {}
  const human = size > 1048576 ? `${(size / 1048576).toFixed(1).replace('.', ',')} МБ` : size ? `${Math.max(1, Math.round(size / 1024))} КБ` : '';
  return { ext, human };
};

const logo = (dark) => `
  <svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true"><g fill="${dark ? '#faf9f6' : '#131313'}"><rect x="5" y="6" width="22" height="5"/><rect x="13.5" y="13" width="5" height="13"/></g></svg>
  <span class="logo__text">Тернов<span class="logo__sep" aria-hidden="true"></span><span class="logo__sub">Капитал</span></span>`;

const nav = [
  ['experience', 'Мой опыт'],
  ['services', 'Услуги'],
  ['cases', 'Кейсы'],
  ['documents', 'Полезные документы'],
  ['contacts', 'Контакты'],
];

const casesForModal = cases.items.map(({ title, tags, image, blocks }) => ({ title, tags, image: image ? image.replace(/^\//, '') : '', blocks }));

// Общая оболочка страницы. base: '' для главной, './' для остальных страниц (якоря ведут на главную)
const page = ({ title, description, base = '', main, after = '' }) => `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  ${hero.photo ? `<meta property="og:image" content="${src(hero.photo)}">` : ''}
  <link rel="icon" href="assets/favicon.svg?v=3" type="image/svg+xml">
  <link rel="icon" href="assets/favicon.ico?v=3" sizes="32x32">
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png?v=3">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script>document.documentElement.classList.add('js');setTimeout(function(){document.documentElement.classList.add('reveal-all')},4000)</script>
</head>
<body>

  <header class="header">
    <div class="header__bar">
      <a href="${base || '#top'}" class="logo" aria-label="Тернов Капитал, на главную">${logo(false)}</a>
      <nav class="nav" id="nav" aria-label="Основное меню">
        ${nav.map(([id, label]) => `<a href="${base}#${id}">${label}</a>`).join('\n        ')}
      </nav>
      <button type="button" class="btn btn--accent header__cta" data-lead="Шапка сайта">${esc(general.cta_label)}</button>
      <button class="burger" id="burger" aria-label="Открыть меню" aria-expanded="false" aria-controls="nav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>

${main}
  <footer class="footer card card--dark" id="contacts">
    <div class="footer__top">
      <div>
        <p class="eyebrow eyebrow--light">Контакты</p>
        <h2 class="footer__title">${esc(general.contacts_title)}</h2>
        ${general.contacts_text ? `<p class="footer__lead">${esc(general.contacts_text)}</p>` : ''}
      </div>
      <div class="footer__contacts">
        <a class="footer__link" href="${tel(general.phone)}">${esc(general.phone)}</a>
        <a class="footer__link" href="mailto:${esc(general.email)}">${esc(general.email)}</a>
        <div class="footer__btns">
          ${(general.messengers || []).map((m) => `<a ${linkAttrs(m.url)} class="btn btn--ghost">${esc(m.name)}</a>`).join('\n          ')}
          <button type="button" class="btn btn--accent" data-lead="Блок контактов">Оставить заявку</button>
          <a href="${tel(general.phone)}" class="btn btn--ghost">Позвонить</a>
        </div>
      </div>
    </div>
    <div class="footer__bottom">
      <a href="${base || '#top'}" class="logo logo--light" aria-label="Тернов Капитал, наверх">${logo(true)}</a>
      <nav class="footer__nav" aria-label="Меню в подвале">
        ${nav.slice(0, 4).map(([id, label]) => `<a href="${base}#${id}">${label}</a>`).join('\n        ')}
      </nav>
      <p class="footer__copy">© ${new Date().getFullYear()} Тернов Капитал<br><a href="privacy.html">Политика конфиденциальности</a></p>
    </div>
  </footer>

  <div class="cookie" id="cookie" role="region" aria-label="Уведомление о cookies" hidden>
    <p class="cookie__text">${esc(general.cookie_text)} <a href="privacy.html">Политика конфиденциальности</a></p>
    <button class="btn btn--accent cookie__btn" type="button" id="cookie-accept">Понятно</button>
  </div>
${after}
  <dialog class="modal lead" id="lead-modal" aria-labelledby="lead-title">
    <button class="modal__close" type="button" aria-label="Закрыть">×</button>
    <form class="lead__form" id="lead-form" novalidate>
      <h2 class="modal__title" id="lead-title">${esc(general.form_title)}</h2>
      ${general.form_text ? `<p class="lead__text">${esc(general.form_text)}</p>` : ''}
      <input type="hidden" name="source" id="lead-source">
      <label class="field">
        <span class="field__label">Услуга</span>
        <span class="select">
          <select class="field__input" name="service" id="lead-service" required>
            <option value="" disabled selected>Выберите услугу</option>
            ${services.items.map((s) => `<option value="${esc(s.title)}">${esc(s.title)}</option>`).join('')}
            <option value="Другое">Другое</option>
          </select>
        </span>
      </label>
      <label class="field">
        <span class="field__label">Имя</span>
        <input class="field__input" name="name" autocomplete="name" required maxlength="100">
      </label>
      <label class="field">
        <span class="field__label">Телефон или Telegram</span>
        <input class="field__input" name="contact" autocomplete="tel" inputmode="tel" required maxlength="100" placeholder="+7 900 000-00-00 или @username">
      </label>
      <label class="field">
        <span class="field__label">Коротко о задаче <span class="field__opt">необязательно</span></span>
        <textarea class="field__input field__input--area" name="message" rows="3" maxlength="2000"></textarea>
      </label>
      <label class="field__hp" aria-hidden="true">Не заполняйте<input name="website" tabindex="-1" autocomplete="off"></label>
      <label class="check">
        <input type="checkbox" name="consent" required>
        <span>Соглашаюсь на обработку персональных данных в соответствии с <a href="privacy.html" target="_blank">политикой конфиденциальности</a></span>
      </label>
      <p class="lead__error" id="lead-error" role="alert" hidden></p>
      <button class="btn btn--accent lead__submit" type="submit">Отправить заявку</button>
    </form>
    <div class="lead__done" id="lead-done" hidden>
      <h2 class="modal__title">Заявка отправлена</h2>
      <p class="lead__text">${esc(general.form_success)}</p>
      <button class="btn btn--dark" type="button" data-close>Хорошо</button>
    </div>
  </dialog>

  <script>window.LEAD = ${JSON.stringify({ endpoint: general.form_endpoint || '', email: general.email, phone: general.phone }).replace(/</g, '\\u003c')};</script>
  <script src="main.js" defer></script>
</body>
</html>
`;

const homeMain = `  <main id="top">

    <section class="hero card${hero.photo ? '' : ' hero--empty'}">
      ${hero.photo
        ? `<img class="hero__bg" src="${src(hero.photo)}" alt="${esc(hero.name)}">`
        : `<div class="hero__bg ph"><span class="ph__label">Фото на весь баннер, человек справа</span></div>`}
      <div class="hero__content">
        <h1 class="hero__title">${esc(hero.name)}</h1>
        <ul class="hero__roles">
          ${hero.roles.map((r) => `<li>${esc(r)}</li>`).join('\n          ')}
        </ul>
        <div class="hero__actions">
          <button type="button" class="btn btn--accent" data-lead="Главный экран">${esc(general.cta_label)}</button>
          <a href="#services" class="btn btn--ghost">Услуги</a>
        </div>
      </div>
    </section>

    <section class="section card card--light" id="experience">
      <div class="section__head">
        <p class="eyebrow">Мой опыт</p>
        <h2 class="section__title">${esc(experience.title)}</h2>
      </div>
      <div class="stats">
        ${experience.items.map((s) => `
        <article class="stat${s.accent ? ' stat--accent' : ''}">
          <p class="stat__num"><span class="stat__value" data-count>${esc(s.number)}</span>${s.unit ? ` <span class="stat__unit">${esc(s.unit)}</span>` : ''}</p>
          <p class="stat__text">${esc(s.text)}</p>
        </article>`).join('')}
      </div>
    </section>

    <section class="section card" id="services">
      <div class="section__head">
        <p class="eyebrow">Услуги</p>
        <h2 class="section__title">${esc(services.title)}</h2>
      </div>
      <div class="services">
        ${services.items.map((s, i) => `
        <article class="service service--${['yellow', 'lavender', 'pink', 'lime', 'blue'][i % 5]}">
          ${img(s.image, 'service__img')}
          <div class="service__body">
            <span class="service__num">${pad(i + 1)}</span>
            <h3 class="service__title">${esc(s.title)}</h3>
            ${s.text ? `<p class="service__text">${text(s.text)}</p>` : ''}
            <button type="button" class="btn btn--dark" data-lead="Услуги" data-service="${esc(s.title)}">Обсудить</button>
          </div>
        </article>`).join('')}
      </div>
    </section>

    <section class="section card card--light" id="cases">
      <div class="section__head">
        <p class="eyebrow">Кейсы</p>
        <h2 class="section__title">${esc(cases.title)}</h2>
      </div>
      <div class="cases">
        ${cases.items.map((c, i) => `
        <button class="case" type="button" data-case="${i}">
          ${img(c.image, 'case__img')}
          ${c.tags?.length ? `<div class="case__tags">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
          <h3 class="case__title">${esc(c.title)}</h3>
          <p class="case__text">${esc(c.summary)}</p>
          <span class="case__more">Подробнее</span>
        </button>`).join('')}
      </div>
    </section>

    <section class="section card" id="documents">
      <div class="section__head">
        <p class="eyebrow">Полезные документы</p>
        <h2 class="section__title">${esc(documents.title)}</h2>
      </div>
      <ul class="docs">
        ${documents.items.length ? documents.items.map((d) => {
          const { ext, human } = fileInfo(d.file);
          return `
        <li class="doc">
          <span class="doc__icon doc__icon--${esc(ext)}">${esc(ext.toUpperCase())}</span>
          <div>
            <p class="doc__name">${esc(d.title)}</p>
            <p class="doc__meta">${esc(ext.toUpperCase())}${human ? `, ${human}` : ''}</p>
          </div>
          <a class="btn btn--outline" href="${src(d.file)}" download>Скачать</a>
        </li>`;
        }).join('') : '<li class="docs__empty">Шаблоны скоро появятся.</li>'}
      </ul>
    </section>

  </main>
`;

const home = page({
  title: general.seo_title,
  description: general.seo_description,
  main: homeMain,
  after: `
  <dialog class="modal" id="case-modal" aria-labelledby="case-modal-title">
    <button class="modal__close" type="button" aria-label="Закрыть">×</button>
    <div class="modal__body" id="case-modal-body"></div>
  </dialog>

  <script>window.CASES = ${JSON.stringify(casesForModal).replace(/</g, '\\u003c')};</script>`,
});

const privacyPage = page({
  title: `${privacy.title} | Тернов Капитал`,
  description: privacy.title,
  base: './',
  main: `  <main id="top">
    <article class="section card legal">
      <p class="eyebrow">Документ</p>
      <h1 class="section__title legal__title">${esc(privacy.title)}</h1>
      ${privacy.updated ? `<p class="legal__date">Редакция от ${esc(privacy.updated)}</p>` : ''}
      <div class="legal__body">
        ${markdown(privacy.body)}
      </div>
    </article>
  </main>
`,
});

// Сборка
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
fs.writeFileSync(path.join(out, 'index.html'), typograph(home));
fs.writeFileSync(path.join(out, 'privacy.html'), typograph(privacyPage));
for (const item of ['styles.css', 'main.js', '.nojekyll', 'CNAME', 'assets', 'files', 'admin']) {
  const from = path.join(root, item);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(out, item), { recursive: true });
}
console.log('Сайт собран в _site');
