export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export function calculateCartTotal(items: CartItem[] | undefined): number {
  // BUG: items can be undefined when cart is empty — .reduce() will throw TypeError
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
