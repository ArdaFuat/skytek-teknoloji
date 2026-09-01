const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
const year = document.getElementById('year');
const quoteForm = document.getElementById('quoteForm');

if (year) year.textContent = new Date().getFullYear();

const handleScroll = () => {
  header?.classList.toggle('scrolled', window.scrollY > 20);
};
handleScroll();
window.addEventListener('scroll', handleScroll, { passive: true });

navToggle?.addEventListener('click', () => {
  const isOpen = nav?.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
  document.body.classList.toggle('no-scroll', Boolean(isOpen));
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  });
});

const getYoutubeLinks = (slug) => {
  const value = window.SKYTEK_YOUTUBE_LINKS?.[slug] || [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
};

const isRealYoutubeLink = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (!clean || clean === '#' || clean.includes('BURAYA') || clean.includes('YAPISTIR')) return false;
  return /^https?:\/\//i.test(clean);
};

const youtubeEmbedUrl = (url) => {
  try {
    const parsed = new URL(url.trim());
    let id = '';
    if (parsed.hostname.includes('youtu.be')) {
      id = parsed.pathname.replace('/', '').split('/')[0];
    } else if (parsed.pathname.includes('/shorts/')) {
      id = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || '';
    } else if (parsed.pathname.includes('/embed/')) {
      id = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
    } else {
      id = parsed.searchParams.get('v') || '';
    }
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : url;
  } catch (error) {
    return url;
  }
};

const resolveYoutubeUrl = (button) => {
  const slug = button.dataset.projectSlug;
  const index = Number(button.dataset.youtubeIndex || 0);
  return getYoutubeLinks(slug)[index] || '';
};

const updateYoutubeCards = () => {
  document.querySelectorAll('[data-youtube-card]').forEach((card) => {
    const url = resolveYoutubeUrl(card);
    const slug = card.dataset.projectSlug;
    const index = Number(card.dataset.youtubeIndex || 0) + 1;
    if (isRealYoutubeLink(url)) {
      card.classList.add('has-youtube-link');
      card.innerHTML = '<span class="play-badge">▶</span><strong>YouTube videosu hazır</strong><small>Proje detayında büyük açılır</small>';
    } else {
      card.classList.add('youtube-card-empty');
      card.innerHTML = '<span class="play-badge">▶</span><strong>Proje videosu</strong><small>Proje detaylarını incele</small>';
    }
  });

  document.querySelectorAll('[data-youtube-button]').forEach((button) => {
    const url = resolveYoutubeUrl(button);
    const slug = button.dataset.projectSlug;
    const index = Number(button.dataset.youtubeIndex || 0) + 1;
    if (isRealYoutubeLink(url)) {
      button.classList.add('has-youtube-link');
      const label = button.dataset.youtubeLabel || 'YouTube videosu';
      button.innerHTML = `<span class="play-badge">▶</span><strong>${label}</strong><small>Büyük oynatıcıda aç</small>`;
    } else {
      button.classList.add('youtube-card-empty');
      button.hidden = true;
    }
  });
};
updateYoutubeCards();

// Public site: hide media sections that have no available photo or video.
document.querySelectorAll('.project-media-top').forEach((section) => {
  const hasPhoto = Boolean(section.querySelector('[data-lightbox-image], [data-project-slide] img'));
  const hasVideo = [...section.querySelectorAll('[data-youtube-button]')].some((button) => !button.hidden);
  if (!hasPhoto && !hasVideo) section.hidden = true;
});

// Project filters on homepage
const filterButtons = document.querySelectorAll('[data-project-filter]');
const projectCards = document.querySelectorAll('[data-project-card]');
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.projectFilter;
    filterButtons.forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    projectCards.forEach((card) => {
      const services = (card.dataset.services || '').split(/\s+/);
      const visible = filter === 'all' || services.includes(filter);
      card.hidden = !visible;
    });
  });
});

// Lightbox / video modal
let modal;
const ensureModal = () => {
  if (modal) return modal;
  modal = document.createElement('div');
  modal.className = 'media-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="media-modal-backdrop" data-modal-close></div>
    <div class="media-modal-dialog" role="dialog" aria-modal="true" aria-label="Medya görüntüleyici">
      <button class="media-modal-close" type="button" data-modal-close aria-label="Kapat">×</button>
      <div class="media-modal-content" data-modal-content></div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-modal-close]').forEach((close) => close.addEventListener('click', closeModal));
  return modal;
};

const openModal = (html) => {
  const el = ensureModal();
  el.querySelector('[data-modal-content]').innerHTML = html;
  el.classList.add('is-open');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
};

function closeModal() {
  if (!modal) return;
  activeModalGallery = [];
  activeModalGalleryIndex = 0;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.querySelector('[data-modal-content]').innerHTML = '';
  document.body.classList.remove('no-scroll');
}

let activeModalGallery = [];
let activeModalGalleryIndex = 0;

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[char]));

const renderModalGallery = (items, index) => {
  if (!items.length) return;
  activeModalGallery = items;
  activeModalGalleryIndex = (index + items.length) % items.length;
  const item = items[activeModalGalleryIndex];
  const safeSrc = escapeHtml(item.src);
  const safeTitle = escapeHtml(item.title || '');
  const controls = items.length > 1 ? `
    <button class="modal-gallery-arrow modal-gallery-prev" type="button" data-modal-gallery-prev aria-label="Önceki fotoğraf">←</button>
    <button class="modal-gallery-arrow modal-gallery-next" type="button" data-modal-gallery-next aria-label="Sonraki fotoğraf">→</button>` : '';
  openModal(`
    <div class="modal-gallery-wrap">
      <figure class="modal-figure">
        <img src="${safeSrc}" alt="${safeTitle}">
        <figcaption class="modal-gallery-caption"><span>${safeTitle}</span><span>${activeModalGalleryIndex + 1} / ${items.length}</span></figcaption>
      </figure>
      ${controls}
    </div>`);
  modal?.querySelector('[data-modal-gallery-prev]')?.addEventListener('click', () => renderModalGallery(activeModalGallery, activeModalGalleryIndex - 1));
  modal?.querySelector('[data-modal-gallery-next]')?.addEventListener('click', () => renderModalGallery(activeModalGallery, activeModalGalleryIndex + 1));
};

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
  if (!modal?.classList.contains('is-open') || activeModalGallery.length < 2) return;
  if (event.key === 'ArrowLeft') renderModalGallery(activeModalGallery, activeModalGalleryIndex - 1);
  if (event.key === 'ArrowRight') renderModalGallery(activeModalGallery, activeModalGalleryIndex + 1);
});

document.querySelectorAll('[data-lightbox-image]').forEach((button) => {
  button.addEventListener('click', () => {
    const gallery = button.closest('[data-project-gallery]');
    const galleryButtons = gallery ? [...gallery.querySelectorAll('[data-lightbox-image]')] : [button];
    const items = galleryButtons.map((item) => ({
      src: item.dataset.lightboxImage,
      title: item.dataset.lightboxTitle || ''
    }));
    const index = Math.max(0, galleryButtons.indexOf(button));
    renderModalGallery(items, index);
  });
});

document.querySelectorAll('[data-youtube-button]').forEach((button) => {
  button.addEventListener('click', () => {
    const url = resolveYoutubeUrl(button);
    if (!isRealYoutubeLink(url)) return;
    const embed = youtubeEmbedUrl(url);
    openModal(`<div class="modal-video"><iframe src="${embed}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`);
  });
});

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

quoteForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(quoteForm);
  const name = formData.get('name') || '';
  const phone = formData.get('phone') || '';
  const service = formData.get('service') || '';
  const message = formData.get('message') || '';
  const text = [
    'Merhaba Skytek Teknoloji, web siteniz üzerinden proje görüşmesi yapmak istiyorum.',
    '',
    `Ad/Firma: ${name}`,
    `Telefon: ${phone}`,
    `İlgilendiğim sistem: ${service}`,
    `Proje detayları: ${message}`,
  ].join('\n');
  const whatsappNumber = '905065664093';
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
});



// Geçmiş projeler: fotoğraf geçişi + büyütme — mobil stabil sürüm
const skytekMobileQuery = window.matchMedia?.('(max-width: 760px)');

document.querySelectorAll('[data-project-gallery]').forEach((gallery) => {
  const slides = [...gallery.querySelectorAll('[data-project-slide]')];
  const dots = [...gallery.querySelectorAll('[data-project-dot]')];
  const thumbs = [...gallery.querySelectorAll('[data-gallery-thumb]')];
  const prev = gallery.querySelector('[data-project-prev]');
  const next = gallery.querySelector('[data-project-next]');
  const current = gallery.querySelector('[data-project-current]');
  if (slides.length < 1) return;

  let active = 0;
  let timer = null;
  let touchStartX = null;
  let touchStartY = null;
  let swiped = false;
  let inViewport = true;
  let interacting = false;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const warmImage = (index) => {
    const img = slides[(index + slides.length) % slides.length]?.querySelector('img');
    if (!img) return;
    img.loading = 'eager';
    img.decode?.().catch(() => {});
  };

  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === active);
      slide.setAttribute('aria-hidden', i === active ? 'false' : 'true');
      slide.tabIndex = i === active ? 0 : -1;
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === active);
      dot.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle('is-active', i === active);
      thumb.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
    if (current) current.textContent = String(active + 1);
    warmImage(active);
    warmImage(active + 1);
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const start = () => {
    stop();
    if (reducedMotion || slides.length <= 1 || !inViewport || document.hidden || interacting) return;
    const delay = skytekMobileQuery?.matches ? 6800 : 5200;
    timer = window.setInterval(() => show(active + 1), delay);
  };

  prev?.addEventListener('click', () => { show(active - 1); start(); });
  next?.addEventListener('click', () => { show(active + 1); start(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); start(); }));
  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => { show(i); start(); }));

  gallery.addEventListener('mouseenter', () => { interacting = true; stop(); });
  gallery.addEventListener('mouseleave', () => { interacting = false; start(); });
  gallery.addEventListener('focusin', () => { interacting = true; stop(); });
  gallery.addEventListener('focusout', () => { interacting = false; start(); });

  gallery.addEventListener('touchstart', (event) => {
    const point = event.changedTouches?.[0];
    touchStartX = point?.clientX ?? null;
    touchStartY = point?.clientY ?? null;
    swiped = false;
    interacting = true;
    stop();
  }, { passive: true });

  gallery.addEventListener('touchend', (event) => {
    if (touchStartX === null || touchStartY === null) {
      interacting = false;
      return start();
    }
    const point = event.changedTouches?.[0];
    const dx = (point?.clientX ?? touchStartX) - touchStartX;
    const dy = (point?.clientY ?? touchStartY) - touchStartY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      swiped = true;
      show(active + (dx < 0 ? 1 : -1));
    }
    touchStartX = null;
    touchStartY = null;
    window.setTimeout(() => { interacting = false; start(); }, 180);
  }, { passive: true });

  // Yatay swipe sonrasında oluşan sentetik click lightbox'ı yanlışlıkla açmasın.
  gallery.addEventListener('click', (event) => {
    if (!swiped) return;
    if (event.target.closest('[data-project-slide]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    swiped = false;
  }, true);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      inViewport = entries[0]?.isIntersecting ?? true;
      if (inViewport) start(); else stop();
    }, { threshold: 0.18, rootMargin: '120px 0px' });
    observer.observe(gallery);
  }

  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  show(0);
  start();
});

// Image carousel: Ne yapıyoruz? — swipe + görünürken autoplay
 document.querySelectorAll('[data-service-slider]').forEach((slider) => {
  const slides = [...slider.querySelectorAll('[data-slide]')];
  const dots = [...slider.querySelectorAll('[data-slider-dot]')];
  const prev = slider.querySelector('[data-slider-prev]');
  const next = slider.querySelector('[data-slider-next]');
  if (!slides.length) return;

  let active = 0;
  let timer = null;
  let touchStartX = null;
  let touchStartY = null;
  let inViewport = true;
  let interacting = false;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const warmImage = (index) => {
    const img = slides[(index + slides.length) % slides.length]?.querySelector('img');
    if (!img) return;
    img.loading = 'eager';
    img.decode?.().catch(() => {});
  };

  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === active);
      slide.setAttribute('aria-hidden', i === active ? 'false' : 'true');
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === active);
      dot.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
    warmImage(active);
    warmImage(active + 1);
  };

  const stop = () => { if (timer) window.clearInterval(timer); timer = null; };
  const start = () => {
    stop();
    if (reducedMotion || slides.length <= 1 || !inViewport || document.hidden || interacting) return;
    timer = window.setInterval(() => show(active + 1), skytekMobileQuery?.matches ? 6200 : 4600);
  };

  prev?.addEventListener('click', () => { show(active - 1); start(); });
  next?.addEventListener('click', () => { show(active + 1); start(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); start(); }));

  slider.addEventListener('mouseenter', () => { interacting = true; stop(); });
  slider.addEventListener('mouseleave', () => { interacting = false; start(); });
  slider.addEventListener('focusin', () => { interacting = true; stop(); });
  slider.addEventListener('focusout', () => { interacting = false; start(); });
  slider.addEventListener('touchstart', (event) => {
    const point = event.changedTouches?.[0];
    touchStartX = point?.clientX ?? null;
    touchStartY = point?.clientY ?? null;
    interacting = true;
    stop();
  }, { passive: true });
  slider.addEventListener('touchend', (event) => {
    const point = event.changedTouches?.[0];
    if (touchStartX !== null && touchStartY !== null) {
      const dx = (point?.clientX ?? touchStartX) - touchStartX;
      const dy = (point?.clientY ?? touchStartY) - touchStartY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.15) show(active + (dx < 0 ? 1 : -1));
    }
    touchStartX = touchStartY = null;
    window.setTimeout(() => { interacting = false; start(); }, 180);
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      inViewport = entries[0]?.isIntersecting ?? true;
      if (inViewport) start(); else stop();
    }, { threshold: 0.18, rootMargin: '120px 0px' });
    observer.observe(slider);
  }
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  show(0);
  start();
});
