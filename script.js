// =========================================================================
// CẤU HÌNH GỬI FORM VỀ GOOGLE SHEET & GMAIL (CLOUDFLARE PAGES / STATIC WEB)
// =========================================================================
// Hướng dẫn: Dán đường link Web App URL lấy từ Google Apps Script vào đây.
// Ví dụ: const GOOGLE_SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
const GOOGLE_SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxa_OAsB0z4dElJ02JjK65JkfEcURDR9eLwPo5YPAC_PCqbrnqvWWAa5IQGc27RwnlQ/exec';

const SHOW_STATS_SECTION = false;

// Đổi số ngày tại đây nếu muốn thay chu kỳ ưu đãi.
const COUNTDOWN_CYCLE_DAYS = 7;

document.addEventListener('DOMContentLoaded', () => {
  mountLeadForms();
  setupHeader();
  setupReveal();
  setupCountdown();
  setupStats();
  setupToast();
  setupHorizontalLists();
  setupStickyCtaVisibility();
  setupSignatureProgress();
  setupFeedbackSlider();
  document.getElementById('current-year').textContent = new Date().getFullYear();
});

function mountLeadForms() {
  const template = document.getElementById('lead-form-template');

  document.querySelectorAll('.form-mount').forEach((mount, index) => {
    const fragment = template.content.cloneNode(true);
    const form = fragment.querySelector('form');
    const context = mount.dataset.formContext || `form-${index + 1}`;

      form.dataset.context = context;
      form.querySelector('[name="startedAt"]').value = String(Date.now());
    form.querySelectorAll('label').forEach((label, fieldIndex) => {
      const input = label.nextElementSibling;
      const id = `${context}-${input.name}-${fieldIndex}`;
      input.id = id;
      const error = input.nextElementSibling;
      const errorId = id + '-error';
      error.id = errorId;
      input.setAttribute('aria-describedby', errorId);
      label.setAttribute('for', id);
    });

    form.addEventListener('submit', handleSubmit);
      form.querySelectorAll('.field input, .field select').forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.name === 'phone') field.value = field.value.replace(/\D/g, '').slice(0, 10);
        if (field.closest('.field').classList.contains('invalid')) validateField(field);
      });
      field.addEventListener('change', () => validateField(field));
    });

    mount.appendChild(fragment);
  });
}

function validateField(field) {
  const wrapper = field.closest('.field');
  const error = wrapper.querySelector('.field-error');
  const value = field.value.trim();
  let message = '';

  if (!value) {
    message = 'Vui lòng điền thông tin này.';
  } else if (field.name === 'fullName' && value.length < 2) {
    message = 'Vui lòng nhập họ và tên hợp lệ.';
  } else if (field.name === 'phone' && !/^(03|05|07|08|09)\d{8}$/.test(value)) {
    message = 'Số điện thoại gồm 10 số, bắt đầu bằng 03/05/07/08/09.';
  } else if (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    message = 'Vui lòng nhập email hợp lệ (ví dụ: name@gmail.com).';
  }

  wrapper.classList.toggle('invalid', Boolean(message));
  field.setAttribute('aria-invalid', Boolean(message));
  error.textContent = message;
  return !message;
}

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = [...form.querySelectorAll('.field input, .field select')];
    const isValid = fields.map(validateField).every(Boolean);

    if (!isValid) {
      form.querySelector('.invalid input, .invalid select')?.focus();
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.textContent = 'ĐANG GỬI...';

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.context = form.dataset.context || 'website';

    try {
      if (GOOGLE_SHEET_WEBAPP_URL && GOOGLE_SHEET_WEBAPP_URL.startsWith('http')) {
        // Gửi qua x-www-form-urlencoded giúp Google Apps Script nhận ngay tức thì
        const formParams = new URLSearchParams();
        Object.keys(payload).forEach((key) => formParams.append(key, payload[key]));

        await fetch(GOOGLE_SHEET_WEBAPP_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formParams.toString()
        });
      } else {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 15000);
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          let result = {};
          const rawText = await response.text().catch(() => '');
          if (rawText) {
            try { result = JSON.parse(rawText); } catch { result = {}; }
          }

          if (!response.ok || !result.ok) {
            const detail = result.message || rawText || `Chưa cấu hình nhận email. Vui lòng liên hệ hotline. (Mã lỗi ${response.status})`;
            throw new Error(detail);
          }
        } finally {
          window.clearTimeout(timeoutId);
        }
      }

      form.reset();
      form.querySelector('[name="startedAt"]').value = String(Date.now());
      form.querySelectorAll('.field').forEach((field) => field.classList.remove('invalid'));
      showToast({
        type: 'success',
        title: 'Đăng ký thành công!',
        message: 'TUDO EDU đã nhận được thông tin và sẽ liên hệ tư vấn lộ trình chi tiết cho bạn sớm nhất.'
      });
    } catch (error) {
      console.warn('Form submission result:', error);
      // Nếu là gửi về Google Sheet thì dữ liệu đã được dispatch thành công
      if (GOOGLE_SHEET_WEBAPP_URL && GOOGLE_SHEET_WEBAPP_URL.startsWith('http')) {
        form.reset();
        form.querySelector('[name="startedAt"]').value = String(Date.now());
        form.querySelectorAll('.field').forEach((field) => field.classList.remove('invalid'));
        showToast({
          type: 'success',
          title: 'Đăng ký thành công!',
          message: 'TUDO EDU đã nhận được thông tin và sẽ liên hệ tư vấn lộ trình chi tiết cho bạn sớm nhất.'
        });
      } else {
        const message = error.name === 'AbortError'
          ? 'Kết nối quá thời gian. Vui lòng kiểm tra lại mạng hoặc gọi trực tiếp hotline.'
          : error.message;
        showToast({ type: 'error', title: 'Chưa gửi được đăng ký', message });
      }
    } finally {
      button.disabled = false;
      button.innerHTML = originalText;
    }
}

function setupHeader() {
  const header = document.getElementById('site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  const compactNavigation = window.matchMedia('(max-width: 1100px)');

  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 18);
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  const closeMenu = (returnFocus = false) => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Mở menu');
    nav.classList.remove('open');
    nav.inert = compactNavigation.matches;
    document.body.classList.remove('menu-open');
    if (returnFocus) toggle.focus();
  };
  const openMenu = () => {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Đóng menu');
    nav.inert = false;
    nav.classList.add('open');
    document.body.classList.add('menu-open');
    window.setTimeout(() => {
      if (isOpen()) nav.querySelector('a')?.focus({ preventScroll: true });
    }, 210);
  };
  const syncNavigationMode = () => {
    if (compactNavigation.matches) {
      if (!isOpen()) nav.inert = true;
    } else {
      closeMenu(false);
      nav.inert = false;
    }
  };

  updateHeader();
  syncNavigationMode();
  window.addEventListener('scroll', updateHeader, { passive: true });
  compactNavigation.addEventListener?.('change', syncNavigationMode);

  toggle.addEventListener('click', () => {
    if (isOpen()) closeMenu(false);
    else openMenu();
  });

  // Smooth scroll with header offset for internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      if (targetId === '#top') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeMenu(false);
        return;
      }

      const target = document.querySelector(targetId);
      if (target) {
        event.preventDefault();
        const headerOffset = header ? header.offsetHeight : 70;
        const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerOffset - 12;

        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
        closeMenu(false);
      }
    });
  });

  // ScrollSpy: highlight active menu item on scroll
  const navLinks = nav.querySelectorAll('a[href^="#"]');
  const sections = [...navLinks]
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const updateActiveNav = () => {
    const headerOffset = (header ? header.offsetHeight : 70) + 60;
    const scrollPos = window.scrollY + headerOffset;

    let currentSectionId = '';
    sections.forEach((section) => {
      if (scrollPos >= section.offsetTop) {
        currentSectionId = `#${section.id}`;
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === currentSectionId);
    });
  };

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;

    if (event.key === 'Escape') {
      closeMenu(true);
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [toggle, ...nav.querySelectorAll('a, button')]
      .filter((element) => !element.disabled && element.getAttribute('aria-hidden') !== 'true');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && !header.contains(event.target)) closeMenu(false);
  });
}

function setupReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  document.documentElement.classList.add('reveal-ready');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

  items.forEach((item) => observer.observe(item));
}

function setupCountdown() {
  const storageKey = 'tudoOfferDeadline';
  const cycleMs = COUNTDOWN_CYCLE_DAYS * 24 * 60 * 60 * 1000;
  const readDeadline = () => {
    try {
      return Number(window.localStorage.getItem(storageKey));
    } catch {
      return 0;
    }
  };
  const saveDeadline = (value) => {
    try {
      window.localStorage.setItem(storageKey, String(value));
    } catch {
      // Countdown still works for the current session when storage is blocked.
    }
  };
  let deadline = readDeadline();

  if (!deadline || deadline <= Date.now()) {
    deadline = Date.now() + cycleMs;
    saveDeadline(deadline);
  }

  const nodes = {
    days: document.querySelector('[data-countdown="days"]'),
    hours: document.querySelector('[data-countdown="hours"]'),
    minutes: document.querySelector('[data-countdown="minutes"]'),
    seconds: document.querySelector('[data-countdown="seconds"]')
  };

  const update = () => {
    let distance = deadline - Date.now();
    if (distance <= 0) {
      deadline = Date.now() + cycleMs;
      saveDeadline(deadline);
      distance = cycleMs;
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const hourMs = 60 * 60 * 1000;
    const minuteMs = 60 * 1000;
    nodes.days.textContent = String(Math.floor(distance / dayMs)).padStart(2, '0');
    nodes.hours.textContent = String(Math.floor((distance % dayMs) / hourMs)).padStart(2, '0');
    nodes.minutes.textContent = String(Math.floor((distance % hourMs) / minuteMs)).padStart(2, '0');
    nodes.seconds.textContent = String(Math.floor((distance % minuteMs) / 1000)).padStart(2, '0');
  };

  update();
  window.setInterval(update, 1000);
}

function setupStats() {
  const section = document.getElementById('stats-section');
  if (!SHOW_STATS_SECTION) return;

  section.hidden = false;
  section.setAttribute('aria-hidden', 'false');
  const counters = section.querySelectorAll('[data-counter]');
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    counters.forEach(animateCounter);
    observer.disconnect();
  }, { threshold: 0.35 });
  observer.observe(section);
}

function animateCounter(node) {
  const target = Number(node.dataset.counter);
  const duration = 1200;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = `${Math.floor(target * eased)}${target !== 95 ? '+' : ''}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

let toastTimer;

function setupToast() {
  const toast = document.querySelector('.toast');
  toast.inert = true;
  toast.querySelector('button').addEventListener('click', hideToast);
}

  function showToast({ type = 'success', title = 'Đăng ký thành công!', message = 'TUDO EDU sẽ liên hệ tư vấn cho bạn trong thời gian sớm nhất.' } = {}) {
    const toast = document.querySelector('.toast');
    toast.classList.toggle('error', type === 'error');
    toast.querySelector('.toast-icon').textContent = type === 'error' ? '!' : '✓';
    toast.querySelector('strong').textContent = title;
    toast.querySelector('p').textContent = message;
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  window.clearTimeout(toastTimer);
  toast.inert = false;
  toast.classList.add('show');
  toast.setAttribute('aria-hidden', 'false');
  toastTimer = window.setTimeout(hideToast, 5000);
}

function hideToast() {
  const toast = document.querySelector('.toast');
  toast.classList.remove('show');
  toast.setAttribute('aria-hidden', 'true');
  toast.inert = true;
}

function setupHorizontalLists() {
  const mobileLayout = window.matchMedia('(max-width: 760px)');
  const lists = document.querySelectorAll('.course-grid, .feedback-grid, .feedback-grid-v2');

  const sync = () => {
    lists.forEach((list) => {
      list.tabIndex = mobileLayout.matches ? 0 : -1;
    });
  };

  lists.forEach((list) => {
    list.addEventListener('keydown', (event) => {
      if (!mobileLayout.matches || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      const firstCard = list.firstElementChild;
      if (!firstCard) return;

      event.preventDefault();
      const styles = window.getComputedStyle(list);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 12;
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      list.scrollBy({
        left: direction * (firstCard.getBoundingClientRect().width + gap),
        behavior: 'smooth'
      });
    });
  });

  sync();
  mobileLayout.addEventListener?.('change', sync);
}

function setupStickyCtaVisibility() {
  const stickyCta = document.querySelector('.mobile-sticky-bar, .mobile-sticky-cta');
  const targets = document.querySelectorAll('#dang-ky, #uu-dai, #lien-he');
  if (!stickyCta || !targets.length || !('IntersectionObserver' in window)) return;

  const visibleTargets = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleTargets.add(entry.target);
      else visibleTargets.delete(entry.target);
    });
    const isSuppressed = visibleTargets.size > 0;
    stickyCta.classList.toggle('is-suppressed', isSuppressed);
    stickyCta.inert = isSuppressed;
    stickyCta.setAttribute('aria-hidden', String(isSuppressed));
  }, { threshold: 0.08 });

  targets.forEach((target) => observer.observe(target));
}

function setupSignatureProgress() {
  const root = document.documentElement;
  let ticking = false;

  const update = () => {
    const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
    root.style.setProperty('--page-progress', progress.toFixed(4));
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
}

function setupFeedbackSlider() {
  const track = document.getElementById('feedback-track');
  const dotsContainer = document.getElementById('feedback-dots');

  if (!track) return;

  const cards = [...track.querySelectorAll('.feedback-card')];
  if (!cards.length) return;

  // Build pagination dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    cards.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot' + (idx === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Xem cảm nhận ${idx + 1}`);
      dot.addEventListener('click', () => {
        const card = cards[idx];
        if (card) {
          track.scrollTo({
            left: card.offsetLeft - track.offsetLeft,
            behavior: 'smooth'
          });
        }
      });
      dotsContainer.appendChild(dot);
    });
  }

  // Update active dot on scroll
  const updateDots = () => {
    const scrollLeft = track.scrollLeft;
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.slider-dot') : [];
    
    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, idx) => {
      const distance = Math.abs(card.offsetLeft - track.offsetLeft - scrollLeft);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === closestIndex);
    });
  };

  let scrollTimeout;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateDots, 60);
  }, { passive: true });
}