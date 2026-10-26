// Simulated Product Database with Categories and Subcategory Types
const categoryData = {
  shirts: {
    name: "Shirts",
    types: [
      { id: "casual-shirt", name: "Casual Shirt", desc: "Everyday versatile comfort" },
      { id: "oversized-shirt", name: "Oversized Shirt", desc: "Relaxed, roomy modern silhouette" },
      { id: "cuban-collar-shirt", name: "Cuban Collar Shirt", desc: "Open camp collar retro style" },
      { id: "check-shirt", name: "Check Shirt", desc: "Classic patterns & premium weave" },
      { id: "denim-shirt", name: "Denim Shirt", desc: "Durable washed denim essentials" }
    ]
  },
  tshirts: {
    name: "T-Shirts",
    types: [
      { id: "oversized-tshirt", name: "Oversized T-shirt", desc: "Roomy streetwear aesthetic" },
      { id: "drop-shoulder-tshirt", name: "Drop-Shoulder T-shirt", desc: "Sloping shoulder relaxed drape" },
      { id: "boxy-fit-tshirt", name: "Boxy-Fit T-shirt", desc: "Square modern cut" },
      { id: "heavyweight-tshirt", name: "Heavyweight T-shirt", desc: "Dense, structured premium 240+ GSM fabric" },
      { id: "streetwear-tshirt", name: "Streetwear T-shirt", desc: "Urban aesthetics and graphics" },
      { id: "longline-tshirt", name: "Longline T-shirt", desc: "Extended length and curved hem" }
    ]
  },
  pants: {
    name: "Pants",
    types: [
      { id: "baggy-pants", name: "Baggy Pants", desc: "Loose and relaxed fit." },
      { id: "wide-leg-pants", name: "Wide-Leg Pants", desc: "Wide from the waist to the ankle." },
      { id: "cargo-pants", name: "Cargo Pants", desc: "Pants with multiple pockets." },
      { id: "parachute-pants", name: "Parachute Pants", desc: "Lightweight, relaxed, sporty style." }
    ]
  }
};

const products = [
  // ===== SHIRTS =====
  // 1. Casual Shirt
  {
    id: "p_003",
    name: "OXFORD SHIRT MSC1104",
    price: 799,
    originalPrice: 1299,
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=650&fit=crop&q=80",
    category: "shirts",
    subcategory: "casual-shirt",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White", "Light Blue", "Navy"],
    badge: "Bestseller"
  },
  {
    id: "p_005",
    name: "LINEN CASUAL SHIRT MSC1057",
    price: 999,
    originalPrice: 1599,
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=500&h=650&fit=crop&q=80",
    category: "shirts",
    subcategory: "casual-shirt",
    sizes: ["M", "L", "XL"],
    colors: ["Beige", "Olive", "White"],
    badge: "Popular"
  },
  // 2. Oversized Shirt
  {
    id: "p_sh_01",
    name: "RELAXED DRAPE OVERSIZED SHIRT",
    price: 1199,
    originalPrice: 1899,
    image: "https://images.unsplash.com/photo-1620012253295-c15c429fbb41?w=500&h=650&fit=crop&q=80",
    category: "shirts",
    subcategory: "oversized-shirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Sage Green", "Off-White", "Charcoal"],
    badge: "Trending"
  },
  {
    id: "p_sh_02",
    name: "FLOWY POPLIN OVERSIZED SHIRT",
    price: 1249,
    originalPrice: 1999,
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500&h=650&fit=crop&q=80",
    category: "shirts",
    subcategory: "oversized-shirt",
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Dusty Pink", "White"],
    badge: "New"
  },
  // 3. Cuban Collar Shirt
  {
    id: "p_sh_03",
    name: "RESORT CUBAN COLLAR SHIRT",
    price: 1099,
    originalPrice: 1699,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=650&fit=crop&q=80",
    category: "shirts",
    subcategory: "cuban-collar-shirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Terracotta", "Cream", "Black"],
    badge: "Must Have"
  },
  {
    id: "p_sh_04",
    name: "TEXTURED RETRO CUBAN COLLAR SHIRT",
    price: 1149,
    originalPrice: 1799,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=650&fit=crop&q=80",
    category: "shirts",
    subcategory: "cuban-collar-shirt",
    sizes: ["M", "L", "XL"],
    colors: ["Olive", "Oatmeal"],
    badge: "New"
  },
  // 4. Check Shirt
  {
    id: "p_002",
    name: "IMPORTED STRIPES & CHECK SHIRT MSC0991",
    price: 899,
    originalPrice: 1499,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=650&fit=crop&q=80",
    category: "shirts",
    subcategory: "check-shirt",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Navy Check", "Red Check", "Green Plaid"],
    badge: "Hot"
  },
  {
    id: "p_sh_05",
    name: "BUFFALO PLAID FLANNEL CHECK SHIRT",
    price: 999,
    originalPrice: 1599,
    image: "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=500&h=650&fit=crop&q=80",
    category: "shirts",
    subcategory: "check-shirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black/White Check", "Navy/Brown"],
    badge: "Bestseller"
  },
  // 5. Denim Shirt
  {
    id: "p_006",
    name: "VINTAGE WASHED DENIM SHIRT",
    price: 1099,
    originalPrice: 1699,
    image: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=500&h=650&fit=crop&q=80",
    category: "shirts",
    subcategory: "denim-shirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Medium Blue", "Light Wash"],
    badge: "Classic"
  },
  {
    id: "p_sh_06",
    name: "BLACK RAW DENIM UTILITY SHIRT",
    price: 1199,
    originalPrice: 1799,
    image: "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=500&h=650&fit=crop&q=80",
    category: "shirts",
    subcategory: "denim-shirt",
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Washed Black", "Indigo"],
    badge: "New"
  },

  // ===== T-SHIRTS =====
  // 1. Oversized T-shirt
  {
    id: "p_ts_01",
    name: "MINIMAL OVERSIZED T-SHIRT",
    price: 699,
    originalPrice: 1099,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "oversized-tshirt",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Jet Black", "Chalk White", "Olive"],
    badge: "Bestseller"
  },
  {
    id: "p_ts_02",
    name: "ACID WASH HEAVY OVERSIZED TEE",
    price: 749,
    originalPrice: 1199,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "oversized-tshirt",
    sizes: ["M", "L", "XL"],
    colors: ["Washed Grey", "Faded Rust"],
    badge: "Trending"
  },
  // 2. Drop-Shoulder T-shirt
  {
    id: "p_ts_03",
    name: "RAW EDGE DROP-SHOULDER T-SHIRT",
    price: 649,
    originalPrice: 999,
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "drop-shoulder-tshirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Beige", "Mocha", "White"],
    badge: "Popular"
  },
  {
    id: "p_ts_04",
    name: "DENSE WEAVE DROP-SHOULDER TEE",
    price: 699,
    originalPrice: 1099,
    image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "drop-shoulder-tshirt",
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Forest Green", "Charcoal"],
    badge: "New"
  },
  // 3. Boxy-Fit T-shirt
  {
    id: "p_ts_05",
    name: "SQUARE CUT BOXY-FIT TEE",
    price: 749,
    originalPrice: 1199,
    image: "https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "boxy-fit-tshirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Cream", "Black", "Dusty Blue"],
    badge: "Staff Pick"
  },
  {
    id: "p_ts_06",
    name: "CROPPED SILHOUETTE BOXY TEE",
    price: 799,
    originalPrice: 1299,
    image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "boxy-fit-tshirt",
    sizes: ["M", "L", "XL"],
    colors: ["Sage", "Heather Grey"],
    badge: "Trending"
  },
  // 4. Heavyweight T-shirt
  {
    id: "p_ts_07",
    name: "260 GSM SOLID HEAVYWEIGHT TEE",
    price: 849,
    originalPrice: 1399,
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "heavyweight-tshirt",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Off-White", "Pitch Black", "Brown"],
    badge: "Ultra Premium"
  },
  {
    id: "p_ts_08",
    name: "ORGANIC HEAVYWEIGHT JERSEY TEE",
    price: 899,
    originalPrice: 1499,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "heavyweight-tshirt",
    sizes: ["M", "L", "XL"],
    colors: ["Taupe", "Midnight Navy"],
    badge: "New"
  },
  // 5. Streetwear T-shirt
  {
    id: "p_ts_09",
    name: "TOKYO CIPHER STREETWEAR GRAPHIC TEE",
    price: 799,
    originalPrice: 1299,
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "streetwear-tshirt",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Washed Black", "White"],
    badge: "Hot"
  },
  {
    id: "p_ts_10",
    name: "CYBERPUNK DISTRESSED STREETWEAR TEE",
    price: 849,
    originalPrice: 1399,
    image: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "streetwear-tshirt",
    sizes: ["M", "L", "XL"],
    colors: ["Graphite", "Vintage Olive"],
    badge: "Trending"
  },
  // 6. Longline T-shirt
  {
    id: "p_ts_11",
    name: "CURVED HEM ESSENTIAL LONGLINE TEE",
    price: 699,
    originalPrice: 1099,
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "longline-tshirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Heather Grey", "White"],
    badge: "Essential"
  },
  {
    id: "p_ts_12",
    name: "ASYMMETRIC SPLIT LONGLINE TEE",
    price: 749,
    originalPrice: 1199,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&h=650&fit=crop&q=80",
    category: "tshirts",
    subcategory: "longline-tshirt",
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Olive Green", "Charcoal"],
    badge: "New"
  },

  // ===== PANTS =====
  // 1. Baggy Pants — Loose and relaxed fit
  {
    id: "p_pt_01",
    name: "RELAXED COTTON BAGGY PANTS",
    price: 1299,
    originalPrice: 1999,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=650&fit=crop&q=80",
    category: "pants",
    subcategory: "baggy-pants",
    sizes: ["30", "32", "34", "36", "38"],
    colors: ["Khaki", "Black", "Olive"],
    badge: "Bestseller"
  },
  {
    id: "p_004",
    name: "NO FADE BLACK LYCRA DENIM BAGGY PANTS",
    price: 1499,
    originalPrice: 2199,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=650&fit=crop&q=80",
    category: "pants",
    subcategory: "baggy-pants",
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Jet Black", "Charcoal"],
    badge: "Popular"
  },
  // 2. Wide-Leg Pants — Wide from the waist to the ankle
  {
    id: "p_001",
    name: "LINEN PLEATED WIDE-LEG PANTS MPJ0089",
    price: 1299,
    originalPrice: 1999,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=650&fit=crop&q=80",
    category: "pants",
    subcategory: "wide-leg-pants",
    sizes: ["30", "32", "34", "36"],
    colors: ["Natural Linen", "Navy", "Black"],
    badge: "Trending"
  },
  {
    id: "p_pt_02",
    name: "TAILORED FLOWY WIDE-LEG TROUSERS",
    price: 1499,
    originalPrice: 2299,
    image: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=500&h=650&fit=crop&q=80",
    category: "pants",
    subcategory: "wide-leg-pants",
    sizes: ["30", "32", "34", "36", "38"],
    colors: ["Dark Brown", "Charcoal", "Cream"],
    badge: "Premium"
  },
  // 3. Cargo Pants — Pants with multiple pockets
  {
    id: "p_pt_03",
    name: "TACTICAL 6-POCKET CARGO PANTS",
    price: 1599,
    originalPrice: 2499,
    image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=500&h=650&fit=crop&q=80",
    category: "pants",
    subcategory: "cargo-pants",
    sizes: ["30", "32", "34", "36", "38"],
    colors: ["Military Green", "Black", "Desert Sand"],
    badge: "Hot"
  },
  {
    id: "p_pt_04",
    name: "RELAXED UTILITY TECH CARGO PANTS",
    price: 1449,
    originalPrice: 2299,
    image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=500&h=650&fit=crop&q=80",
    category: "pants",
    subcategory: "cargo-pants",
    sizes: ["28", "30", "32", "34"],
    colors: ["Dark Grey", "Black"],
    badge: "New"
  },
  // 4. Parachute Pants — Lightweight, relaxed, sporty style
  {
    id: "p_pt_05",
    name: "WINDBREAKER NYLON PARACHUTE PANTS",
    price: 1399,
    originalPrice: 2199,
    image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&h=650&fit=crop&q=80",
    category: "pants",
    subcategory: "parachute-pants",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Gunmetal Grey", "Black", "Off-White"],
    badge: "Trending"
  },
  {
    id: "p_pt_06",
    name: "BUNGEE CORD SPORTY PARACHUTE PANTS",
    price: 1349,
    originalPrice: 2099,
    image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?w=500&h=650&fit=crop&q=80",
    category: "pants",
    subcategory: "parachute-pants",
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Khaki Green", "Matte Black"],
    badge: "New"
  }
];

// Helper functions for data access (synchronized with Admin DB)
function getActiveProductsList() {
  if (typeof window !== 'undefined' && window.CF_LOCAL_DB) {
    try {
      const db = window.CF_LOCAL_DB.get();
      if (db && db.products && db.products.length > 0) {
        return db.products;
      }
    } catch (e) {}
  }
  return products;
}

function getProductById(id) {
  const list = getActiveProductsList();
  return list.find(p => p.id === id);
}

function getAllProducts() {
  return getActiveProductsList();
}

function getProductsByCategory(category) {
  const list = getActiveProductsList();
  if (!category || category === "all") return list;
  return list.filter(p => p.category.toLowerCase() === category.toLowerCase());
}

function getProductsBySubcategory(subcategory) {
  const list = getActiveProductsList();
  if (!subcategory || subcategory === "all") return list;
  return list.filter(p => p.subcategory && p.subcategory.toLowerCase() === subcategory.toLowerCase());
}
