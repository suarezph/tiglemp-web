import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Send,
  Star,
  XCircle,
} from 'lucide-react';
import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type {
  ApprovalAction,
  ApprovalLog,
  ServiceType,
  PartnerApplication,
  PartnerShopLocationInput,
} from '@/types/api';
import { ServiceTypePicker } from '@/components/ServiceTypePicker';
import { CoverageAreaPicker } from '@/components/CoverageAreaPicker';
import { ShopLocationsField } from '@/components/ShopLocationsField';
import { DocumentsUploader } from '@/components/DocumentsUploader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { usePageTitle } from '@/lib/use-page-title';

const editSchema = z.object({
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
});
type EditValues = z.infer<typeof editSchema>;

const APPLICATION_QUERY_KEY = ['partner', 'application'] as const;

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

function locationsFromApplication(
  app: PartnerApplication
): PartnerShopLocationInput[] {
  return app.shopLocations.map((loc) => ({
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
  }));
}

function defaultsFromApplication(app: PartnerApplication): EditValues {
  const areas = app.serviceCoverageAreas ?? [];
  const regionIds = areas.length > 0 ? [areas[0].coverageRegionId] : [];
  const cityIds = [...new Set(areas.map((a) => a.coverageCityId))];
  return {
    businessName: app.businessName,
    phone: app.phone,
    serviceTypeIds: app.serviceTypes.map((bt) => bt.serviceTypeId),
    coverageRegionIds: regionIds,
    coverageCityIds: cityIds,
  };
}

export function Application() {
  usePageTitle('Your application');
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const query = useQuery({
    queryKey: APPLICATION_QUERY_KEY,
    queryFn: () => api.get<PartnerApplication>('/partner/application'),
    retry: false,
  });

  useEffect(() => {
    if (!query.data || !user || !token) return;
    const liveStatus = query.data.data.approvalStatus;
    if (user.approvalStatus !== liveStatus) {
      setSession(token, { ...user, approvalStatus: liveStatus });
    }
  }, [query.data, user, token, setSession]);

  if (query.isLoading) {
    return (
      <PageShell>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your application…
        </div>
      </PageShell>
    );
  }

  if (query.isError) {
    return (
      <PageShell onLogout={logout}>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="size-5" />
              Could not load your application
            </CardTitle>
            <CardDescription className="text-destructive/80">
              {query.error instanceof ApiError
                ? query.error.message
                : 'Something went wrong. Try refreshing the page.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </PageShell>
    );
  }

  const application = query.data!.data;

  if (application.approvalStatus === 'APPROVED') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageShell onLogout={logout}>
      <ApplicationContent application={application} />
    </PageShell>
  );
}

function ApplicationContent({
  application,
}: {
  application: PartnerApplication;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [shopLocations, setShopLocations] = useState<
    PartnerShopLocationInput[]
  >(() => locationsFromApplication(application));
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const isRejected = application.approvalStatus === 'REJECTED';

  useEffect(() => {
    if (!isRejected) {
      setMode('view');
      setResubmitOpen(false);
    }
  }, [isRejected]);

  const serviceTypesQuery = useQuery({
    queryKey: ['meta', 'service-types'],
    queryFn: () => api.get<ServiceType[]>('/meta/service-types'),
    enabled: isRejected,
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: defaultsFromApplication(application),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (mode === 'view') {
      editForm.reset(defaultsFromApplication(application));
      setShopLocations(locationsFromApplication(application));
      setStagedFiles([]);
    }
    // editForm is stable; intentionally not in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application, mode]);

  const updateMutation = useMutation({
    mutationFn: (values: EditValues) => {
      const regionId = values.coverageRegionIds[0];
      const serviceCoverageAreas =
        regionId === undefined
          ? []
          : values.serviceTypeIds.map((serviceTypeId) => ({
              serviceTypeId,
              coverageRegionId: regionId,
              coverageCityIds: values.coverageCityIds,
            }));

      return api.put<PartnerApplication>('/partner/application', {
        businessName: values.businessName,
        phone: values.phone,
        serviceTypeIds: values.serviceTypeIds,
        serviceCoverageAreas,
        shopLocations: sanitizeLocations(shopLocations),
        // TODO: supportingDocuments — staged files are captured but not sent
        // until the upload-to-storage flow is finalized server-side.
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_QUERY_KEY });
      setMode('view');
    },
    onError: (error) => applyServerFieldErrors(error, editForm),
  });

  const resubmitMutation = useMutation({
    mutationFn: (comment: string) =>
      api.post<PartnerApplication>('/partner/application/resubmit', {
        comment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_QUERY_KEY });
      setResubmitOpen(false);
    },
  });

  const apiFieldErrors =
    updateMutation.error instanceof ApiError
      ? updateMutation.error.fieldErrors
      : null;
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

  const editGeneralError = generalApiErrorMessage(updateMutation.error);

  return (
    <>
      <StatusCard application={application} />

      {mode === 'edit' ? (
        <EditCard
          form={editForm}
          serviceTypes={serviceTypesQuery.data?.data ?? []}
          serviceTypesLoading={serviceTypesQuery.isPending}
          shopLocations={shopLocations}
          onShopLocationsChange={setShopLocations}
          shopLocationErrors={shopLocationErrors}
          stagedFiles={stagedFiles}
          onStagedFilesChange={setStagedFiles}
          existingDocuments={application.documents}
          onSubmit={editForm.handleSubmit((values) =>
            updateMutation.mutate(values)
          )}
          onCancel={() => {
            updateMutation.reset();
            editForm.reset(defaultsFromApplication(application));
            setShopLocations(locationsFromApplication(application));
            setStagedFiles([]);
            setMode('view');
          }}
          saving={updateMutation.isPending}
          generalError={editGeneralError}
        />
      ) : (
        <DetailsCard application={application} />
      )}

      {isRejected && mode === 'view' && (
        <RejectedActions
          resubmitOpen={resubmitOpen}
          onEdit={() => setMode('edit')}
          onOpenResubmit={() => setResubmitOpen(true)}
          onCancelResubmit={() => {
            resubmitMutation.reset();
            setResubmitOpen(false);
          }}
          onResubmit={(comment) => resubmitMutation.mutate(comment)}
          submitting={resubmitMutation.isPending}
          submitError={generalApiErrorMessage(resubmitMutation.error)}
        />
      )}

      <TimelineCard logs={application.approvalLogs} />
    </>
  );
}

function applyServerFieldErrors(
  error: unknown,
  form: ReturnType<typeof useForm<EditValues>>
) {
  if (!(error instanceof ApiError)) return;
  const fieldErrors = error.fieldErrors;
  if (!fieldErrors) return;
  const formFields: Array<keyof EditValues> = [
    'businessName',
    'phone',
    'serviceTypeIds',
    'coverageRegionIds',
    'coverageCityIds',
  ];
  let firstField: keyof EditValues | null = null;
  for (const name of formFields) {
    const messages = collectFieldErrors(fieldErrors, name);
    if (messages.length === 0) continue;
    form.setError(name, { type: 'server', message: messages.join(' ') });
    if (!firstField) firstField = name;
  }
  const coverageMsgs = collectFieldErrors(fieldErrors, 'serviceCoverageAreas');
  if (coverageMsgs.length > 0) {
    form.setError('coverageCityIds', {
      type: 'server',
      message: coverageMsgs.join(' '),
    });
    if (!firstField) firstField = 'coverageCityIds';
  }
  if (firstField) form.setFocus(firstField);
}

function PageShell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout?: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">partner.tiglemp.com</p>
          <h1 className="text-2xl font-semibold mt-1">Your application</h1>
        </div>
        {onLogout && (
          <Button variant="outline" size="sm" onClick={onLogout}>
            Sign out
          </Button>
        )}
      </div>
      {children}
    </main>
  );
}

function StatusCard({ application }: { application: PartnerApplication }) {
  const isPending = application.approvalStatus === 'PENDING';
  const isRejected = application.approvalStatus === 'REJECTED';

  return (
    <Card
      className={
        isRejected
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-amber-300/40 bg-amber-50'
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>
            {isPending && 'Application under review'}
            {isRejected && 'Application needs changes'}
          </CardTitle>
          <StatusBadge status={application.approvalStatus} />
        </div>
        <CardDescription>
          {isPending &&
            'An admin is reviewing your submission. We will email you when there is an update.'}
          {isRejected &&
            'Your application was sent back. Update the affected details and resubmit when ready.'}
        </CardDescription>
      </CardHeader>
      {isRejected && application.approvalComment && (
        <CardContent>
          <div className="rounded-md border border-destructive/30 bg-background p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Reviewer comment
            </p>
            <p className="mt-1 text-sm">{application.approvalComment}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function DetailsCard({ application }: { application: PartnerApplication }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submitted details</CardTitle>
        <CardDescription>
          {application.approvalStatus === 'REJECTED'
            ? 'Tap "Edit application" below to change these details.'
            : 'Editing is locked while your application is under review.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <DetailSection
          title="Business information"
          subtitle="What customers see about your business."
        >
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <DetailField label="Business name">
              {application.businessName}
            </DetailField>
            <DetailField label="Phone">{application.phone}</DetailField>
          </div>
          <DetailField label="Services you offer">
            {application.serviceTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">None</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {application.serviceTypes.map((bt) => (
                  <Badge key={bt.serviceTypeId} variant="secondary">
                    {bt.serviceType.name}
                  </Badge>
                ))}
              </div>
            )}
          </DetailField>
        </DetailSection>

        <DetailSection
          title="Service coverage area"
          subtitle="Where you accept bookings."
        >
          <CoverageBreakdown application={application} />
        </DetailSection>

        <DetailSection
          title="Address & supporting documents"
          subtitle="Shop locations and verification files."
        >
          <DetailField
            label={`Shop locations (${application.shopLocations.length})`}
          >
            {application.shopLocations.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No shop locations added yet.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {application.shopLocations.map((loc) => (
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
                  </li>
                ))}
              </ul>
            )}
          </DetailField>

          <DetailField label={`Documents (${application.documents.length})`}>
            {application.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No documents uploaded yet.
              </p>
            ) : (
              <ul className="divide-y rounded-md border bg-background">
                {application.documents.map((doc) => (
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
        </DetailSection>
      </CardContent>
    </Card>
  );
}

function CoverageBreakdown({
  application,
}: {
  application: PartnerApplication;
}) {
  const areas = application.serviceCoverageAreas ?? [];
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

function EditCard({
  form,
  serviceTypes,
  serviceTypesLoading,
  shopLocations,
  onShopLocationsChange,
  shopLocationErrors,
  stagedFiles,
  onStagedFilesChange,
  existingDocuments,
  onSubmit,
  onCancel,
  saving,
  generalError,
}: {
  form: ReturnType<typeof useForm<EditValues>>;
  serviceTypes: ServiceType[];
  serviceTypesLoading: boolean;
  shopLocations: PartnerShopLocationInput[];
  onShopLocationsChange: (next: PartnerShopLocationInput[]) => void;
  shopLocationErrors: Record<string, string[] | undefined> | null;
  stagedFiles: File[];
  onStagedFilesChange: (next: File[]) => void;
  existingDocuments: PartnerApplication['documents'];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  generalError: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit application</CardTitle>
        <CardDescription>
          Update your details and resubmit when ready.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                          options={serviceTypes}
                          value={field.value}
                          onChange={field.onChange}
                          loading={serviceTypesLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection
              title="Service coverage area"
              subtitle="Where you accept bookings."
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
              subtitle="Manage your shop locations and verification files."
            >
              <ShopLocationsField
                value={shopLocations}
                onChange={onShopLocationsChange}
                errors={shopLocationErrors}
              />
              <DocumentsUploader
                existing={existingDocuments}
                staged={stagedFiles}
                onStagedChange={onStagedFilesChange}
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

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={saving || serviceTypesLoading}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function RejectedActions({
  resubmitOpen,
  onEdit,
  onOpenResubmit,
  onCancelResubmit,
  onResubmit,
  submitting,
  submitError,
}: {
  resubmitOpen: boolean;
  onEdit: () => void;
  onOpenResubmit: () => void;
  onCancelResubmit: () => void;
  onResubmit: (comment: string) => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const [comment, setComment] = useState('');
  const trimmed = comment.trim();
  const localError =
    trimmed.length === 0
      ? null
      : trimmed.length < 10
      ? 'Tell us what changed (at least 10 characters).'
      : comment.length > 500
      ? 'Comment is too long (max 500 characters).'
      : null;

  if (!resubmitOpen) {
    return (
      <Card>
        <CardContent className="flex flex-wrap gap-2 pt-6">
          <Button onClick={onEdit} variant="outline">
            <Pencil className="size-4" />
            Edit application
          </Button>
          <Button onClick={onOpenResubmit}>
            <Send className="size-4" />
            Resubmit application
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="size-4 text-muted-foreground" />
          Resubmit application
        </CardTitle>
        <CardDescription>
          Briefly describe what you changed. The reviewer will see this note in
          your application history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="e.g. Uploaded the missing business permit and corrected our phone number."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={submitting}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{localError ?? ' '}</span>
          <span>{comment.length}/500</span>
        </div>

        {submitError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {submitError}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onResubmit(trimmed)}
            disabled={submitting || !!localError || trimmed.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Resubmitting…
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Confirm resubmit
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancelResubmit}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailSection({
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

function TimelineCard({ logs }: { logs: ApprovalLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          Application history
        </CardTitle>
        <CardDescription>Most recent activity first.</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history yet.</p>
        ) : (
          <ol className="space-y-4">
            {logs.map((log) => (
              <li
                key={log.id}
                className="border-l-2 border-border pl-3 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <ActionBadge action={log.action} />
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(log.createdAt)}
                  </span>
                </div>
                {log.comment && <p className="text-sm">{log.comment}</p>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: PartnerApplication['approvalStatus'];
}) {
  const styles =
    status === 'APPROVED'
      ? 'bg-primary/10 text-primary'
      : status === 'REJECTED'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-amber-100 text-amber-800';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

function ActionBadge({ action }: { action: ApprovalAction }) {
  const styles =
    action === 'APPROVED'
      ? 'bg-primary/10 text-primary'
      : action === 'REJECTED'
      ? 'bg-destructive/10 text-destructive'
      : action === 'RESUBMITTED'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-muted text-foreground';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {action}
    </span>
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}
