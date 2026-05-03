import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { setVerifyContext, clearVerifyContext } from '@/lib/verify-context';
import type {
  BusinessType,
  ListResponse,
  RegisterPartnerResponse,
} from '@/types/api';
import { AuthLayout } from '@/components/AuthLayout';
import { BusinessTypePicker } from '@/components/BusinessTypePicker';
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

const registerSchema = z
  .object({
    businessName: z
      .string()
      .min(2, 'Business name must be at least 2 characters')
      .max(120, 'Business name is too long'),
    businessTypeIds: z
      .array(z.string())
      .min(1, 'Pick at least one business type')
      .max(10, 'Too many business types selected'),
    phone: z
      .string()
      .min(7, 'Phone must be at least 7 characters')
      .max(30, 'Phone is too long'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must include at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      businessTypeIds: [],
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const businessTypesQuery = useQuery({
    queryKey: ['meta', 'business-types'],
    queryFn: () => api.get<ListResponse<BusinessType>>('/meta/business-types'),
  });

  const mutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      api.post<RegisterPartnerResponse>('/auth/register/partner', {
        email: values.email,
        password: values.password,
        businessTypeIds: values.businessTypeIds,
        businessName: values.businessName,
        phone: values.phone,
      }),
    onSuccess: (data, variables) => {
      if (data.message) {
        setVerifyContext({ source: 'register', message: data.message });
      } else {
        clearVerifyContext();
      }
      const params = new URLSearchParams();
      params.set('email', variables.email);
      navigate(`/verify-partner-email?${params.toString()}`, {
        replace: true,
      });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return;
      const body = error.body as
        | {
            code?: string;
            details?: { fieldErrors?: Record<string, string[] | undefined> };
          }
        | null;
      const fieldErrors = body?.details?.fieldErrors;
      if (body?.code !== 'VALIDATION_ERROR' || !fieldErrors) return;
      const formFields: Array<keyof RegisterFormValues> = [
        'businessName',
        'businessTypeIds',
        'phone',
        'email',
        'password',
        'confirmPassword',
      ];
      let firstField: keyof RegisterFormValues | null = null;
      for (const name of formFields) {
        const messages = fieldErrors[name];
        if (!messages?.length) continue;
        form.setError(name, { type: 'server', message: messages.join(' ') });
        if (!firstField) firstField = name;
      }
      if (firstField) form.setFocus(firstField);
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  const generalError = (() => {
    if (!mutation.error) return null;
    if (mutation.error instanceof ApiError) {
      const body = mutation.error.body as { code?: string } | null;
      if (body?.code === 'VALIDATION_ERROR') return null;
      return mutation.error.message;
    }
    return 'Unexpected error. Please try again.';
  })();

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Quick signup. You can complete your shop locations and documents
            after logging in.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tiglemp Mobile Wash" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessTypeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business types</FormLabel>
                  <FormDescription>Pick all that apply.</FormDescription>
                  <FormControl>
                    <div>
                      <BusinessTypePicker
                        options={businessTypesQuery.data?.data ?? []}
                        value={field.value}
                        onChange={field.onChange}
                        loading={businessTypesQuery.isPending}
                      />
                    </div>
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
                    <Input placeholder="+639171234567" {...field} />
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
                      placeholder="m@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    We&apos;ll send a verification link to this address.
                  </FormDescription>
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
                    Must include uppercase, lowercase, number, and a special
                    character.
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
              className="w-full"
              disabled={mutation.isPending || businessTypesQuery.isPending}
            >
              {mutation.isPending ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
