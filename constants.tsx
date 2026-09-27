
import React from 'react';
import { NavItem, Product, Service } from './types';

export const COMPANY_NAME = "Red Bird International";
export const TAGLINE = "Custom Apparel OEM & Legitimate Surplus Export";
export const COMPANY_ADDRESS = "House #12, Road #04, Sector #01, Uttara, Dhaka, Bangladesh";
export const COMPANY_EMAIL = "info@redbird-international.com";
export const COMPANY_PHONE = "+880-965-818-2256 (office)";
export const WEBSITE_URL = "https://redbird-international.com";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "OEM & Products", href: "#products" },
  { label: "Work Process", href: "#gallery" },
  { label: "Our Reach", href: "#global-network" },
  { label: "Contact", href: "#contact" },
];

export const SERVICES: Service[] = [
  {
    title: "Custom OEM Manufacturing",
    description: "Tailored manufacturing engineered to buyer tech-packs. We produce custom T-shirts exported to South Korea, fine-gauge sweaters, hoodies, and knitwear with client-negotiated private label specs.",
    icon: "🧵"
  },
  {
    title: "Verified Stock Sourcing",
    description: "Legitimate sourcing of authentic cancelled export lots and factory overstocks, backed by certified release permissions, commercial bills of lading, and verified chain of custody.",
    icon: "📑"
  },
  {
    title: "Rigorous 4-Point Inspection",
    description: "Strict quality control protocols to ensure every single garment, seam, stitch density, and GSM meets international export standards before packing.",
    icon: "🔍"
  },
  {
    title: "Direct Buyer Negotiation",
    description: "Transparent B2B terms, flexible sampling, custom labeling, and bespoke fabric weights negotiated directly based on each customer's specific market demands.",
    icon: "🤝"
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Heavyweight Combed Cotton Crewneck T-Shirt (220 GSM)",
    brand: "Korea Export OEM",
    category: "Custom Manufacturing",
    garmentType: "T-shirts",
    sourcingType: "Custom OEM Manufacturing",
    fabricSpec: "100% Ring-Spun Combed Compact Cotton, 220 GSM, Bio-Silicone Washed",
    targetMarket: "South Korea & Asia-Pacific",
    moq: "1,000 pcs / color",
    colors: ["White", "Black", "Charcoal", "Deep Navy"],
    sizes: ["95 (M)", "100 (L)", "105 (XL)", "110 (2XL)"],
    price: 6.80,
    pricingRules: {
      bulkDiscounts: [
        { minQty: 1000, discountPercentage: 5 },
        { minQty: 3000, discountPercentage: 10 },
        { minQty: 10000, discountPercentage: 15 }
      ],
      variantAdjustments: {
        "110 (2XL)": 0.40
      }
    },
    images: [
      "/src/assets/images/korea_tshirt_craft_1790114674548.jpg",
      "/src/assets/images/hero_apparel_manufacturing_1790114666237.jpg"
    ],
    reviews: [
      { id: '1', productId: 1, userName: 'Seoul Fashion Trading Co.', rating: 5, comment: 'Exceptional 220 GSM density and collar ribbing. Clean stitch lines and shrink test under 2%. Perfect for our Korean retail line.', date: '2026-03-15T10:00:00Z' },
      { id: '2', productId: 1, userName: 'Busan Import Ltd.', rating: 5, comment: 'Consistent dye lots and reliable bulk execution. Highly recommended for custom OEM orders.', date: '2026-03-20T14:30:00Z' }
    ]
  },
  {
    id: 2,
    name: "Fine-Gauge Knitted Cotton-Merino Sweater (12 GG)",
    brand: "Custom Knitwear Studio",
    category: "Custom Manufacturing",
    garmentType: "Sweaters & Knitwear",
    sourcingType: "Custom OEM Manufacturing",
    fabricSpec: "12-Gauge Fine Interlock Cotton-Merino Wool Blend Yarn",
    targetMarket: "European Union & North America",
    moq: "800 pcs / style",
    colors: ["Oatmeal Heather", "Forest Green", "Charcoal Slate", "Midnight Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    price: 18.50,
    pricingRules: {
      bulkDiscounts: [
        { minQty: 500, discountPercentage: 6 },
        { minQty: 1500, discountPercentage: 12 },
        { minQty: 5000, discountPercentage: 18 }
      ],
      variantAdjustments: {
        "XXL": 1.20
      }
    },
    images: [
      "/src/assets/images/custom_knitwear_sweater_1790114683287.jpg",
      "/src/assets/images/hero_apparel_manufacturing_1790114666237.jpg"
    ]
  },
  {
    id: 3,
    name: "French Terry Heavyweight Pullover Hoodie (360 GSM)",
    brand: "Custom Streetwear OEM",
    category: "Custom Manufacturing",
    garmentType: "Hoodies",
    sourcingType: "Custom OEM Manufacturing",
    fabricSpec: "360 GSM Heavy Combed Cotton Brushed French Terry, 2x2 Spandex Rib",
    targetMarket: "South Korea & Japan",
    moq: "1,000 pcs / color",
    colors: ["Melange Grey", "Washed Black", "Olive Drab", "Vintage Navy"],
    sizes: ["95 (M)", "100 (L)", "105 (XL)", "110 (2XL)"],
    price: 14.20,
    pricingRules: {
      bulkDiscounts: [
        { minQty: 800, discountPercentage: 5 },
        { minQty: 2500, discountPercentage: 10 },
        { minQty: 5000, discountPercentage: 15 }
      ]
    },
    images: [
      "/src/assets/images/warehouse_export_logistics_1790114694683.jpg",
      "/src/assets/images/korea_tshirt_craft_1790114674548.jpg"
    ]
  },
  {
    id: 4,
    name: "Verified Export Surplus: Classic Piqué Cotton Polo Lot",
    brand: "Verified Surplus Allocation",
    category: "Verified Surplus Lots",
    garmentType: "Polos",
    sourcingType: "Verified Surplus Sourcing",
    fabricSpec: "230 GSM Mercerized Piqué Cotton (100% Authorized Release)",
    targetMarket: "Global Export Wholesalers",
    moq: "3,000 pcs full lot",
    colors: ["Classic White", "Royal Blue", "Crimson Red", "Jet Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    price: 7.90,
    pricingRules: {
      bulkDiscounts: [
        { minQty: 1000, discountPercentage: 7 },
        { minQty: 3000, discountPercentage: 14 }
      ]
    },
    images: [
      "/src/assets/images/korea_tshirt_craft_1790114674548.jpg",
      "/src/assets/images/warehouse_export_logistics_1790114694683.jpg"
    ]
  },
  {
    id: 5,
    name: "Drop-Shoulder Oversized Boxy Tee (260 GSM)",
    brand: "Korea Export OEM",
    category: "Custom Manufacturing",
    garmentType: "T-shirts",
    sourcingType: "Custom OEM Manufacturing",
    fabricSpec: "260 GSM Heavy Single Jersey, Seoul Streetwear Relaxed Pattern",
    targetMarket: "South Korea (Seoul)",
    moq: "1,000 pcs / style",
    colors: ["Chalk White", "Washed Slate", "Forest Green", "Pitch Black"],
    sizes: ["100 (L)", "105 (XL)", "110 (2XL)"],
    price: 7.50,
    pricingRules: {
      bulkDiscounts: [
        { minQty: 1000, discountPercentage: 5 },
        { minQty: 3000, discountPercentage: 12 }
      ]
    },
    images: [
      "/src/assets/images/korea_tshirt_craft_1790114674548.jpg",
      "/src/assets/images/hero_apparel_manufacturing_1790114666237.jpg"
    ]
  },
  {
    id: 6,
    name: "Verified Export Surplus: 5-Pocket Stretch Twill Pant Lot",
    brand: "Verified Surplus Allocation",
    category: "Verified Surplus Lots",
    garmentType: "Jeans & Pants",
    sourcingType: "Verified Surplus Sourcing",
    fabricSpec: "11.5 oz Ring-Spun Stretch Cotton Twill, Bar-Tacked Reinforcement",
    targetMarket: "Global Wholesalers",
    moq: "2,500 pcs lot",
    colors: ["Khaki Tan", "Navy", "Washed Slate", "Olive"],
    sizes: ["30", "32", "34", "36", "38"],
    price: 11.20,
    pricingRules: {
      bulkDiscounts: [
        { minQty: 1000, discountPercentage: 6 },
        { minQty: 2500, discountPercentage: 12 }
      ]
    },
    images: [
      "/src/assets/images/warehouse_export_logistics_1790114694683.jpg",
      "/src/assets/images/custom_knitwear_sweater_1790114683287.jpg"
    ]
  },
  {
    id: 7,
    name: "Ribbed Crewneck Wool-Blend Heavy Knit Pullover (7 GG)",
    brand: "Custom Knitwear Studio",
    category: "Custom Manufacturing",
    garmentType: "Sweaters & Knitwear",
    sourcingType: "Custom OEM Manufacturing",
    fabricSpec: "7-Gauge Heavy Rib Knit, Anti-Pilling Lambswool & Acrylic Blend",
    targetMarket: "Europe & East Asia",
    moq: "600 pcs / color",
    colors: ["Camel", "Oatmeal", "Charcoal", "Dark Moss"],
    sizes: ["S", "M", "L", "XL"],
    price: 21.00,
    pricingRules: {
      bulkDiscounts: [
        { minQty: 500, discountPercentage: 8 },
        { minQty: 1500, discountPercentage: 15 }
      ]
    },
    images: [
      "/src/assets/images/custom_knitwear_sweater_1790114683287.jpg",
      "/src/assets/images/hero_apparel_manufacturing_1790114666237.jpg"
    ]
  },
  {
    id: 8,
    name: "Verified Export Surplus: All-Weather Technical Shell Lot",
    brand: "Verified Surplus Allocation",
    category: "Verified Surplus Lots",
    garmentType: "Outerwear",
    sourcingType: "Verified Surplus Sourcing",
    fabricSpec: "Waterproof Breathable DWR Nylon Shell with Sealed Seams",
    targetMarket: "Global Wholesalers",
    moq: "1,500 pcs lot",
    colors: ["Black", "Graphite Grey", "Deep Teal"],
    sizes: ["M", "L", "XL", "XXL"],
    price: 19.50,
    pricingRules: {
      bulkDiscounts: [
        { minQty: 500, discountPercentage: 5 },
        { minQty: 1500, discountPercentage: 12 }
      ]
    },
    images: [
      "/src/assets/images/warehouse_export_logistics_1790114694683.jpg",
      "/src/assets/images/hero_apparel_manufacturing_1790114666237.jpg"
    ]
  }
];
