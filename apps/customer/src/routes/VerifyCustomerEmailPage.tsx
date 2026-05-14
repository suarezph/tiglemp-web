import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';

type ResendResponse = {
  emailDelivery?: {
    configured?: boolean;
    delivered: boolean;
    skipped?: boolean;
    reason?: string;
    messageId?: string | null;
  };
  verification?: {
    expiresAt: string;
    verificationUrl: string;
    token: string;
  };
};

export function VerifyCustomerEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const initialEmail = params.get('email') ?? '';
  const [email, setEmail] = useState(initialEmail);

  // useQuery (not useMutation) so React Strict Mode's dev double-mount dedupes
  // by queryKey rather than firing two verify requests.
  const verifyQuery = useQuery({
    queryKey: ['auth', 'verify-customer-email', token],
    queryFn: () => api.post<null>('/auth/verify-email', { token }),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const resendMutation = useMutation({
    mutationFn: (targetEmail: string) =>
      api.post<ResendResponse>('/auth/resend-verification', {
        email: targetEmail,
        role: 'CUSTOMER',
      }),
  });

  const handleResend = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    resendMutation.mutate(email.trim());
  };

  const verifyApiError =
    verifyQuery.error instanceof ApiError ? verifyQuery.error : null;
  const verifyCode = verifyApiError?.code;
  const alreadyVerified = verifyCode === 'ALREADY_VERIFIED';
  const canResend =
    verifyCode === 'VERIFICATION_TOKEN_INVALID' ||
    verifyCode === 'VERIFICATION_TOKEN_USED' ||
    verifyCode === 'VERIFICATION_TOKEN_EXPIRED';

  return (
    <>
      <title>Verify your email — Tiglemp</title>

      <AuthShell>
        <div className="rounded-2xl bg-background ring-1 ring-border shadow-xl p-8 space-y-5">
          {/* No token at all — let the user request a new link. */}
          {!token && (
            <Status
              tone="muted"
              icon={<Mail className="size-7" />}
              title="Verify your email"
              description="Open the verification link we sent to your inbox. You can also request a new one below."
            />
          )}

          {/* Auto-verify states (token in URL). */}
          {!!token && verifyQuery.isPending && (
            <Status
              tone="muted"
              icon={<Loader2 className="size-7 animate-spin" />}
              title="Verifying your email…"
              description="This only takes a second."
            />
          )}

          {!!token && verifyQuery.isSuccess && (
            <Status
              tone="success"
              icon={<CheckCircle2 className="size-7" />}
              title="You're verified"
              description="Your email is confirmed. You can now sign in and start booking."
              action={
                <Button asChild className="h-11 w-full max-w-xs">
                  <Link to="/login">Continue to sign in</Link>
                </Button>
              }
            />
          )}

          {!!token && verifyQuery.isError && alreadyVerified && (
            <Status
              tone="success"
              icon={<CheckCircle2 className="size-7" />}
              title="Already verified"
              description="This email is already verified. You can sign in any time."
              action={
                <Button asChild className="h-11 w-full max-w-xs">
                  <Link to="/login">Continue to sign in</Link>
                </Button>
              }
            />
          )}

          {!!token && verifyQuery.isError && !alreadyVerified && (
            <Status
              tone="error"
              icon={<XCircle className="size-7" />}
              title={
                verifyCode === 'VERIFICATION_TOKEN_EXPIRED'
                  ? 'This link has expired'
                  : verifyCode === 'VERIFICATION_TOKEN_USED'
                  ? 'This link was already used'
                  : verifyCode === 'VERIFICATION_TOKEN_INVALID'
                  ? "This link isn't valid"
                  : "Couldn't verify your email"
              }
              description={
                verifyApiError?.message ??
                'Request a new verification email below and try again.'
              }
            />
          )}

          {/* Resend form: shown when there's no token, or when the token
              failed for an invalid/used/expired reason. */}
          {(!token || canResend) && (
            <form
              onSubmit={handleResend}
              className="space-y-3 border-t border-border pt-5"
              noValidate
            >
              <div className="space-y-2">
                <label
                  htmlFor="resendEmail"
                  className="text-sm font-semibold"
                >
                  Resend verification email
                </label>
                <input
                  id="resendEmail"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {resendMutation.isError && (
                <p className="text-sm text-destructive" role="alert">
                  {resendMutation.error instanceof ApiError
                    ? resendMutation.error.message
                    : 'Could not resend right now. Try again.'}
                </p>
              )}
              {resendMutation.isSuccess && (
                <p className="text-sm text-primary" role="status">
                  ✓ A new verification email is on the way. Check your inbox.
                </p>
              )}

              <Button
                type="submit"
                variant="outline"
                className="w-full h-11"
                disabled={resendMutation.isPending}
              >
                {resendMutation.isPending ? 'Sending…' : 'Send a new link'}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
            Wrong account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Start over
            </Link>
          </p>
        </div>
      </AuthShell>
    </>
  );
}

function Status({
  tone,
  icon,
  title,
  description,
  action,
}: {
  tone: 'muted' | 'success' | 'error';
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const tile =
    tone === 'success'
      ? 'bg-primary/15 text-primary'
      : tone === 'error'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-foreground/[0.06] text-foreground';

  return (
    <div className="text-center">
      <div
        className={`size-14 mx-auto rounded-full grid place-items-center ${tile}`}
      >
        {icon}
      </div>
      <h1 className="mt-5 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
