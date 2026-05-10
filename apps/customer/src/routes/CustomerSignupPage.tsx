import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthShell } from '@/components/auth/AuthShell';
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

const signupSchema = z.object({
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
  agreeToTerms: z
    .boolean()
    .refine((v) => v === true, 'You must agree to continue'),
});

type SignupValues = z.infer<typeof signupSchema>;

export function CustomerSignupPage() {
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      agreeToTerms: false,
    },
    mode: 'onBlur',
  });

  const onSubmit = form.handleSubmit((values) => {
    console.log('[Tiglemp Customer Signup]', {
      ...values,
      password: '****',
    });
  });

  return (
    <>
      <title>Create your Tiglemp account</title>
      <meta
        name="description"
        content="Sign up for free and book trusted local cleaning services in 60 seconds. New customers get 10% off their first booking."
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

              <Button
                type="submit"
                className="w-full h-11 rounded-lg text-base font-bold"
                disabled={form.formState.isSubmitting}
              >
                Create account
              </Button>
            </form>
          </Form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-primary underline underline-offset-2 hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </AuthShell>
    </>
  );
}
