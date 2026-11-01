(() => {
  // ---------- Меню ----------
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Подсветка активного пункта меню
  const links = [...nav.querySelectorAll('a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));
  // На первом экране ни один пункт не подсвечен
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) links.forEach((a) => a.classList.remove('is-active'));
  }, { rootMargin: '-45% 0px -50% 0px' }).observe(document.querySelector('.hero'));

  // ---------- Появление при скролле ----------
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  const observeReveal = (root = document) => root.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 80}ms`;
    reveal.observe(el);
  });
  observeReveal();

  document.getElementById('year').textContent = new Date().getFullYear();

  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const media = (src, label, cls) => src
    ? `<div class="${cls}"><img src="${esc(src)}" alt="" loading="lazy"></div>`
    : `<div class="${cls} ph"><span class="ph__label">${label}</span></div>`;

  // ---------- Кейсы ----------
  const casesList = document.getElementById('cases-list');
  const modal = document.getElementById('case-modal');
  const modalBody = document.getElementById('case-modal-body');
  let cases = [];

  const openCase = (i) => {
    const c = cases[i];
    const blocks = (c.blocks || [])
      .map((b) => `<div class="modal__block"><h4>${esc(b.title)}</h4><p>${esc(b.text)}</p></div>`)
      .join('');
    modalBody.innerHTML = `
      ${media(c.image, 'Фото', 'modal__img ph-wrap')}
      ${c.tags?.length ? `<div class="case__tags" style="padding:0">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <h3 class="modal__title" id="case-modal-title">${esc(c.title)}</h3>
      ${blocks}
      <a href="#contacts" class="btn btn--accent" data-close>Обсудить похожую задачу</a>`;
    modal.showModal();
  };

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.modal__close') || e.target.closest('[data-close]')) modal.close();
  });

  fetch('data/cases.json')
    .then((r) => r.json())
    .then((data) => {
      cases = data;
      casesList.innerHTML = cases.map((c, i) => `
        <button class="case reveal" type="button" data-case="${i}">
          ${media(c.image, 'Фото', 'case__img ph-wrap')}
          ${c.tags?.length ? `<div class="case__tags">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
          <h3 class="case__title">${esc(c.title)}</h3>
          <p class="case__text">${esc(c.summary)}</p>
          <span class="case__more">Подробнее</span>
        </button>`).join('');
      casesList.querySelectorAll('[data-case]').forEach((el) => el.addEventListener('click', () => openCase(+el.dataset.case)));
      observeReveal(casesList);
    })
    .catch(() => { casesList.innerHTML = ''; });

  // ---------- Документы ----------
  const docsList = document.getElementById('docs-list');
  const formatSize = (bytes) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`;

  fetch('data/documents.json', { cache: 'no-store' })
    .then((r) => r.json())
    .then((docs) => {
      if (!docs.length) {
        docsList.innerHTML = '<li class="docs__empty">Шаблоны скоро появятся.</li>';
        return;
      }
      docsList.innerHTML = docs.map((d) => `
        <li class="doc reveal">
          <span class="doc__icon doc__icon--${esc(d.ext)}">${esc(d.ext)}</span>
          <div>
            <p class="doc__name">${esc(d.title)}</p>
            <p class="doc__meta">${esc(d.ext.toUpperCase())}, ${formatSize(d.size)}</p>
          </div>
          <a class="btn btn--outline" href="${esc(d.url)}" download>Скачать</a>
        </li>`).join('');
      observeReveal(docsList);
    })
    .catch(() => { docsList.innerHTML = '<li class="docs__empty">Шаблоны скоро появятся.</li>'; });
})();
