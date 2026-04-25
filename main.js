// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {

  // ===== HEADER SCROLL EFFECT =====
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ===== HERO SLIDESHOW =====
  const heroSlides = document.querySelector('.hero-slides');
  const dots = document.querySelectorAll('.hero-dots .dot');
  let currentSlide = 0;
  const totalSlides = 2;

  function goToSlide(n) {
    currentSlide = n;
    heroSlides.style.transform = `translateX(-${n * 50}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === n));
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goToSlide(i));
  });

  // Auto-play
  setInterval(() => {
    goToSlide((currentSlide + 1) % totalSlides);
  }, 5000);

  // ===== MOBILE MENU =====
  const menuToggle = document.querySelector('.menu-toggle');
  const navMobile = document.querySelector('.nav-mobile');
  const mobileOverlay = document.querySelector('.mobile-overlay');
  const closeMenu = document.querySelector('.close-menu');

  function openMenu() {
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

  menuToggle.addEventListener('click', () => {
    navMobile.classList.contains('open') ? closeMobileMenu() : openMenu();
  });

  closeMenu.addEventListener('click', closeMobileMenu);
  mobileOverlay.addEventListener('click', closeMobileMenu);

  // ===== FAQ ACCORDION =====
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      faqItems.forEach(fi => {
        fi.classList.remove('open');
        fi.querySelector('.faq-answer').style.maxHeight = '0';
      });

      // Open clicked
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // ===== CART DRAWER =====
  const cartBtn = document.getElementById('cart-btn');
  const cartDrawer = document.querySelector('.cart-drawer');
  const cartOverlay = document.querySelector('.cart-drawer-overlay');
  const cartClose = document.querySelector('.cart-drawer-close');

  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // ===== SEARCH TOGGLE =====
  const searchBtn = document.getElementById('search-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const searchClose = document.getElementById('search-close');
  const searchInput = document.getElementById('search-input');

  searchBtn.addEventListener('click', () => {
    searchOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput.focus(), 300);
  });

  searchClose.addEventListener('click', () => {
    searchOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });

  // ===== SCROLL ANIMATIONS =====
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.product-card, .category-card, .testimonial-card, .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Add animate-in style
  const style = document.createElement('style');
  style.textContent = `.animate-in { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(style);

  // Stagger category cards
  document.querySelectorAll('.category-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.1}s`;
  });

  // Stagger product cards within each grid
  document.querySelectorAll('.products-grid').forEach(grid => {
    grid.querySelectorAll('.product-card').forEach((card, i) => {
      card.style.transitionDelay = `${i * 0.1}s`;
    });
  });

  // ===== E-COMMERCE LOGIC =====
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
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = totalQty;
  }

  function renderCartDrawer() {
    const body = document.querySelector('.cart-drawer-body');
    const totalPriceEl = document.getElementById('cart-total-price');
    
    if (cart.length === 0) {
      body.innerHTML = '<p>Your cart is empty</p>';
      totalPriceEl.textContent = '₹0';
      return;
    }

    let html = '';
    cart.forEach(item => {
      const p = getProductById(item.id);
      if (!p) return;
      html += `
        <div class="cart-item">
          <img src="${p.image}" class="cart-item-img" alt="${p.name}">
          <div class="cart-item-info">
            <div>
              <div class="cart-item-title">${p.name}</div>
              <div class="cart-item-price">₹${p.price}</div>
            </div>
            <div class="cart-item-actions">
              <div class="qty-ctrl">
                <button class="qty-btn minus" data-id="${item.id}">-</button>
                <div class="qty-val">${item.qty}</div>
                <button class="qty-btn plus" data-id="${item.id}">+</button>
              </div>
              <span class="remove-btn" data-id="${item.id}">Remove</span>
            </div>
          </div>
        </div>
      `;
    });
    
    body.innerHTML = html;
    totalPriceEl.textContent = `₹${getCartTotal()}`;

    // Add event listeners for new cart elements
    body.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const item = cart.find(i => i.id === id);
        if (e.target.classList.contains('plus')) {
          item.qty++;
        } else if (e.target.classList.contains('minus')) {
          item.qty--;
          if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
        }
        saveCart(); updateCartBadge(); renderCartDrawer();
      });
    });

    body.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        cart = cart.filter(i => i.id !== e.target.dataset.id);
        saveCart(); updateCartBadge(); renderCartDrawer();
      });
    });
  }

  // Initial render
  updateCartBadge();
  renderCartDrawer();

  // Add to Cart Buttons
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = e.target.closest('.product-card');
      const id = card.dataset.id;
      const existing = cart.find(i => i.id === id);
      if (existing) {
        existing.qty++;
      } else {
        cart.push({ id: id, qty: 1 });
      }
      saveCart();
      updateCartBadge();
      renderCartDrawer();
      openCart();
    });
  });


  // ===== CHECKOUT OVERLAY LOGIC =====
  const checkoutOverlay = document.getElementById('checkout-overlay');
  const checkoutClose = document.getElementById('checkout-close');
  const checkoutItemsContainer = document.getElementById('checkout-items-container');
  const checkoutSubtotal = document.getElementById('checkout-subtotal');
  const checkoutTotal = document.getElementById('checkout-total');
  const btnPayNow = document.getElementById('btn-pay-now');
  const upiFieldGroup = document.getElementById('upi-field-group');
  const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
  const checkoutForm = document.getElementById('checkout-form');

  let checkoutItems = []; // Items currently being checked out

  function renderCheckoutItems() {
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
            <div class="checkout-item-qty">Qty: ${item.qty}</div>
            <div class="checkout-item-price">₹${p.price}</div>
          </div>
        </div>
      `;
    });
    checkoutItemsContainer.innerHTML = html;
    checkoutSubtotal.textContent = `₹${subtotal}`;
    
    const total = subtotal + 55; // Shipping
    checkoutTotal.textContent = `₹${total}`;
    btnPayNow.textContent = `Pay ₹${total}`;
  }

  function openCheckout(items) {
    checkoutItems = items;
    renderCheckoutItems();
    checkoutOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  checkoutClose.addEventListener('click', () => {
    checkoutOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });

  // Toggle UPI field based on payment method
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'upi') {
        upiFieldGroup.style.display = 'block';
        document.getElementById('c-upi-id').setAttribute('required', 'true');
      } else {
        upiFieldGroup.style.display = 'none';
        document.getElementById('c-upi-id').removeAttribute('required');
      }
      
      if (e.target.value === 'cod') {
        btnPayNow.textContent = 'Complete Order';
      } else {
        // Re-calculate total to update button text
        const total = checkoutItems.reduce((t, item) => t + (getProductById(item.id).price * item.qty), 0) + 55;
        btnPayNow.textContent = `Pay ₹${total}`;
      }
    });
  });

  // "Buy Now" Buttons
  document.querySelectorAll('.btn-buy-now').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = e.target.closest('.product-card');
      const id = card.dataset.id;
      // Close cart if open
      closeCart();
      // Open checkout with single item
      openCheckout([{ id: id, qty: 1 }]);
    });
  });

  // Cart Checkout Button
  document.getElementById('cart-checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) return;
    closeCart();
    openCheckout([...cart]);
  });

  // Handle Form Submission (Fake Payment Process)
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    btnPayNow.textContent = 'Processing...';
    btnPayNow.style.opacity = '0.7';
    
    // Simulate API call
    setTimeout(() => {
      btnPayNow.style.opacity = '1';
      btnPayNow.textContent = 'Payment Successful!';
      btnPayNow.style.background = '#28a745';
      btnPayNow.style.color = '#fff';
      
      setTimeout(() => {
        alert('Order placed successfully! Thank you for shopping with Comfort Factory.');
        // Clear cart if we checked out from cart
        if (checkoutItems.length > 1 || checkoutItems.some(i => cart.find(ci => ci.id === i.id))) {
           cart = [];
           saveCart();
           updateCartBadge();
           renderCartDrawer();
        }
        window.location.reload();
      }, 1000);
    }, 1500);
  });

});
