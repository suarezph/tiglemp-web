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
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Send,
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
} from '@/types/api';
import { ServiceTypePicker } from '@/components/ServiceTypePicker';
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

const editSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(120, 'Business name is too long'),
  serviceTypeIds: z
    .array(z.string())
    .min(1, 'Pick at least one service type')
    .max(10, 'Too many service types selected'),
  phone: z
    .string()
    .min(7, 'Phone must be at least 7 characters')
    .max(30, 'Phone is too long'),
});
type EditValues = z.infer<typeof editSchema>;

const APPLICATION_QUERY_KEY = ['partner', 'application'] as const;

export function Application() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const query = useQuery({
    queryKey: APPLICATION_QUERY_KEY,
    queryFn: () =>
      api.get<PartnerApplication>('/partner/application'),
    retry: false,
  });

  // Keep the persisted auth user's approvalStatus in sync with the live
  // application status, so refresh / route-guard checks reflect reality.
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

  const isRejected = application.approvalStatus === 'REJECTED';

  // If status flips away from REJECTED (e.g. after a successful resubmit),
  // collapse any open edit / resubmit panels so they don't dangle.
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

  // When the underlying application data refreshes (e.g. after PUT), reset
  // the form's defaults so a subsequent "Cancel" rolls back to the freshly
  // saved values rather than the original page-load values.
  useEffect(() => {
    if (mode === 'view') {
      editForm.reset(defaultsFromApplication(application));
    }
    // editForm is stable; intentionally not in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application, mode]);

  const updateMutation = useMutation({
    mutationFn: (values: EditValues) =>
      api.put<PartnerApplication>('/partner/application', values),
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

  const editGeneralError = generalApiErrorMessage(updateMutation.error);

  return (
    <>
      <StatusCard application={application} />

      {mode === 'edit' ? (
        <EditCard
          form={editForm}
          serviceTypes={serviceTypesQuery.data?.data ?? []}
          serviceTypesLoading={serviceTypesQuery.isPending}
          onSubmit={editForm.handleSubmit((values) =>
            updateMutation.mutate(values)
          )}
          onCancel={() => {
            updateMutation.reset();
            editForm.reset(defaultsFromApplication(application));
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

function defaultsFromApplication(app: PartnerApplication): EditValues {
  return {
    businessName: app.businessName,
    phone: app.phone,
    serviceTypeIds: app.serviceTypes.map((bt) => bt.serviceTypeId),
  };
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
  ];
  let firstField: keyof EditValues | null = null;
  for (const name of formFields) {
    const messages = collectFieldErrors(fieldErrors, name);
    if (messages.length === 0) continue;
    form.setError(name, { type: 'server', message: messages.join(' ') });
    if (!firstField) firstField = name;
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
            'An admin is reviewing your submission. We will email you when there is an update. You can sign in any time to check the latest status.'}
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
            ? 'Tap “Edit application” below to change these details.'
            : 'Editing is locked while your application is under review.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field label="Business name" value={application.businessName} />
        <Field label="Phone" value={application.phone} />
        <Field
          label="Team seats"
          value={`${application.partnerUserLimit} total partner user accounts`}
        />
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Service types
          </p>
          {application.serviceTypes.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">None</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {application.serviceTypes.map((bt) => (
                <span
                  key={bt.serviceTypeId}
                  className="inline-flex items-center rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs"
                >
                  {bt.serviceType.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <DocumentsList documents={application.documents} />
        <ShopLocationsList locations={application.shopLocations} />
      </CardContent>
    </Card>
  );
}

function EditCard({
  form,
  serviceTypes,
  serviceTypesLoading,
  onSubmit,
  onCancel,
  saving,
  generalError,
}: {
  form: ReturnType<typeof useForm<EditValues>>;
  serviceTypes: ServiceType[];
  serviceTypesLoading: boolean;
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
          Save changes here, then resubmit your application separately when
          you're ready.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
              name="serviceTypeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service types</FormLabel>
                  <FormDescription>Pick all that apply.</FormDescription>
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

            {generalError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {generalError}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={saving || serviceTypesLoading}
              >
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
          <span>{localError ?? ' '}</span>
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

function DocumentsList({
  documents,
}: {
  documents: PartnerApplication['documents'];
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">Documents</p>
      {documents.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">
          No documents uploaded yet.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-muted-foreground" />
              {doc.publicUrl ? (
                <a
                  href={doc.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  {doc.fileName}
                </a>
              ) : (
                <span>{doc.fileName}</span>
              )}
              {doc.documentType && (
                <span className="text-xs text-muted-foreground">
                  ({doc.documentType})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShopLocationsList({
  locations,
}: {
  locations: PartnerApplication['shopLocations'];
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">
        Shop locations
      </p>
      {locations.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">
          No shop locations added yet.
        </p>
      ) : (
        <ul className="mt-2 space-y-3">
          {locations.map((loc) => (
            <li
              key={loc.id}
              className="rounded-md border bg-muted/30 p-3 text-sm"
            >
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="size-4 text-muted-foreground" />
                {loc.label}
                {loc.isDefault && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {[
                  loc.line1,
                  loc.line2,
                  loc.city,
                  loc.state,
                  loc.postalCode,
                  loc.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {loc.contactPhone && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {loc.contactPhone}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
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
