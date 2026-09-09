export function generateUpiUri({
  upiId,
  name,
  amount,
  orderReference,
  currency = 'INR'
}: {
  upiId: string;
  name: string;
  amount: number;
  orderReference: string;
  currency?: string;
}) {
  const url = new URL('upi://pay');
  url.searchParams.append('pa', upiId); // Payee VPA
  url.searchParams.append('pn', name);  // Payee Name
  url.searchParams.append('am', amount.toFixed(2)); // Amount
  url.searchParams.append('cu', currency); // Currency
  url.searchParams.append('tr', orderReference); // Transaction ref ID
  return url.toString();
}

export function generateOrderReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = crypto.randomUUID().split('-')[0].toUpperCase();
  return `ORD-${timestamp}-${randomStr}`;
}
