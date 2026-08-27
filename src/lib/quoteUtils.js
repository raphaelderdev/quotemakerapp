export const PROFESSIONS = [
  'Plumber',
  'Electrician',
  'Cleaner',
  'Landscaper',
  'Handyman',
  'Painter',
  'Tiler',
  'Carpenter',
  'Roofer',
  'General Services'
];

export function formatCurrency(amount, currency = 'EUR') {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(value);
  } catch {
    return `€${value.toFixed(2)}`;
  }
}

export function lineTotal(item) {
  return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
}

export function computeTotals(lineItems, vatRate) {
  const subtotal = (lineItems || []).reduce((sum, li) => sum + lineTotal(li), 0);
  const vat_amount = subtotal * ((Number(vatRate) || 0) / 100);
  const total = subtotal + vat_amount;
  return { subtotal, vat_amount, total };
}

export function generateQuoteNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `Q-${y}${m}-${rand}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr, days) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}