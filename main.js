// ===================================================
// COMFORT FACTORY - PREMIUM FASHION ANIMATION ENGINE
// ===================================================

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. NAVBAR SCROLL & LOGO ENTRANCE
  // ==========================================
  const header = document.querySelector('.header');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    header.classList.toggle('scrolled', currentScrollY > 40);
    lastScrollY = currentScrollY;
  }, { passive: true });

  // ==========================================
  // 2. HERO SLIDESHOW ANIMATION (Ken Burns & Crossfade)
  // ==========================================
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots = document.querySelectorAll('.hero-dots .dot');
  let currentSlideIndex = 0;
  let slideInterval = null;
  const slideDuration = 5500; // 5.5s per slide

  function showSlide(index) {
    if (!heroSlides.length) return;
    currentSlideIndex = (index + heroSlides.length) % heroSlides.length;

    heroSlides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlideIndex);
    });

    heroDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlideIndex);
      const progress = dot.querySelector('.dot-progress');
      if (progress) {
        progress.style.transition = 'none';
        progress.style.width = '0%';
        if (i === currentSlideIndex) {
          // Trigger smooth CSS transition fill
          setTimeout(() => {
            progress.style.transition = `width ${slideDuration}ms linear`;
            progress.style.width = '100%';
          }, 40);
        }
      }
    });
  }

  function startSlideTimer() {
    clearInterval(slideInterval);
    showSlide(currentSlideIndex);
    slideInterval = setInterval(() => {
      showSlide(currentSlideIndex + 1);
    }, slideDuration);
  }

  if (heroDots.length > 0) {
    heroDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        currentSlideIndex = i;
        startSlideTimer();
      });
    });

    startSlideTimer();
  }

  // ==========================================
  // 3. MOBILE MENU & ACCORDION ANIMATIONS
  // ==========================================
  const menuToggle = document.querySelector('.menu-toggle');
  const navMobile = document.querySelector('.nav-mobile');
  const mobileOverlay = document.querySelector('.mobile-overlay');
  const closeMenu = document.querySelector('.close-menu');

  function openMobileMenu() {
    navMobile.classList.add('open');
    mobileOverlay.classList.add('visible');
    menuToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    navMobile.classList.remove('open');
    mobileOverlay.classList.remove('visible');
    menuToggle.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      navMobile.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
    });
  }

  if (closeMenu) closeMenu.addEventListener('click', closeMobileMenu);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

  // Mobile Submenu Accordion Toggles
  document.querySelectorAll('.mobile-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const parentItem = btn.closest('.mobile-nav-item');
      const wasOpen = parentItem.classList.contains('open');

      // Close all other mobile submenus smoothly
      document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('open');
      });

      if (!wasOpen) {
        parentItem.classList.add('open');
      }
    });
  });

  // ==========================================
  // 4. SCROLL REVEALS & STAGGER OBSERVER
  // ==========================================
  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  function observeElements() {
    const revealTargets = document.querySelectorAll(
      '.category-card-item, .product-card, .testimonial-card, .faq-item, .store-banner, .categories-section, .section-header'
    );
    revealTargets.forEach((el, index) => {
      el.classList.add('reveal-on-scroll');
      // Subtle stagger delay for grid items
      const delay = (index % 4) * 0.08;
      el.style.transitionDelay = `${delay}s`;
      revealObserver.observe(el);
    });
  }

  observeElements();

  // Subtle Parallax Effect on Store Banner
  const storeBannerImg = document.querySelector('.store-banner-inner img');
  if (storeBannerImg) {
    window.addEventListener('scroll', () => {
      const bannerRect = storeBannerImg.parentElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (bannerRect.top < windowHeight && bannerRect.bottom > 0) {
        const progress = (windowHeight - bannerRect.top) / (windowHeight + bannerRect.height);
        const translateY = (progress - 0.5) * 40;
        storeBannerImg.style.transform = `translateY(${translateY}px) scale(1.05)`;
      }
    }, { passive: true });
  }

  // ==========================================
  // 5. TOAST NOTIFICATION SYSTEM
  // ==========================================
  const toastContainer = document.getElementById('toast-container');

  function showToast(product, size) {
    if (!toastContainer || !product) return;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
      <img src="${product.image}" class="toast-thumb" alt="${product.name}">
      <div class="toast-content">
        <div class="toast-title">${product.name}</div>
        <div class="toast-sub">✓ Added to cart ${size ? `• Size ${size}` : ''}</div>
      </div>
      <button class="toast-btn-view" type="button">View Cart</button>
    `;

    toastContainer.appendChild(toast);

    // Trigger slide-in animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    toast.querySelector('.toast-btn-view').addEventListener('click', () => {
      openCart();
      dismissToast(toast);
    });

    // Auto dismiss after 3.2 seconds
    setTimeout(() => {
      dismissToast(toast);
    }, 3200);
  }

  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  }

  // ==========================================
  // 6. CATEGORY & SUB-TYPE ENGINE
  // ==========================================
  let currentCategory = 'shirts';
  let currentSubcategory = 'all';
  let currentSize = 'all';
  let currentColor = 'all';
  let currentSort = 'featured';

  const typesCategoryNameEl = document.getElementById('types-category-name');
  const typesChipsWrapEl = document.getElementById('types-chips-wrap');
  const bcCategoryEl = document.getElementById('bc-category');
  const bcSubcategoryEl = document.getElementById('bc-subcategory');
  const listingTitleEl = document.getElementById('listing-title');
  const listingDescEl = document.getElementById('listing-description');
  const productCountEl = document.getElementById('product-count');
  const listingGridEl = document.getElementById('listing-products-grid');

  const filterSizeSelect = document.getElementById('filter-size');
  const filterColorSelect = document.getElementById('filter-color');
  const sortSelect = document.getElementById('sort-select');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  // Render Subcategory Type Chips with Active Animations
  function renderTypesChips() {
    if (!typesChipsWrapEl) return;
    const catInfo = categoryData[currentCategory];
    if (!catInfo) return;

    if (typesCategoryNameEl) {
      typesCategoryNameEl.textContent = catInfo.name;
    }

    let chipsHtml = `
      <button type="button" class="type-chip-btn ${currentSubcategory === 'all' ? 'active' : ''}" data-type="all">
        All ${catInfo.name}
      </button>
    `;

    catInfo.types.forEach(t => {
      const isActive = currentSubcategory === t.id;
      chipsHtml += `
        <button type="button" class="type-chip-btn ${isActive ? 'active' : ''}" data-type="${t.id}" title="${t.desc}">
          <span>${t.name}</span>
        </button>
      `;
    });

    typesChipsWrapEl.innerHTML = chipsHtml;

    // Attach click listeners to chips
    typesChipsWrapEl.querySelectorAll('.type-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const typeId = btn.dataset.type;
        setCategoryAndType(currentCategory, typeId, true);
      });
    });
  }

  // Render Products into the Dedicated Listing Section with Smooth Fade/Slide
  function renderProductsListing() {
    if (!listingGridEl) return;

    // Smooth transition out
    listingGridEl.classList.add('filtering-out');

    setTimeout(() => {
      let filtered = getAllProducts().filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());

      if (currentSubcategory !== 'all') {
        filtered = filtered.filter(p => p.subcategory && p.subcategory.toLowerCase() === currentSubcategory.toLowerCase());
      }

      // Size filter
      if (currentSize !== 'all') {
        filtered = filtered.filter(p => p.sizes && p.sizes.includes(currentSize));
      }

      // Color filter
      if (currentColor !== 'all') {
        filtered = filtered.filter(p => p.colors && p.colors.some(c => c.toLowerCase().includes(currentColor.toLowerCase())));
      }

      // Sorting
      if (currentSort === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (currentSort === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (currentSort === 'name-asc') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Update Counts & Headers
      if (productCountEl) productCountEl.textContent = filtered.length;

      const catInfo = categoryData[currentCategory];
      const catName = catInfo ? catInfo.name : 'Collection';
      
      let subName = `All ${catName}`;
      let subDesc = `Explore our premium ${catName.toLowerCase()} crafted with superior fabrics and modern fits.`;

      if (currentSubcategory !== 'all' && catInfo) {
        const foundType = catInfo.types.find(t => t.id === currentSubcategory);
        if (foundType) {
          subName = foundType.name;
          subDesc = `${foundType.name} — ${foundType.desc}`;
        }
      }

      if (bcCategoryEl) bcCategoryEl.textContent = catName;
      if (bcSubcategoryEl) bcSubcategoryEl.textContent = subName;
      if (listingTitleEl) listingTitleEl.textContent = currentSubcategory === 'all' ? `${catName} Collection` : subName;
      if (listingDescEl) listingDescEl.textContent = subDesc;

      if (filtered.length === 0) {
        listingGridEl.innerHTML = `
          <div class="empty-products">
            <p>No products match the selected filters in this style.</p>
            <button type="button" class="btn-clear-empty" id="btn-clear-empty">Reset Filters</button>
          </div>
        `;
        const btnClear = document.getElementById('btn-clear-empty');
        if (btnClear) {
          btnClear.addEventListener('click', resetFilters);
        }
        listingGridEl.classList.remove('filtering-out');
        listingGridEl.classList.add('filtering-in');
        return;
      }

      let html = '';
      filtered.forEach((p, idx) => {
        const typeObj = catInfo ? catInfo.types.find(t => t.id === p.subcategory) : null;
        const typeLabel = typeObj ? typeObj.name : (p.subcategory ? p.subcategory.replace('-', ' ') : catName);

        const sizesHtml = p.sizes ? p.sizes.map((s, sIdx) => `
          <button type="button" class="size-btn ${sIdx === 0 ? 'active' : ''}" data-size="${s}">${s}</button>
        `).join('') : '';

        const colorsHtml = p.colors ? p.colors.map(c => `
          <span class="color-tag">${c}</span>
        `).join('') : '';

        html += `
          <div class="product-card reveal-on-scroll revealed" data-id="${p.id}" data-category="${p.category}" data-subcategory="${p.subcategory}" style="transition-delay: ${(idx % 4) * 0.08}s;">
            <div class="product-image">
              <img src="${p.image}" alt="${p.name}" loading="lazy">
              ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
            </div>
            <div class="product-info">
              <div class="product-type-tag">${typeLabel}</div>
              <h3>${p.name}</h3>
              <div class="product-price">
                <span class="current">₹${p.price.toLocaleString('en-IN')}</span>
                ${p.originalPrice ? `<span class="original">₹${p.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                ${p.originalPrice ? `<span class="discount">${Math.round((1 - p.price / p.originalPrice) * 100)}% off</span>` : ''}
              </div>
              <div class="product-options-row">
                ${sizesHtml ? `<div class="size-selection-wrap"><span class="size-selection-label">Size:</span> ${sizesHtml}</div>` : ''}
                ${colorsHtml ? `<div class="colors-selection-wrap">${colorsHtml}</div>` : ''}
              </div>
              <div class="product-actions">
                <button class="btn-add-cart" data-id="${p.id}">Add to Cart</button>
                <button class="btn-buy-now" data-id="${p.id}">Buy it Now</button>
              </div>
            </div>
          </div>
        `;
      });

      listingGridEl.innerHTML = html;
      attachCardListeners(listingGridEl);

      // Smooth transition in
      listingGridEl.classList.remove('filtering-out');
      listingGridEl.classList.add('filtering-in');
    }, 220);
  }

  // Attach card event listeners (Size selection, Add to Cart, Buy Now)
  function attachCardListeners(container) {
    // Size selection pills with micro-interaction
    container.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const parent = btn.closest('.size-selection-wrap');
        parent.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Add to Cart with Cart Shake & Toast Notification
    container.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.product-card');
        const id = card.dataset.id;
        const selectedSizeBtn = card.querySelector('.size-btn.active');
        const selectedSize = selectedSizeBtn ? selectedSizeBtn.dataset.size : null;
        const product = getProductById(id);

        addToCart(id, selectedSize);

        // Animate Cart Icon in Header
        const headerCartBtn = document.getElementById('cart-btn');
        if (headerCartBtn) {
          headerCartBtn.classList.remove('animating-cart');
          void headerCartBtn.offsetWidth; // Trigger reflow
          headerCartBtn.classList.add('animating-cart');
          setTimeout(() => headerCartBtn.classList.remove('animating-cart'), 700);
        }

        // Show Luxury Toast Notification
        if (product) {
          showToast(product, selectedSize);
        }

        // Visual feedback on the button
        const originalText = btn.textContent;
        btn.textContent = 'Added ✓';
        btn.style.background = '#d4af37';
        btn.style.color = '#0a0a0a';
        btn.style.borderColor = '#d4af37';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 1200);
      });
    });

    // Buy Now
    container.querySelectorAll('.btn-buy-now').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.product-card');
        const id = card.dataset.id;
        const selectedSizeBtn = card.querySelector('.size-btn.active');
        const selectedSize = selectedSizeBtn ? selectedSizeBtn.dataset.size : null;
        closeCart();
        openCheckout([{ id: id, qty: 1, size: selectedSize }]);
      });
    });
  }

  // Set Category and Subcategory Type with scroll & URL hash
  function setCategoryAndType(category, subcategory = 'all', shouldScroll = false) {
    if (!categoryData[category]) category = 'shirts';

    currentCategory = category;
    currentSubcategory = subcategory;

    // Update active state on Homepage Category Cards
    document.querySelectorAll('.category-card-item').forEach(card => {
      card.classList.toggle('active', card.dataset.category === category);
    });

    renderTypesChips();
    renderProductsListing();

    if (shouldScroll) {
      const listingSection = document.getElementById('product-listing');
      if (listingSection) {
        listingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  function resetFilters() {
    currentSize = 'all';
    currentColor = 'all';
    currentSort = 'featured';
    if (filterSizeSelect) filterSizeSelect.value = 'all';
    if (filterColorSelect) filterColorSelect.value = 'all';
    if (sortSelect) sortSelect.value = 'featured';
    renderProductsListing();
  }

  if (filterSizeSelect) {
    filterSizeSelect.addEventListener('change', (e) => {
      currentSize = e.target.value;
      renderProductsListing();
    });
  }

  if (filterColorSelect) {
    filterColorSelect.addEventListener('change', (e) => {
      currentColor = e.target.value;
      renderProductsListing();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProductsListing();
    });
  }

  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', resetFilters);
  }

  // Category Cards Click (Homepage Category Cards)
  document.querySelectorAll('.category-card-item').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.category;
      setCategoryAndType(cat, 'all', true);
    });
    // Keyboard accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const cat = card.dataset.category;
        setCategoryAndType(cat, 'all', true);
      }
    });
  });

  // Handle URL Hash Navigation & Links across site
  function handleHashNavigation(hash) {
    if (!hash) return;
    const cleanHash = hash.replace(/^#/, '');

    // Pattern: category/<cat>/<subcat> or category/<cat>
    if (cleanHash.startsWith('category/')) {
      const parts = cleanHash.split('/');
      const cat = parts[1];
      const sub = parts[2] || 'all';
      if (categoryData[cat]) {
        setCategoryAndType(cat, sub, true);
        return;
      }
    }

    // Direct Category IDs
    if (cleanHash === 'shirts' || cleanHash === 'tshirts' || cleanHash === 'pants') {
      setCategoryAndType(cleanHash, 'all', true);
      return;
    }

    // Direct Subcategory IDs (e.g. #casual-shirt, #baggy-pants)
    for (const [catKey, catVal] of Object.entries(categoryData)) {
      const matchedType = catVal.types.find(t => t.id === cleanHash);
      if (matchedType) {
        setCategoryAndType(catKey, matchedType.id, true);
        return;
      }
    }
  }

  // Listen to all navigation links (Desktop & Mobile)
  document.querySelectorAll('a[href^="#category/"], .dropdown-menu a, .mobile-subnav a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#category/')) {
        e.preventDefault();
        handleHashNavigation(href);
        closeMobileMenu();
      }
    });
  });

  // Check URL hash on page load
  if (window.location.hash) {
    handleHashNavigation(window.location.hash);
  } else {
    // Initial render
    setCategoryAndType('shirts', 'all', false);
  }

  window.addEventListener('hashchange', () => {
    handleHashNavigation(window.location.hash);
  });

  // Attach card listeners to any static product cards existing on the page (e.g. New Arrivals)
  attachCardListeners(document.body);

  // ==========================================
  // 7. E-COMMERCE CART & CHECKOUT
  // ==========================================
  let cart = JSON.parse(localStorage.getItem('comfort_cart')) || [];

  function saveCart() {
    localStorage.setItem('comfort_cart', JSON.stringify(cart));
  }

  function getCartTotal() {
    return cart.reduce((total, item) => {
      const product = getProductById(item.id);
      return total + (product ? product.price * item.qty : 0);
    }, 0);
  }

  function updateCartBadge() {
    const badge = document.querySelector('.cart-count');
    if (!badge) return;
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = totalQty;
    // Pop animation
    badge.classList.remove('pop');
    void badge.offsetWidth; // Reflow
    badge.classList.add('pop');
  }

  function addToCart(id, size = null) {
    const existing = cart.find(i => i.id === id && (!size || i.size === size));
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id: id, qty: 1, size: size });
    }
    saveCart();
    updateCartBadge();
    renderCartDrawer();
  }

  // Cart Drawer Elements
  const cartBtn = document.getElementById('cart-btn');
  const cartDrawer = document.querySelector('.cart-drawer');
  const cartOverlay = document.querySelector('.cart-drawer-overlay');
  const cartClose = document.querySelector('.cart-drawer-close');

  function openCart() {
    if (!cartDrawer || !cartOverlay) return;
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    if (!cartDrawer || !cartOverlay) return;
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  function renderCartDrawer() {
    const body = document.querySelector('.cart-drawer-body');
    const totalPriceEl = document.getElementById('cart-total-price');
    if (!body || !totalPriceEl) return;

    if (cart.length === 0) {
      body.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#888;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" style="margin-bottom:12px;"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <p style="font-size:1rem; font-weight:500;">Your shopping bag is empty</p>
        </div>
      `;
      totalPriceEl.textContent = '₹0';
      return;
    }

    let html = '';
    cart.forEach(item => {
      const p = getProductById(item.id);
      if (!p) return;
      html += `
        <div class="cart-item" data-cart-id="${item.id}" data-size="${item.size || ''}">
          <img src="${p.image}" class="cart-item-img" alt="${p.name}">
          <div class="cart-item-info">
            <div>
              <div class="cart-item-title">${p.name}</div>
              ${item.size ? `<div style="font-size:0.75rem; color:#888; margin-top:2px;">Size: ${item.size}</div>` : ''}
              <div class="cart-item-price">₹${p.price.toLocaleString('en-IN')}</div>
            </div>
            <div class="cart-item-actions">
              <div class="qty-ctrl">
                <button class="qty-btn minus" data-id="${item.id}" data-size="${item.size || ''}">-</button>
                <div class="qty-val">${item.qty}</div>
                <button class="qty-btn plus" data-id="${item.id}" data-size="${item.size || ''}">+</button>
              </div>
              <span class="remove-btn" data-id="${item.id}" data-size="${item.size || ''}">Remove</span>
            </div>
          </div>
        </div>
      `;
    });

    body.innerHTML = html;
    totalPriceEl.textContent = `₹${getCartTotal().toLocaleString('en-IN')}`;

    // Add event listeners for cart quantity and remove buttons
    body.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const size = btn.dataset.size || null;
        const item = cart.find(i => i.id === id && (!size || i.size === size));
        if (!item) return;

        if (btn.classList.contains('plus')) {
          item.qty++;
          saveCart();
          updateCartBadge();
          renderCartDrawer();
        } else if (btn.classList.contains('minus')) {
          item.qty--;
          if (item.qty <= 0) {
            animateAndRemoveItem(btn.closest('.cart-item'), id, size);
          } else {
            saveCart();
            updateCartBadge();
            renderCartDrawer();
          }
        }
      });
    });

    // Animate item removal
    body.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const size = btn.dataset.size || null;
        animateAndRemoveItem(btn.closest('.cart-item'), id, size);
      });
    });
  }

  function animateAndRemoveItem(itemEl, id, size) {
    if (itemEl) {
      itemEl.classList.add('removing');
      setTimeout(() => {
        cart = cart.filter(i => !(i.id === id && (!size || i.size === size)));
        saveCart();
        updateCartBadge();
        renderCartDrawer();
      }, 350);
    } else {
      cart = cart.filter(i => !(i.id === id && (!size || i.size === size)));
      saveCart();
      updateCartBadge();
      renderCartDrawer();
    }
  }

  // Initial cart render
  updateCartBadge();
  renderCartDrawer();

  // ==========================================
  // 8. CHECKOUT OVERLAY & PAYMENT
  // ==========================================
  const checkoutOverlay = document.getElementById('checkout-overlay');
  const checkoutClose = document.getElementById('checkout-close');
  const checkoutItemsContainer = document.getElementById('checkout-items-container');
  const checkoutSubtotal = document.getElementById('checkout-subtotal');
  const checkoutTotal = document.getElementById('checkout-total');
  const btnPayNow = document.getElementById('btn-pay-now');
  const checkoutForm = document.getElementById('checkout-form');

  let checkoutItems = [];

  function renderCheckoutItems() {
    if (!checkoutItemsContainer || !checkoutSubtotal || !checkoutTotal || !btnPayNow) return;
    let html = '';
    let subtotal = 0;
    checkoutItems.forEach(item => {
      const p = getProductById(item.id);
      if (!p) return;
      subtotal += p.price * item.qty;
      html += `
        <div class="checkout-item">
          <img src="${p.image}" alt="${p.name}">
          <div class="checkout-item-info">
            <div class="checkout-item-title">${p.name}</div>
            ${item.size ? `<div class="checkout-item-qty">Size: ${item.size}</div>` : ''}
            <div class="checkout-item-qty">Qty: ${item.qty}</div>
            <div class="checkout-item-price">₹${(p.price * item.qty).toLocaleString('en-IN')}</div>
          </div>
        </div>
      `;
    });
    checkoutItemsContainer.innerHTML = html;
    checkoutSubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

    const total = subtotal + 55; // Shipping flat rate
    checkoutTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    btnPayNow.textContent = `Pay ₹${total.toLocaleString('en-IN')}`;
  }

  function openCheckout(items) {
    checkoutItems = items;
    renderCheckoutItems();
    if (checkoutOverlay) {
      checkoutOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  if (checkoutClose && checkoutOverlay) {
    checkoutClose.addEventListener('click', () => {
      checkoutOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // Cart Drawer Checkout Button
  const cartCheckoutBtn = document.getElementById('cart-checkout-btn');
  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      closeCart();
      openCheckout([...cart]);
    });
  }

  // Handle Form Submission (Checkout Payment & Admin Order Synchronization)
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      btnPayNow.textContent = 'Processing Secure Payment via Easebuzz...';
      btnPayNow.style.opacity = '0.7';

      // Collect customer information from inputs
      const customerData = {
        name: (document.getElementById('c-name') ? document.getElementById('c-name').value.trim() : 'Customer') || 'Customer',
        email: (document.getElementById('c-email') ? document.getElementById('c-email').value.trim() : 'customer@example.com') || 'customer@example.com',
        phone: (document.getElementById('c-phone') ? document.getElementById('c-phone').value.trim() : '+91 99999 00000') || '+91 99999 00000',
        address: (document.getElementById('c-address') ? document.getElementById('c-address').value.trim() : 'Street Address') || 'Street Address',
        city: (document.getElementById('c-city') ? document.getElementById('c-city').value.trim() : 'City') || 'City',
        pincode: (document.getElementById('c-pin') ? document.getElementById('c-pin').value.trim() : '000000') || '000000'
      };

      const orderItems = checkoutItems.map(item => {
        const p = getProductById(item.id);
        return {
          id: item.id,
          name: p ? p.name : 'Apparel Product',
          size: item.size || 'M',
          color: (p && p.colors && p.colors.length > 0) ? p.colors[0] : 'Standard',
          price: p ? p.price : 999,
          qty: item.qty || 1,
          image: p ? p.image : ''
        };
      });

      const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const shipping = subtotal >= 999 ? 0 : 55;
      const total = subtotal + shipping;

      const orderPayload = {
        customer: customerData,
        items: orderItems,
        subtotal: subtotal,
        shipping: shipping,
        discount: 0,
        total: total,
        paymentMethod: 'Easebuzz / UPI',
        transactionId: `TXN_EB_${Date.now().toString().slice(-8)}`,
        paymentStatus: 'Paid',
        status: 'Confirmed'
      };

      try {
        if (typeof window !== 'undefined' && window.CF_API) {
          await window.CF_API.fetchWithFallback('/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderPayload)
          });
        }
      } catch (err) {
        console.warn('Could not post order to API, fallback to client state:', err);
      }

      setTimeout(() => {
        btnPayNow.style.opacity = '1';
        btnPayNow.textContent = 'Payment Successful!';
        btnPayNow.style.background = '#28a745';
        btnPayNow.style.color = '#fff';

        setTimeout(() => {
          alert('Order placed successfully! Your order has been recorded in our dispatch system.');
          cart = [];
          saveCart();
          updateCartBadge();
          renderCartDrawer();
          window.location.reload();
        }, 900);
      }, 1200);
    });
  }

  // ==========================================
  // 9. SEARCH OVERLAY & FAQ ACCORDION
  // ==========================================
  const searchBtn = document.getElementById('search-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const searchClose = document.getElementById('search-close');
  const searchInput = document.getElementById('search-input');

  if (searchBtn && searchOverlay) {
    searchBtn.addEventListener('click', () => {
      searchOverlay.classList.add('open');
      searchOverlay.style.opacity = '1';
      searchOverlay.style.visibility = 'visible';
      document.body.style.overflow = 'hidden';
      if (searchInput) setTimeout(() => searchInput.focus(), 300);
    });
  }

  if (searchClose && searchOverlay) {
    searchClose.addEventListener('click', () => {
      searchOverlay.classList.remove('open');
      searchOverlay.style.opacity = '0';
      searchOverlay.style.visibility = 'hidden';
      document.body.style.overflow = '';
    });
  }

  // FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (question && answer) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all
        faqItems.forEach(fi => {
          fi.classList.remove('open');
          const ans = fi.querySelector('.faq-answer');
          if (ans) ans.style.maxHeight = '0';
        });

        // Open clicked
        if (!isOpen) {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    }
  });

});
