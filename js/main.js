document.addEventListener('DOMContentLoaded', () => {

  // ===== LAZY LOADING FOR IMAGES =====
  document.querySelectorAll('img:not(.logo img)').forEach((img, i) => {
    if (i > 0) img.loading = 'lazy';
  });

  // ===== STICKY HEADER =====
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ===== MOBILE MENU =====
  const burger = document.querySelector('.burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.classList.toggle('no-scroll');
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('no-scroll');
      });
    });
  }

  // ===== REVEAL ON SCROLL =====
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(el => revealObserver.observe(el));
  }

  // ===== PROMO SLIDER =====
  const sliderTrack = document.querySelector('.slider-track');
  const slides = document.querySelectorAll('.slide');
  const sliderDots = document.querySelectorAll('.slider-dot');
  const prevBtn = document.querySelector('.slider-prev');
  const nextBtn = document.querySelector('.slider-next');
  let currentSlide = 0;
  let sliderInterval;

  function goToSlide(index) {
    if (!slides.length) return;
    currentSlide = ((index % slides.length) + slides.length) % slides.length;
    sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    sliderDots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
  }

  function startSlider() {
    sliderInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
  }

  function resetSlider() {
    clearInterval(sliderInterval);
    startSlider();
  }

  if (slides.length) {
    if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(currentSlide - 1); resetSlider(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(currentSlide + 1); resetSlider(); });
    sliderDots.forEach((dot, i) => dot.addEventListener('click', () => { goToSlide(i); resetSlider(); }));
    startSlider();
  }

  // ===== REVIEWS CAROUSEL =====
  const reviewsTrack = document.querySelector('.reviews-track');
  const reviewCards = document.querySelectorAll('.reviews-track .review-card');
  const reviewPrev = document.querySelector('.review-prev');
  const reviewNext = document.querySelector('.review-next');
  let reviewIndex = 0;

  function getReviewsVisible() {
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 768) return 2;
    return 3;
  }

  function moveReviews(index) {
    if (!reviewCards.length) return;
    const visible = getReviewsVisible();
    const max = Math.max(0, reviewCards.length - visible);
    reviewIndex = Math.min(Math.max(index, 0), max);
    const cardWidth = reviewCards[0].offsetWidth + 16;
    reviewsTrack.style.transform = `translateX(-${reviewIndex * cardWidth}px)`;
  }

  if (reviewPrev) reviewPrev.addEventListener('click', () => moveReviews(reviewIndex - 1));
  if (reviewNext) reviewNext.addEventListener('click', () => moveReviews(reviewIndex + 1));

  // ===== GALLERY FILTER =====
  const filterTabs = document.querySelectorAll('.gallery-filter .filter-tab');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      galleryItems.forEach(item => {
        if (cat === 'all' || item.dataset.category === cat) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });

  // ===== CATALOG FILTER TABS =====
  const catalogTabs = document.querySelectorAll('.catalog-filter .filter-tab');
  catalogTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      catalogTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      if (target === 'all') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const section = document.querySelector(target);
        if (section) {
          const offset = header ? header.offsetHeight + 60 : 100;
          window.scrollTo({ top: section.offsetTop - offset, behavior: 'smooth' });
        }
      }
    });
  });

  // ===== LIGHTBOX =====
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('img') : null;
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');
  let lightboxItems = [];
  let lightboxIndex = 0;

  function openLightbox(index, items) {
    lightboxItems = items || [...document.querySelectorAll('.gallery-item:not(.hidden)')];
    lightboxIndex = index;
    const item = lightboxItems[lightboxIndex];
    if (!item) return;
    const img = item.querySelector('img') || item;
    if (img && lightboxImg) {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
    }
    if (lightbox) lightbox.classList.add('active');
    document.body.classList.add('no-scroll');
  }

  function closeLightbox() {
    if (lightbox) lightbox.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  // Gallery items lightbox
  document.querySelectorAll('.gallery-item').forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  // Product card images lightbox
  const productCardImgs = [...document.querySelectorAll('.product-card img')];
  productCardImgs.forEach((img, i) => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(i, productCardImgs);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  function getLightboxItemImg(item) {
    return item.querySelector ? (item.querySelector('img') || item) : item;
  }

  if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    const img = getLightboxItemImg(lightboxItems[lightboxIndex]);
    if (img && lightboxImg) { lightboxImg.src = img.src; }
  });

  if (lightboxNext) lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
    const img = getLightboxItemImg(lightboxItems[lightboxIndex]);
    if (img && lightboxImg) { lightboxImg.src = img.src; }
  });

  // ===== MODALS =====
  const modalOverlay = document.querySelector('.modal-overlay');
  const modalCloseBtn = document.querySelector('.modal-close');
  const callbackBtns = document.querySelectorAll('[data-modal="callback"]');

  function openModal() {
    if (modalOverlay) {
      modalOverlay.classList.add('active');
      document.body.classList.add('no-scroll');
    }
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.classList.remove('no-scroll');
      const success = modalOverlay.querySelector('.form-success');
      if (success) success.classList.remove('show');
      const form = modalOverlay.querySelector('form');
      if (form) form.reset();
    }
  }

  callbackBtns.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  // Review modal
  const reviewModal = document.querySelector('.review-modal-overlay');
  const reviewModalClose = document.querySelector('.review-modal-close');
  const reviewModalBtn = document.querySelector('[data-modal="review"]');

  if (reviewModalBtn && reviewModal) {
    reviewModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      reviewModal.classList.add('active');
      document.body.classList.add('no-scroll');
    });
  }
  if (reviewModalClose) {
    reviewModalClose.addEventListener('click', () => {
      reviewModal.classList.remove('active');
      document.body.classList.remove('no-scroll');
    });
  }
  if (reviewModal) {
    reviewModal.addEventListener('click', (e) => {
      if (e.target === reviewModal) {
        reviewModal.classList.remove('active');
        document.body.classList.remove('no-scroll');
      }
    });
  }

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeLightbox();
      if (reviewModal) {
        reviewModal.classList.remove('active');
        document.body.classList.remove('no-scroll');
      }
    }
  });

  // Sanitize text inputs on blur
  document.querySelectorAll('input[type="text"], textarea').forEach(input => {
    input.addEventListener('blur', () => {
      input.value = input.value.replace(/[<>"'&]/g, '');
    });
  });

  // Rate limiting for form submissions
  const formSubmitTimestamps = new WeakMap();
  const FORM_COOLDOWN = 5000; // 5 seconds between submissions

  // ===== FORM SUBMISSIONS =====
  const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/27753860d2568c45b3db2e6a7c472621e5f125b837323e83fb140b00550b1abe';

  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Rate limiting
      const lastSubmit = formSubmitTimestamps.get(form) || 0;
      if (Date.now() - lastSubmit < FORM_COOLDOWN) return;
      formSubmitTimestamps.set(form, Date.now());

      // Sanitize all inputs before processing
      form.querySelectorAll('input[type="text"], textarea').forEach(input => {
        input.value = input.value.replace(/[<>"'&]/g, '').trim();
      });

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
      }

      // Collect form data
      const formData = new FormData(form);
      formData.append('_subject', 'Новая заявка с сайта Кухни на заказ');
      formData.append('_template', 'table');
      formData.append('_captcha', 'false');
      formData.append('_honey', '');
      formData.append('Страница', document.title + ' (' + window.location.pathname + ')');

      try {
        const response = await fetch(FORMSUBMIT_URL, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData
        });

        const success = form.querySelector('.form-success') || form.closest('.modal, .cta-section, .contact-form-section, section')?.querySelector('.form-success');

        if (response.ok) {
          if (success) {
            success.classList.add('show');
            setTimeout(() => success.classList.remove('show'), 4000);
          }
          form.reset();
        } else {
          if (success) {
            success.textContent = 'Ошибка отправки. Позвоните нам!';
            success.classList.add('show');
            setTimeout(() => {
              success.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
              success.classList.remove('show');
            }, 4000);
          }
        }
      } catch {
        const success = form.querySelector('.form-success') || form.closest('.modal, .cta-section, .contact-form-section, section')?.querySelector('.form-success');
        if (success) {
          success.textContent = 'Ошибка сети. Позвоните нам!';
          success.classList.add('show');
          setTimeout(() => {
            success.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
            success.classList.remove('show');
          }, 4000);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  });

  // ===== COUNTER ANIMATION =====
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = el.dataset.count;
          const isPercent = target.includes('%');
          const isPlus = target.includes('+');
          const num = parseInt(target.replace(/[^0-9]/g, ''));
          const suffix = target.replace(/[0-9]/g, '');
          let current = 0;
          const step = Math.max(1, Math.floor(num / 60));
          const timer = setInterval(() => {
            current += step;
            if (current >= num) {
              current = num;
              clearInterval(timer);
            }
            el.textContent = current + suffix;
          }, 25);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  // ===== PHONE MASK =====
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.startsWith('8')) value = '7' + value.slice(1);
      if (!value.startsWith('7')) value = '7' + value;
      let formatted = '+7';
      if (value.length > 1) formatted += ' (' + value.slice(1, 4);
      if (value.length > 4) formatted += ') ' + value.slice(4, 7);
      if (value.length > 7) formatted += '-' + value.slice(7, 9);
      if (value.length > 9) formatted += '-' + value.slice(9, 11);
      e.target.value = formatted;
    });

    input.addEventListener('focus', (e) => {
      if (!e.target.value) e.target.value = '+7';
    });
  });

});
