export { default } from "next-auth/middleware";

export const config = {
  // Protect customer account routes only. Checkout is accessible to guests.
  // Every protected Route Handler / Server Action additionally calls requireSession().
  matcher: ["/account/:path*"],
};
