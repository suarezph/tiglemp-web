import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Mail } from 'lucide-react';
import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import type { RegisterCustomerResponse } from '@/types/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { PageMeta } from '@/components/PageMeta';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Enter your full name')
      .max(120, 'Name is too long'),
    email: z.string().email('Enter a valid email address'),
    phone: z
      .string()
      .min(7, 'Enter a valid phone number')
      .max(30, 'Phone number is too long'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[0-9]/, 'Must include a number')
      .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
    confirmPassword: z.string(),
    agreeToTerms: z
      .boolean()
      .refine((v) => v === true, 'You must agree to continue'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupValues = z.infer<typeof signupSchema>;

const SERVER_FIELDS: Array<keyof SignupValues> = [
  'fullName',
  'email',
  'phone',
  'password',
];

export function CustomerSignupPage() {
  const [params] = useSearchParams();
  const redirect = params.get('redirect') ?? '/';
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: (values: SignupValues) =>
      api.post<RegisterCustomerResponse>('/auth/register/customer', {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
      }),
    onSuccess: (_response, variables) => {
      setSubmittedEmail(variables.email);
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return;
      const fieldErrors = error.fieldErrors;
      if (!fieldErrors) return;
      SERVER_FIELDS.forEach((name) => {
        const msgs = collectFieldErrors(fieldErrors, name);
        if (msgs.length === 0) return;
        form.setError(name, { type: 'server', message: msgs.join(' ') });
      });
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  const generalError = generalApiErrorMessage(mutation.error);

  if (submittedEmail) {
    return (
      <>
        <PageMeta title="Check your email" noIndex />
        <AuthShell>
          <div className="rounded-2xl bg-background ring-1 ring-border shadow-xl p-8 text-center">
            <div className="size-14 mx-auto rounded-full bg-primary/15 text-primary grid place-items-center">
              <Mail className="size-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Almost there</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              We sent a verification link to{' '}
              <span className="font-semibold text-foreground">
                {submittedEmail}
              </span>
              . Open it to activate your account, then come back here to sign in.
            </p>

            <div className="mt-6 grid gap-2">
              <Button asChild className="h-11">
                <Link
                  to={`/login${
                    redirect !== '/'
                      ? `?redirect=${encodeURIComponent(redirect)}`
                      : ''
                  }`}
                >
                  Go to sign in
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11">
                <Link to="/">Back to home</Link>
              </Button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Didn't get the email? Check your spam folder, or{' '}
              <Link
                to={`/verify-customer-email?email=${encodeURIComponent(
                  submittedEmail
                )}`}
                className="font-semibold text-primary underline underline-offset-2"
              >
                resend the link
              </Link>
              .
            </p>
          </div>
        </AuthShell>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Create your account"
        description="Sign up free and book trusted local cleaning services in 60 seconds."
      />

      <AuthShell>
        <div className="rounded-2xl bg-background ring-1 ring-border shadow-xl p-6 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign up free. No credit cards needed.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="name"
                        placeholder="Juan dela Cruz"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        autoComplete="tel"
                        placeholder="+639171234567"
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Uppercase, lowercase, number, and special character.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mt-0.5 size-4 accent-primary"
                      />
                      <span className="text-foreground">
                        I agree to the{' '}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener"
                          className="font-bold text-primary underline underline-offset-2"
                        >
                          Terms
                        </a>{' '}
                        and{' '}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener"
                          className="font-bold text-primary underline underline-offset-2"
                        >
                          Privacy Policy
                        </a>
                        .
                      </span>
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {generalError && (
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
                {mutation.isPending ? (
                  <>Creating account…</>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Create account
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to={`/login${
              redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''
            }`}
            className="font-bold text-primary underline underline-offset-2 hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </AuthShell>
    </>
  );
}
