# Cloudinary Image Verification Report — Stage A

**Mode:** READ-ONLY verification. No uploads, deletes, overwrites, or reassignments.
**Cloud:** res.cloudinary.com/k7248qtu (existing account — assets preserved, public IDs untouched).

## Asset verification

| Metric | Value |
|---|---|
| Unique Cloudinary URLs | 89 |
| Reachable (HTTP 200) | 89 |
| Unreachable | 0 |
| Total image references across 72 products | 112 |
| Products with ≥1 image | 72 / 72 |
| Products with exactly 1 image | 49 |
| Products with 2+ images | 23 |

## Image distribution

| Images per product | 1 | 2 | 3 | 4 | 6 |
|---|---|---|---|---|---|
| # products | 49 | 14 | 5 | 2 | 2 |

## Shared images (same URL across products)

16 URLs are shared by more than one product. Notable:
- **24K Gold Serum & Glycolic Serum** share all 6 identical images (likely duplicate assignment — flagged).
- **3 Collagen Soaps** (Vitamin C / Pink / Orange) share one image.
- **5 set products** share one generic image.
- Same-line sharing (Dark Spot, Lavishing Light, Brighten Glow) — likely intentional.

Full flagged-mismatch comparison: `download/image-comparison-flagged.png`.

## Flagged mismatches (pending your approval — NOT auto-reassigned)

1. **Egg Collagen Soap** — primary image is the Egg Collagen Serum (dropper bottle).
2. **Pink Collagen Soap** — shows orange soaps (same as Orange Collagen Soap).
3. **Vitamin C Soap** — shows orange soaps (identical to Orange Collagen Soap).
4. **Caramel Lush Body Lotion** — multi-product collection shot, not a single lotion.
5. **24K Gold Serum & Glycolic Serum** — identical 6-image sets.

No Cloudinary assets were modified, deleted, or reassigned. The flagged mismatches remain pending your manual review and per-product approval.

## Contact sheet

`download/product-image-contact-sheet.png` — all 72 products with their primary Cloudinary image.
