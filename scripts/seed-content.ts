/**
 * Seed content pages, FAQs, and sample blog post for Phase 3.5.
 * Run: export DATABASE_URL=... && bun run scripts/seed-content.ts
 */
import { db } from "../src/lib/db";

async function main() {
  console.log("★ Seeding content pages + FAQs...");

  // --- Shipping Policy ---
  await db.page.upsert({
    where: { slug: "shipping-policy" },
    create: {
      slug: "shipping-policy",
      title: "Shipping Policy",
      body: `<h2>Processing Time</h2><p>Orders are processed within 1-2 business days (Monday-Friday, excluding holidays). You will receive a confirmation email once your order has been shipped.</p><h2>Shipping Methods & Delivery Times</h2><ul><li><strong>Standard Shipping:</strong> 3-5 business days — $5.99 (FREE on orders over $50)</li><li><strong>Express Shipping:</strong> 1-2 business days — calculated at checkout</li></ul><h2>Delivery Regions</h2><p>We currently ship within the United States. International shipping will be available soon — please check back or contact us for updates.</p><h2>Order Tracking</h2><p>Once your order ships, you will receive an email with tracking information. You can also track your order <a href="/track-order">here</a> using your order number and email.</p><h2>Shipping Delays</h2><p>Delivery times are estimates and are not guaranteed. Angels Beauty is not responsible for delays caused by carriers, weather, customs, or other circumstances beyond our control.</p><h2>Incorrect Address</h2><p>Please ensure your shipping address is correct at checkout. Angels Beauty is not responsible for packages delivered to an incorrect address provided by the customer.</p><p><em>Note: This policy is editable by the store administrator. Please review and adjust to match your actual shipping terms.</em></p>`,
      published: true,
      publishedAt: new Date(),
    },
    update: {},
  });

  // --- Returns & Exchanges ---
  await db.page.upsert({
    where: { slug: "returns-exchanges" },
    create: {
      slug: "returns-exchanges",
      title: "Returns & Exchanges",
      body: `<h2>Return Policy</h2><p>We want you to love your Angels Beauty products. If you are not completely satisfied, we accept returns within <strong>30 days</strong> of delivery.</p><h2>Eligibility</h2><ul><li>Items must be unused, unopened, and in their original packaging.</li><li>Proof of purchase (order number) is required.</li><li>Sale or clearance items are final sale unless the product is defective.</li></ul><h2>How to Initiate a Return</h2><ol><li>Contact our support team at <a href="/support">our support page</a> with your order number and the reason for return.</li><li>We will review your request and provide a return authorization if eligible.</li><li>Ship the item(s) back to the address provided. Customers are responsible for return shipping costs unless the item was defective or an error on our part.</li></ol><h2>Refunds</h2><p>Once we receive and inspect the returned item, a refund will be processed to your original payment method within 5-7 business days. You will receive an email confirmation.</p><h2>Exchanges</h2><p>To exchange an item, please follow the return process above and place a new order for the desired product.</p><h2>Damaged or Defective Items</h2><p>If you receive a damaged or defective item, please contact us within 7 days of delivery with a photo of the damage. We will arrange a replacement or full refund at no cost to you.</p><p><em>Note: This policy is editable by the store administrator. Please review and adjust to match your actual return terms.</em></p>`,
      published: true,
      publishedAt: new Date(),
    },
    update: {},
  });

  // --- About Us ---
  await db.page.upsert({
    where: { slug: "about-us" },
    create: {
      slug: "about-us",
      title: "About Us",
      body: `<h2>Our Story</h2><p>Angels Beauty was founded with a simple mission: to bring premium, authentic beauty products to everyone who wants to look and feel their best. We believe beauty is not just about looking good — it is about feeling confident, empowered, and connected to your natural self.</p><h2>Our Mission</h2><p>To provide high-quality skincare, makeup, and beauty essentials that help our customers achieve their natural glow. We carefully select every product in our collection to ensure authenticity, quality, and results.</p><h2>Our Values</h2><ul><li><strong>Authenticity:</strong> Every product we sell is genuine and sourced with care.</li><li><strong>Customer Care:</strong> Your satisfaction is our priority. We are here to help you find the right products and answer your questions.</li><li><strong>Accessibility:</strong> Beauty should be for everyone — all skin types, all tones, all routines.</li></ul><h2>Why Shop With Us?</h2><ul><li>72+ authentic products across 11 categories</li><li>Fast and secure shipping</li><li>Easy 30-day returns</li><li>Friendly customer support</li><li>Secure checkout</li></ul><p><em>Note: This content is editable by the store administrator. Please review and customize with your actual brand story and details.</em></p>`,
      published: true,
      publishedAt: new Date(),
    },
    update: {},
  });

  // --- FAQs ---
  const faqs = [
    { category: "Orders & Shipping", question: "How long does it take to process my order?", answer: "Orders are processed within 1-2 business days. You will receive a confirmation email once your order has shipped.", sortOrder: 0 },
    { category: "Orders & Shipping", question: "How do I track my order?", answer: "Once your order ships, you will receive an email with tracking information. You can also track your order using our <a href=\"/track-order\">Track Order</a> page with your order number and email address.", sortOrder: 1 },
    { category: "Orders & Shipping", question: "Do you offer free shipping?", answer: "Yes! We offer free standard shipping on all orders over $50 within the United States.", sortOrder: 2 },
    { category: "Orders & Shipping", question: "Can I change or cancel my order after placing it?", answer: "If you need to change or cancel your order, please contact our support team immediately. We can accommodate changes if the order has not yet been shipped.", sortOrder: 3 },
    { category: "Returns & Exchanges", question: "What is your return policy?", answer: "We accept returns within 30 days of delivery for unused, unopened items in their original packaging. Please see our <a href=\"/returns-exchanges\">Returns & Exchanges</a> page for full details.", sortOrder: 0 },
    { category: "Returns & Exchanges", question: "How do I get a refund?", answer: "Once we receive and inspect your returned item, a refund will be processed to your original payment method within 5-7 business days.", sortOrder: 1 },
    { category: "Products", question: "Are your products authentic?", answer: "Yes, every product we sell is authentic and carefully sourced. We stand behind the quality of every item in our collection.", sortOrder: 0 },
    { category: "Products", question: "Do you test products on animals?", answer: "For specific product information regarding animal testing, please refer to the individual product descriptions or contact our support team.", sortOrder: 1 },
    { category: "Account", question: "Do I need an account to place an order?", answer: "No, you can check out as a guest. However, creating an account allows you to track orders, save addresses, and access your order history.", sortOrder: 0 },
    { category: "Account", question: "How do I reset my password?", answer: "Visit our <a href=\"/login\">login page</a> and click \"Forgot password?\" You will receive an email with a link to reset your password.", sortOrder: 1 },
  ];

  for (const f of faqs) {
    await db.fAQ.create({ data: { ...f, isActive: true } });
  }
  console.log(`  • ${faqs.length} FAQs seeded`);

  console.log("✔ Content seed complete.");
}

main().catch((e) => { console.error("Seed failed:", e); process.exit(1); }).finally(() => db.$disconnect());
