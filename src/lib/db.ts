export type QueryResult = {
  rows: Record<string, unknown>[];
  duration_ms: number;
};

export async function runQuery(sql: string): Promise<QueryResult> {
  // BUG: returns undefined when sql is empty — caller accessing .rows will throw TypeError
  if (!sql.trim()) {
    return undefined as unknown as QueryResult;
  }
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return {
    rows: [{ id: 1, product: "Pro Plan", qty: 3 }],
    duration_ms: 3000,
  };
}
