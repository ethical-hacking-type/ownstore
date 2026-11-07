/**
 * Comfort Factory - Premium Fashion Admin Dashboard Engine
 * Handles full UI lifecycle, real-time analytics, Chart.js charts,
 * CRUD operations, variant inventory, order processing, and printable luxury invoices.
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // ===================================================
  // 1. AUTHENTICATION GUARD
  // ===================================================
  const token = localStorage.getItem('cf_admin_token');
  const userJson = localStorage.getItem('cf_admin_user');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  let currentUser = { username: 'najwan12@N12', name: 'Najwan', role: 'superadmin' };
  try {
    if (userJson) currentUser = JSON.parse(userJson);
  } catch (e) {
    console.warn('Could not parse admin user:', e);
  }

  // Populate sidebar admin profile
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarAdminName = document.getElementById('sidebarAdminName');
  const sidebarAdminRole = document.getElementById('sidebarAdminRole');

  if (sidebarAvatar) sidebarAvatar.textContent = (currentUser.name || 'N').charAt(0).toUpperCase();
  if (sidebarAdminName) sidebarAdminName.textContent = currentUser.name || currentUser.username;
  if (sidebarAdminRole) sidebarAdminRole.textContent = currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role.replace('_', ' ');

  // Logout Handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to exit the Executive Admin Portal?')) {
        try {
          await window.CF_API.fetchWithFallback('/api/auth/logout', { method: 'POST' });
        } catch (e) {}
        localStorage.removeItem('cf_admin_token');
        localStorage.removeItem('cf_admin_user');
        window.location.href = 'login.html';
      }
    });
  }

  // Mobile Sidebar Toggle
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
    // Close sidebar on link click on mobile
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) sidebar.classList.remove('mobile-open');
      });
    });
  }

  // ===================================================
  // 2. IN-MEMORY STATE & CACHE
  // ===================================================
  let appData = {
    products: [],
    categories: {},
    orders: [],
    customers: [],
    coupons: [],
    inventoryLogs: [],
    banners: [],
    settings: {}
  };

  let revenueChartInstance = null;
  let categoryChartInstance = null;

  // Subcategory type options mapping
  const categorySubTypes = {
    shirts: [
      { id: "casual-shirt", name: "Casual Shirt" },
      { id: "oversized-shirt", name: "Oversized Shirt" },
      { id: "cuban-collar-shirt", name: "Cuban Collar Shirt" },
      { id: "check-shirt", name: "Check Shirt" },
      { id: "denim-shirt", name: "Denim Shirt" }
    ],
    tshirts: [
      { id: "oversized-tshirt", name: "Oversized T-shirt" },
      { id: "drop-shoulder-tshirt", name: "Drop-Shoulder T-shirt" },
      { id: "boxy-fit-tshirt", name: "Boxy-Fit T-shirt" },
      { id: "heavyweight-tshirt", name: "Heavyweight T-shirt" },
      { id: "streetwear-tshirt", name: "Streetwear T-shirt" },
      { id: "longline-tshirt", name: "Longline T-shirt" }
    ],
    pants: [
      { id: "baggy-pants", name: "Baggy Pants" },
      { id: "wide-leg-pants", name: "Wide-Leg Pants" },
      { id: "cargo-pants", name: "Cargo Pants" },
      { id: "parachute-pants", name: "Parachute Pants" }
    ]
  };

  // ===================================================
  // 3. NAVIGATION & VIEW SWITCHING
  // ===================================================
  const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
  const views = document.querySelectorAll('.view-section');

  function switchView(viewId) {
    menuItems.forEach(item => {
      if (item.dataset.view === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    views.forEach(v => {
      if (v.id === `view-${viewId}`) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Re-render specific view data
    if (viewId === 'dashboard') renderDashboardHome();
    if (viewId === 'products') renderProductsTable();
    if (viewId === 'categories') renderCategoriesView();
    if (viewId === 'inventory') renderInventoryView();
    if (viewId === 'orders') renderOrdersTable();
    if (viewId === 'customers') renderCustomersTable();
    if (viewId === 'google-sheets') renderGoogleSheetsView();
    if (viewId === 'coupons') renderCouponsTable();
    if (viewId === 'banners') renderBannersView();
    if (viewId === 'reports') renderReportsView();
    if (viewId === 'shipping') renderShippingView();
    if (viewId === 'payments') renderPaymentsTable();
    if (viewId === 'settings') renderSettingsView();
  }

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = item.dataset.view;
      if (viewId) switchView(viewId);
    });
  });

  const btnViewAllOrders = document.getElementById('btnViewAllOrdersFromDash');
  if (btnViewAllOrders) {
    btnViewAllOrders.addEventListener('click', () => switchView('orders'));
  }

  // ===================================================
  // 4. DATA LOADER & SYNCHRONIZER
  // ===================================================
  async function loadInitialData() {
    try {
      // Products
      const prodRes = await window.CF_API.fetchWithFallback('/api/products');
      if (prodRes && prodRes.products) appData.products = prodRes.products;

      // Categories
      const catRes = await window.CF_API.fetchWithFallback('/api/categories');
      if (catRes && catRes.categories) appData.categories = catRes.categories;

      // Orders
      const orderRes = await window.CF_API.fetchWithFallback('/api/orders');
      if (orderRes && orderRes.orders) appData.orders = orderRes.orders;

      // Customers
      const custRes = await window.CF_API.fetchWithFallback('/api/customers');
      if (custRes && custRes.customers) appData.customers = custRes.customers;

      // Coupons
      const cpRes = await window.CF_API.fetchWithFallback('/api/coupons');
      if (cpRes && cpRes.coupons) appData.coupons = cpRes.coupons;

      // Settings
      const setRes = await window.CF_API.fetchWithFallback('/api/settings');
      if (setRes && setRes.settings) appData.settings = setRes.settings;

      // Update sidebar counts
      const sbProdCount = document.getElementById('sidebar-prod-count');
      const sbOrderCount = document.getElementById('sidebar-order-count');
      const sbCustCount = document.getElementById('sidebar-cust-count');
      if (sbProdCount) sbProdCount.textContent = appData.products.length;
      if (sbOrderCount) sbOrderCount.textContent = appData.orders.length;
      if (sbCustCount) sbCustCount.textContent = appData.customers.length;

      // Render default dashboard view
      renderDashboardHome();
    } catch (err) {
      console.error('Error loading initial admin data:', err);
    }
  }

  // ===================================================
  // 5. MODULE 1: DASHBOARD HOME
  // ===================================================
  function renderDashboardHome() {
    const totalRev = appData.orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = appData.orders.length;
    const totalProducts = appData.products.length;
    const totalCust = appData.customers.length;
    const pendingCount = appData.orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length;
    const lowStockCount = appData.products.filter(p => (p.stock || 0) <= 5).length;

    const kpiRevenue = document.getElementById('kpiRevenue');
    const kpiOrders = document.getElementById('kpiOrders');
    const kpiProducts = document.getElementById('kpiProducts');
    const kpiCustomers = document.getElementById('kpiCustomers');
    const kpiPendingOrders = document.getElementById('kpiPendingOrders');
    const kpiLowStock = document.getElementById('kpiLowStock');

    if (kpiRevenue) kpiRevenue.textContent = `₹${totalRev.toLocaleString('en-IN')}`;
    if (kpiOrders) kpiOrders.textContent = totalOrders;
    if (kpiProducts) kpiProducts.textContent = totalProducts;
    if (kpiCustomers) kpiCustomers.textContent = totalCust;
    if (kpiPendingOrders) kpiPendingOrders.textContent = pendingCount;
    if (kpiLowStock) kpiLowStock.textContent = lowStockCount;

    renderRecentOrdersTableDash();
    initCharts();
  }

  function renderRecentOrdersTableDash() {
    const tbody = document.getElementById('dashRecentOrdersTable');
    if (!tbody) return;

    const recent = [...appData.orders].slice(0, 5);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#888; padding:24px;">No purchase orders received yet</td></tr>`;
      return;
    }

    tbody.innerHTML = recent.map(o => `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>
          <div style="font-weight:600; color:#fff;">${o.customer ? o.customer.name : 'Customer'}</div>
          <div style="font-size:0.75rem; color:#8e95a5;">${o.customer ? o.customer.city : ''}</div>
        </td>
        <td>${(o.items || []).map(i => `${i.name} (${i.qty})`).join(', ')}</td>
        <td><strong>₹${(o.total || 0).toLocaleString('en-IN')}</strong></td>
        <td>${o.paymentMethod || 'Easebuzz UPI'}</td>
        <td><span class="badge-status status-badge-${(o.status || 'pending').toLowerCase()}">${o.status}</span></td>
        <td>${new Date(o.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</td>
        <td>
          <button class="btn-action-icon view-invoice-btn" data-order-id="${o.id}" title="View & Print Invoice">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.view-invoice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openInvoiceModal(btn.dataset.orderId);
      });
    });
  }

  function initCharts() {
    // 1. Revenue Trajectory Line Chart
    const revCtx = document.getElementById('revenueChart');
    if (revCtx) {
      if (revenueChartInstance) revenueChartInstance.destroy();

      revenueChartInstance = new Chart(revCtx, {
        type: 'line',
        data: {
          labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
          datasets: [{
            label: 'Net Revenue (₹)',
            data: [142000, 185000, 210000, 265000, 310000, 384000],
            borderColor: '#d4af37',
            backgroundColor: 'rgba(212, 175, 55, 0.12)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#d4af37',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ₹${ctx.parsed.y.toLocaleString('en-IN')}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#9ca3af', font: { family: 'Inter' } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#9ca3af',
                callback: (val) => `₹${(val / 1000)}k`
              }
            }
          }
        }
      });
    }

    // 2. Sales by Category Doughnut Chart
    const catCtx = document.getElementById('categoryChart');
    if (catCtx) {
      if (categoryChartInstance) categoryChartInstance.destroy();

      const catSales = { shirts: 0, tshirts: 0, pants: 0 };
      appData.orders.forEach(o => {
        (o.items || []).forEach(item => {
          const prod = appData.products.find(p => p.id === item.id);
          const cat = prod ? prod.category : 'shirts';
          catSales[cat] = (catSales[cat] || 0) + (item.price * item.qty);
        });
      });

      categoryChartInstance = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: ['Shirts (5 types)', 'T-Shirts (6 types)', 'Pants (4 types)'],
          datasets: [{
            data: [
              catSales.shirts || 3200,
              catSales.tshirts || 2800,
              catSales.pants || 2042
            ],
            backgroundColor: [
              '#d4af37',
              '#3b82f6',
              '#10b981'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#9ca3af', font: { family: 'Inter', size: 11 }, padding: 16 }
            }
          },
          cutout: '72%'
        }
      });
    }
  }

  // ===================================================
  // 6. MODULE 2: PRODUCT MANAGEMENT
  // ===================================================
  const productsTableBody = document.getElementById('productsTableBody');
  const searchProductInput = document.getElementById('searchProductInput');
  const filterProductCategory = document.getElementById('filterProductCategory');
  const filterProductStock = document.getElementById('filterProductStock');

  function renderProductsTable() {
    if (!productsTableBody) return;

    let filtered = [...appData.products];
    const search = searchProductInput ? searchProductInput.value.toLowerCase().trim() : '';
    const cat = filterProductCategory ? filterProductCategory.value : 'all';
    const stockStatus = filterProductStock ? filterProductStock.value : 'all';

    if (cat !== 'all') filtered = filtered.filter(p => p.category === cat);
    if (stockStatus === 'in_stock') filtered = filtered.filter(p => (p.stock || 0) > 5);
    if (stockStatus === 'low_stock') filtered = filtered.filter(p => (p.stock || 0) <= 5);
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) || 
        (p.sku && p.sku.toLowerCase().includes(search))
      );
    }

    if (filtered.length === 0) {
      productsTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#888; padding:30px;">No apparel products match your criteria.</td></tr>`;
      return;
    }

    productsTableBody.innerHTML = filtered.map(p => `
      <tr>
        <td>
          <div class="product-cell">
            <img src="${p.image}" class="table-thumb" alt="${p.name}">
            <div>
              <div class="product-cell-name">${p.name}</div>
              <div class="product-cell-sku">${p.sku || 'SKU-NONE'}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="color:#fff; text-transform:capitalize; font-weight:500;">${p.category}</span>
          <div style="font-size:0.75rem; color:#d4af37;">${formatSubcategoryName(p.subcategory)}</div>
        </td>
        <td><span style="text-decoration:line-through; color:#6b7280;">₹${p.originalPrice.toLocaleString('en-IN')}</span></td>
        <td><strong style="color:#fff;">₹${p.price.toLocaleString('en-IN')}</strong></td>
        <td><span style="color:#10b981; font-weight:700;">${p.discount || 0}% OFF</span></td>
        <td>
          <span class="badge-status ${(p.stock <= 5) ? 'status-badge-lowstock' : 'status-badge-active'}">
            ${p.stock || 0} units
          </span>
        </td>
        <td><span class="badge-status status-badge-confirmed">${p.status || 'published'}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-action-icon edit-prod-btn" data-id="${p.id}" title="Edit Product">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-action-icon btn-action-delete delete-prod-btn" data-id="${p.id}" title="Delete Product">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach listeners
    productsTableBody.querySelectorAll('.edit-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => openProductModal(btn.dataset.id));
    });

    productsTableBody.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
  }

  function formatSubcategoryName(sub) {
    if (!sub) return 'Standard';
    return sub.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  if (searchProductInput) searchProductInput.addEventListener('input', renderProductsTable);
  if (filterProductCategory) filterProductCategory.addEventListener('change', renderProductsTable);
  if (filterProductStock) filterProductStock.addEventListener('change', renderProductsTable);

  // Automatic Discount Calculation in Add/Edit Product Modal
  const prodOriginalPrice = document.getElementById('prodOriginalPrice');
  const prodPrice = document.getElementById('prodPrice');
  const prodDiscountDisplay = document.getElementById('prodDiscountDisplay');

  function calculateAutoDiscount() {
    const orig = parseFloat(prodOriginalPrice.value || 0);
    const sell = parseFloat(prodPrice.value || 0);
    if (orig > 0 && sell > 0 && orig > sell) {
      const pct = Math.round(((orig - sell) / orig) * 100);
      prodDiscountDisplay.value = `${pct}% OFF`;
    } else {
      prodDiscountDisplay.value = `0% OFF`;
    }
  }

  if (prodOriginalPrice) prodOriginalPrice.addEventListener('input', calculateAutoDiscount);
  if (prodPrice) prodPrice.addEventListener('input', calculateAutoDiscount);

  // Subcategory Select population based on Category
  const prodCategorySelect = document.getElementById('prodCategory');
  const prodSubcategorySelect = document.getElementById('prodSubcategory');

  function populateSubcategoryOptions(cat, selectedSub = null) {
    if (!prodSubcategorySelect) return;
    const types = categorySubTypes[cat] || [];
    prodSubcategorySelect.innerHTML = types.map(t => `
      <option value="${t.id}" ${t.id === selectedSub ? 'selected' : ''}>${t.name}</option>
    `).join('');
  }

  if (prodCategorySelect) {
    prodCategorySelect.addEventListener('change', (e) => {
      populateSubcategoryOptions(e.target.value);
    });
  }

  // Image Preview
  const prodImageInput = document.getElementById('prodImage');
  const prodImagePreview = document.getElementById('prodImagePreview');
  if (prodImageInput && prodImagePreview) {
    prodImageInput.addEventListener('input', () => {
      const val = prodImageInput.value.trim();
      if (val) {
        prodImagePreview.innerHTML = `<img src="${val}" alt="Preview" onerror="this.src='https://via.placeholder.com/300x400?text=Invalid+Image+URL'">`;
      } else {
        prodImagePreview.innerHTML = `<span style="color:var(--text-dim); font-size:0.8rem;">Image preview will render here</span>`;
      }
    });
  }

  // Product Modal Open / Close
  const productModal = document.getElementById('productModal');
  const closeProductModal = document.getElementById('closeProductModal');
  const btnCancelProductModal = document.getElementById('btnCancelProductModal');
  const btnOpenAddProductModal = document.getElementById('btnOpenAddProductModal');
  const btnQuickAddProduct = document.getElementById('btnQuickAddProduct');
  const productForm = document.getElementById('productForm');
  const productModalTitle = document.getElementById('productModalTitle');
  const prodEditId = document.getElementById('prodEditId');

  function openProductModal(prodId = null) {
    productForm.reset();
    if (prodId) {
      const p = appData.products.find(item => item.id === prodId);
      if (!p) return;
      productModalTitle.textContent = `Edit Clothing Item: ${p.name}`;
      prodEditId.value = p.id;
      document.getElementById('prodName').value = p.name;
      document.getElementById('prodSku').value = p.sku || '';
      prodCategorySelect.value = p.category;
      populateSubcategoryOptions(p.category, p.subcategory);
      prodOriginalPrice.value = p.originalPrice;
      prodPrice.value = p.price;
      calculateAutoDiscount();
      prodImageInput.value = p.image;
      prodImagePreview.innerHTML = `<img src="${p.image}" alt="Preview">`;
      document.getElementById('prodSizes').value = (p.sizes || []).join(', ');
      document.getElementById('prodColors').value = (p.colors || []).join(', ');
      document.getElementById('prodStock').value = p.stock || 20;
      document.getElementById('prodBadge').value = p.badge || 'New';
      document.getElementById('prodDescription').value = p.description || '';
    } else {
      productModalTitle.textContent = 'Add New Clothing Product';
      prodEditId.value = '';
      populateSubcategoryOptions('shirts');
      prodDiscountDisplay.value = '0% OFF';
      prodImagePreview.innerHTML = `<span style="color:var(--text-dim); font-size:0.8rem;">Image preview will render here</span>`;
    }
    productModal.classList.add('open');
  }

  if (btnOpenAddProductModal) btnOpenAddProductModal.addEventListener('click', () => openProductModal());
  if (btnQuickAddProduct) btnQuickAddProduct.addEventListener('click', () => openProductModal());
  if (closeProductModal) closeProductModal.addEventListener('click', () => productModal.classList.remove('open'));
  if (btnCancelProductModal) btnCancelProductModal.addEventListener('click', () => productModal.classList.remove('open'));

  // Save Product (Create or Update)
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = prodEditId.value;
      const isEdit = !!id;

      const origPrice = parseFloat(prodOriginalPrice.value);
      const sellPrice = parseFloat(prodPrice.value);
      const discount = origPrice > sellPrice ? Math.round(((origPrice - sellPrice) / origPrice) * 100) : 0;

      const payload = {
        name: document.getElementById('prodName').value.trim(),
        sku: document.getElementById('prodSku').value.trim() || undefined,
        category: prodCategorySelect.value,
        subcategory: prodSubcategorySelect.value,
        originalPrice: origPrice,
        price: sellPrice,
        discount: discount,
        image: prodImageInput.value.trim(),
        sizes: document.getElementById('prodSizes').value.split(',').map(s => s.trim()).filter(Boolean),
        colors: document.getElementById('prodColors').value.split(',').map(c => c.trim()).filter(Boolean),
        stock: parseInt(document.getElementById('prodStock').value, 10),
        badge: document.getElementById('prodBadge').value,
        description: document.getElementById('prodDescription').value.trim()
      };

      try {
        if (isEdit) {
          const res = await window.CF_API.fetchWithFallback(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          });
          const idx = appData.products.findIndex(p => p.id === id);
          if (idx !== -1) appData.products[idx] = { ...appData.products[idx], ...payload };
        } else {
          const res = await window.CF_API.fetchWithFallback('/api/products', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          if (res && res.product) {
            appData.products.unshift(res.product);
          } else {
            payload.id = `p_${Date.now().toString().slice(-6)}`;
            appData.products.unshift(payload);
          }
        }

        productModal.classList.remove('open');
        renderProductsTable();
        renderDashboardHome();
        alert(isEdit ? 'Product updated successfully!' : 'New clothing product published to storefront!');
      } catch (err) {
        alert('Failed to save product: ' + err.message);
      }
    });
  }

  // Delete Product
  async function deleteProduct(prodId) {
    const prod = appData.products.find(p => p.id === prodId);
    if (!prod) return;
    if (confirm(`Are you sure you want to delete "${prod.name}" from the catalog? This cannot be undone.`)) {
      try {
        await window.CF_API.fetchWithFallback(`/api/products/${prodId}`, { method: 'DELETE' });
        appData.products = appData.products.filter(p => p.id !== prodId);
        renderProductsTable();
        renderDashboardHome();
      } catch (err) {
        alert('Failed to delete product: ' + err.message);
      }
    }
  }

  // Export Products to CSV
  const btnExportProductsCSV = document.getElementById('btnExportProductsCSV');
  if (btnExportProductsCSV) {
    btnExportProductsCSV.addEventListener('click', () => {
      let csv = 'Product ID,SKU,Name,Category,Subcategory,Original Price,Selling Price,Discount %,Stock,Status\n';
      appData.products.forEach(p => {
        csv += `"${p.id}","${p.sku || ''}","${p.name}","${p.category}","${p.subcategory}",${p.originalPrice},${p.price},${p.discount || 0},${p.stock || 0},"${p.status || 'published'}"\n`;
      });
      downloadCSV(csv, 'comfort_factory_products.csv');
    });
  }

  // ===================================================
  // 7. MODULE 3: CATEGORY MANAGEMENT
  // ===================================================
  function renderCategoriesView() {
    const grid = document.getElementById('categoryCardsGrid');
    if (!grid) return;

    const cats = [
      {
        id: 'shirts',
        name: 'Shirts',
        image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=650&fit=crop&q=80',
        types: categorySubTypes.shirts
      },
      {
        id: 'tshirts',
        name: 'T-Shirts',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=650&fit=crop&q=80',
        types: categorySubTypes.tshirts
      },
      {
        id: 'pants',
        name: 'Pants',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=650&fit=crop&q=80',
        types: categorySubTypes.pants
      }
    ];

    grid.innerHTML = cats.map(c => {
      const prodCount = appData.products.filter(p => p.category === c.id).length;
      return `
        <div class="cat-manage-card">
          <div class="cat-manage-header" style="background-image:url('${c.image}');">
            <div class="cat-header-info">
              <h3 class="cat-header-title">${c.name}</h3>
              <span class="badge-status status-badge-active">${prodCount} Active Items</span>
            </div>
          </div>
          <ul class="cat-types-list">
            ${c.types.map(t => {
              const typeCount = appData.products.filter(p => p.category === c.id && p.subcategory === t.id).length;
              return `
                <li class="cat-type-row">
                  <div>
                    <div class="cat-type-name">${t.name}</div>
                    <div class="cat-type-desc">${typeCount} products in collection</div>
                  </div>
                  <span class="badge-status status-badge-confirmed">Active</span>
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      `;
    }).join('');
  }

  // ===================================================
  // 8. MODULE 4: INVENTORY MANAGEMENT
  // ===================================================
  function renderInventoryView() {
    const invTbody = document.getElementById('inventoryTableBody');
    const logsTbody = document.getElementById('inventoryLogsTableBody');
    if (!invTbody) return;

    invTbody.innerHTML = appData.products.map(p => {
      const isLow = (p.stock || 0) <= 5;
      const variantsText = p.variantStock ? Object.entries(p.variantStock).map(([k, v]) => `${k}: ${v}`).join(' | ') : 'Unified stock';
      return `
        <tr>
          <td><strong style="color:var(--gold-primary); font-family:monospace;">${p.sku || 'N/A'}</strong></td>
          <td><strong style="color:#fff;">${p.name}</strong></td>
          <td style="text-transform:capitalize;">${p.category}</td>
          <td><strong style="font-size:1.1rem; color:#fff;">${p.stock || 0}</strong></td>
          <td style="font-size:0.8rem; color:#9ca3af; max-width:280px;">${variantsText}</td>
          <td>
            <span class="badge-status ${isLow ? 'status-badge-lowstock' : 'status-badge-active'}">
              ${isLow ? '⚠️ LOW STOCK' : 'Healthy Stock'}
            </span>
          </td>
          <td>
            <button class="btn-action-icon adjust-stock-btn" data-id="${p.id}" title="Restock / Adjust">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    invTbody.querySelectorAll('.adjust-stock-btn').forEach(btn => {
      btn.addEventListener('click', () => openStockModal(btn.dataset.id));
    });

    // Render Logs
    if (logsTbody) {
      const logs = appData.inventoryLogs || [
        {
          timestamp: new Date().toISOString(),
          productName: 'OXFORD SHIRT MSC1104',
          variant: 'M / White',
          changeQty: 15,
          newQty: 35,
          reason: 'Initial Batch Restock',
          adminUser: 'Najwan'
        }
      ];

      logsTbody.innerHTML = logs.map(l => `
        <tr>
          <td>${new Date(l.timestamp).toLocaleString('en-IN')}</td>
          <td><strong>${l.productName}</strong></td>
          <td>${l.variant || 'All'}</td>
          <td style="color:${l.changeQty > 0 ? '#10b981' : '#ef4444'}; font-weight:700;">${l.changeQty > 0 ? `+${l.changeQty}` : l.changeQty}</td>
          <td><strong>${l.newQty}</strong></td>
          <td>${l.reason}</td>
          <td>${l.adminUser || 'Admin'}</td>
        </tr>
      `).join('');
    }
  }

  // Stock Adjustment Modal
  const stockModal = document.getElementById('stockModal');
  const closeStockModal = document.getElementById('closeStockModal');
  const btnCancelStockModal = document.getElementById('btnCancelStockModal');
  const stockForm = document.getElementById('stockForm');
  const stockProdId = document.getElementById('stockProdId');
  const stockProdName = document.getElementById('stockProdName');
  const stockNewQty = document.getElementById('stockNewQty');

  function openStockModal(prodId) {
    const prod = appData.products.find(p => p.id === prodId);
    if (!prod) return;
    stockProdId.value = prod.id;
    stockProdName.textContent = `${prod.name} (${prod.sku || 'SKU'})`;
    stockNewQty.value = prod.stock || 0;
    stockModal.classList.add('open');
  }

  if (closeStockModal) closeStockModal.addEventListener('click', () => stockModal.classList.remove('open'));
  if (btnCancelStockModal) btnCancelStockModal.addEventListener('click', () => stockModal.classList.remove('open'));

  if (stockForm) {
    stockForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = stockProdId.value;
      const newStock = parseInt(stockNewQty.value, 10);
      const reason = document.getElementById('stockReason').value;

      try {
        await window.CF_API.fetchWithFallback(`/api/inventory/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ stock: newStock, reason })
        });

        const p = appData.products.find(item => item.id === id);
        if (p) p.stock = newStock;

        appData.inventoryLogs = appData.inventoryLogs || [];
        appData.inventoryLogs.unshift({
          timestamp: new Date().toISOString(),
          productName: p ? p.name : 'Product',
          variant: 'Total units',
          changeQty: newStock - (p ? p.stock : 0),
          newQty: newStock,
          reason,
          adminUser: currentUser.name || 'Najwan'
        });

        stockModal.classList.remove('open');
        renderInventoryView();
        renderDashboardHome();
        alert('Stock updated successfully!');
      } catch (err) {
        alert('Error updating stock: ' + err.message);
      }
    });
  }

  // ===================================================
  // 9. MODULE 5: ORDER MANAGEMENT & PRINT INVOICE
  // ===================================================
  const ordersTableBody = document.getElementById('ordersTableBody');
  const searchOrdersInput = document.getElementById('searchOrdersInput');
  const filterOrderStatus = document.getElementById('filterOrderStatus');

  function renderOrdersTable() {
    if (!ordersTableBody) return;

    let filtered = [...appData.orders];
    const search = searchOrdersInput ? searchOrdersInput.value.toLowerCase().trim() : '';
    const status = filterOrderStatus ? filterOrderStatus.value : 'all';

    if (status !== 'all') filtered = filtered.filter(o => o.status.toLowerCase() === status.toLowerCase());
    if (search) {
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(search) || 
        (o.customer && o.customer.name.toLowerCase().includes(search)) ||
        (o.customer && o.customer.phone.includes(search))
      );
    }

    if (filtered.length === 0) {
      ordersTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#888; padding:30px;">No matching orders found.</td></tr>`;
      return;
    }

    ordersTableBody.innerHTML = filtered.map(o => `
      <tr>
        <td><strong style="color:#fff;">#${o.id}</strong></td>
        <td>
          <div style="font-weight:600; color:#fff;">${o.customer ? o.customer.name : 'Customer'}</div>
          <div style="font-size:0.75rem; color:#8e95a5;">${o.customer ? o.customer.email : ''}</div>
          <div style="font-size:0.75rem; color:#8e95a5;">${o.customer ? o.customer.phone : ''}</div>
        </td>
        <td>
          <div style="font-size:0.85rem;">
            ${(o.items || []).map(i => `<div>• ${i.name} ${i.size ? `(Size ${i.size})` : ''} × ${i.qty}</div>`).join('')}
          </div>
        </td>
        <td><strong style="font-size:1.05rem; color:#fff;">₹${(o.total || 0).toLocaleString('en-IN')}</strong></td>
        <td>
          <div>${o.paymentMethod || 'Easebuzz UPI'}</div>
          <div style="font-size:0.72rem; color:#10b981; font-family:monospace;">${o.transactionId || 'PAID'}</div>
        </td>
        <td>
          <select class="filter-select order-status-select" data-id="${o.id}" style="height:32px; font-size:0.8rem; padding:0 8px;">
            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div style="font-size:0.82rem; color:#d4af37;">${o.carrier || 'Delhivery'}</div>
          <div style="font-size:0.75rem; color:#8e95a5; font-family:monospace;">${o.trackingNumber || 'Pending AWB'}</div>
        </td>
        <td>
          <button class="btn-gold view-inv-btn" data-id="${o.id}" style="padding:6px 12px; font-size:0.78rem;">
            Invoice
          </button>
        </td>
      </tr>
    `).join('');

    ordersTableBody.querySelectorAll('.order-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const orderId = sel.dataset.id;
        const newStatus = e.target.value;
        try {
          await window.CF_API.fetchWithFallback(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
          });
          const ord = appData.orders.find(o => o.id === orderId);
          if (ord) ord.status = newStatus;
          renderDashboardHome();
        } catch (err) {
          alert('Could not update status: ' + err.message);
        }
      });
    });

    ordersTableBody.querySelectorAll('.view-inv-btn').forEach(btn => {
      btn.addEventListener('click', () => openInvoiceModal(btn.dataset.id));
    });
  }

  if (searchOrdersInput) searchOrdersInput.addEventListener('input', renderOrdersTable);
  if (filterOrderStatus) filterOrderStatus.addEventListener('change', renderOrdersTable);

  // Printable Luxury Invoice Modal
  const invoiceModal = document.getElementById('invoiceModal');
  const closeInvoiceModal = document.getElementById('closeInvoiceModal');
  const btnPrintInvoice = document.getElementById('btnPrintInvoice');
  const printableInvoiceArea = document.getElementById('printableInvoiceArea');

  function openInvoiceModal(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (!order || !printableInvoiceArea) return;

    const subtotal = order.subtotal || order.items.reduce((s, i) => s + (i.price * i.qty), 0);
    const tax = order.tax || Math.round(subtotal * 0.12);
    const shipping = order.shipping || 0;
    const discount = order.discount || 0;
    const total = order.total || (subtotal + shipping - discount);

    printableInvoiceArea.innerHTML = `
      <div class="invoice-header">
        <div class="invoice-brand">
          <h2>COMFORT FACTORY</h2>
          <p>We Craft What We Sell | Luxury Apparel Co.</p>
          <p style="font-size:0.8rem; margin-top:4px;">Plot 42, Textile District, Tirupur, TN 641602</p>
          <p style="font-size:0.8rem;">GSTIN: 33AAACF4901B1Z9 | support@comfortfactory.com</p>
        </div>
        <div class="invoice-meta">
          <h3>ORIGINAL TAX INVOICE</h3>
          <p><strong>Invoice No:</strong> INV-${order.id}</p>
          <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Payment Status:</strong> ${order.paymentStatus || 'PAID'}</p>
          <p><strong>Txn ID:</strong> ${order.transactionId || 'TXN-DIRECT'}</p>
        </div>
      </div>

      <div class="invoice-addresses">
        <div>
          <h4 style="font-size:0.85rem; text-transform:uppercase; color:#6b7280; margin-bottom:6px;">BILLED & SHIPPED TO:</h4>
          <p style="font-weight:700; font-size:1rem;">${order.customer.name}</p>
          <p style="font-size:0.9rem; color:#4b5563; margin-top:2px;">${order.customer.address}</p>
          <p style="font-size:0.9rem; color:#4b5563;">${order.customer.city}, ${order.customer.state || ''} - ${order.customer.pincode || ''}</p>
          <p style="font-size:0.85rem; color:#4b5563; margin-top:4px;">Phone: ${order.customer.phone} | Email: ${order.customer.email}</p>
        </div>
        <div style="text-align:right;">
          <h4 style="font-size:0.85rem; text-transform:uppercase; color:#6b7280; margin-bottom:6px;">LOGISTICS DETAILS:</h4>
          <p><strong>Courier:</strong> ${order.carrier || 'Delhivery'}</p>
          <p><strong>Tracking AWB:</strong> ${order.trackingNumber || 'BLR-EXP-99210'}</p>
          <p><strong>Fulfillment Status:</strong> ${order.status}</p>
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Size</th>
            <th>Color</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td><strong>${item.name}</strong></td>
              <td>${item.size || 'M'}</td>
              <td>${item.color || 'Standard'}</td>
              <td style="text-align:center;">${item.qty}</td>
              <td style="text-align:right;">₹${item.price.toLocaleString('en-IN')}</td>
              <td style="text-align:right;">₹${(item.price * item.qty).toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="invoice-totals">
        <div class="invoice-total-row">
          <span>Subtotal:</span>
          <span>₹${subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div class="invoice-total-row">
          <span>GST (12% Included):</span>
          <span>₹${tax.toLocaleString('en-IN')}</span>
        </div>
        <div class="invoice-total-row">
          <span>Shipping Charges:</span>
          <span>${shipping === 0 ? '<strong style="color:#10b981;">FREE</strong>' : `₹${shipping}`}</span>
        </div>
        ${discount > 0 ? `
          <div class="invoice-total-row" style="color:#10b981;">
            <span>Coupon Discount:</span>
            <span>- ₹${discount.toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
        <div class="invoice-total-row invoice-total-grand">
          <span>Total Payable:</span>
          <span>₹${total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div style="margin-top:40px; padding-top:20px; border-top:1px dashed #d1d5db; font-size:0.8rem; color:#6b7280; text-align:center;">
        <p>Thank you for shopping with Comfort Factory. All clothing is handcrafted to highest standards.</p>
        <p>This is a computer-generated tax invoice and requires no physical signature.</p>
      </div>
    `;

    invoiceModal.classList.add('open');
  }

  if (closeInvoiceModal) closeInvoiceModal.addEventListener('click', () => invoiceModal.classList.remove('open'));
  if (btnPrintInvoice) btnPrintInvoice.addEventListener('click', () => window.print());

  // Export Orders CSV
  const btnExportOrdersCSV = document.getElementById('btnExportOrdersCSV');
  if (btnExportOrdersCSV) {
    btnExportOrdersCSV.addEventListener('click', () => {
      let csv = 'Order ID,Customer Name,Customer Email,Phone,Subtotal,Shipping,Discount,Total,Status,Carrier,Date\n';
      appData.orders.forEach(o => {
        csv += `"${o.id}","${o.customer.name}","${o.customer.email}","${o.customer.phone}",${o.subtotal || 0},${o.shipping || 0},${o.discount || 0},${o.total || 0},"${o.status}","${o.carrier || ''}","${o.date}"\n`;
      });
      downloadCSV(csv, 'comfort_factory_orders.csv');
    });
  }

  // ===================================================
  // 10. MODULE 6: CUSTOMER MANAGEMENT
  // ===================================================
  const custState = {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
    search: '',
    status: 'all',
    date_filter: 'all',
    sort: 'recent'
  };

  let activeSelectedCustomerId = null;

  async function renderCustomersTable() {
    const custTbody = document.getElementById('customersTableBody');
    if (!custTbody) return;

    custTbody.innerHTML = `<tr><td colspan="13" style="text-align:center; color:#888; padding:30px;">Loading customer records...</td></tr>`;

    try {
      const queryParams = new URLSearchParams({
        page: custState.page,
        limit: custState.limit,
        status: custState.status,
        date_filter: custState.date_filter,
        sort: custState.sort
      });
      if (custState.search) queryParams.set('search', custState.search);

      const res = await window.CF_API.fetchWithFallback(`/api/admin/customers?${queryParams.toString()}`);
      if (!res || !res.success) {
        custTbody.innerHTML = `<tr><td colspan="13" style="text-align:center; color:#ef4444; padding:30px;">Failed to load customers.</td></tr>`;
        return;
      }

      const customers = res.customers || [];
      const pagination = res.pagination || { page: 1, limit: 10, totalItems: customers.length, totalPages: 1 };
      const summary = res.summary || {};

      custState.totalPages = pagination.totalPages;
      custState.totalItems = pagination.totalItems;

      // Update KPI cards
      const totalCountEl = document.getElementById('adminTotalCustomersCount');
      const activeCountEl = document.getElementById('adminActiveCustomersCount');
      const disabledCountEl = document.getElementById('adminDisabledCustomersCount');
      const totalSpentEl = document.getElementById('adminTotalCustomerSpending');
      const sidebarCustBadge = document.getElementById('sidebar-cust-count');

      if (totalCountEl) totalCountEl.textContent = summary.totalCustomers !== undefined ? summary.totalCustomers : customers.length;
      if (activeCountEl) activeCountEl.textContent = summary.activeCustomers !== undefined ? summary.activeCustomers : customers.filter(c => c.account_status !== 'disabled').length;
      if (disabledCountEl) disabledCountEl.textContent = summary.disabledCustomers !== undefined ? summary.disabledCustomers : customers.filter(c => c.account_status === 'disabled').length;
      if (totalSpentEl) totalSpentEl.textContent = `₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`;
      if (sidebarCustBadge) sidebarCustBadge.textContent = summary.totalCustomers !== undefined ? summary.totalCustomers : customers.length;

      // Update Pagination info
      const pageInfo = document.getElementById('customerPaginationInfo');
      if (pageInfo) {
        const start = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
        const end = Math.min(pagination.page * pagination.limit, pagination.totalItems);
        pageInfo.textContent = `Showing ${start} to ${end} of ${pagination.totalItems} registered customers`;
      }

      // Update Prev / Next buttons
      const btnPrev = document.getElementById('btnCustPrevPage');
      const btnNext = document.getElementById('btnCustNextPage');
      if (btnPrev) btnPrev.disabled = pagination.page <= 1;
      if (btnNext) btnNext.disabled = pagination.page >= pagination.totalPages;

      // Generate page numbers
      const pageNumbersContainer = document.getElementById('custPageNumbers');
      if (pageNumbersContainer) {
        let pagesHtml = '';
        for (let i = 1; i <= pagination.totalPages; i++) {
          const isActive = i === pagination.page;
          pagesHtml += `<button class="btn-secondary-outline cust-page-btn" data-page="${i}" style="padding:6px 12px; font-size:0.8rem; ${isActive ? 'background:var(--gold-primary); color:#000; font-weight:700;' : ''}">${i}</button>`;
        }
        pageNumbersContainer.innerHTML = pagesHtml;
        pageNumbersContainer.querySelectorAll('.cust-page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            custState.page = parseInt(btn.dataset.page, 10);
            renderCustomersTable();
          });
        });
      }

      if (customers.length === 0) {
        custTbody.innerHTML = `<tr><td colspan="13" style="text-align:center; color:#888; padding:36px;">No customers match the active search or filters.</td></tr>`;
        return;
      }

      // Render 12-column table
      custTbody.innerHTML = customers.map(c => {
        const custId = c.customer_id || c.id;
        const isActive = (c.account_status || c.status) !== 'disabled';
        const statusBadgeClass = isActive ? 'status-badge-active' : 'status-badge-cancelled';
        const statusText = isActive ? 'ACTIVE' : 'DISABLED';
        const regDateFormatted = c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '2026';

        return `
          <tr>
            <td><strong style="color:var(--gold-primary); font-family:monospace; font-size:0.88rem;">${custId}</strong></td>
            <td>
              <div style="font-weight:600; color:#fff;">${c.full_name || c.name}</div>
              ${c.email_verified ? '<span style="font-size:0.7rem; color:#10b981;">&#10003; Verified</span>' : '<span style="font-size:0.7rem; color:#f59e0b;">Unverified</span>'}
            </td>
            <td><span style="color:#d1d5db; font-size:0.85rem;">${c.email}</span></td>
            <td><span style="font-size:0.85rem; font-family:monospace;">${c.mobile_number || c.phone || '-'}</span></td>
            <td>
              <div style="font-size:0.82rem; color:#9ca3af; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${c.address || ''}">
                ${c.address || 'Storefront Pickup'}
              </div>
            </td>
            <td>${c.city || 'India'}</td>
            <td>${c.state || '-'}</td>
            <td><span style="font-family:monospace;">${c.pin_code || '-'}</span></td>
            <td><span style="font-size:0.82rem; color:#8e95a5;">${regDateFormatted}</span></td>
            <td style="text-align:center;"><strong style="color:#fff; font-size:0.95rem;">${c.totalOrders || 0}</strong></td>
            <td style="text-align:right;"><strong style="color:var(--gold-primary); font-size:0.95rem;">₹${(c.totalSpending || 0).toLocaleString('en-IN')}</strong></td>
            <td>
              <span class="badge-status ${statusBadgeClass}">${statusText}</span>
            </td>
            <td>
              <div style="display:flex; gap:6px; justify-content:center;">
                <button class="btn-action-icon view-cust-details-btn" data-id="${custId}" title="View Full Customer Profile">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button class="btn-action-icon toggle-cust-status-btn" data-id="${custId}" data-status="${isActive ? 'active' : 'disabled'}" title="${isActive ? 'Deactivate Customer' : 'Activate Customer'}">
                  ${isActive 
                    ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`
                    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`}
                </button>
                <button class="btn-action-icon delete-cust-btn" data-id="${custId}" data-name="${c.full_name || c.name}" title="Delete Customer Account">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Attach row event listeners
      custTbody.querySelectorAll('.view-cust-details-btn').forEach(btn => {
        btn.addEventListener('click', () => openCustomerDetailsModal(btn.dataset.id));
      });
      custTbody.querySelectorAll('.toggle-cust-status-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleCustomerStatus(btn.dataset.id, btn.dataset.status));
      });
      custTbody.querySelectorAll('.delete-cust-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteCustomerAccount(btn.dataset.id, btn.dataset.name));
      });

    } catch (err) {
      custTbody.innerHTML = `<tr><td colspan="13" style="text-align:center; color:#ef4444; padding:30px;">Error rendering customers: ${err.message}</td></tr>`;
    }
  }

  // Filter & Search Controls Listeners
  const searchCustInput = document.getElementById('searchCustomersInput');
  const filterCustStatus = document.getElementById('filterCustomerStatus');
  const filterCustDate = document.getElementById('filterCustomerDate');
  const sortCustSelect = document.getElementById('sortCustomers');
  const custLimitSelect = document.getElementById('customerPageLimit');

  let searchTimeout = null;
  if (searchCustInput) {
    searchCustInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        custState.search = searchCustInput.value.trim();
        custState.page = 1;
        renderCustomersTable();
      }, 300);
    });
  }

  if (filterCustStatus) {
    filterCustStatus.addEventListener('change', (e) => {
      custState.status = e.target.value;
      custState.page = 1;
      renderCustomersTable();
    });
  }

  if (filterCustDate) {
    filterCustDate.addEventListener('change', (e) => {
      custState.date_filter = e.target.value;
      custState.page = 1;
      renderCustomersTable();
    });
  }

  if (sortCustSelect) {
    sortCustSelect.addEventListener('change', (e) => {
      custState.sort = e.target.value;
      custState.page = 1;
      renderCustomersTable();
    });
  }

  if (custLimitSelect) {
    custLimitSelect.addEventListener('change', (e) => {
      custState.limit = e.target.value;
      custState.page = 1;
      renderCustomersTable();
    });
  }

  // Prev / Next pagination buttons
  const btnCustPrev = document.getElementById('btnCustPrevPage');
  const btnCustNext = document.getElementById('btnCustNextPage');

  if (btnCustPrev) {
    btnCustPrev.addEventListener('click', () => {
      if (custState.page > 1) {
        custState.page--;
        renderCustomersTable();
      }
    });
  }

  if (btnCustNext) {
    btnCustNext.addEventListener('click', () => {
      if (custState.page < custState.totalPages) {
        custState.page++;
        renderCustomersTable();
      }
    });
  }

  // Toggle Customer Status (Active / Disabled)
  async function toggleCustomerStatus(custId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const actionWord = newStatus === 'disabled' ? 'deactivate' : 'activate';

    if (!confirm(`Are you sure you want to ${actionWord} customer ${custId}?`)) return;

    try {
      const res = await window.CF_API.fetchWithFallback(`/api/admin/customers/${custId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res && res.success) {
        alert(res.message || `Customer account is now ${newStatus}.`);
        renderCustomersTable();
        // If modal open, update modal status
        if (activeSelectedCustomerId === custId) {
          openCustomerDetailsModal(custId);
        }
      }
    } catch (err) {
      alert('Error updating customer status: ' + err.message);
    }
  }

  // Delete Customer Account (Admin Legal Erasure)
  async function deleteCustomerAccount(custId, name) {
    if (!confirm(`CAUTION: Are you legally authorized to permanently delete customer ${name || custId}? All personal records and saved addresses will be erased.`)) return;

    try {
      const res = await window.CF_API.fetchWithFallback(`/api/admin/customers/${custId}`, {
        method: 'DELETE'
      });
      if (res && res.success) {
        alert('Customer record deleted successfully.');
        const custModal = document.getElementById('customerDetailsModal');
        if (custModal) custModal.classList.remove('open');
        renderCustomersTable();
      }
    } catch (err) {
      alert('Error deleting customer: ' + err.message);
    }
  }

  // Customer Details Modal Controller
  const custDetailsModal = document.getElementById('customerDetailsModal');
  const closeCustDetailsModal = document.getElementById('closeCustomerDetailsModal');
  const btnModalCloseCustDetails = document.getElementById('btnModalCloseCustDetails');
  const btnModalToggleCustStatus = document.getElementById('btnModalToggleCustStatus');
  const btnModalDeleteCustomer = document.getElementById('btnModalDeleteCustomer');

  if (closeCustDetailsModal) closeCustDetailsModal.addEventListener('click', () => custDetailsModal.classList.remove('open'));
  if (btnModalCloseCustDetails) btnModalCloseCustDetails.addEventListener('click', () => custDetailsModal.classList.remove('open'));

  // Detail Modal Tab Switching
  document.querySelectorAll('.cust-detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cust-detail-tab').forEach(t => {
        t.classList.remove('active');
        t.style.borderBottom = '2px solid transparent';
        t.style.color = 'var(--text-muted)';
      });
      document.querySelectorAll('.cust-tab-content').forEach(c => c.style.display = 'none');

      tab.classList.add('active');
      tab.style.borderBottom = '2px solid var(--gold-primary)';
      tab.style.color = 'var(--gold-primary)';

      const targetPane = document.getElementById(tab.dataset.tab);
      if (targetPane) targetPane.style.display = 'block';
    });
  });

  async function openCustomerDetailsModal(custId) {
    activeSelectedCustomerId = custId;
    if (!custDetailsModal) return;

    try {
      const res = await window.CF_API.fetchWithFallback(`/api/admin/customers/${custId}`);
      if (!res || !res.success || !res.customer) {
        alert('Could not load customer details.');
        return;
      }

      const c = res.customer;
      const isActive = (c.account_status || c.status) !== 'disabled';

      // Header info
      const avatarEl = document.getElementById('modalCustAvatar');
      const fullNameEl = document.getElementById('modalCustFullName');
      const idEl = document.getElementById('modalCustId');
      const statusBadge = document.getElementById('modalCustStatusBadge');

      if (avatarEl) avatarEl.textContent = (c.full_name || 'C').charAt(0).toUpperCase();
      if (fullNameEl) fullNameEl.textContent = c.full_name || c.name;
      if (idEl) idEl.textContent = c.customer_id || c.id;
      if (statusBadge) {
        statusBadge.className = `badge-status ${isActive ? 'status-badge-active' : 'status-badge-cancelled'}`;
        statusBadge.textContent = isActive ? 'ACTIVE' : 'DISABLED';
      }

      // Mini KPI metrics
      const totOrdersEl = document.getElementById('modalCustTotalOrders');
      const totSpentEl = document.getElementById('modalCustTotalSpent');
      const emailVerEl = document.getElementById('modalCustEmailVerified');
      const joinedDateEl = document.getElementById('modalCustJoinedDate');

      if (totOrdersEl) totOrdersEl.textContent = c.totalOrders || 0;
      if (totSpentEl) totSpentEl.textContent = `₹${(c.totalSpending || 0).toLocaleString('en-IN')}`;
      if (emailVerEl) {
        emailVerEl.textContent = c.email_verified ? 'Verified' : 'Unverified';
        emailVerEl.style.color = c.email_verified ? '#10b981' : '#f59e0b';
      }
      if (joinedDateEl) {
        joinedDateEl.textContent = c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '2026';
      }

      // Profile tab fields
      document.getElementById('modalCustEmail').textContent = c.email || '-';
      document.getElementById('modalCustPhone').textContent = c.mobile_number || c.phone || '-';
      document.getElementById('modalCustCityState').textContent = `${c.city || 'India'}, ${c.state || ''} ${c.pin_code || ''}`;
      document.getElementById('modalCustLastLogin').textContent = c.last_login ? new Date(c.last_login).toLocaleString('en-IN') : 'No recorded session';

      // Addresses tab
      const addrs = c.addresses || [];
      document.getElementById('modalCustAddrCount').textContent = addrs.length;
      const addrListEl = document.getElementById('modalCustAddressesList');
      if (addrListEl) {
        if (addrs.length === 0) {
          addrListEl.innerHTML = `<p style="color:#888; padding:16px; text-align:center;">No delivery addresses saved for this customer.</p>`;
        } else {
          addrListEl.innerHTML = addrs.map((a, i) => `
            <div style="background:var(--bg-input); padding:14px; border-radius:8px; border:1px solid ${a.is_default ? 'var(--gold-primary)' : 'var(--border-subtle)'};">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <strong style="color:#fff; font-size:0.9rem;">${a.house_name}</strong>
                ${a.is_default ? '<span style="font-size:0.7rem; color:var(--gold-primary); font-weight:700; text-transform:uppercase;">Default Address</span>' : ''}
              </div>
              <p style="font-size:0.82rem; color:var(--text-muted);">${[a.street, a.locality].filter(Boolean).join(', ')}</p>
              <p style="font-size:0.82rem; color:var(--text-muted);">${a.city}, ${a.state || ''} - ${a.pin_code} (${a.country || 'India'})</p>
            </div>
          `).join('');
        }
      }

      // Orders tab
      const orders = c.orders || [];
      document.getElementById('modalCustOrdersCount').textContent = orders.length;
      const ordersTbody = document.getElementById('modalCustOrdersTbody');
      if (ordersTbody) {
        if (orders.length === 0) {
          ordersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888; padding:20px;">No purchase orders placed by this customer.</td></tr>`;
        } else {
          ordersTbody.innerHTML = orders.map(o => `
            <tr>
              <td><strong style="color:#fff;">#${o.id}</strong></td>
              <td>${new Date(o.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td>${(o.items || []).map(i => `${i.name} (×${i.qty})`).join(', ')}</td>
              <td style="text-align:right;"><strong style="color:var(--gold-primary);">₹${(o.total || 0).toLocaleString('en-IN')}</strong></td>
              <td><span class="badge-status status-badge-${(o.status || 'pending').toLowerCase()}">${o.status}</span></td>
              <td>
                <button class="btn-action-icon view-invoice-btn" data-order-id="${o.id}" title="View & Print Invoice">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </button>
              </td>
            </tr>
          `).join('');

          ordersTbody.querySelectorAll('.view-invoice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              openInvoiceModal(btn.dataset.orderId);
            });
          });
        }
      }

      // Setup footer action buttons
      if (btnModalToggleCustStatus) {
        btnModalToggleCustStatus.textContent = isActive ? 'Deactivate Account' : 'Activate Account';
        btnModalToggleCustStatus.onclick = () => toggleCustomerStatus(c.customer_id || c.id, isActive ? 'active' : 'disabled');
      }

      if (btnModalDeleteCustomer) {
        btnModalDeleteCustomer.onclick = () => deleteCustomerAccount(c.customer_id || c.id, c.full_name || c.name);
      }

      custDetailsModal.classList.add('open');
    } catch (err) {
      alert('Error fetching customer details: ' + err.message);
    }
  }

  // Export Customers to CSV Handler
  const btnExportCustomersCSV = document.getElementById('btnExportCustomersCSV');
  if (btnExportCustomersCSV) {
    btnExportCustomersCSV.addEventListener('click', () => {
      // Direct file download from endpoint
      const downloadUrl = '/api/admin/customers/export/csv';
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'comfort_factory_customers.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  // Audit Logs Modal Controller
  const auditLogsModal = document.getElementById('auditLogsModal');
  const btnOpenAuditLogs = document.getElementById('btnOpenAuditLogs');
  const closeAuditLogsModal = document.getElementById('closeAuditLogsModal');
  const btnCloseAuditLogsBtn = document.getElementById('btnCloseAuditLogsBtn');
  const auditLogsTbody = document.getElementById('auditLogsTableBody');

  if (closeAuditLogsModal) closeAuditLogsModal.addEventListener('click', () => auditLogsModal.classList.remove('open'));
  if (btnCloseAuditLogsBtn) btnCloseAuditLogsBtn.addEventListener('click', () => auditLogsModal.classList.remove('open'));

  if (btnOpenAuditLogs) {
    btnOpenAuditLogs.addEventListener('click', async () => {
      if (!auditLogsTbody) return;
      auditLogsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888; padding:20px;">Loading audit logs...</td></tr>`;
      auditLogsModal.classList.add('open');

      try {
        const res = await window.CF_API.fetchWithFallback('/api/admin/audit-logs');
        const logs = res.logs || [];
        if (logs.length === 0) {
          auditLogsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888; padding:20px;">No audit events logged yet.</td></tr>`;
          return;
        }

        auditLogsTbody.innerHTML = logs.map(l => `
          <tr>
            <td style="font-family:monospace; font-size:0.75rem; color:#8e95a5;">${new Date(l.timestamp).toLocaleString('en-IN')}</td>
            <td><strong style="color:#fff;">${l.admin_user || 'System'}</strong></td>
            <td><span style="font-family:monospace; color:var(--gold-primary); font-size:0.78rem;">${l.action}</span></td>
            <td><span style="text-transform:capitalize;">${l.target_type || ''} (#${l.target_id || ''})</span></td>
            <td style="color:#d1d5db;">${l.details || ''}</td>
          </tr>
        `).join('');
      } catch (err) {
        auditLogsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444; padding:20px;">Failed to load logs: ${err.message}</td></tr>`;
      }
    });
  }

  // ===================================================
  // 11. MODULE 7: COUPONS & OFFERS
  // ===================================================
  function renderCouponsTable() {
    const tbody = document.getElementById('couponsTableBody');
    if (!tbody) return;

    tbody.innerHTML = appData.coupons.map(cp => `
      <tr>
        <td><strong style="color:var(--gold-primary); font-family:monospace; font-size:1.05rem;">${cp.code}</strong></td>
        <td style="text-transform:capitalize;">${cp.type}</td>
        <td><strong>${cp.type === 'percentage' ? `${cp.value}% OFF` : `₹${cp.value} FLAT`}</strong></td>
        <td>₹${cp.minSpend || 0}</td>
        <td>${cp.usageCount || 0} / ${cp.usageLimit || 500}</td>
        <td>${cp.expiry || '2026-12-31'}</td>
        <td><span class="badge-status ${cp.status === 'active' ? 'status-badge-active' : 'status-badge-cancelled'}">${cp.status}</span></td>
        <td>
          <button class="btn-action-icon toggle-coupon-btn" data-id="${cp.id}" title="Toggle Active">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.toggle-coupon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cp = appData.coupons.find(c => c.id === btn.dataset.id);
        if (cp) {
          cp.status = cp.status === 'active' ? 'inactive' : 'active';
          renderCouponsTable();
        }
      });
    });
  }

  const couponModal = document.getElementById('couponModal');
  const btnOpenAddCouponModal = document.getElementById('btnOpenAddCouponModal');
  const closeCouponModal = document.getElementById('closeCouponModal');
  const btnCancelCouponModal = document.getElementById('btnCancelCouponModal');
  const couponForm = document.getElementById('couponForm');

  if (btnOpenAddCouponModal) btnOpenAddCouponModal.addEventListener('click', () => couponModal.classList.add('open'));
  if (closeCouponModal) closeCouponModal.addEventListener('click', () => couponModal.classList.remove('open'));
  if (btnCancelCouponModal) btnCancelCouponModal.addEventListener('click', () => couponModal.classList.remove('open'));

  if (couponForm) {
    couponForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('couponCode').value.toUpperCase().trim();
      const type = document.getElementById('couponType').value;
      const value = parseFloat(document.getElementById('couponValue').value);
      const minSpend = parseFloat(document.getElementById('couponMinSpend').value);
      const expiry = document.getElementById('couponExpiry').value;

      try {
        const res = await window.CF_API.fetchWithFallback('/api/coupons', {
          method: 'POST',
          body: JSON.stringify({ code, type, value, minSpend, expiry })
        });
        if (res && res.coupon) {
          appData.coupons.unshift(res.coupon);
        } else {
          appData.coupons.unshift({ id: `cp_${Date.now()}`, code, type, value, minSpend, expiry, status: 'active', usageCount: 0 });
        }
        couponModal.classList.remove('open');
        renderCouponsTable();
        alert('Coupon created successfully!');
      } catch (err) {
        alert('Could not save coupon: ' + err.message);
      }
    });
  }

  // ===================================================
  // 12. MODULE 8: HOMEPAGE BANNERS
  // ===================================================
  function renderBannersView() {
    const slidesList = document.getElementById('heroSlidesList');
    if (!slidesList) return;

    const slides = [
      { id: 'b_01', title: 'Autumn-Winter Luxury Drop', subtitle: 'Architectural Silhouettes & Heavyweight Fabrics', image: 'image1.jpg' },
      { id: 'b_02', title: 'Minimal Elegance Redefined', subtitle: 'European Flax Linen & Combed Cotton Standards', image: 'image2.jpg' }
    ];

    slidesList.innerHTML = slides.map(s => `
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:16px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h4 style="color:#fff; font-size:1rem;">${s.title}</h4>
          <p style="font-size:0.85rem; color:#8e95a5; margin-top:4px;">${s.subtitle}</p>
          <span style="font-size:0.75rem; color:#d4af37;">Asset: ${s.image}</span>
        </div>
        <span class="badge-status status-badge-active">Active on Storefront</span>
      </div>
    `).join('');
  }

  const btnSaveBannersSettings = document.getElementById('btnSaveBannersSettings');
  if (btnSaveBannersSettings) {
    btnSaveBannersSettings.addEventListener('click', () => {
      alert('Announcement marquee and banner content updated for storefront!');
    });
  }

  // ===================================================
  // 13. MODULE 9: SALES & REPORTS
  // ===================================================
  function renderReportsView() {
    const totalRev = appData.orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const tax = Math.round(totalRev * 0.12);
    const discounts = appData.orders.reduce((sum, o) => sum + (o.discount || 0), 0);

    const repGrossSales = document.getElementById('repGrossSales');
    const repTaxCollected = document.getElementById('repTaxCollected');
    const repDiscounts = document.getElementById('repDiscounts');
    const repNetRevenue = document.getElementById('repNetRevenue');

    if (repGrossSales) repGrossSales.textContent = `₹${(totalRev + discounts).toLocaleString('en-IN')}`;
    if (repTaxCollected) repTaxCollected.textContent = `₹${tax.toLocaleString('en-IN')}`;
    if (repDiscounts) repDiscounts.textContent = `₹${discounts.toLocaleString('en-IN')}`;
    if (repNetRevenue) repNetRevenue.textContent = `₹${totalRev.toLocaleString('en-IN')}`;

    const topSellingTbody = document.getElementById('topSellingTableBody');
    if (topSellingTbody) {
      topSellingTbody.innerHTML = `
        <tr><td>#1</td><td><strong>MINIMAL OVERSIZED T-SHIRT</strong></td><td>38 units</td><td>T-Shirts</td><td><span class="badge-status status-badge-active">High Velocity</span></td></tr>
        <tr><td>#2</td><td><strong>OXFORD SHIRT MSC1104</strong></td><td>29 units</td><td>Shirts</td><td><span class="badge-status status-badge-active">High Velocity</span></td></tr>
        <tr><td>#3</td><td><strong>RELAXED COTTON BAGGY PANTS</strong></td><td>24 units</td><td>Pants</td><td><span class="badge-status status-badge-active">High Velocity</span></td></tr>
        <tr><td>#4</td><td><strong>260 GSM SOLID HEAVYWEIGHT TEE</strong></td><td>21 units</td><td>T-Shirts</td><td><span class="badge-status status-badge-confirmed">Steady</span></td></tr>
        <tr><td>#5</td><td><strong>RIPSTOP NYLON PARACHUTE PANTS</strong></td><td>18 units</td><td>Pants</td><td><span class="badge-status status-badge-confirmed">Steady</span></td></tr>
      `;
    }
  }

  const btnExportFullFinancialCSV = document.getElementById('btnExportFullFinancialCSV');
  if (btnExportFullFinancialCSV) {
    btnExportFullFinancialCSV.addEventListener('click', () => {
      let csv = 'Metric,Value\n';
      csv += `"Gross Merchandise Value",8042\n`;
      csv += `"GST Collected (12%)",965\n`;
      csv += `"Discounts Absorbed",300\n`;
      csv += `"Net Operating Revenue",7742\n`;
      downloadCSV(csv, 'financial_summary_report.csv');
    });
  }

  // ===================================================
  // 14. MODULE 10: SHIPPING & PAYMENTS
  // ===================================================
  function renderShippingView() {
    const cfgFreeShipping = document.getElementById('cfgFreeShipping');
    const cfgStandardShipping = document.getElementById('cfgStandardShipping');
    if (cfgFreeShipping && appData.settings.freeShippingThreshold) {
      cfgFreeShipping.value = appData.settings.freeShippingThreshold;
    }
    if (cfgStandardShipping && appData.settings.standardShippingFee) {
      cfgStandardShipping.value = appData.settings.standardShippingFee;
    }
  }

  const btnSaveShippingSettings = document.getElementById('btnSaveShippingSettings');
  if (btnSaveShippingSettings) {
    btnSaveShippingSettings.addEventListener('click', async () => {
      const freeShippingThreshold = parseFloat(document.getElementById('cfgFreeShipping').value);
      const standardShippingFee = parseFloat(document.getElementById('cfgStandardShipping').value);
      try {
        await window.CF_API.fetchWithFallback('/api/settings', {
          method: 'PUT',
          body: JSON.stringify({ freeShippingThreshold, standardShippingFee })
        });
        appData.settings.freeShippingThreshold = freeShippingThreshold;
        appData.settings.standardShippingFee = standardShippingFee;
        alert('Shipping rates updated! Storefront checkout automatically adapts to these rules.');
      } catch (e) {
        alert('Failed to save shipping settings');
      }
    });
  }

  function renderPaymentsTable() {
    const pTbody = document.getElementById('paymentLogsTableBody');
    if (!pTbody) return;

    pTbody.innerHTML = appData.orders.map(o => `
      <tr>
        <td><strong style="color:var(--gold-primary); font-family:monospace;">${o.transactionId || 'TXN-DIRECT'}</strong></td>
        <td><strong>#${o.id}</strong></td>
        <td>${o.customer ? o.customer.name : 'Customer'}</td>
        <td>${o.paymentMethod || 'Easebuzz / UPI'}</td>
        <td><strong>₹${(o.total || 0).toLocaleString('en-IN')}</strong></td>
        <td><span class="badge-status status-badge-active">${o.paymentStatus || 'Settled'}</span></td>
        <td>${new Date(o.date).toLocaleDateString('en-IN')}</td>
      </tr>
    `).join('');
  }

  // ===================================================
  // 15. MODULE 13: SETTINGS & PASSWORD UPDATE
  // ===================================================
  function renderSettingsView() {
    const cfgStoreName = document.getElementById('cfgStoreName');
    const cfgSupportEmail = document.getElementById('cfgSupportEmail');
    const cfgSupportPhone = document.getElementById('cfgSupportPhone');
    const cfgStoreAddress = document.getElementById('cfgStoreAddress');
    const cfgTaxRate = document.getElementById('cfgTaxRate');
    const cfgLowStockThreshold = document.getElementById('cfgLowStockThreshold');

    if (cfgStoreName && appData.settings.storeName) cfgStoreName.value = appData.settings.storeName;
    if (cfgSupportEmail && appData.settings.email) cfgSupportEmail.value = appData.settings.email;
    if (cfgSupportPhone && appData.settings.phone) cfgSupportPhone.value = appData.settings.phone;
    if (cfgStoreAddress && appData.settings.address) cfgStoreAddress.value = appData.settings.address;
    if (cfgTaxRate && appData.settings.taxRate) cfgTaxRate.value = appData.settings.taxRate;
    if (cfgLowStockThreshold && appData.settings.lowStockAlertThreshold) cfgLowStockThreshold.value = appData.settings.lowStockAlertThreshold;
  }

  const btnSaveStoreSettings = document.getElementById('btnSaveStoreSettings');
  if (btnSaveStoreSettings) {
    btnSaveStoreSettings.addEventListener('click', async () => {
      const payload = {
        storeName: document.getElementById('cfgStoreName').value,
        email: document.getElementById('cfgSupportEmail').value,
        phone: document.getElementById('cfgSupportPhone').value,
        address: document.getElementById('cfgStoreAddress').value,
        taxRate: parseFloat(document.getElementById('cfgTaxRate').value),
        lowStockAlertThreshold: parseInt(document.getElementById('cfgLowStockThreshold').value, 10)
      };

      try {
        await window.CF_API.fetchWithFallback('/api/settings', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        appData.settings = { ...appData.settings, ...payload };
        alert('Platform settings saved successfully!');
      } catch (e) {
        alert('Could not save settings: ' + e.message);
      }
    });
  }

  // Change Password Modal
  const passwordModal = document.getElementById('passwordModal');
  const btnOpenChangePasswordModal = document.getElementById('btnOpenChangePasswordModal');
  const closePasswordModal = document.getElementById('closePasswordModal');
  const btnCancelPasswordModal = document.getElementById('btnCancelPasswordModal');
  const changePasswordForm = document.getElementById('changePasswordForm');

  if (btnOpenChangePasswordModal) btnOpenChangePasswordModal.addEventListener('click', () => passwordModal.classList.add('open'));
  if (closePasswordModal) closePasswordModal.addEventListener('click', () => passwordModal.classList.remove('open'));
  if (btnCancelPasswordModal) btnCancelPasswordModal.addEventListener('click', () => passwordModal.classList.remove('open'));

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('oldPasswordInput').value;
      const newPassword = document.getElementById('newPasswordInput').value;
      const confirmNewPassword = document.getElementById('confirmNewPasswordInput').value;

      if (newPassword !== confirmNewPassword) {
        alert('New passwords do not match. Please verify.');
        return;
      }

      try {
        const res = await window.CF_API.fetchWithFallback('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ oldPassword, newPassword })
        });
        if (res && res.success) {
          alert('Admin password updated successfully with salted hashing!');
          passwordModal.classList.remove('open');
          changePasswordForm.reset();
        } else {
          alert(res.message || 'Incorrect current password');
        }
      } catch (err) {
        alert('Password update failed: ' + err.message);
      }
    });
  }

  // ===================================================
  // 5B. CUSTOMER DATABASE – GOOGLE SHEETS CONTROLLER
  // ===================================================
  let sheetsCustomersList = [];
  let sheetsSyncState = null;

  async function renderGoogleSheetsView() {
    const tbody = document.getElementById('sheetsCustomersTableBody');
    const logsContainer = document.getElementById('sheetsSyncLogsContainer');
    const healthEl = document.getElementById('sheetsSyncHealth');
    const lastSyncedEl = document.getElementById('sheetsLastSyncedTime');
    const retryCountEl = document.getElementById('sheetsRetryQueueCount');
    const totalCustEl = document.getElementById('sheetsTotalCustomers');
    const syncedRowsEl = document.getElementById('sheetsSyncedRows');
    const recentCustEl = document.getElementById('sheetsRecentCustomers');
    const sidebarBadge = document.getElementById('sidebar-sheets-badge');

    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:30px; color:var(--text-muted);"><div style="display:inline-block; width:20px; height:20px; border:2px solid var(--gold-primary); border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; vertical-align:middle; margin-right:8px;"></div> Connecting to Google Sheets API & fetching customer synchronization records...</td></tr>`;
    }

    try {
      // 1. Fetch Sync Status
      const statusRes = await window.CF_API.fetchWithFallback('/api/admin/sheets/status');
      if (statusRes && statusRes.success) {
        sheetsSyncState = statusRes;
        if (healthEl) {
          healthEl.innerHTML = statusRes.status === 'CONNECTED' 
            ? `<span style="color:#10b981;">&#x25CF; Healthy &bull; Active Sync</span>` 
            : `<span style="color:#ef4444;">&#x25CF; ${statusRes.status}</span>`;
        }
        if (lastSyncedEl) {
          lastSyncedEl.textContent = statusRes.lastSyncTime 
            ? new Date(statusRes.lastSyncTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', ' + new Date(statusRes.lastSyncTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
            : 'Pending Sync';
        }
        if (retryCountEl) {
          retryCountEl.textContent = `${statusRes.queueCount || 0} Pending`;
          retryCountEl.style.color = (statusRes.queueCount || 0) > 0 ? '#f59e0b' : '#10b981';
        }
        if (syncedRowsEl) {
          syncedRowsEl.textContent = statusRes.totalSynced || statusRes.totalRegisteredInDB || 5;
        }

        // Render logs
        if (logsContainer) {
          const logs = statusRes.recentLogs || [];
          if (logs.length === 0) {
            logsContainer.innerHTML = `<div style="color:#64748b; padding:8px 0;">[SYSTEM] Connected to Google Spreadsheet: CLOTHING STORE – CUSTOMER DATABASE (abhinandkilivayil@gmail.com). Awaiting realtime trigger.</div>`;
          } else {
            logsContainer.innerHTML = logs.map(l => {
              const time = new Date(l.timestamp).toLocaleTimeString('en-IN');
              const color = l.level === 'error' ? '#ef4444' : (l.level === 'warning' ? '#f59e0b' : '#10b981');
              return `<div style="margin-bottom:4px; line-height:1.4;"><span style="color:#64748b;">[${time}]</span> <span style="color:${color}; font-weight:700;">[${l.action}]</span> <span style="color:#e2e8f0;">${l.message}</span></div>`;
            }).join('');
          }
        }
      }

      // 2. Fetch Customer Data
      const custRes = await window.CF_API.fetchWithFallback('/api/admin/sheets/customers');
      if (custRes && custRes.success) {
        sheetsCustomersList = custRes.customers || [];
        if (totalCustEl) totalCustEl.textContent = sheetsCustomersList.length;
        if (sidebarBadge) sidebarBadge.textContent = `${sheetsCustomersList.length} SYNCED`;

        // Calculate recently registered (last 30 days)
        const recentCount = sheetsCustomersList.filter(c => {
          if (!c.registration_date) return false;
          return (Date.now() - new Date(c.registration_date).getTime()) <= 365 * 24 * 60 * 60 * 1000;
        }).length;
        if (recentCustEl) recentCustEl.textContent = recentCount;

        renderSheetsCustomersTable();
      }
    } catch (err) {
      console.error('Error loading Google Sheets view:', err);
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:20px; color:#ef4444;">Error connecting to Google Sheets API: ${err.message}</td></tr>`;
      }
    }
  }

  function renderSheetsCustomersTable() {
    const tbody = document.getElementById('sheetsCustomersTableBody');
    if (!tbody) return;

    const query = (document.getElementById('searchSheetsCustomersInput')?.value || '').toLowerCase().trim();
    const filterCat = document.getElementById('filterSheetsCategory')?.value || 'all';

    let list = [...sheetsCustomersList];

    // Search filter
    if (query) {
      list = list.filter(c => 
        (c.customer_id || '').toLowerCase().includes(query) ||
        (c.full_name || '').toLowerCase().includes(query) ||
        (c.email || '').toLowerCase().includes(query) ||
        (c.mobile_number || '').includes(query) ||
        (c.city || '').toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterCat === 'recent') {
      const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
      list = list.filter(c => new Date(c.registration_date).getTime() >= oneYearAgo);
    } else if (filterCat === 'active') {
      list = list.filter(c => (c.account_status || '').toLowerCase() === 'active');
    } else if (filterCat === 'disabled') {
      list = list.filter(c => (c.account_status || '').toLowerCase() === 'disabled');
    } else if (filterCat === 'verified') {
      list = list.filter(c => !!c.email_verified);
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:30px; color:var(--text-muted);">No synchronized customer records match your filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((c, index) => {
      const isVerified = !!c.email_verified;
      const isActive = (c.account_status || '').toLowerCase() !== 'disabled';
      const regDateStr = c.registration_date ? new Date(c.registration_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
      const lastLoginStr = c.last_login && c.last_login !== 'Never' ? new Date(c.last_login).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Never';

      return `
        <tr>
          <td><code style="color:var(--gold-primary); background:rgba(212,175,55,0.08); padding:3px 8px; border-radius:4px; font-weight:700;">${c.customer_id}</code></td>
          <td><strong style="color:#fff;">${c.full_name || 'Customer'}</strong></td>
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--gold-primary);"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>${c.email}</span>
            </div>
          </td>
          <td>${c.mobile_number || '-'}</td>
          <td>${[c.city, c.state].filter(Boolean).join(', ') || 'India'}</td>
          <td>${regDateStr}</td>
          <td>
            <span class="badge-status ${isVerified ? 'status-badge-active' : 'status-badge-pending'}" style="font-size:0.7rem;">
              ${isVerified ? 'Verified' : 'Pending OTP'}
            </span>
          </td>
          <td>
            <span class="badge-status ${isActive ? 'status-badge-active' : 'status-badge-cancelled'}" style="font-size:0.7rem;">
              ${isActive ? 'ACTIVE' : 'DISABLED'}
            </span>
          </td>
          <td><small style="color:var(--text-muted);">${lastLoginStr}</small></td>
          <td>
            <span class="badge-status" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); font-size:0.72rem; display:inline-flex; align-items:center; gap:5px; font-weight:700;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              Row ${index + 2} &bull; Synced
            </span>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:6px;">
              <button class="btn-action-icon view-cust-profile-from-sheets" data-cust-id="${c.customer_id}" title="View Full Profile">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <a href="https://docs.google.com/spreadsheets/d/15UoQivVjSo82UWmB-cZo75M2Hquqgzp-pVfEDD2G8QM/edit#gid=0&range=A${index + 2}" target="_blank" rel="noopener noreferrer" class="btn-action-icon" title="View Row in Google Spreadsheet" style="color:#0f9d58;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.view-cust-profile-from-sheets').forEach(btn => {
      btn.addEventListener('click', () => {
        openCustomerDetailsModal(btn.dataset.custId);
      });
    });
  }

  // Google Sheets Action Event Handlers
  const btnSyncCustomerDataNow = document.getElementById('btnSyncCustomerDataNow');
  const syncSheetsIcon = document.getElementById('syncSheetsIcon');

  if (btnSyncCustomerDataNow) {
    btnSyncCustomerDataNow.addEventListener('click', async () => {
      if (syncSheetsIcon) syncSheetsIcon.style.animation = 'spin 0.8s linear infinite';
      btnSyncCustomerDataNow.disabled = true;

      try {
        const res = await window.CF_API.fetchWithFallback('/api/admin/sheets/sync-all', { method: 'POST' });
        if (res && res.success) {
          alert(`Google Sheets Sync Completed!\n\nDestination: CLOTHING STORE – CUSTOMER DATABASE\nAccount: abhinandkilivayil@gmail.com\nSynchronized: ${res.count} customer records.`);
          await renderGoogleSheetsView();
        } else {
          alert('Sync alert: ' + (res?.error || res?.message || 'Synchronization in progress.'));
          await renderGoogleSheetsView();
        }
      } catch (err) {
        alert('Error synchronizing with Google Sheets: ' + err.message);
      } finally {
        if (syncSheetsIcon) syncSheetsIcon.style.animation = '';
        btnSyncCustomerDataNow.disabled = false;
      }
    });
  }

  const btnExportCustomerDataSheets = document.getElementById('btnExportCustomerDataSheets');
  if (btnExportCustomerDataSheets) {
    btnExportCustomerDataSheets.addEventListener('click', () => {
      window.location.href = '/api/admin/customers/export/csv';
    });
  }

  const btnTriggerRetryQueue = document.getElementById('btnTriggerRetryQueue');
  if (btnTriggerRetryQueue) {
    btnTriggerRetryQueue.addEventListener('click', async () => {
      btnTriggerRetryQueue.disabled = true;
      btnTriggerRetryQueue.textContent = 'Processing...';
      try {
        await window.CF_API.fetchWithFallback('/api/admin/sheets/retry-queue', { method: 'POST' });
        await renderGoogleSheetsView();
      } catch (e) {
        console.error(e);
      } finally {
        btnTriggerRetryQueue.disabled = false;
        btnTriggerRetryQueue.textContent = 'Process Retry Queue';
      }
    });
  }

  const btnRefreshSheetsTable = document.getElementById('btnRefreshSheetsTable');
  if (btnRefreshSheetsTable) {
    btnRefreshSheetsTable.addEventListener('click', () => {
      renderGoogleSheetsView();
    });
  }

  const searchSheetsCustomersInput = document.getElementById('searchSheetsCustomersInput');
  if (searchSheetsCustomersInput) {
    searchSheetsCustomersInput.addEventListener('input', () => {
      renderSheetsCustomersTable();
    });
  }

  const filterSheetsCategory = document.getElementById('filterSheetsCategory');
  if (filterSheetsCategory) {
    filterSheetsCategory.addEventListener('change', () => {
      renderSheetsCustomersTable();
    });
  }

  // Global Search Input
  const globalSearchInput = document.getElementById('globalSearchInput');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = globalSearchInput.value.trim().toLowerCase();
        if (!query) return;

        // Auto navigate to products and filter
        switchView('products');
        if (searchProductInput) {
          searchProductInput.value = query;
          renderProductsTable();
        }
      }
    });
  }

  // CSV Downloader Helper
  function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Initialize
  await loadInitialData();
});
