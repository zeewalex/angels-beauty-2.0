# IP Extraction for Rate Limiting

## Overview

The trusted-device enrollment rate limiter (`src/lib/rate-limit.ts`)
extracts the client IP address to identify and limit enrollment attempts.
IP extraction differs between local development and Vercel deployment.

## Vercel deployment (staging + production)

On Vercel, the platform sets these headers via its own edge network:

1. **`x-vercel-forwarded-for`** — the real client IP as determined by
   Vercel's infrastructure. This is **not user-controllable** — the
   client cannot set or override it. **This is the preferred header.**

2. **`x-forwarded-for`** — also set by Vercel's proxy. On Vercel, this
   is trustworthy as the first value (left-most = original client).
   Used as a fallback if `x-vercel-forwarded-for` is absent.

3. **`x-real-ip`** — set by some reverse proxy configurations. Used as
   a secondary fallback.

**Order of preference on Vercel:**
```
x-vercel-forwarded-for  →  x-real-ip  →  x-forwarded-for  →  "unknown"
```

All values are validated as valid IPv4 or IPv6 before use. Invalid
values fall back to the next header, then to `"unknown"`.

## Local development

In local development (no reverse proxy), none of the platform headers
are set by infrastructure. The `x-forwarded-for` header can be set
freely by the client (e.g., via `curl -H "X-Forwarded-For: ..."`).

For local development, this is acceptable — the rate limiter still
works, but a malicious local client could spoof their IP. This is not
a concern in local dev because:
- The rate limiter is a convenience protection, not the primary
  security barrier (bcrypt password verification + PIN check are).
- Local dev is a single-user, trusted environment.

**If running behind a local reverse proxy (nginx, Caddy):**
Configure the proxy to **overwrite** (not append to) the
`X-Forwarded-For` header with the real client IP. This prevents
spoofing. For nginx:
```
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

## What we do NOT do

- We do **not** blindly trust the first value of `X-Forwarded-For`
  without validation. The value is checked as a valid IP format.
- We do **not** trust `X-Forwarded-For` on platforms where it can be
  client-set. On Vercel, `x-vercel-forwarded-for` is preferred because
  it is platform-controlled.
- We do **not** use the full `X-Forwarded-For` chain — only the first
  (left-most) value, which represents the original client.

## Identifier normalization

All extracted IPs are:
1. Trimmed of whitespace.
2. Lowercased (for IPv6 consistency).
3. Validated as IPv4 (four octets 0-255) or IPv6 (colon-separated hex).

Invalid IPs fall back to `"unknown"`, which means all requests without
a detectable valid IP share the same rate-limit bucket. This is safer
than allowing unlimited access.

## Code reference

See `src/lib/rate-limit.ts`, function `normalizeIdentifier(req: Request)`.

```
Vercel:  x-vercel-forwarded-for  →  trusted (platform-set)
Local:   x-forwarded-for         →  not trusted (client-set, dev only)
```
