import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import type { LoginResponse } from '@/types/api';
import { useAuthStore } from '@/stores/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { PageMeta } from '@/components/PageMeta';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') ?? '/customer/dashboard';
  const setSession = useAuthStore((s) => s.setSession);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: (values: LoginValues) =>
      api.post<LoginResponse>('/auth/login', values),
    onSuccess: (response) => {
      const { user, token } = response.data;
      if (user.role !== 'CUSTOMER') {
        form.setError('email', {
          type: 'server',
          message: 'This account is not a customer account.',
        });
        return;
      }
      setSession(token, user);
      navigate(redirect, { replace: true });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return;
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        const emailValue = form.getValues('email');
        const search = new URLSearchParams();
        if (emailValue) search.set('email', emailValue);
        navigate(
          `/verify-customer-email${
            search.toString() ? `?${search.toString()}` : ''
          }`
        );
        return;
      }
      const fieldErrors = error.fieldErrors;
      if (!fieldErrors) return;
      (['email', 'password'] as const).forEach((name) => {
        const msgs = collectFieldErrors(fieldErrors, name);
        if (msgs.length === 0) return;
        form.setError(name, { type: 'server', message: msgs.join(' ') });
      });
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  const apiError =
    mutation.error instanceof ApiError ? mutation.error : null;
  const generalError = generalApiErrorMessage(mutation.error);

  // EMAIL_NOT_VERIFIED redirects away in onError, so we don't render anything
  // for it here.
  const inactive = apiError?.code === 'ACCOUNT_INACTIVE';
  const deleted = apiError?.code === 'ACCOUNT_DELETED';
  const isRedirectingForVerify = apiError?.code === 'EMAIL_NOT_VERIFIED';

  return (
    <>
      <PageMeta
        title="Sign in"
        description="Sign in to your Tiglemp account to manage bookings and track service requests."
        noIndex
      />

      <AuthShell>
        <div className="rounded-2xl bg-background ring-1 ring-border shadow-xl p-6 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage your bookings and get exclusive deals.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-bold text-primary hover:opacity-80 underline-offset-2 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(inactive || deleted) && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {apiError?.message ?? 'Account unavailable.'} Please contact
                  support for help.
                </div>
              )}
              {!isRedirectingForVerify && !inactive && !deleted && generalError && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {generalError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-lg text-base font-bold"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Tiglemp?{' '}
          <Link
            to={`/signup${
              redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''
            }`}
            className="font-bold text-primary underline underline-offset-2 hover:opacity-80"
          >
            Create an account
          </Link>
        </p>
      </AuthShell>
    </>
  );
}
