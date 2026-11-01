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

  // ---------- Цифры опыта досчитываются при появлении ----------
  // В HTML уже стоит итоговое число, анимация только поверх него
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const countUp = (el) => {
    const match = el.textContent.match(/^(\D*)(\d+)(.*)$/);
    if (!match) return;
    const [, before, digits, after] = match;
    const target = +digits;
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = before + Math.round(target * eased) + after;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!reduceMotion) {
    const counter = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        counter.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    const stats = document.querySelector('.stats');
    if (stats) counter.observe(stats);
  }

  // ---------- Окно кейса ----------
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const modal = document.getElementById('case-modal');
  const modalBody = document.getElementById('case-modal-body');
  const cases = window.CASES || [];
  const cta = window.CTA || { label: 'Обсудить задачу', link: '#contacts' };

  const openCase = (i) => {
    const c = cases[i];
    const blocks = (c.blocks || [])
      .map((b) => `<div class="modal__block"><h4>${esc(b.title)}</h4><p>${esc(b.text).replace(/\n/g, '<br>')}</p></div>`)
      .join('');
    const ext = /^https?:/.test(cta.link) ? ' target="_blank" rel="noopener"' : '';
    modalBody.innerHTML = `
      ${c.image ? `<div class="modal__img"><img src="${esc(c.image)}" alt=""></div>` : '<div class="modal__img ph"><span class="ph__label">Фото</span></div>'}
      ${c.tags?.length ? `<div class="case__tags case__tags--flush">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <h3 class="modal__title" id="case-modal-title">${esc(c.title)}</h3>
      ${blocks}
      <a href="${esc(cta.link)}"${ext} class="btn btn--accent" data-close>Обсудить похожую задачу</a>`;
    modal.showModal();
  };

  document.querySelectorAll('[data-case]').forEach((el) => el.addEventListener('click', () => openCase(+el.dataset.case)));
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.modal__close') || e.target.closest('[data-close]')) modal.close();
  });
})();
