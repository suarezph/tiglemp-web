const KEY = 'tiglemp:verify-context';

export type VerifyContext = {
  source: 'register' | 'login';
  message: string;
};

export function getVerifyContext(): VerifyContext | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<VerifyContext> | null;
    if (
      !parsed ||
      typeof parsed.message !== 'string' ||
      (parsed.source !== 'register' && parsed.source !== 'login')
    ) {
      return null;
    }
    return { source: parsed.source, message: parsed.message };
  } catch {
    return null;
  }
}

export function setVerifyContext(ctx: VerifyContext): void {
  sessionStorage.setItem(KEY, JSON.stringify(ctx));
}

export function clearVerifyContext(): void {
  sessionStorage.removeItem(KEY);
}
