/**
 * Seed the ISOLATED dev database (angels_dev) with the 72-product catalog
 * from src/lib/catalog.ts (derived from the client's Product_rows.csv).
 *
 * This populates Category, Product, ProductVariant, Inventory, and ProductImage
 * so the cart/checkout APIs can validate price + stock server-side.
 *
 * Production Supabase is NOT touched — this is the local dev DB only.
 * Idempotent: safe to re-run (upserts).
 *
 * Run: bun run scripts/seed-catalog.ts
 */
import { db } from "../src/lib/db";
import {
  catalogCategories,
  catalogProducts,
} from "../src/lib/catalog";

async function main() {
  console.log("★ Seeding dev DB from catalog (72 products)…");

  // 1. Categories
  for (const c of catalogCategories) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        name: c.name,
        isActive: true,
        sortOrder: 0,
      },
      update: { name: c.name, isActive: true },
    });
  }
  console.log(`  • ${catalogCategories.length} categories`);

  // 2. Products + variants + inventory + images
  let productCount = 0;
  for (const p of catalogProducts) {
    const priceCents = Math.round(p.price * 100);
    const compareCents = p.comparePrice ? Math.round(p.comparePrice * 100) : null;

    await db.product.upsert({
      where: { slug: p.slug },
      create: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        categoryId: (await db.category.findUnique({ where: { slug: p.categorySlug } }))!.id,
        status: "ACTIVE",
        isFeatured: p.featured,
        isBestSeller: p.bestSeller,
        isTrending: p.newArrival,
        priceMinCents: priceCents,
        priceMaxCents: priceCents,
        ratingAvg: null,
        ratingCount: 0,
        sortOrder: 0,
      },
      update: {
        name: p.name,
        description: p.description,
        status: "ACTIVE",
        isFeatured: p.featured,
        isBestSeller: p.bestSeller,
        isTrending: p.newArrival,
        priceMinCents: priceCents,
        priceMaxCents: priceCents,
      },
    });

    // variant (single-SKU per product)
    const variantId = `v-${p.id}`;
    await db.productVariant.upsert({
      where: { sku: p.slug.toUpperCase().replace(/-/g, "_") },
      create: {
        id: variantId,
        productId: p.id,
        sku: p.slug.toUpperCase().replace(/-/g, "_"),
        name: null,
        priceCents,
        compareAtCents: compareCents,
        isActive: true,
        inventory: { create: { quantity: p.stock, lowStockThreshold: 10, trackInventory: true } },
      },
      update: {
        productId: p.id,
        priceCents,
        compareAtCents: compareCents,
        isActive: true,
      },
    });
    // ensure inventory exists
    await db.inventory.upsert({
      where: { variantId },
      create: { variantId, quantity: p.stock, lowStockThreshold: 10, trackInventory: true },
      update: { quantity: p.stock },
    });

    // images (deterministic id for idempotent upsert)
    for (let i = 0; i < p.images.length; i++) {
      const url = p.images[i];
      const publicId = url.split("/").pop()?.split(".")[0] ?? `${i}`;
      const imgId = `img-${p.id}-${i}`;
      await db.productImage.upsert({
        where: { id: imgId },
        create: {
          id: imgId,
          productId: p.id,
          cloudinaryPublicId: `${p.id}-${publicId}`,
          url,
          altText: p.name,
          sortOrder: i,
          isPrimary: i === 0,
        },
        update: { url, altText: p.name, sortOrder: i, isPrimary: i === 0 },
      });
    }
    productCount++;
  }
  console.log(`  • ${productCount} products + variants + inventory + images`);
  console.log("✔ Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
