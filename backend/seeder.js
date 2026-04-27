/**
 * seeder.js  —  backend/seeder.js
 *
 * Wipes the ecom MongoDB database, then seeds:
 *   • 2 users  (1 admin + 1 normal user)
 *   • 50 Adidas-inspired products
 *       - 2 images each uploaded live to YOUR Cloudinary account
 *       - 3–5 reviews per product with real user ObjectId refs
 *       - ratings + numOfReviews computed from reviews
 *   • 20 orders with correct field names matching orderModel exactly
 *
 * Usage  (run from inside /backend)
 * ──────────────────────────────────
 *   node seeder.js            ← wipe + seed
 *   node seeder.js --destroy  ← wipe only
 *
 * Requires  backend/config/config.env:
 *   DB_URI, CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config", "config.env") });

const mongoose   = require("mongoose");
const cloudinary = require("cloudinary").v2;

// ── Models ───────────────────────────────────────────────────────────────────
const User    = require("./models/userModel");
const Product = require("./models/productModel");
const Order   = require("./models/orderModel");

// ── Cloudinary ────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const pick  = (arr)      => arr[Math.floor(Math.random() * arr.length)];
const rnd   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const price = (n)        => parseFloat(n.toFixed(2));

async function uploadToCloudinary(remoteUrl, folder = "products") {
  try {
    const r = await cloudinary.uploader.upload(remoteUrl, {
      folder,
      resource_type: "image",
    });
    return { public_id: r.public_id, url: r.secure_url };
  } catch (err) {
    console.warn(`\n  ⚠  Upload failed for ${remoteUrl.slice(-50)}: ${err.message}`);
    const seed = encodeURIComponent(remoteUrl.slice(-20));
    const fb = await cloudinary.uploader.upload(
      `https://picsum.photos/seed/${seed}/800/800`,
      { folder, resource_type: "image" }
    );
    return { public_id: fb.public_id, url: fb.secure_url };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DROP STALE INDEXES
//
//  A previous schema version added a unique index on `slug`. That field no
//  longer exists in productModel.js, but Atlas still holds the index.
//  Every insert writes slug:null and hits E11000 on the second document.
//  We drop the index AFTER wiping the collection, before inserting new data.
// ─────────────────────────────────────────────────────────────────────────────
async function dropStaleIndexes() {
  const col = mongoose.connection.db.collection("products");

  let existingIndexes = [];
  try {
    existingIndexes = await col.indexes();
  } catch (_) {
    // Collection doesn't exist yet on a fresh DB — nothing to drop
    return;
  }

  const staleName = "slug_1";
  const found     = existingIndexes.some((idx) => idx.name === staleName);

  if (found) {
    try {
      await col.dropIndex(staleName);
      console.log(`   ✔ Dropped stale index: ${staleName}`);
    } catch (err) {
      if (err.codeName !== "IndexNotFound") throw err;
    }
  } else {
    console.log(`   ℹ  Stale index not present (nothing to drop): ${staleName}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCT DATA
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTS_DATA = [

  // ── FOOTWEAR (16) ────────────────────────────────────────────────────────
  {
    name: "Adidas Ultraboost 23",
    description: "Experience incredible energy return with Boost cushioning. The Ultraboost 23 features a Primeknit+ upper for a sock-like fit, a Continental rubber outsole for superior grip, and a Linear Energy Push system for smooth heel-to-toe transitions.",
    price: 189.95, category: "footwear", stock: 42,
    imageUrls: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80",
    ],
  },
  {
    name: "Adidas Stan Smith",
    description: "An icon of tennis-court style since the 1970s. Clean leather upper, perforated 3-Stripes, the iconic green heel tab, and Ortholite cushioning for all-day comfort.",
    price: 94.95, category: "footwear", stock: 80,
    imageUrls: [
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80",
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&q=80",
    ],
  },
  {
    name: "Adidas NMD_R1",
    description: "Street style meets premium comfort. Full-length Boost cushioning, Primeknit upper, and iconic midsole plugs for all-day city wear.",
    price: 129.95, category: "footwear", stock: 55,
    imageUrls: [
      "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
    ],
  },
  {
    name: "Adidas Samba OG",
    description: "Born on the football pitch in the 1950s. Low-profile leather upper, suede T-toe overlay, and gum rubber outsole — a timeless cultural icon.",
    price: 99.95, category: "footwear", stock: 63,
    imageUrls: [
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80",
      "https://images.unsplash.com/photo-1556906781-9a412961a28c?w=800&q=80",
    ],
  },
  {
    name: "Adidas Gazelle",
    description: "A vintage icon remastered. Soft suede upper, serrated 3-Stripes, low-cut silhouette. Originally a multi-sport shoe, now a streetwear essential.",
    price: 89.95, category: "footwear", stock: 70,
    imageUrls: [
      "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    ],
  },
  {
    name: "Adidas Superstar",
    description: "The shell-toe legend. Introduced in 1969 as a basketball shoe, the Superstar transcended sport to become one of the most iconic sneakers of all time.",
    price: 89.95, category: "footwear", stock: 95,
    imageUrls: [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80",
      "https://images.unsplash.com/photo-1584735175315-9d5df23be620?w=800&q=80",
    ],
  },
  {
    name: "Adidas Forum Low",
    description: "Hailing from basketball courts in 1984. Velcro strap ankle support, bold leather upper, and distinctive tooled rubber cupsole.",
    price: 99.95, category: "footwear", stock: 38,
    imageUrls: [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80",
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
    ],
  },
  {
    name: "Adidas Ozweego",
    description: "Future-forward chunky runner with a mixed-material upper, foam pods in the midsole, and a bulky outsole — a statement of bold style and everyday comfort.",
    price: 119.95, category: "footwear", stock: 44,
    imageUrls: [
      "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
    ],
  },
  {
    name: "Adidas Continental 80",
    description: "Clean lines and a retro tennis-court aesthetic. Full-grain leather upper, cupsole construction, and contrast stitching details.",
    price: 84.95, category: "footwear", stock: 50,
    imageUrls: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    ],
  },
  {
    name: "Adidas Predator Accuracy.1 FG",
    description: "Engineered for the modern game. Controlskin upper with rubber elements for enhanced ball control, a compression fit collar, and a sprint frame soleplate.",
    price: 219.95, category: "footwear", stock: 25,
    imageUrls: [
      "https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=800&q=80",
      "https://images.unsplash.com/photo-1510771463146-e89e6e86560e?w=800&q=80",
    ],
  },
  {
    name: "Adidas X Speedportal.1 FG",
    description: "Speed-engineered boots with a Speedskin upper for minimal water absorption, Speedframe outsole, and asymmetric lacing for maximum strike zone.",
    price: 199.95, category: "footwear", stock: 20,
    imageUrls: [
      "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80",
      "https://images.unsplash.com/photo-1518894347340-c78bfb8bdd62?w=800&q=80",
    ],
  },
  {
    name: "Adidas Ultraboost Light",
    description: "Our lightest Ultraboost ever. Light Boost foam delivers legendary energy return at 30% less weight, paired with a Linear Energy Push system and Continental rubber outsole.",
    price: 179.95, category: "footwear", stock: 35,
    imageUrls: [
      "https://images.unsplash.com/photo-1562183241-b937e9102303?w=800&q=80",
      "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=80",
    ],
  },
  {
    name: "Adidas Handball Spezial",
    description: "Born in handball gyms of Europe. Low-profile suede upper, contrast leather toe cap, and gum outsole — an icon that has influenced street culture for decades.",
    price: 94.95, category: "footwear", stock: 48,
    imageUrls: [
      "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=800&q=80",
      "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=80",
    ],
  },
  {
    name: "Adidas Campus 00s",
    description: "The Campus silhouette redefined for a new generation. Slightly oversized proportions, suede upper, and iconic 3-Stripes bridge archival and contemporary style.",
    price: 99.95, category: "footwear", stock: 58,
    imageUrls: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
      "https://images.unsplash.com/photo-1520256862855-398228c41684?w=800&q=80",
    ],
  },
  {
    name: "Adidas Terrex Free Hiker 2 GTX",
    description: "Technical hiking boot with Boost midsole, GORE-TEX waterproof membrane, and Continental rubber outsole for confident grip on any terrain.",
    price: 219.95, category: "footwear", stock: 18,
    imageUrls: [
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80",
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80",
    ],
  },
  {
    name: "Adidas Yeezy Boost 350 V2 Bone",
    description: "The silhouette that changed sneaker culture. Full-length Boost midsole, Primeknit upper with monofilament side stripe, and semi-translucent outsole. Limited stock.",
    price: 229.95, category: "footwear", stock: 8,
    imageUrls: [
      "https://images.unsplash.com/photo-1603787081207-362bcef7c144?w=800&q=80",
      "https://images.unsplash.com/photo-1617375407361-b5391db4bbdb?w=800&q=80",
    ],
  },

  // ── TOPS (13) ──────────────────────────────────────────────────────────────
  {
    name: "Adidas Essentials 3-Stripes T-Shirt",
    description: "A wardrobe essential in soft cotton jersey with classic 3-Stripes down the sleeves. Regular fit, ribbed crew neck, embroidered Adidas logo at the chest.",
    price: 24.95, category: "tops", stock: 150,
    imageUrls: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    ],
  },
  {
    name: "Adidas Trefoil T-Shirt",
    description: "Soft cotton jersey, relaxed fit, bold embroidered Trefoil at the chest. The Trefoil tee is an Originals icon that belongs in every casual wardrobe.",
    price: 27.95, category: "tops", stock: 120,
    imageUrls: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80",
    ],
  },
  {
    name: "Adidas Adicolor Beckenbauer Track Top",
    description: "A heritage icon. Slim-fit track top in smooth tricot fabric with ribbed cuffs, embroidered Trefoil, and 3-Stripes down the sleeves.",
    price: 74.95, category: "tops", stock: 65,
    imageUrls: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
      "https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=800&q=80",
    ],
  },
  {
    name: "Adidas Tiro 23 League Training Top",
    description: "Train at your best with AEROREADY moisture-absorbing technology, zip-up collar, and the iconic Tiro silhouette. Lightweight and breathable for serious sessions.",
    price: 44.95, category: "tops", stock: 88,
    imageUrls: [
      "https://images.unsplash.com/photo-1536992266094-82847e1fd431?w=800&q=80",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
    ],
  },
  {
    name: "Adidas Originals Trefoil Hoodie",
    description: "Heritage meets everyday comfort. Kangaroo pocket, adjustable drawcord hood, brushed fleece interior, Trefoil logo at the left chest.",
    price: 64.95, category: "tops", stock: 72,
    imageUrls: [
      "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80",
      "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800&q=80",
    ],
  },
  {
    name: "Adidas Essentials Fleece Sweatshirt",
    description: "Relaxed warmth in soft fleece. Crew neck, small embroidered Adidas logo, clean minimal styling. The everyday sweatshirt that pairs with everything.",
    price: 44.95, category: "tops", stock: 95,
    imageUrls: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80",
    ],
  },
  {
    name: "Adidas Adicolor Classics Windbreaker",
    description: "Lightweight water-resistant nylon, full-zip front, packable hood, bold 3-Stripes down the sleeves in a vintage colourway. An Originals legend reworked.",
    price: 84.95, category: "tops", stock: 40,
    imageUrls: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80",
    ],
  },
  {
    name: "Adidas Run Icons 3-Stripes Running T-Shirt",
    description: "Made with recycled polyester and AEROREADY technology to keep you dry. Reflective details for low-light visibility and a relaxed fit for easy movement.",
    price: 34.95, category: "tops", stock: 110,
    imageUrls: [
      "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&q=80",
      "https://images.unsplash.com/photo-1589149098258-3e9102cd63d3?w=800&q=80",
    ],
  },
  {
    name: "Adidas SST Track Jacket",
    description: "A perennial Originals classic. Smooth tricot fabric, mock neck full-zip, rib cuffs, and 3-Stripes down the sleeves define this timeless SST silhouette.",
    price: 69.95, category: "tops", stock: 55,
    imageUrls: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80",
    ],
  },
  {
    name: "Adidas Own The Run Jacket",
    description: "Lightweight and packable for runs in changeable weather. AEROREADY technology, packable hood, and reflective details combine performance with practicality.",
    price: 79.95, category: "tops", stock: 45,
    imageUrls: [
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    ],
  },
  {
    name: "Adidas Terrex Multi Full-Zip Fleece Hoodie",
    description: "Technical fleece for mountain adventures. Warm, breathable, moisture-wicking, full zip, hood, zippered hand pockets, and hem drawcord for a secure fit.",
    price: 109.95, category: "tops", stock: 30,
    imageUrls: [
      "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&q=80",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
    ],
  },
  {
    name: "Adidas Badge of Sport T-Shirt",
    description: "Clean, sport-inspired tee featuring the classic Badge of Sport graphic. Soft cotton, regular fit, crew neck — a simple iconic look for off-duty days.",
    price: 27.95, category: "tops", stock: 130,
    imageUrls: [
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    ],
  },
  {
    name: "Adidas Tiro 23 Competition Training Jacket",
    description: "Competition-grade training jacket with slim fit, AEROREADY technology, soft-touch finish. The 1/4-zip design with reflective logo is perfect for warm-up.",
    price: 59.95, category: "tops", stock: 52,
    imageUrls: [
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    ],
  },

  // ── BOTTOM (8) ────────────────────────────────────────────────────────────
  {
    name: "Adidas Essentials 3-Stripes Shorts",
    description: "Go-to training shorts in soft French terry with elastic waistband, front zip pockets, and 3-Stripes down the sides. Comfortable on and off the pitch.",
    price: 29.95, category: "bottom", stock: 140,
    imageUrls: [
      "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
    ],
  },
  {
    name: "Adidas Tiro 23 League Pants",
    description: "Iconic football training pants with AEROREADY technology, slim-fit silhouette, ankle zips, and signature Tiro side panels. Built for serious athletes.",
    price: 44.95, category: "bottom", stock: 85,
    imageUrls: [
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
    ],
  },
  {
    name: "Adidas SST Track Pants",
    description: "An Originals classic. Smooth tricot fabric, 3-Stripes down the legs, side pockets, and an elastic drawcord waistband for all-day comfort.",
    price: 64.95, category: "bottom", stock: 70,
    imageUrls: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
    ],
  },
  {
    name: "Adidas Own The Run Shorts",
    description: "Lightweight running shorts with built-in briefs, back zip pocket, and reflective details. AEROREADY keeps moisture away from your skin.",
    price: 34.95, category: "bottom", stock: 90,
    imageUrls: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80",
      "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800&q=80",
    ],
  },
  {
    name: "Adidas Adicolor Firebird Track Pants",
    description: "A fire-bird legacy in a modern silhouette. Contrasting colour body, 3-Stripes down the legs, side zip pockets, and elastic waistband.",
    price: 69.95, category: "bottom", stock: 55,
    imageUrls: [
      "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=800&q=80",
      "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&q=80",
    ],
  },
  {
    name: "Adidas Terrex Liteflex Hiking Pants",
    description: "Lightweight stretchy woven hiking pants with zip-off legs, cargo pockets, UPF rating, and a secure waistband with belt loops.",
    price: 79.95, category: "bottom", stock: 35,
    imageUrls: [
      "https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
    ],
  },
  {
    name: "Adidas Essentials Tapered Cuff Joggers",
    description: "Comfortable everyday joggers in soft cotton single jersey. 3-Stripes down sides, ribbed cuffs, side pockets, and drawcord waistband. Regular-tapered fit.",
    price: 44.95, category: "bottom", stock: 100,
    imageUrls: [
      "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&q=80",
      "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=800&q=80",
    ],
  },
  {
    name: "Adidas AEROREADY 3-Stripes Slim Shorts",
    description: "AEROREADY training shorts with slim fit, elastic waistband, and 3-Stripes. Perfect for gym sessions, warm-ups, and recovery days.",
    price: 29.95, category: "bottom", stock: 115,
    imageUrls: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80",
    ],
  },

  // ── ACCESSORIES (6) ───────────────────────────────────────────────────────
  {
    name: "Adidas Trefoil Cap",
    description: "Six-panel cap with a curved brim, metal eyelets, and an embroidered Trefoil logo. Adjustable strap closure fits most head sizes.",
    price: 24.95, category: "accessories", stock: 200,
    imageUrls: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80",
      "https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800&q=80",
    ],
  },
  {
    name: "Adidas Adicolor Classic Backpack",
    description: "Spacious everyday backpack — large main compartment, front zippered pocket, padded back panel, adjustable straps, and a tonal Trefoil logo. 28 litres.",
    price: 44.95, category: "accessories", stock: 75,
    imageUrls: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80",
    ],
  },
  {
    name: "Adidas Linear 3-Stripes Socks 3 Pairs",
    description: "Cushioned crew socks with arch support and 3-Stripes ankle ribbing. 3-pack to keep your sock game strong all week. One size fits most.",
    price: 16.95, category: "accessories", stock: 300,
    imageUrls: [
      "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&q=80",
      "https://images.unsplash.com/photo-1612363148760-a67f05e7e0ca?w=800&q=80",
    ],
  },
  {
    name: "Adidas BOS Beanie",
    description: "Cosy ribbed-knit beanie with a Badge of Sport embroidered logo. Stretchy fabric fits most head sizes and keeps you warm on cold training days.",
    price: 22.95, category: "accessories", stock: 160,
    imageUrls: [
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80",
      "https://images.unsplash.com/photo-1510598155-877f4c3ba738?w=800&q=80",
    ],
  },
  {
    name: "Adidas Stadium Duffel Bag Medium",
    description: "Versatile duffel with large main compartment, zippered front pocket, end zip shoe pocket, and adjustable padded shoulder strap. Perfect for gym and travel.",
    price: 49.95, category: "accessories", stock: 60,
    imageUrls: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80",
    ],
  },
  {
    name: "Adidas 3-Stripes Headband & Wristband Set",
    description: "Terry cloth headband + 2 wristbands with moisture-wicking properties. Keeps sweat out of your eyes during intense sessions. Classic look, practical performance.",
    price: 14.95, category: "accessories", stock: 220,
    imageUrls: [
      "https://images.unsplash.com/photo-1612363148760-a67f05e7e0ca?w=800&q=80",
      "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&q=80",
    ],
  },

  // ── CLOTHING (7) ──────────────────────────────────────────────────────────
  {
    name: "Adidas Adicolor 3-Stripes Full-Zip Hoodie",
    description: "Heritage-inspired full-zip hoodie in heavyweight fleece with 3-Stripes down the sleeves, kangaroo pocket, and adjustable hood. Relaxed fit.",
    price: 79.95, category: "clothing", stock: 60,
    imageUrls: [
      "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800&q=80",
      "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80",
    ],
  },
  {
    name: "Adidas Terrex Utilitas Down Vest",
    description: "Packable insulated vest for cold-weather outdoor adventures. 700-fill recycled down, water-repellent finish, two-way front zip. Packs into its own chest pocket.",
    price: 149.95, category: "clothing", stock: 22,
    imageUrls: [
      "https://images.unsplash.com/photo-1605008664816-e7c09b0a0073?w=800&q=80",
      "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&q=80",
    ],
  },
  {
    name: "Adidas Adventure Winter Jacket",
    description: "Bold winter jacket with PrimaLoft insulation, water-repellent finish, detachable hood, and archive-inspired graphics. Made with 70%+ recycled materials.",
    price: 189.95, category: "clothing", stock: 15,
    imageUrls: [
      "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=800&q=80",
      "https://images.unsplash.com/photo-1605008664816-e7c09b0a0073?w=800&q=80",
    ],
  },
  {
    name: "Adidas Tiro 23 Pro Shorts",
    description: "Match-ready football shorts with AEROREADY technology, elastic waistband with internal drawcord, and iconic Tiro side panels. Slim fit.",
    price: 29.95, category: "clothing", stock: 100,
    imageUrls: [
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=80",
      "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800&q=80",
    ],
  },
  {
    name: "Adidas Own The Run Tank Top",
    description: "Minimal and breathable running vest in lightweight AEROREADY fabric. Wide armholes, reflective logo, and a back zip pocket for your essentials.",
    price: 29.95, category: "clothing", stock: 75,
    imageUrls: [
      "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    ],
  },
  {
    name: "Adidas All Blacks 2023 Home Jersey",
    description: "Official replica jersey of the New Zealand All Blacks. AEROREADY fabric, iconic silver fern badge, and a slim performance fit.",
    price: 89.95, category: "clothing", stock: 30,
    imageUrls: [
      "https://images.unsplash.com/photo-1580087641016-5e69ccb6a4c5?w=800&q=80",
      "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=800&q=80",
    ],
  },
  {
    name: "Adidas Essentials 3-Stripes Woven Shorts",
    description: "Lightweight woven training shorts with elastic waistband, side pockets, and 3-Stripes. Regular fit ideal for gym workouts and sport.",
    price: 27.95, category: "clothing", stock: 120,
    imageUrls: [
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=80",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  REVIEW COMMENT POOL
// ─────────────────────────────────────────────────────────────────────────────
const REVIEW_COMMENTS = [
  "Absolutely love these. The quality is exactly what I expected from Adidas.",
  "Very comfortable and stylish. Gets loads of compliments whenever I wear them.",
  "Great product but sizing runs slightly small — I'd recommend going up half a size.",
  "Perfect fit and the material feels premium. Worth every penny.",
  "Delivered quickly and arrived in perfect condition. Very happy with this purchase.",
  "Good value for money. The build quality is solid and it looks great in person.",
  "Been wearing these for 3 months now and they still look brand new.",
  "The colour is exactly as shown in the photos. Really pleased with this purchase.",
  "Excellent comfort. I wear these all day and my feet never hurt.",
  "Top quality as expected. Adidas never disappoints.",
  "A bit pricey but the quality justifies it. You get what you pay for.",
  "These exceeded my expectations. Highly recommend to anyone.",
  "Runs true to size. The design is clean and minimalist — exactly what I wanted.",
  "Fantastic for the gym. Lightweight and breathable even during intense sessions.",
  "Brilliant product. Have already ordered a second pair in a different colour.",
];

// ─────────────────────────────────────────────────────────────────────────────
//  UK SHIPPING ADDRESSES
// ─────────────────────────────────────────────────────────────────────────────
const UK_ADDRESSES = [
  { address: "12 Oxford Street",    city: "London",     state: "England",   zip: 10001, phone: 7911123456 },
  { address: "45 Princes Street",   city: "Edinburgh",  state: "Scotland",  zip: 20002, phone: 7922234567 },
  { address: "8 St Mary Street",    city: "Cardiff",    state: "Wales",     zip: 30003, phone: 7933345678 },
  { address: "23 Royal Avenue",     city: "Belfast",    state: "N.Ireland", zip: 40004, phone: 7944456789 },
  { address: "6 Northern Quarter",  city: "Manchester", state: "England",   zip: 50005, phone: 7955567890 },
  { address: "31 Briggate",         city: "Leeds",      state: "England",   zip: 60006, phone: 7966678901 },
  { address: "99 New Street",       city: "Birmingham", state: "England",   zip: 70007, phone: 7977789012 },
  { address: "2 Castle Street",     city: "Bristol",    state: "England",   zip: 80008, phone: 7988890123 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  DATABASE CONNECTION  (no deprecated options — removed useNewUrlParser &
//  useUnifiedTopology which have had no effect since MongoDB Driver v4)
// ─────────────────────────────────────────────────────────────────────────────
async function connectDB() {
  await mongoose.connect(process.env.DB_URI);
  console.log("✔  MongoDB connected:", mongoose.connection.host);
}

// ─────────────────────────────────────────────────────────────────────────────
//  DESTROY  — wipe all three collections
// ─────────────────────────────────────────────────────────────────────────────
async function destroyData() {
  console.log("\n🗑  Wiping existing data from ecom collections…");
  const [u, p, o] = await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
  ]);
  console.log(`   Deleted → Users: ${u.deletedCount}  Products: ${p.deletedCount}  Orders: ${o.deletedCount}`);
  console.log("✔  All collections cleared");
}

// ─────────────────────────────────────────────────────────────────────────────
//  SEED
// ─────────────────────────────────────────────────────────────────────────────
async function seedData() {

  // ── 1. USERS ──────────────────────────────────────────────────────────────
  console.log("\n👤 Creating users…");

  const adminUser = await User.create({
    name:     "Admin User",
    email:    "admin@clickit.com",
    password: "Admin@1234",
    role:     "admin",
    profilePic: {
      public_id: "avatars/admin_seed",
      url: "https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-man.jpg",
    },
  });
  console.log(`  ✔ Admin  → ${adminUser.email}`);

  const normalUser = await User.create({
    name:     "Jane Smith",
    email:    "jane@example.com",
    password: "Password@1234",
    role:     "user",
    profilePic: {
      public_id: "avatars/jane_seed",
      url: "https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-woman.jpg",
    },
  });
  console.log(`  ✔ User   → ${normalUser.email}`);

  const users = [adminUser, normalUser];

  // ── 2. PRODUCTS ───────────────────────────────────────────────────────────
  console.log(`\n📦 Creating ${PRODUCTS_DATA.length} products (uploading images to Cloudinary)…`);

  const createdProducts = [];

  for (let i = 0; i < PRODUCTS_DATA.length; i++) {
    const data = PRODUCTS_DATA[i];
    process.stdout.write(`  [${String(i + 1).padStart(2, "0")}/${PRODUCTS_DATA.length}] ${data.name}…`);

    const images = [];
    for (const url of data.imageUrls) {
      const img = await uploadToCloudinary(url, "products");
      images.push(img);
    }

    const reviewCount = rnd(3, 5);
    const reviews = [];
    for (let r = 0; r < reviewCount; r++) {
      const reviewer = users[r % users.length];
      const rating   = rnd(3, 5);
      reviews.push({
        user:       reviewer._id,
        profileImg: reviewer.profilePic.url,
        name:       reviewer.name,
        rating,
        comment:    pick(REVIEW_COMMENTS),
      });
    }

    const avgRating = reviews.reduce((s, rev) => s + rev.rating, 0) / reviews.length;

    const product = await Product.create({
      name:         data.name,
      description:  data.description,
      price:        data.price,
      category:     data.category,
      stock:        data.stock,
      images,
      reviews,
      ratings:      parseFloat(avgRating.toFixed(1)),
      numOfReviews: reviews.length,
      createdBy:    adminUser._id,
    });

    createdProducts.push(product);
    console.log(" ✔");
  }

  // ── 3. ORDERS ─────────────────────────────────────────────────────────────
  console.log("\n🛒 Creating 20 orders…");

  const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Delivered", "Delivered"];

  for (let i = 0; i < 20; i++) {
    const orderUser  = users[i % 2];
    const addr       = pick(UK_ADDRESSES);
    const numItems   = rnd(1, 4);

    const shuffled   = [...createdProducts].sort(() => 0.5 - Math.random());
    const orderItems = shuffled.slice(0, numItems).map((p) => ({
      name:     p.name,
      price:    p.price,
      quantity: rnd(1, 3),
      image:    p.images[0].url,
      product:  p._id,
    }));

    const rawItemPrice  = orderItems.reduce((s, item) => s + item.price * item.quantity, 0);
    const itemPrice     = price(rawItemPrice);
    const taxPrice      = price(itemPrice * 0.20);
    const shippingPrice = itemPrice > 100 ? 0 : 4.99;
    const totalPrice    = price(itemPrice + taxPrice + shippingPrice);

    const orderStatus = pick(ORDER_STATUSES);
    const daysAgo     = rnd(1, 365);
    const paidAt      = new Date(Date.now() - daysAgo * 86_400_000);

    await Order.create({
      shippingInfo: {
        address: addr.address,
        city:    addr.city,
        state:   addr.state,
        country: "United Kingdom",
        zip:     addr.zip,
        phone:   addr.phone,
      },
      orderItems,
      user:        orderUser._id,
      paymentInfo: {
        id:     `pi_seed_${Date.now()}_${i}`,
        status: "succeeded",
      },
      paidAt,
      itemPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      orderStatus,
      ...(orderStatus === "Delivered"
        ? { deliveredAt: new Date(paidAt.getTime() + rnd(3, 10) * 86_400_000) }
        : {}),
    });

    console.log(`  ✔ Order ${String(i + 1).padStart(2, "0")} — ${orderStatus.padEnd(11)} — £${totalPrice}`);
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log("\n──────────────────────────────────────────────────");
  console.log("✅  SEED COMPLETE");
  console.log(`   Users    : ${users.length}`);
  console.log(`   Products : ${createdProducts.length}`);
  console.log(`   Orders   : 20`);
  console.log("──────────────────────────────────────────────────");
  console.log("\n🔑 Login credentials");
  console.log("   Admin  →  admin@clickit.com   /  Admin@1234");
  console.log("   User   →  jane@example.com    /  Password@1234");
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    await destroyData();              // wipe collections
    await dropStaleIndexes();         // ← drop slug_1 AFTER wipe, BEFORE insert
    if (process.argv[2] !== "--destroy") await seedData();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seeder failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
