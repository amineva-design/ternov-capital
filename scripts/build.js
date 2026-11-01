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

const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(general.seo_title)}</title>
  <meta name="description" content="${esc(general.seo_description)}">
  <meta property="og:title" content="${esc(general.seo_title)}">
  <meta property="og:description" content="${esc(general.seo_description)}">
  <meta property="og:type" content="website">
  ${hero.photo ? `<meta property="og:image" content="${src(hero.photo)}">` : ''}
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>

  <header class="header">
    <div class="header__bar">
      <a href="#top" class="logo" aria-label="Тернов Капитал, на главную">${logo(false)}</a>
      <nav class="nav" id="nav" aria-label="Основное меню">
        ${nav.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('\n        ')}
      </nav>
      <a ${linkAttrs(general.cta_link)} class="btn btn--accent header__cta">${esc(general.cta_label)}</a>
      <button class="burger" id="burger" aria-label="Открыть меню" aria-expanded="false" aria-controls="nav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>

  <main id="top">

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
          <a ${linkAttrs(general.cta_link)} class="btn btn--accent">${esc(general.cta_label)}</a>
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
            <a ${linkAttrs(general.cta_link)} class="btn btn--dark">Обсудить</a>
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
          ${(general.messengers || []).map((m) => `<a ${linkAttrs(m.url)} class="btn btn--accent">${esc(m.name)}</a>`).join('\n          ')}
          <a href="${tel(general.phone)}" class="btn ${general.messengers?.length ? 'btn--ghost' : 'btn--accent'}">Позвонить</a>
        </div>
      </div>
    </div>
    <div class="footer__bottom">
      <a href="#top" class="logo logo--light" aria-label="Тернов Капитал, наверх">${logo(true)}</a>
      <nav class="footer__nav" aria-label="Меню в подвале">
        ${nav.slice(0, 4).map(([id, label]) => `<a href="#${id}">${label}</a>`).join('\n        ')}
      </nav>
      <p class="footer__copy">© ${new Date().getFullYear()} Тернов Капитал</p>
    </div>
  </footer>

  <dialog class="modal" id="case-modal" aria-labelledby="case-modal-title">
    <button class="modal__close" type="button" aria-label="Закрыть">×</button>
    <div class="modal__body" id="case-modal-body"></div>
  </dialog>

  <script>window.CASES = ${JSON.stringify(casesForModal).replace(/</g, '\\u003c')}; window.CTA = ${JSON.stringify({ label: general.cta_label, link: general.cta_link })};</script>
  <script src="main.js" defer></script>
</body>
</html>
`;

// Сборка
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
fs.writeFileSync(path.join(out, 'index.html'), html);
for (const item of ['styles.css', 'main.js', '.nojekyll', 'CNAME', 'assets', 'files', 'admin']) {
  const from = path.join(root, item);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(out, item), { recursive: true });
}
console.log('Сайт собран в _site');
