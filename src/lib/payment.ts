export type PaymentPayload = {
  amount: number;
  currency: string;
  customerId: string;
};

export function formatPaymentSummary(payload: PaymentPayload | undefined): string {
  if (!payload) {
    throw new Error("Payment payload is required");
  }
  return `${payload.currency.toUpperCase()} ${payload.amount.toFixed(2)} charged to ${payload.customerId}`;
}
