/**
 * Pricing plan definitions — single source of truth.
 * Both PaywallModal and Pricing page import from here.
 */
export const PLANS = {
  monthly: {
    id: 'monthly',
    label: 'Monthly Access',
    price: 199,
    period: '/mo',
    description: 'Perfect for a quick financial checkup.',
    features: [
      { text: 'Unlimited Health Scores', included: true },
      { text: 'Advanced Tax Optimization', included: true },
      { text: 'Dynamic FIRE Planning', included: true },
      { text: 'Priority Processing', included: false },
      { text: 'Export to PDF', included: false },
    ],
  },
  yearly: {
    id: 'yearly',
    label: 'Pro Yearly',
    price: 1999,
    period: '/yr',
    // 199 * 12 = 2388 — 1999 = 389 saved
    savings: 389,
    features: [
      { text: 'Everything in Monthly', included: true },
      { text: 'Priority AI Processing', included: true },
      { text: 'Direct email support', included: true },
      { text: 'Export to PDF / Excel', included: true },
      { text: 'Early access to new agents', included: true },
    ],
  },
}
