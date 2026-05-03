import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { clearVerifyContext, getVerifyContext } from '@/lib/verify-context';
import type { ResendVerificationResponse } from '@/types/api';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function VerifyPartnerEmail() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailParam);

  const verifyContext = useMemo(() => getVerifyContext(), []);

  // useQuery (not useMutation) so React Strict Mode's dev double-mount dedupes
  // by queryKey instead of firing the request twice and orphaning the response
  // on the unmounted observer.
  const verifyQuery = useQuery({
    queryKey: ['verify-partner-email', tokenParam],
    queryFn: () =>
      api.post<{ message: string }>('/auth/verify-email', {
        token: tokenParam,
      }),
    enabled: !!tokenParam,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (verifyQuery.isSuccess) {
      clearVerifyContext();
    }
  }, [verifyQuery.isSuccess]);

  const resendMutation = useMutation({
    mutationFn: (targetEmail: string) =>
      api.post<ResendVerificationResponse>('/auth/resend-verification', {
        email: targetEmail,
        role: 'PARTNER',
      }),
  });

  const handleResend = (e: FormEvent) => {
    e.preventDefault();
    resendMutation.mutate(email);
  };

  const isVerifyingFlow = !!tokenParam;
  const fromLogin = !tokenParam && verifyContext?.source === 'login';
  const fromRegister = !tokenParam && verifyContext?.source === 'register';
  const isPostRegisterFlow = !tokenParam && !!emailParam;

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">
            {verifyQuery.isSuccess
              ? 'Email verified'
              : isVerifyingFlow
              ? 'Verify your email'
              : fromLogin
              ? 'Verify your email to continue'
              : fromRegister
              ? 'Account created'
              : 'Check your email'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {verifyQuery.isSuccess
              ? 'Your email is confirmed. An admin will review your application before you can log in.'
              : isVerifyingFlow
              ? 'We need to confirm the email on your partner account before you can log in.'
              : fromLogin
              ? `${verifyContext!.message}. Resend the verification link below to continue.`
              : fromRegister
              ? verifyContext!.message
              : isPostRegisterFlow
              ? `We sent a verification link to ${emailParam}. Click the link in your inbox to verify your account.`
              : 'Open the verification link from your email to confirm your account.'}
          </p>
        </div>

        {/* Auto-verify states (only when token is in URL) */}
        {isVerifyingFlow && verifyQuery.isLoading && (
          <StatusBanner
            tone="muted"
            icon={<Loader2 className="size-5 animate-spin" />}
            title="Verifying…"
            description="Hold on while we confirm your email."
          />
        )}

        {isVerifyingFlow && verifyQuery.isSuccess && (
          <StatusBanner
            tone="success"
            icon={<CheckCircle2 className="size-5" />}
            title="You're verified"
            description="Your email is confirmed. Once an admin approves your application, you'll be able to sign in."
            action={
              <Button asChild className="w-full">
                <Link to="/login">Continue to login</Link>
              </Button>
            }
          />
        )}

        {isVerifyingFlow && verifyQuery.isError && (
          <StatusBanner
            tone="error"
            icon={<XCircle className="size-5" />}
            title="Verification failed"
            description={
              verifyQuery.error instanceof ApiError
                ? verifyQuery.error.message
                : 'The link is invalid or expired. Request a new one below.'
            }
          />
        )}

        {/* No-token state: tailor banner copy to where the user came from. */}
        {!isVerifyingFlow && fromLogin && (
          <StatusBanner
            tone="muted"
            icon={<Mail className="size-5" />}
            title="Check your inbox"
            description="Click the verification link we sent earlier, or resend a new one below."
          />
        )}
        {!isVerifyingFlow && !fromLogin && (fromRegister || isPostRegisterFlow) && (
          <StatusBanner
            tone="muted"
            icon={<Mail className="size-5" />}
            title="Open your inbox"
            description="Click the verification link we sent to confirm this email. If you don't see it within 10 minutes, you can resend the link below."
          />
        )}

        {/* Resend section: shown unless verification already succeeded */}
        {!verifyQuery.isSuccess && (
          <form onSubmit={handleResend} className="space-y-3 border-t pt-4">
            <div className="grid gap-2">
              <Label htmlFor="resendEmail">Resend verification</Label>
              <Input
                id="resendEmail"
                type="email"
                required
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              <StatusBanner
                tone="success"
                icon={<Mail className="size-5" />}
                title="Verification resent"
                description="Check your inbox for the new link."
              />
            )}

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending ? 'Sending…' : 'Resend verification'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Wrong account?{' '}
          <Link to="/register" className="underline underline-offset-4">
            Start over
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

type StatusBannerProps = {
  tone: 'muted' | 'success' | 'error';
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
};

function StatusBanner({
  tone,
  icon,
  title,
  description,
  action,
}: StatusBannerProps) {
  const toneClasses =
    tone === 'success'
      ? 'border-primary/30 bg-primary/5'
      : tone === 'error'
      ? 'border-destructive/30 bg-destructive/5'
      : 'border-border bg-muted/40';

  return (
    <div className={`rounded-md border p-4 space-y-3 ${toneClasses}`}>
      <div className="flex items-start gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
