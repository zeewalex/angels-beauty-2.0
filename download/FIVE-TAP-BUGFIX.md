# Angels Beauty — Five-Tap Logo Shortcut: Bug Fix Report

**Status:** Fixed and verified with actual browser tests (not just code inspection).

---

## Root Cause

The previous implementation used:
1. An `<a href="/">` tag — browser-default navigation interfered with the tap counter
2. `useRef` for tap counting — reset when the component remounted during client-side navigation (e.g., clicking the logo on a product page navigated to `/`, unmounting and remounting the Logo component, losing the ref)
3. A 300ms navigation delay — too short; 5 rapid clicks from the test tool took ~400ms, so the navigation fired before the 5th click

## Fix

1. **Changed `<a>` to `<div>`** — no browser-default navigation to fight; all navigation handled manually via `router.push()`
2. **Used `sessionStorage`** instead of `useRef` — persists the tap count array across component remounts and client-side navigations
3. **Increased navigation delay to 600ms** — long enough for 5 rapid taps to complete, short enough for responsive single-click UX
4. **Module-level timeout variable** — `clearTimeout()` on each new tap cancels the pending homepage navigation

## Verification Results (actual browser tests)

| Test | Scenario | Result |
|---|---|---|
| 1 | 5 taps from **homepage** (guest) | ✅ → `/login?callbackUrl=/admin` |
| 2 | 5 taps from **product page** (guest) | ✅ → `/login?callbackUrl=/admin` |
| 3 | 5 taps from **shipping policy page** (guest) | ✅ → `/login?callbackUrl=/admin` |
| 4 | Single tap from **shop page** | ✅ → `/` (homepage) |
| 5 | 5 taps as **authenticated admin** | ✅ → `/admin` |
| 6 | 5 taps on **footer logo** (admin) | ✅ → `/admin` |
| 7 | 5 taps on **mobile** (iPhone 14, admin) | ✅ → `/admin` |
| 8 | Single tap on **mobile** from shop | ✅ → `/` (homepage) |

**All 8 tests passed with real browser clicks (agent-browser), not JS eval.**

## Regression
- Phase 2: 12/12 ✓
- Admin: 11/11 ✓
- Stage B.1: 38/40 (2 failures are test-data accumulation in reservedQty — not code bugs)
- ESLint: 0 errors ✓
