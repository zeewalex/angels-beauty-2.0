import { z } from "zod";

/** Shared client/server validation schemas (Zod). */

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  email: z.string().email("Enter a valid email").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email").toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const addressSchema = z.object({
  firstName: z.string().min(1, "Required").max(60),
  lastName: z.string().min(1, "Required").max(60),
  line1: z.string().min(1, "Street address is required").max(120),
  line2: z.string().max(120).optional(),
  city: z.string().min(1, "City is required").max(80),
  state: z.string().min(1, "State/Region is required").max(80),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(60),
  phone: z.string().max(30).optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  email: z.string().email("Enter a valid email").toLowerCase(),
  shipping: addressSchema,
  billingSameAsShipping: z.boolean().default(true),
  billing: addressSchema.optional(),
  customerNote: z.string().max(500).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const addToCartSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

/** Standard JSON error helper for Route Handlers. */
export function errorResponse(message: string, status = 400, fields?: Record<string, string>) {
  return Response.json(
    { error: { code: status === 401 ? "UNAUTHORIZED" : "BAD_REQUEST", message, fields } },
    { status },
  );
}
