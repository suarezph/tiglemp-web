const CUSTOMER_BASE = (import.meta.env.VITE_CUSTOMER_URL ?? '').replace(
  /\/$/,
  ''
);

export const CUSTOMER_BE_A_PARTNER_URL = `${CUSTOMER_BASE}/be-a-partner`;
