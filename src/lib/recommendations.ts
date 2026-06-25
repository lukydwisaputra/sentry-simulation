export type Product = {
  id: string;
  name: string;
  price: number;
};

const PRODUCTS: Product[] = [
  { id: "p0", name: "Starter Plan", price: 29 },
  { id: "p1", name: "Growth Plan", price: 79 },
  { id: "p2", name: "Pro Plan", price: 149 },
  { id: "p3", name: "Business Plan", price: 299 },
  { id: "p4", name: "Enterprise Plan", price: 599 },
  { id: "p5", name: "Add-on: Analytics", price: 49 },
  { id: "p6", name: "Add-on: SSO", price: 99 },
  { id: "p7", name: "Add-on: Audit Log", price: 79 },
  { id: "p8", name: "Add-on: Custom Domain", price: 19 },
  { id: "p9", name: "Add-on: Priority Support", price: 199 },
];

export function getRecommendedProduct(userId: number): Product {
  // BUG: index overflows when userId >= 100 — Math.floor(100 / 10) = 10, out of bounds (max index is 9)
  const index = Math.floor(userId / 10);
  const product = PRODUCTS[index];
  return { id: product.id, name: product.name, price: product.price };
}
