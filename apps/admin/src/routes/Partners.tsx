import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  CheckCircle2,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Star,
  XCircle,
} from 'lucide-react';
import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import type {
  ApprovalAction,
  ApprovalLog,
  ApprovalStatus,
  ServiceType,
  Partner,
  PartnerShopLocationInput,
  PartnerUser,
} from '@/types/api';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShopLocationsField } from '@/components/ShopLocationsField';
import { DocumentsUploader } from '@/components/DocumentsUploader';
import { ServiceTypePicker } from '@/components/ServiceTypePicker';
import { CoverageAreaPicker } from '@/components/CoverageAreaPicker';

const PARTNERS_KEY = ['admin', 'partners'] as const;
const SERVICE_TYPES_KEY = ['meta', 'service-types'] as const;

function useServiceTypes(enabled: boolean) {
  return useQuery({
    queryKey: SERVICE_TYPES_KEY,
    queryFn: () => api.get<ServiceType[]>('/meta/service-types'),
    enabled,
  });
}

const statusVariant: Record<
  ApprovalStatus,
  'default' | 'secondary' | 'destructive'
> = {
  APPROVED: 'default',
  PENDING: 'secondary',
  REJECTED: 'destructive',
};

function rootUserOf(partner: Partner): PartnerUser | undefined {
  return partner.users?.find((u) => u.isPartnerRoot) ?? partner.users?.[0];
}

const sanitizeLocations = (
  locations: PartnerShopLocationInput[]
): PartnerShopLocationInput[] =>
  locations.map((loc) => ({
    ...loc,
    line2: loc.line2?.trim() ? loc.line2.trim() : null,
    contactPhone: loc.contactPhone?.trim() ? loc.contactPhone.trim() : null,
    notes: loc.notes?.trim() ? loc.notes.trim() : null,
    isDefault: !!loc.isDefault,
  }));

export function Partners() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Partner | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Partner | null>(null);
  const [banTarget, setBanTarget] = useState<Partner | null>(null);

  const partnersQuery = useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: () => api.get<Partner[]>('/admin/partners'),
  });

  const partners = partnersQuery.data?.data ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Partners</h1>
          <p className="text-sm text-muted-foreground">
            Manage service partners, shop locations, and supporting documents.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Add Partner
        </Button>
      </div>

      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[1%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partnersQuery.isPending && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {partnersQuery.isError && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-destructive py-6">
                  Failed to load partners: {partnersQuery.error.message}
                </TableCell>
              </TableRow>
            )}
            {!partnersQuery.isPending && partners.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  No partners yet. Click "Add Partner" to create one.
                </TableCell>
              </TableRow>
            )}
            {partners.map((partner) => {
              return (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">
                    {partner.businessName}
                  </TableCell>
                  <TableCell>
                    {rootUserOf(partner)?.email ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{partner.phone}</TableCell>
                  <TableCell>
                    <ServicesCell partner={partner} />
                  </TableCell>
                  <TableCell>
                    <CoverageCell partner={partner} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={statusVariant[partner.approvalStatus]}>
                        {partner.approvalStatus}
                      </Badge>
                      {partner.isBanned && (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="size-3" />
                          Banned
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                          <span className="sr-only">Open actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setDetailsTarget(partner)}
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditTarget(partner)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {partner.approvalStatus !== 'APPROVED' && (
                          <DropdownMenuItem
                            onClick={() => setReviewTarget(partner)}
                          >
                            Review
                          </DropdownMenuItem>
                        )}
                        {partner.approvalStatus === 'APPROVED' &&
                          !partner.isBanned && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setBanTarget(partner)}
                            >
                              Ban
                            </DropdownMenuItem>
                          )}
                        {partner.approvalStatus === 'APPROVED' &&
                          partner.isBanned && (
                            <DropdownMenuItem
                              onClick={() => setBanTarget(partner)}
                            >
                              Unban
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CreatePartnerDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditPartnerDialog
        partner={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <PartnerDetailsDialog
        partner={detailsTarget}
        onClose={() => setDetailsTarget(null)}
      />
      <ReviewPartnerDialog
        partner={reviewTarget}
        onClose={() => setReviewTarget(null)}
      />
      <BanPartnerDialog
        partner={banTarget}
        onClose={() => setBanTarget(null)}
      />
    </>
  );
}

type CreatePartnerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const createPartnerSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(120, 'Business name is too long'),
  phone: z
    .string()
    .min(7, 'Phone must be at least 7 characters')
    .max(30, 'Phone is too long'),
  serviceTypeIds: z
    .array(z.string())
    .min(1, 'Pick at least one service type')
    .max(20, 'Too many service types selected'),
  coverageRegionIds: z
    .array(z.number())
    .max(1, 'Pick only one region'),
  coverageCityIds: z.array(z.number()),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .regex(/[A-Z]/, 'Must include at least one uppercase letter')
    .regex(/[a-z]/, 'Must include at least one lowercase letter')
    .regex(/[0-9]/, 'Must include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must include at least one special character'),
});

type CreatePartnerFormValues = z.infer<typeof createPartnerSchema>;

const CREATE_PARTNER_DEFAULTS: CreatePartnerFormValues = {
  businessName: '',
  phone: '',
  serviceTypeIds: [],
  coverageRegionIds: [],
  coverageCityIds: [],
  email: '',
  password: '',
};

function CreatePartnerDialog({ open, onOpenChange }: CreatePartnerDialogProps) {
  const queryClient = useQueryClient();
  const [shopLocations, setShopLocations] = useState<
    PartnerShopLocationInput[]
  >([]);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const form = useForm<CreatePartnerFormValues>({
    resolver: zodResolver(createPartnerSchema),
    defaultValues: CREATE_PARTNER_DEFAULTS,
    mode: 'onBlur',
  });

  const serviceTypesQuery = useServiceTypes(open);

  const resetExtras = () => {
    setShopLocations([]);
    setStagedFiles([]);
  };

  const mutation = useMutation({
    mutationFn: (values: CreatePartnerFormValues) => {
      const regionId = values.coverageRegionIds[0];
      const serviceCoverageAreas =
        regionId === undefined
          ? []
          : values.serviceTypeIds.map((serviceTypeId) => ({
              serviceTypeId,
              coverageRegionId: regionId,
              coverageCityIds: values.coverageCityIds,
            }));

      return api.post('/admin/partners', {
        email: values.email,
        password: values.password,
        businessName: values.businessName,
        phone: values.phone,
        serviceTypeIds: values.serviceTypeIds,
        partnerUserLimit: 5,
        approvalStatus: 'APPROVED',
        serviceCoverageAreas,
        shopLocations: sanitizeLocations(shopLocations),
        // TODO: supportingDocuments — staged files are captured but not sent
        // until the upload-to-storage flow is finalized server-side.
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
      form.reset(CREATE_PARTNER_DEFAULTS);
      resetExtras();
      onOpenChange(false);
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return;
      const fieldErrors = error.fieldErrors;
      if (!fieldErrors) return;
      const formFields: Array<keyof CreatePartnerFormValues> = [
        'businessName',
        'phone',
        'serviceTypeIds',
        'coverageRegionIds',
        'coverageCityIds',
        'email',
        'password',
      ];
      let firstField: keyof CreatePartnerFormValues | null = null;
      for (const name of formFields) {
        const messages = collectFieldErrors(fieldErrors, name);
        if (messages.length === 0) continue;
        form.setError(name, { type: 'server', message: messages.join(' ') });
        if (!firstField) firstField = name;
      }
      // Coverage validation comes back keyed on serviceCoverageAreas — route
      // it onto the cities field since that's the more common mismatch.
      const coverageMsgs = collectFieldErrors(
        fieldErrors,
        'serviceCoverageAreas'
      );
      if (coverageMsgs.length > 0) {
        form.setError('coverageCityIds', {
          type: 'server',
          message: coverageMsgs.join(' '),
        });
        if (!firstField) firstField = 'coverageCityIds';
      }
      if (firstField) form.setFocus(firstField);
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      mutation.reset();
      form.reset(CREATE_PARTNER_DEFAULTS);
      resetExtras();
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  const apiFieldErrors =
    mutation.error instanceof ApiError ? mutation.error.fieldErrors : null;
  const shopLocationErrors = (() => {
    if (!apiFieldErrors) return null;
    const sliced: Record<string, string[] | undefined> = {};
    const prefix = 'shopLocations.';
    for (const [key, msgs] of Object.entries(apiFieldErrors)) {
      if (!msgs?.length) continue;
      if (key.startsWith(prefix)) sliced[key.slice(prefix.length)] = msgs;
    }
    return Object.keys(sliced).length > 0 ? sliced : null;
  })();

  const generalError = generalApiErrorMessage(mutation.error);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Partner</DialogTitle>
          <DialogDescription>
            Creates an approved partner account immediately.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} noValidate className="grid gap-6">
            <FormSection
              title="Business information"
              subtitle="Public details we share with customers."
            >
              <div className="grid gap-4 sm:grid-cols-2">
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
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+639171234567" {...field} />
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
                  <FormItem>
                    <FormLabel>Services you offer</FormLabel>
                    <FormDescription>
                      Pick all that apply (at least one).
                    </FormDescription>
                    <FormControl>
                      <div>
                        <ServiceTypePicker
                          options={serviceTypesQuery.data?.data ?? []}
                          value={field.value}
                          onChange={field.onChange}
                          loading={serviceTypesQuery.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection
              title="Account information"
              subtitle="Credentials the partner will use to sign in."
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
                        autoComplete="off"
                        placeholder="partner@example.com"
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
                      Must include uppercase, lowercase, number, and a special
                      character.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection
              title="Service coverage area"
              subtitle="Where this partner accepts bookings."
            >
              <FormField
                control={form.control}
                name="coverageCityIds"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <div>
                        <CoverageAreaPicker
                          regionIds={form.watch('coverageRegionIds')}
                          cityIds={form.watch('coverageCityIds')}
                          onRegionsChange={(next) => {
                            form.setValue('coverageRegionIds', next, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                            form.clearErrors('coverageRegionIds');
                            form.clearErrors('coverageCityIds');
                          }}
                          onCitiesChange={(next) => {
                            form.setValue('coverageCityIds', next, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                            form.clearErrors('coverageCityIds');
                          }}
                        />
                      </div>
                    </FormControl>
                    {form.formState.errors.coverageRegionIds?.message && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.coverageRegionIds.message}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection
              title="Address & supporting documents"
              subtitle="Optional — add shop locations and verification files."
            >
              <ShopLocationsField
                value={shopLocations}
                onChange={setShopLocations}
                errors={shopLocationErrors}
              />
              <DocumentsUploader
                staged={stagedFiles}
                onStagedChange={setStagedFiles}
              />
            </FormSection>

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
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create partner'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type EditPartnerDialogProps = {
  partner: Partner | null;
  onClose: () => void;
};

const editPartnerSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(120, 'Business name is too long'),
  phone: z
    .string()
    .min(7, 'Phone must be at least 7 characters')
    .max(30, 'Phone is too long'),
  serviceTypeIds: z
    .array(z.string())
    .min(1, 'Pick at least one service type')
    .max(20, 'Too many service types selected'),
  coverageRegionIds: z.array(z.number()).max(1, 'Pick only one region'),
  coverageCityIds: z.array(z.number()),
  partnerUserLimit: z
    .number()
    .int()
    .min(1, 'Must allow at least 1 seat')
    .max(50, 'Too many seats'),
  isActive: z.boolean(),
});

type EditPartnerFormValues = z.infer<typeof editPartnerSchema>;

function EditPartnerDialog({ partner, onClose }: EditPartnerDialogProps) {
  const queryClient = useQueryClient();
  const [shopLocations, setShopLocations] = useState<
    PartnerShopLocationInput[]
  >([]);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const form = useForm<EditPartnerFormValues>({
    resolver: zodResolver(editPartnerSchema),
    defaultValues: {
      businessName: '',
      phone: '',
      serviceTypeIds: [],
      coverageRegionIds: [],
      coverageCityIds: [],
      partnerUserLimit: 1,
      isActive: true,
    },
    mode: 'onBlur',
  });

  const serviceTypesQuery = useServiceTypes(partner !== null);

  useEffect(() => {
    if (!partner) return;
    const areas = partner.serviceCoverageAreas ?? [];
    const regionIds = areas.length > 0 ? [areas[0].coverageRegionId] : [];
    const cityIds = [...new Set(areas.map((a) => a.coverageCityId))];
    form.reset({
      businessName: partner.businessName,
      phone: partner.phone,
      serviceTypeIds: partner.serviceTypes.map((pbt) => pbt.serviceTypeId),
      coverageRegionIds: regionIds,
      coverageCityIds: cityIds,
      partnerUserLimit: partner.partnerUserLimit,
      isActive: rootUserOf(partner)?.isActive ?? true,
    });
    setShopLocations(
      partner.shopLocations.map((loc) => ({
        label: loc.label,
        line1: loc.line1,
        line2: loc.line2,
        city: loc.city,
        state: loc.state,
        postalCode: loc.postalCode,
        country: loc.country,
        latitude: loc.latitude,
        longitude: loc.longitude,
        contactPhone: loc.contactPhone,
        notes: loc.notes,
        isDefault: loc.isDefault,
      }))
    );
    setStagedFiles([]);
  }, [partner, form]);

  const mutation = useMutation({
    mutationFn: (values: EditPartnerFormValues) => {
      const regionId = values.coverageRegionIds[0];
      const serviceCoverageAreas =
        regionId === undefined
          ? []
          : values.serviceTypeIds.map((serviceTypeId) => ({
              serviceTypeId,
              coverageRegionId: regionId,
              coverageCityIds: values.coverageCityIds,
            }));

      return api.put(`/admin/partners/${partner!.id}`, {
        businessName: values.businessName,
        phone: values.phone,
        serviceTypeIds: values.serviceTypeIds,
        partnerUserLimit: values.partnerUserLimit,
        isActive: values.isActive,
        serviceCoverageAreas,
        shopLocations: sanitizeLocations(shopLocations),
        // TODO: supportingDocuments — staged files are captured but not sent
        // until the upload-to-storage flow is finalized server-side.
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
      onClose();
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return;
      const fieldErrors = error.fieldErrors;
      if (!fieldErrors) return;
      const formFields: Array<keyof EditPartnerFormValues> = [
        'businessName',
        'phone',
        'serviceTypeIds',
        'coverageRegionIds',
        'coverageCityIds',
        'partnerUserLimit',
        'isActive',
      ];
      let firstField: keyof EditPartnerFormValues | null = null;
      for (const name of formFields) {
        const messages = collectFieldErrors(fieldErrors, name);
        if (messages.length === 0) continue;
        form.setError(name, { type: 'server', message: messages.join(' ') });
        if (!firstField) firstField = name;
      }
      const coverageMsgs = collectFieldErrors(
        fieldErrors,
        'serviceCoverageAreas'
      );
      if (coverageMsgs.length > 0) {
        form.setError('coverageCityIds', {
          type: 'server',
          message: coverageMsgs.join(' '),
        });
        if (!firstField) firstField = 'coverageCityIds';
      }
      if (firstField) form.setFocus(firstField);
    },
  });

  const handleClose = () => {
    mutation.reset();
    setStagedFiles([]);
    onClose();
  };

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  const apiFieldErrors =
    mutation.error instanceof ApiError ? mutation.error.fieldErrors : null;
  const shopLocationErrors = (() => {
    if (!apiFieldErrors) return null;
    const sliced: Record<string, string[] | undefined> = {};
    const prefix = 'shopLocations.';
    for (const [key, msgs] of Object.entries(apiFieldErrors)) {
      if (!msgs?.length) continue;
      if (key.startsWith(prefix)) sliced[key.slice(prefix.length)] = msgs;
    }
    return Object.keys(sliced).length > 0 ? sliced : null;
  })();

  const generalError = generalApiErrorMessage(mutation.error);
  const usersInUse = partner?.users?.length ?? 0;

  return (
    <Dialog open={partner !== null} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Partner</DialogTitle>
          <DialogDescription>
            Update business info, coverage, locations, and documents. Email and
            password cannot be changed here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} noValidate className="grid gap-6">
            <FormSection
              title="Business information"
              subtitle="Public details we share with customers."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                  <FormItem>
                    <FormLabel>Services you offer</FormLabel>
                    <FormDescription>
                      Pick all that apply (at least one).
                    </FormDescription>
                    <FormControl>
                      <div>
                        <ServiceTypePicker
                          options={serviceTypesQuery.data?.data ?? []}
                          value={field.value}
                          onChange={field.onChange}
                          loading={serviceTypesQuery.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection
              title="Account information"
              subtitle="Email is fixed; manage seat allocation here."
            >
              <DetailField label="Email">
                <p className="text-sm">
                  {(partner ? rootUserOf(partner)?.email : null) ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </p>
              </DetailField>

              <FormField
                control={form.control}
                name="partnerUserLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team seats</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 1)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Total partner accounts allowed (root counts toward this
                      limit). Currently {usersInUse} in use.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection
              title="Service coverage area"
              subtitle="Where this partner accepts bookings."
            >
              <FormField
                control={form.control}
                name="coverageCityIds"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <div>
                        <CoverageAreaPicker
                          regionIds={form.watch('coverageRegionIds')}
                          cityIds={form.watch('coverageCityIds')}
                          onRegionsChange={(next) => {
                            form.setValue('coverageRegionIds', next, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                            form.clearErrors('coverageRegionIds');
                            form.clearErrors('coverageCityIds');
                          }}
                          onCitiesChange={(next) => {
                            form.setValue('coverageCityIds', next, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                            form.clearErrors('coverageCityIds');
                          }}
                        />
                      </div>
                    </FormControl>
                    {form.formState.errors.coverageRegionIds?.message && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.coverageRegionIds.message}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection
              title="Address & supporting documents"
              subtitle="Manage shop locations and verification files."
            >
              <ShopLocationsField
                value={shopLocations}
                onChange={setShopLocations}
                errors={shopLocationErrors}
              />
              <DocumentsUploader
                existing={partner?.documents}
                staged={stagedFiles}
                onStagedChange={setStagedFiles}
              />
            </FormSection>

            <FormSection
              title="Account status"
              subtitle="Disable to immediately block this partner from signing in."
            >
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <span>Account active</span>
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            {generalError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {generalError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type PartnerDetailsDialogProps = {
  partner: Partner | null;
  onClose: () => void;
};

function PartnerDetailsDialog({ partner, onClose }: PartnerDetailsDialogProps) {
  return (
    <Dialog open={partner !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partner details</DialogTitle>
          <DialogDescription>
            {partner
              ? `Joined ${new Date(partner.createdAt).toLocaleDateString()}`
              : ''}
          </DialogDescription>
        </DialogHeader>
        {partner && (
          <div className="grid gap-6">
            <FormSection
              title="Business information"
              subtitle="Public details shared with customers."
            >
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold">
                  {partner.businessName}
                </h4>
                <Badge variant={statusVariant[partner.approvalStatus]}>
                  {partner.approvalStatus}
                </Badge>
                {partner.isBanned && (
                  <Badge variant="destructive" className="gap-1">
                    <Ban className="size-3" />
                    Banned
                  </Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <DetailField label="Phone">{partner.phone}</DetailField>
                <DetailField label="Joined">
                  {new Date(partner.createdAt).toLocaleString()}
                </DetailField>
              </div>

              <DetailField label="Services you offer">
                {partner.serviceTypes.length === 0 ? (
                  <p className="text-muted-foreground italic text-sm">None</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {partner.serviceTypes.map((pbt) => (
                      <Badge key={pbt.serviceTypeId} variant="secondary">
                        {pbt.serviceType.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </DetailField>
            </FormSection>

            <FormSection
              title="Account information"
              subtitle="Sign-in accounts attached to this partner."
            >
              <DetailField label="Team seats">
                <p className="text-sm">
                  <span className="font-medium">
                    {partner.users?.length ?? 0} / {partner.partnerUserLimit}
                  </span>{' '}
                  <span className="text-muted-foreground">
                    partner accounts in use
                  </span>
                </p>
              </DetailField>

              {partner.users && partner.users.length > 0 && (
                <ul className="divide-y rounded-md border bg-background">
                  {partner.users.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {u.email}
                      </span>
                      {u.isPartnerRoot && (
                        <Badge variant="secondary">Root</Badge>
                      )}
                      {!u.isActive && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </FormSection>

            <FormSection
              title="Service coverage area"
              subtitle="Where this partner accepts bookings."
            >
              <CoverageBreakdown partner={partner} />
            </FormSection>

            <FormSection
              title="Address & supporting documents"
              subtitle="Shop locations and verification files."
            >
              <DetailField
                label={`Shop locations (${partner.shopLocations.length})`}
              >
                {partner.shopLocations.length === 0 ? (
                  <p className="text-muted-foreground italic text-sm">None</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {partner.shopLocations.map((loc) => (
                      <li
                        key={loc.id}
                        className="rounded-md border bg-background p-3 text-sm space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{loc.label}</span>
                          {loc.isDefault && (
                            <Badge variant="default" className="gap-1">
                              <Star className="size-3" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {loc.line1}
                          {loc.line2 && `, ${loc.line2}`}
                          <br />
                          {loc.city}, {loc.state} {loc.postalCode}
                          <br />
                          {loc.country}
                        </p>
                        {loc.contactPhone && (
                          <p className="text-xs text-muted-foreground">
                            📞 {loc.contactPhone}
                          </p>
                        )}
                        {loc.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            {loc.notes}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </DetailField>

              <DetailField label={`Documents (${partner.documents.length})`}>
                {partner.documents.length === 0 ? (
                  <p className="text-muted-foreground italic text-sm">None</p>
                ) : (
                  <ul className="divide-y rounded-md border bg-background">
                    {partner.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <FileText className="size-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-sm">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[doc.documentType, doc.mimeType]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                        {doc.publicUrl && (
                          <Button asChild variant="ghost" size="icon">
                            <a
                              href={doc.publicUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              <ExternalLink />
                              <span className="sr-only">Open</span>
                            </a>
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </DetailField>
            </FormSection>

            <FormSection
              title="Review history"
              subtitle="Approval and moderation activity."
            >
              <ApprovalHistory logs={partner.approvalLogs ?? []} />
            </FormSection>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function CoverageBreakdown({ partner }: { partner: Partner }) {
  const areas = partner.serviceCoverageAreas ?? [];
  if (areas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No coverage areas defined.
      </p>
    );
  }

  type Group = {
    serviceTypeId: string;
    serviceTypeName: string;
    regionName: string;
    cityNames: Set<string>;
  };
  const groups = new Map<string, Group>();
  for (const a of areas) {
    const key = `${a.serviceTypeId}__${a.coverageRegionId}`;
    const existing = groups.get(key);
    if (existing) {
      if (a.coverageCity?.name) existing.cityNames.add(a.coverageCity.name);
    } else {
      groups.set(key, {
        serviceTypeId: a.serviceTypeId,
        serviceTypeName: a.serviceType?.name ?? 'Service',
        regionName: a.coverageRegion?.name ?? `Region ${a.coverageRegionId}`,
        cityNames: new Set(a.coverageCity?.name ? [a.coverageCity.name] : []),
      });
    }
  }

  return (
    <ul className="grid gap-3">
      {[...groups.values()].map((g, idx) => (
        <li
          key={`${g.serviceTypeId}-${idx}`}
          className="rounded-md border bg-background p-3 space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-sm">{g.serviceTypeName}</span>
            <Badge variant="secondary" className="font-normal">
              {g.regionName}
            </Badge>
          </div>
          {g.cityNames.size > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {[...g.cityNames].map((city) => (
                <Badge key={city} variant="outline" className="font-normal">
                  {city}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              All cities in region
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function ServicesCell({ partner }: { partner: Partner }) {
  const names = partner.serviceTypes.map((s) => s.serviceType.name);
  if (names.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  const shown = names.slice(0, 2);
  const extra = names.length - shown.length;
  return (
    <div
      className="flex flex-wrap items-center gap-1 max-w-[220px]"
      title={names.join(', ')}
    >
      {shown.map((n) => (
        <Badge key={n} variant="secondary" className="font-normal">
          {n}
        </Badge>
      ))}
      {extra > 0 && (
        <span className="text-xs text-muted-foreground">+{extra}</span>
      )}
    </div>
  );
}

function CoverageCell({ partner }: { partner: Partner }) {
  const areas = partner.serviceCoverageAreas ?? [];
  if (areas.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  const regionNames = new Set<string>();
  for (const a of areas) {
    const name = a.coverageRegion?.name;
    if (name) regionNames.add(name);
  }
  const regions = [...regionNames];
  const cityCount = new Set(areas.map((a) => a.coverageCityId)).size;
  return (
    <span
      className="text-sm"
      title={`${regions.join(', ')} · ${cityCount} cit${cityCount === 1 ? 'y' : 'ies'}`}
    >
      {regions.join(', ') || '—'}
      {cityCount > 0 && (
        <span className="text-muted-foreground"> · {cityCount}</span>
      )}
    </span>
  );
}

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card/40 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

type ReviewPartnerDialogProps = {
  partner: Partner | null;
  onClose: () => void;
};

function ReviewPartnerDialog({ partner, onClose }: ReviewPartnerDialogProps) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [pendingAction, setPendingAction] = useState<ApprovalStatus | null>(null);

  // Reset transient state whenever a different partner is targeted (or the
  // dialog is closed).
  useEffect(() => {
    setComment('');
    setPendingAction(null);
  }, [partner?.id]);

  const mutation = useMutation({
    mutationFn: ({
      approvalStatus,
      approvalComment,
    }: {
      approvalStatus: ApprovalStatus;
      approvalComment: string;
    }) =>
      api.patch(`/admin/partners/${partner!.id}/approval`, {
        approvalStatus,
        approvalComment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
      handleClose();
    },
    onSettled: () => setPendingAction(null),
  });

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  const submit = (approvalStatus: ApprovalStatus) => {
    const trimmed = comment.trim();
    if (trimmed.length < 5) return;
    setPendingAction(approvalStatus);
    mutation.mutate({ approvalStatus, approvalComment: trimmed });
  };

  const trimmedLength = comment.trim().length;
  const commentError =
    trimmedLength === 0
      ? 'A comment is required.'
      : trimmedLength < 5
      ? 'Comment must be at least 5 characters.'
      : comment.length > 500
      ? 'Comment is too long (max 500 characters).'
      : null;

  const submitting = mutation.isPending;

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <Dialog
      open={partner !== null}
      onOpenChange={(next) => !next && !submitting && handleClose()}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review application</DialogTitle>
          <DialogDescription>
            {partner ? (
              <>
                Decide on <strong>{partner.businessName}</strong>'s application.
                Your comment is shared with the partner and stored in their
                application history.
              </>
            ) : (
              ''
            )}
          </DialogDescription>
        </DialogHeader>

        {partner && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Email:</span>{' '}
              {rootUserOf(partner)?.email ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Current status:</span>{' '}
              <Badge variant={statusVariant[partner.approvalStatus]}>
                {partner.approvalStatus}
              </Badge>
            </p>
          </div>
        )}

        {partner && (
          <ApprovalHistory logs={partner.approvalLogs ?? []} />
        )}

        <div className="grid gap-2">
          <Label htmlFor="reviewComment">Comment</Label>
          <textarea
            id="reviewComment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="e.g. Documents verified and application approved."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitting}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="text-destructive">{commentError ?? ' '}</span>
            <span>{comment.length}/500</span>
          </div>
        </div>

        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => submit('REJECTED')}
            disabled={submitting || !!commentError}
          >
            <XCircle />
            {submitting && pendingAction === 'REJECTED' ? 'Rejecting…' : 'Reject'}
          </Button>
          <Button
            type="button"
            onClick={() => submit('APPROVED')}
            disabled={submitting || !!commentError}
          >
            <CheckCircle2 />
            {submitting && pendingAction === 'APPROVED' ? 'Approving…' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApprovalHistory({ logs }: { logs: ApprovalLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
        No review history yet.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-muted/20">
      <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground">
        Review history
      </div>
      <ol className="max-h-64 overflow-y-auto divide-y">
        {logs.map((log) => (
          <li key={log.id} className="px-3 py-2 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <ApprovalActionBadge action={log.action} />
              <span className="text-xs text-muted-foreground">
                {formatLogTimestamp(log.createdAt)}
              </span>
            </div>
            {log.comment && (
              <p className="text-sm text-foreground/90">{log.comment}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ApprovalActionBadge({ action }: { action: ApprovalAction }) {
  const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
    action === 'APPROVED'
      ? 'default'
      : action === 'REJECTED'
      ? 'destructive'
      : action === 'RESUBMITTED'
      ? 'secondary'
      : 'outline';
  return <Badge variant={variant}>{action}</Badge>;
}

function formatLogTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

type BanPartnerDialogProps = {
  partner: Partner | null;
  onClose: () => void;
};

function BanPartnerDialog({ partner, onClose }: BanPartnerDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [partner?.id]);

  const mutation = useMutation({
    mutationFn: (body: { isBanned: boolean; bannedReason: string | null }) =>
      api.patch(`/admin/partners/${partner!.id}/ban`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
      handleClose();
    },
  });

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  const isBanFlow = !!partner && !partner.isBanned;

  const trimmedLength = reason.trim().length;
  const reasonError = isBanFlow
    ? trimmedLength === 0
      ? 'A reason is required.'
      : trimmedLength < 5
      ? 'Reason must be at least 5 characters.'
      : reason.length > 500
      ? 'Reason is too long (max 500 characters).'
      : null
    : null;

  const submit = () => {
    if (!partner) return;
    if (isBanFlow) {
      const trimmed = reason.trim();
      if (trimmed.length < 5) return;
      mutation.mutate({ isBanned: true, bannedReason: trimmed });
    } else {
      mutation.mutate({ isBanned: false, bannedReason: null });
    }
  };

  const submitting = mutation.isPending;

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <Dialog
      open={partner !== null}
      onOpenChange={(next) => !next && !submitting && handleClose()}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isBanFlow ? 'Ban partner' : 'Unban partner'}
          </DialogTitle>
          <DialogDescription>
            {partner && isBanFlow && (
              <>
                Banning <strong>{partner.businessName}</strong> blocks them from
                signing in and accepting bookings. Provide a reason — it's
                stored on the account.
              </>
            )}
            {partner && !isBanFlow && (
              <>
                Restore access for <strong>{partner.businessName}</strong>?
                They'll be able to sign in and operate again.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {partner && !isBanFlow && partner.bannedReason && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Original ban reason
            </p>
            <p className="mt-1">{partner.bannedReason}</p>
          </div>
        )}

        {isBanFlow && (
          <div className="grid gap-2">
            <Label htmlFor="banReason">Reason</Label>
            <textarea
              id="banReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="e.g. Repeated policy violations after multiple warnings."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="text-destructive">{reasonError ?? ' '}</span>
              <span>{reason.length}/500</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isBanFlow ? 'destructive' : 'default'}
            onClick={submit}
            disabled={submitting || !!reasonError}
          >
            {isBanFlow ? <Ban /> : <ShieldCheck />}
            {submitting
              ? isBanFlow
                ? 'Banning…'
                : 'Unbanning…'
              : isBanFlow
              ? 'Ban partner'
              : 'Unban partner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
