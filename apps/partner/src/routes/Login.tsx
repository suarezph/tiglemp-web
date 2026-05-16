import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, ApiError, generalApiErrorMessage } from '@/lib/api';
import { setVerifyContext } from '@/lib/verify-context';
import { useAuthStore } from '@/stores/auth';
import type { LoginResponse } from '@/types/api';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CUSTOMER_BE_A_PARTNER_URL } from '@/lib/external-urls';
import { usePageTitle } from '@/lib/use-page-title';

export function Login() {
  usePageTitle('Sign in');
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.post<LoginResponse>('/auth/login', { email, password }),
    onSuccess: (response) => {
      const { user, token } = response.data;
      if (user.role !== 'PARTNER') {
        mutation.reset();
        return;
      }
      setSession(token, user);
      const target =
        user.approvalStatus === 'APPROVED' ? '/dashboard' : '/application';
      navigate(target, { replace: true });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return;
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        setVerifyContext({ source: 'login', message: error.message });
        const params = new URLSearchParams();
        params.set('email', email);
        navigate(`/verify-partner-email?${params.toString()}`);
      }
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const errorBanner = (() => {
    if (mutation.data && mutation.data.data.user.role !== 'PARTNER') {
      return {
        message: 'This account is not registered as a partner.',
        showSupport: false,
      };
    }
    if (!mutation.error) return null;
    if (mutation.error instanceof ApiError) {
      if (mutation.error.code === 'EMAIL_NOT_VERIFIED') return null;
      const showSupport =
        mutation.error.code === 'ACCOUNT_BANNED' ||
        mutation.error.code === 'ACCOUNT_INACTIVE';
      const message = generalApiErrorMessage(mutation.error);
      if (!message) return null;
      return { message, showSupport };
    }
    return { message: 'Unexpected error', showSupport: false };
  })();

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Login to your account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to login to your partner account.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="#"
                className="text-sm underline-offset-4 hover:underline text-muted-foreground"
              >
                Forgot your password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {errorBanner && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive space-y-1"
            >
              <p>{errorBanner.message}</p>
              {errorBanner.showSupport && (
                <p className="text-xs text-destructive/80">
                  Please contact support for assistance.
                </p>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in…' : 'Login'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <a
            href={CUSTOMER_BE_A_PARTNER_URL}
            className="underline underline-offset-4"
          >
            Apply to be a partner
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
