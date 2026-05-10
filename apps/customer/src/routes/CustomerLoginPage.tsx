import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthShell } from '@/components/auth/AuthShell';
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
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = form.handleSubmit((values) => {
    console.log('[Tiglemp Customer Login]', { ...values, password: '****' });
  });

  return (
    <>
      <title>Sign in to Tiglemp</title>
      <meta
        name="description"
        content="Sign in to your Tiglemp account to manage your cleaning bookings."
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

              <Button
                type="submit"
                className="w-full h-11 rounded-lg text-base font-bold"
                disabled={form.formState.isSubmitting}
              >
                Sign in
              </Button>
            </form>
          </Form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Tiglemp?{' '}
          <Link
            to="/signup"
            className="font-bold text-primary underline underline-offset-2 hover:opacity-80"
          >
            Create an account
          </Link>
        </p>
      </AuthShell>
    </>
  );
}
