import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import type { Address, CustomerProfile, MeResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const profileSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Enter your full name')
      .max(120, 'Name is too long'),
    phone: z
      .string()
      .min(7, 'Enter a valid phone number')
      .max(30, 'Phone is too long'),
    hasAddress: z.boolean(),
    label: z.string().optional().or(z.literal('')),
    line1: z.string().optional().or(z.literal('')),
    line2: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    postalCode: z.string().optional().or(z.literal('')),
    country: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (!data.hasAddress) return;
    const req = (key: keyof typeof data, label: string, min = 2) => {
      const v = String(data[key] ?? '').trim();
      if (v.length < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${label} is required`,
        });
      }
    };
    req('label', 'Label');
    req('line1', 'Address line 1', 3);
    req('city', 'City');
    req('state', 'State / province');
    req('postalCode', 'Postal code', 3);
    req('country', 'Country');
  });

type ProfileValues = z.infer<typeof profileSchema>;

const ME_QUERY_KEY = ['auth', 'me'] as const;

const SERVER_FIELDS: Array<keyof ProfileValues> = ['fullName', 'phone'];
const ADDRESS_FIELD_MAP: Record<string, keyof ProfileValues> = {
  'defaultAddress.label': 'label',
  'defaultAddress.line1': 'line1',
  'defaultAddress.line2': 'line2',
  'defaultAddress.city': 'city',
  'defaultAddress.state': 'state',
  'defaultAddress.postalCode': 'postalCode',
  'defaultAddress.country': 'country',
};

function valuesFromProfile(profile: CustomerProfile | null | undefined): ProfileValues {
  const addr = profile?.defaultAddress;
  return {
    fullName: profile?.fullName ?? '',
    phone: profile?.phone ?? '',
    hasAddress: !!addr,
    label: addr?.label ?? '',
    line1: addr?.line1 ?? '',
    line2: addr?.line2 ?? '',
    city: addr?.city ?? '',
    state: addr?.state ?? '',
    postalCode: addr?.postalCode ?? '',
    country: addr?.country ?? 'Philippines',
  };
}

type ProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => api.get<MeResponse>('/auth/me'),
    enabled: open,
    staleTime: 60_000,
  });

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: valuesFromProfile(null),
    mode: 'onBlur',
  });

  // Sync the form with the latest fetched profile each time it lands.
  useEffect(() => {
    if (!open) return;
    if (!meQuery.data) return;
    form.reset(valuesFromProfile(meQuery.data.data.customerProfile));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, meQuery.data]);

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) => {
      const defaultAddress: Address | null = values.hasAddress
        ? {
            label: values.label!.trim(),
            line1: values.line1!.trim(),
            line2: values.line2?.trim() ? values.line2.trim() : null,
            city: values.city!.trim(),
            state: values.state!.trim(),
            postalCode: values.postalCode!.trim(),
            country: values.country!.trim(),
          }
        : null;
      return api.put<CustomerProfile>('/customer/profile', {
        fullName: values.fullName,
        phone: values.phone,
        defaultAddress,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      onOpenChange(false);
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
      for (const [apiKey, formKey] of Object.entries(ADDRESS_FIELD_MAP)) {
        const msgs = collectFieldErrors(fieldErrors, apiKey);
        if (msgs.length === 0) continue;
        form.setError(formKey, { type: 'server', message: msgs.join(' ') });
      }
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  const generalError = generalApiErrorMessage(mutation.error);
  const hasAddress = form.watch('hasAddress');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit your profile</DialogTitle>
          <DialogDescription>
            Update your contact details and default service address. Email and
            password can't be changed here.
          </DialogDescription>
        </DialogHeader>

        {meQuery.isPending ? (
          <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading your profile…
          </div>
        ) : meQuery.isError ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            Couldn't load your profile. Close and try again.
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={onSubmit} noValidate className="grid gap-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input autoComplete="name" {...field} />
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
              </div>

              <div className="rounded-xl border border-border bg-foreground/[0.02] p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" />
                      Default address
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      We pre-fill this when you book an on-site service.
                    </p>
                  </div>
                  {hasAddress ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        form.setValue('hasAddress', false, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        form.setValue('hasAddress', true, {
                          shouldDirty: true,
                        })
                      }
                    >
                      <Plus className="size-3.5" />
                      Add address
                    </Button>
                  )}
                </div>

                {hasAddress && (
                  <div className="grid gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                              <Input placeholder="Home" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="country-name"
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
                      name="line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address line 1</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="address-line1"
                              placeholder="123 Mabini Street"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="line2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address line 2 (optional)</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="address-line2"
                              placeholder="Barangay, subdivision"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="address-level2"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="address-level1"
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
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal code</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="postal-code"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {generalError && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {generalError}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
