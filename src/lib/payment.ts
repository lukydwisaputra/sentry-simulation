export type PaymentPayload = {
  amount: number;
  currency: string;
  customerId: string;
};

export function formatPaymentSummary(payload: PaymentPayload | undefined): string {
  // BUG: payload can be undefined when payment context is missing — accessing .amount throws TypeError
  return `${payload.currency.toUpperCase()} ${payload.amount.toFixed(2)} charged to ${payload.customerId}`;
}
