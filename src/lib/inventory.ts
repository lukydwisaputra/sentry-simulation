export async function fetchInventory(warehouseId: string): Promise<{ items: number; warehouseId: string }> {
  if (!warehouseId) {
    throw new Error("Warehouse ID cannot be empty");
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { items: 42, warehouseId };
}
