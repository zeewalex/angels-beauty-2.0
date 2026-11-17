# Supabase Catalog Reconciliation Report — Stage A

**Source:** client-provided Supabase Product_rows.csv export (READ-ONLY — no live Supabase connection, no service-role credentials).
**Compared against:** dev catalog (`src/lib/catalog.ts`).
**Mode:** READ-ONLY comparison. No production writes, migrations, or modifications.

## Summary

| Metric | Supabase (CSV) | Dev catalog | Match |
|---|---|---|---|
| Products | 72 | 72 | ✓ |
| Category slugs | 12 | 11 | 12 → 11 (intentional merge — see below) |
| Price mismatches | — | — | 0 |
| Stock mismatches | — | — | 0 |
| Image-ref mismatches | — | — | 0 |
| Name mismatches | — | — | 0 |

## Category reconciliation (12 source → 11 canonical)

The dev catalog has **2 intentional, approved category corrections** (dev only — production Supabase unchanged). Each product preserves its `sourceCategorySlug` for migration tracking:

| Change | Source slug | Canonical slug | Products affected |
|---|---|---|---|
| Merge | `face-masks-scrubs` | `masks-scrubs` | Green Tea Detox Mask |
| Move | `toners` | `supplements` | Angels Slimming and Detox Tea |

Source category counts: {'body-oils': 3, 'face-cream': 9, 'face-masks-scrubs': 1, 'lotion': 7, 'masks-scrubs': 2, 'serum': 12, 'skincare-sets': 11, 'soaps-cleansers': 11, 'sunscreen': 1, 'supplements': 7, 'toners': 3, 'turmeric-collection': 5}
Dev canonical counts: {'body-oils': 3, 'face-cream': 9, 'lotion': 7, 'masks-scrubs': 3, 'serum': 12, 'skincare-sets': 11, 'soaps-cleansers': 11, 'sunscreen': 1, 'supplements': 8, 'toners': 2, 'turmeric-collection': 5}

## Data integrity

- **Prices:** 0 mismatches — all 72 product prices match the CSV exactly.
- **Stock:** 0 mismatches — all 72 stock quantities match the CSV exactly.
- **Image references:** 0 mismatches — all 112 image references (89 unique Cloudinary URLs) match the CSV exactly.
- **Names/slugs:** 0 mismatches — all 72 names + slugs match.

## Discrepancies requiring your decision

None — all product data (prices, descriptions, stock, slugs, images) is identical between the Supabase CSV export and the dev catalog. The only differences are the 2 approved category corrections (documented above with source-slug preservation).

## Note on live connection

This reconciliation uses the client-provided CSV export as the read-only Supabase source (per the earlier decision not to use service-role credentials). When you approve a live read-only connection (e.g., a read-only Postgres role or anon key with RLS), the same comparison can be re-run against the live tables to confirm no drift since the export.
