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
  const sections = links
    .filter((a) => a.getAttribute('href').startsWith('#'))
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));
  // На первом экране ни один пункт не подсвечен
  const hero = document.querySelector('.hero');
  if (hero) new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) links.forEach((a) => a.classList.remove('is-active'));
  }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);

  // ---------- Плашка cookies ----------
  const cookie = document.getElementById('cookie');
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };
  if (cookie && !store.get('cookie-ok')) {
    cookie.hidden = false;
    document.getElementById('cookie-accept').addEventListener('click', () => {
      store.set('cookie-ok', '1');
      cookie.hidden = true;
    });
  }

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
  // Висячие предлоги, как при сборке страницы (scripts/build.js)
  const shortWords = /(^|[\s(«"„])([а-яё]{1,2}|без|для|над|под|при|про|или|что|как|это|все|из-за|из-под|не|ни|же)\s+/giu;
  const noHanging = (s) => s
    .replace(shortWords, '$1$2\u00a0').replace(shortWords, '$1$2\u00a0')
    .replace(/(\d)\s+(?=[а-яёa-z₽%])/giu, '$1\u00a0')
    .replace(/\s+(—|–)/g, '\u00a0$1');
  const esc = (s = '') => noHanging(String(s)).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const escAttr = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const modal = document.getElementById('case-modal');
  if (!modal) return;
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
      ${c.image ? `<div class="modal__img"><img src="${escAttr(c.image)}" alt=""></div>` : '<div class="modal__img ph"><span class="ph__label">Фото</span></div>'}
      ${c.tags?.length ? `<div class="case__tags case__tags--flush">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <h3 class="modal__title" id="case-modal-title">${esc(c.title)}</h3>
      ${blocks}
      <a href="${escAttr(cta.link)}"${ext} class="btn btn--accent" data-close>Обсудить похожую задачу</a>`;
    modal.showModal();
  };

  document.querySelectorAll('[data-case]').forEach((el) => el.addEventListener('click', () => openCase(+el.dataset.case)));
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.modal__close') || e.target.closest('[data-close]')) modal.close();
  });
})();
