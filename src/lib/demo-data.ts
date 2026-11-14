/**
 * DEMO DATA for Angels Beauty — Phase 1 build.
 *
 * This is temporary demo content used to build and present the design.
 * It is NOT connected to the real Supabase / Cloudinary store data and
 * will be replaced during Phase 3 integration. Do not treat these
 * products, prices, or reviews as real store data.
 */

export type DemoProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAt: number;
  rating: number;
  reviewCount: number;
  image: string;
  badge?: string;
};

export type DemoCategory = {
  id: string;
  name: string;
  image: string;
  bg: string; // tailwind bg class for the pastel tile
  count: string;
};

export type DemoTestimonial = {
  id: string;
  name: string;
  country: string;
  avatarBg: string;
  initials: string;
  rating: number;
  quote: string;
  highlights: string[];
};

export const demoCategories: DemoCategory[] = [
  {
    id: "skincare",
    name: "Skincare",
    image: "/images/category-skincare.png",
    bg: "bg-[#dde8d5]",
    count: "120+ Products",
  },
  {
    id: "makeup",
    name: "Makeup",
    image: "/images/category-makeup.png",
    bg: "bg-[#f7d9dc]",
    count: "85+ Products",
  },
  {
    id: "hair-care",
    name: "Hair Care",
    image: "/images/category-haircare.png",
    bg: "bg-[#f7dcd0]",
    count: "64+ Products",
  },
  {
    id: "fragrance",
    name: "Fragrance",
    image: "/images/category-fragrance.png",
    bg: "bg-[#e4dcec]",
    count: "42+ Products",
  },
  {
    id: "body-care",
    name: "Body Care",
    image: "/images/category-bodycare.png",
    bg: "bg-[#dce9e4]",
    count: "58+ Products",
  },
];

export const demoBestSellers: DemoProduct[] = [
  {
    id: "p1",
    name: "Hydra Glow Moisturizer",
    category: "Skincare",
    price: 34,
    compareAt: 40,
    rating: 5,
    reviewCount: 247,
    image: "/images/product-moisturizer.png",
    badge: "Best Seller",
  },
  {
    id: "p2",
    name: "Velvet Matte Lipstick",
    category: "Makeup",
    price: 22,
    compareAt: 28,
    rating: 5,
    reviewCount: 189,
    image: "/images/product-lipstick.png",
    badge: "Best Seller",
  },
  {
    id: "p3",
    name: "Radiance Face Serum",
    category: "Skincare",
    price: 42,
    compareAt: 50,
    rating: 5,
    reviewCount: 312,
    image: "/images/product-serum.png",
    badge: "Best Seller",
  },
  {
    id: "p4",
    name: "Gentle Face Cleanser",
    category: "Skincare",
    price: 18,
    compareAt: 24,
    rating: 4,
    reviewCount: 156,
    image: "/images/product-cleanser.png",
    badge: "Best Seller",
  },
];

export const demoTrending: DemoProduct[] = [
  {
    id: "t1",
    name: "Vitamin C Serum",
    category: "Skincare",
    price: 38,
    compareAt: 44,
    rating: 5,
    reviewCount: 1241,
    image: "/images/product-vitaminc.png",
    badge: "Trending",
  },
  {
    id: "t2",
    name: "Matte Liquid Foundation",
    category: "Makeup",
    price: 36,
    compareAt: 39,
    rating: 5,
    reviewCount: 980,
    image: "/images/product-foundation.png",
    badge: "Trending",
  },
  {
    id: "t3",
    name: "Eyeshadow Palette",
    category: "Makeup",
    price: 28,
    compareAt: 36,
    rating: 5,
    reviewCount: 1024,
    image: "/images/product-eyeshadow.png",
    badge: "Trending",
  },
  {
    id: "t4",
    name: "Hair Repair Mask",
    category: "Hair Care",
    price: 24,
    compareAt: 30,
    rating: 4,
    reviewCount: 1012,
    image: "/images/product-hairmask.png",
    badge: "Trending",
  },
];

export const demoTestimonials: DemoTestimonial[] = [
  {
    id: "r1",
    name: "Sarah Johnson",
    country: "USA",
    avatarBg: "bg-[#f7d9dc]",
    initials: "SJ",
    rating: 5,
    quote:
      "I've been using Angels Beauty for six months and my skin has never looked healthier. The natural ingredients and fast shipping make me a loyal customer now!",
    highlights: ["healthier", "natural ingredients and fast shipping", "loyal customer now!"],
  },
  {
    id: "r2",
    name: "Emily Carter",
    country: "UK",
    avatarBg: "bg-[#dde8d5]",
    initials: "EC",
    rating: 5,
    quote:
      "Absolutely in love with the Radiance Face Serum. It feels luxurious and my glow is real. The packaging is beautiful and delivery was quicker than expected.",
    highlights: ["glow is real", "packaging is beautiful"],
  },
  {
    id: "r3",
    name: "Olivia Martinez",
    country: "Canada",
    avatarBg: "bg-[#e4dcec]",
    initials: "OM",
    rating: 5,
    quote:
      "The Hydra Glow Moisturizer transformed my dry skin into something soft and radiant. Clean ingredients that actually work — I recommend Angels Beauty to everyone.",
    highlights: ["transformed my dry skin", "Clean ingredients that actually work"],
  },
];

export const instagramImages = [
  "/images/instagram-1.png",
  "/images/instagram-2.png",
  "/images/instagram-3.png",
  "/images/instagram-4.png",
  "/images/instagram-5.png",
];

export const navLinks = [
  { label: "Home", href: "#home", active: true },
  { label: "Shop", href: "#shop" },
  { label: "Categories", href: "#categories", hasDropdown: true },
  { label: "About", href: "#about" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
];
