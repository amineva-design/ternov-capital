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

  // ---------- Появление справа налево (как в Pipely) ----------
  // Стартовое состояние задаёт CSS (.js ...), здесь только добавляем .is-in при появлении
  const revealSelector = '.hero__title, .hero__roles li, .hero__actions, .eyebrow, .section__title, .stat, .service__body, .case, .doc, .legal__body, .footer__title, .footer__lead, .footer__contacts';
  const revealItems = [...document.querySelectorAll(revealSelector)];
  revealItems.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.matches(revealSelector));
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 90}ms`;
  });
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealer.unobserve(entry.target);
      // После появления задержка не нужна, иначе hover будет срабатывать с опозданием
      setTimeout(() => { entry.target.style.transitionDelay = ''; }, 1500);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealItems.forEach((el) => revealer.observe(el));

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

  // ---------- Текст в окнах ----------
  // Висячие предлоги, как при сборке страницы (scripts/build.js)
  const shortWords = /(^|[\s(«"„])([а-яё]{1,2}|без|для|над|под|при|про|или|что|как|это|все|из-за|из-под|не|ни|же)\s+/giu;
  const noHanging = (s) => s
    .replace(shortWords, '$1$2\u00a0').replace(shortWords, '$1$2\u00a0')
    .replace(/(\d)\s+(?=[а-яёa-z₽%])/giu, '$1\u00a0')
    .replace(/\s+(—|–)/g, '\u00a0$1');
  const esc = (s = '') => noHanging(String(s)).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const escAttr = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // ---------- Форма заявки ----------
  // Каждая кнопка с data-lead открывает форму и передаёт, откуда пришла заявка
  const lead = document.getElementById('lead-modal');
  const leadForm = document.getElementById('lead-form');
  const leadDone = document.getElementById('lead-done');
  const leadError = document.getElementById('lead-error');
  const leadSource = document.getElementById('lead-source');
  const leadSourceLabel = document.getElementById('lead-source-label');
  const leadSubmit = leadForm.querySelector('[type="submit"]');
  const cfg = window.LEAD || {};

  const openLead = (source) => {
    leadForm.hidden = false;
    leadDone.hidden = true;
    leadError.hidden = true;
    leadSource.value = source;
    leadSourceLabel.textContent = source;
    leadSourceLabel.hidden = !source;
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());
    lead.showModal();
    leadForm.querySelector('[name="name"]').focus();
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lead]');
    if (!btn) return;
    e.preventDefault();
    setMenu(false);
    openLead(btn.dataset.lead);
  });

  const showError = (text) => {
    leadError.textContent = text;
    leadError.hidden = false;
  };

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(leadForm));
    data.consent = leadForm.consent.checked;
    if (!data.name.trim()) return showError('Укажите имя.');
    if (data.contact.replace(/[^\dA-Za-z_@]/g, '').length < 5) return showError('Укажите телефон или Telegram, чтобы с вами можно было связаться.');
    if (!data.consent) return showError('Нужно согласие на обработку персональных данных.');
    if (data.website) return; // скрытое поле для ботов
    data.page = location.href;

    // Пока не подключён приём заявок, открываем письмо с заполненными данными
    if (!cfg.endpoint) {
      const body = `Имя: ${data.name}\nКонтакт: ${data.contact}\nОткуда: ${data.source}\n\n${data.message}`;
      location.href = `mailto:${cfg.email}?subject=${encodeURIComponent('Заявка с сайта: ' + data.source)}&body=${encodeURIComponent(body)}`;
      return;
    }

    leadSubmit.disabled = true;
    leadSubmit.textContent = 'Отправляю…';
    leadError.hidden = true;
    try {
      const res = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.status);
      leadForm.reset();
      leadForm.hidden = true;
      leadDone.hidden = false;
    } catch {
      showError(`Не получилось отправить. Позвоните по номеру ${cfg.phone} или напишите на ${cfg.email}.`);
    } finally {
      leadSubmit.disabled = false;
      leadSubmit.textContent = 'Отправить заявку';
    }
  });

  lead.addEventListener('click', (e) => {
    if (e.target === lead || e.target.closest('.modal__close') || e.target.closest('[data-close]')) lead.close();
  });

  // ---------- Окно кейса ----------
  const modal = document.getElementById('case-modal');
  if (!modal) return;
  const modalBody = document.getElementById('case-modal-body');
  const cases = window.CASES || [];

  const openCase = (i) => {
    const c = cases[i];
    const blocks = (c.blocks || [])
      .map((b) => `<div class="modal__block"><h4>${esc(b.title)}</h4><p>${esc(b.text).replace(/\n/g, '<br>')}</p></div>`)
      .join('');
    modalBody.innerHTML = `
      ${c.image ? `<div class="modal__img"><img src="${escAttr(c.image)}" alt=""></div>` : '<div class="modal__img ph"><span class="ph__label">Фото</span></div>'}
      ${c.tags?.length ? `<div class="case__tags case__tags--flush">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <h3 class="modal__title" id="case-modal-title">${esc(c.title)}</h3>
      ${blocks}
      <button type="button" class="btn btn--accent" data-lead="Кейс: ${escAttr(c.title)}">Обсудить похожую задачу</button>`;
    modal.showModal();
  };

  document.querySelectorAll('[data-case]').forEach((el) => el.addEventListener('click', () => openCase(+el.dataset.case)));
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.modal__close')) modal.close();
  });
})();
