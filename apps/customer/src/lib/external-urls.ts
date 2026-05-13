// Centralised pointers to sibling apps. Keeps URL formatting (trailing
// slash handling, etc.) in one place so callers can just import constants.

const PARTNER_BASE = (import.meta.env.VITE_PARTNER_URL ?? '').replace(
  /\/$/,
  ''
);

export const PARTNER_LOGIN_URL = `${PARTNER_BASE}/login`;
export const PARTNER_HELP_URL = `${PARTNER_BASE}/help`;
export const PARTNER_VERIFY_URL = `${PARTNER_BASE}/verify-partner-email`;
