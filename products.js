// Simulated Product Database
const products = [
  {
    id: "p_001",
    name: "LINEN PANTS MPJ0089",
    price: 1299,
    originalPrice: 1999,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=540&fit=crop&q=80",
    category: "pants"
  },
  {
    id: "p_002",
    name: "IMPORTED STRIPES SHIRT MSC0991",
    price: 899,
    originalPrice: 1499,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=540&fit=crop&q=80",
    category: "shirts"
  },
  {
    id: "p_003",
    name: "OXFORD SHIRT MSC1104",
    price: 799,
    originalPrice: 1299,
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400&h=540&fit=crop&q=80",
    category: "shirts"
  },
  {
    id: "p_004",
    name: "NO FADE BLACK LYCRA DENIM PANTS MDP0175",
    price: 1499,
    originalPrice: 2199,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=540&fit=crop&q=80",
    category: "pants"
  },
  {
    id: "p_005",
    name: "LINEN SHIRTS MSC1057",
    price: 999,
    originalPrice: 1599,
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=400&h=540&fit=crop&q=80",
    category: "shirts"
  },
  {
    id: "p_006",
    name: "DENIM SHIRTS",
    price: 1099,
    originalPrice: 1699,
    image: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400&h=540&fit=crop&q=80",
    category: "shirts"
  }
];

// Helper functions for data access
function getProductById(id) {
  return products.find(p => p.id === id);
}

function getAllProducts() {
  return products;
}
