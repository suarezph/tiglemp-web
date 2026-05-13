import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import type { ServiceType, RegisterPartnerResponse } from '@/types/api';
import { PARTNER_LOGIN_URL, PARTNER_VERIFY_URL } from '@/lib/external-urls';
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
import { ServiceMultiSelect } from './ServiceMultiSelect';

const registerSchema = z
  .object({
    businessName: z
      .string()
      .min(2, 'Business name must be at least 2 characters')
      .max(120, 'Business name is too long'),
    phone: z
      .string()
      .min(7, 'Enter a valid phone number')
      .max(30, 'Phone number is too long'),
    serviceTypeIds: z
      .array(z.string())
      .min(1, 'Pick at least one service you offer')
      .max(20, 'Too many services selected'),
    email: z.string().email('Enter a valid email address'),
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

type RegisterValues = z.infer<typeof registerSchema>;

export function PartnerRegisterForm() {
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      phone: '',
      serviceTypeIds: [],
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
    mode: 'onBlur',
  });

  const serviceTypesQuery = useQuery({
    queryKey: ['meta', 'service-types'],
    queryFn: () => api.get<ServiceType[]>('/meta/service-types'),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      api.post<RegisterPartnerResponse>('/auth/register/partner', {
        email: values.email,
        password: values.password,
        serviceTypeIds: values.serviceTypeIds,
        businessName: values.businessName,
        phone: values.phone,
      }),
    onSuccess: (_response, variables) => {
      const params = new URLSearchParams();
      params.set('email', variables.email);
      window.location.href = `${PARTNER_VERIFY_URL}?${params.toString()}`;
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return;
      const fieldErrors = error.fieldErrors;
      if (!fieldErrors) return;
      const formFields: Array<keyof RegisterValues> = [
        'businessName',
        'phone',
        'serviceTypeIds',
        'email',
        'password',
        'confirmPassword',
      ];
      let firstField: keyof RegisterValues | null = null;
      for (const name of formFields) {
        const messages = collectFieldErrors(fieldErrors, name);
        if (messages.length === 0) continue;
        form.setError(name, { type: 'server', message: messages.join(' ') });
        if (!firstField) firstField = name;
      }
      if (firstField) form.setFocus(firstField);
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  const generalError = generalApiErrorMessage(mutation.error);

  const serviceOptions = (serviceTypesQuery.data?.data ?? []).map((s) => ({
    id: s.id,
    label: s.name,
    description: s.description ?? null,
  }));

  return (
    <div className="rounded-2xl bg-background ring-1 ring-border shadow-xl p-6 md:p-8 lg:p-10">
      <Form {...form}>
        <form onSubmit={onSubmit} noValidate className="space-y-8">
          {/* Section 1: business info */}
          <Section title="About your business" subtitle="We share these details with potential customers.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Bright Shine Carwash"
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
                    <FormLabel>Business phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+639171234567"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serviceTypeIds"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Services you offer</FormLabel>
                  <FormDescription>
                    Search and pick all the services your business offers.
                  </FormDescription>
                  <FormControl>
                    <ServiceMultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={serviceOptions}
                      loading={serviceTypesQuery.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          <hr className="border-border" />

          {/* Section 2: account */}
          <Section
            title="Create your account"
            subtitle="You'll use this to manage bookings and team members."
          >
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
                      placeholder="you@yourbusiness.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </Section>

          {/* T&C */}
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem>
                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span className="text-foreground">
                    I agree to the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener"
                      className="font-bold text-primary underline underline-offset-2"
                    >
                      Partner Terms
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Already a partner?{' '}
              <a
                href={PARTNER_LOGIN_URL}
                className="font-bold text-primary underline underline-offset-2"
              >
                Sign in
              </a>
            </p>
            <Button
              type="submit"
              disabled={mutation.isPending || serviceTypesQuery.isPending}
              className="h-12 px-7 rounded-full text-base font-bold shadow-lg shadow-primary/20"
            >
              {mutation.isPending ? 'Submitting…' : 'Apply to be a partner'}
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-lg font-bold">{title}</h3>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

