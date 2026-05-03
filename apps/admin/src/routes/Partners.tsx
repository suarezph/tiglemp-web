import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FileText, MapPin, MoreHorizontal, Plus, Star } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type {
  ApprovalStatus,
  BusinessType,
  ListResponse,
  Partner,
  PartnerShopLocationInput,
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
import { BusinessTypePicker } from '@/components/BusinessTypePicker';

const PARTNERS_KEY = ['admin', 'partners'] as const;
const BUSINESS_TYPES_KEY = ['meta', 'business-types'] as const;

function useBusinessTypes(enabled: boolean) {
  return useQuery({
    queryKey: BUSINESS_TYPES_KEY,
    queryFn: () => api.get<ListResponse<BusinessType>>('/meta/business-types'),
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
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  const partnersQuery = useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: () => api.get<ListResponse<Partner>>('/admin/partners'),
  });

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      approvalStatus,
    }: {
      id: string;
      approvalStatus: ApprovalStatus;
    }) =>
      api.patch(`/admin/partners/${id}/approval`, { approvalStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PARTNERS_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
      setDeleteTarget(null);
    },
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
              <TableHead>Locations</TableHead>
              <TableHead>Docs</TableHead>
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
              const defaultLocation =
                partner.shopLocations.find((l) => l.isDefault) ??
                partner.shopLocations[0];
              return (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">
                    {partner.businessName}
                  </TableCell>
                  <TableCell>{partner.user.email}</TableCell>
                  <TableCell>{partner.phone}</TableCell>
                  <TableCell>
                    {partner.shopLocations.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        {partner.shopLocations.length}
                        {defaultLocation && (
                          <span className="text-muted-foreground">
                            · {defaultLocation.city}
                          </span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {partner.documents.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm">
                        <FileText className="size-3.5 text-muted-foreground" />
                        {partner.documents.length}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[partner.approvalStatus]}>
                      {partner.approvalStatus}
                    </Badge>
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
                        <DropdownMenuItem
                          disabled={
                            partner.approvalStatus === 'APPROVED' ||
                            approveMutation.isPending
                          }
                          onClick={() =>
                            approveMutation.mutate({
                              id: partner.id,
                              approvalStatus: 'APPROVED',
                            })
                          }
                        >
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={
                            partner.approvalStatus === 'REJECTED' ||
                            approveMutation.isPending
                          }
                          onClick={() =>
                            approveMutation.mutate({
                              id: partner.id,
                              approvalStatus: 'REJECTED',
                            })
                          }
                        >
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(partner)}
                        >
                          Delete
                        </DropdownMenuItem>
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
      <DeletePartnerDialog
        partner={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
        error={
          deleteMutation.error instanceof ApiError
            ? deleteMutation.error.message
            : null
        }
      />
    </>
  );
}

type CreatePartnerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CreatePartnerDialog({ open, onOpenChange }: CreatePartnerDialogProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessTypeIds, setBusinessTypeIds] = useState<string[]>([]);
  const [shopLocations, setShopLocations] = useState<
    PartnerShopLocationInput[]
  >([]);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const businessTypesQuery = useBusinessTypes(open);

  const reset = () => {
    setEmail('');
    setPassword('');
    setBusinessName('');
    setPhone('');
    setBusinessTypeIds([]);
    setShopLocations([]);
    setStagedFiles([]);
  };

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/admin/partners', {
        email,
        password,
        businessName,
        phone,
        businessTypeIds,
        shopLocations: sanitizeLocations(shopLocations),
        // TODO: supportingDocuments — staged files are captured but not sent
        // until the upload-to-storage flow is finalized server-side.
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
      reset();
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      mutation.reset();
      reset();
    }
    onOpenChange(next);
  };

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Partner</DialogTitle>
          <DialogDescription>
            Creates an approved partner account immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              required
              minLength={2}
              maxLength={120}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              required
              minLength={7}
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Business types</Label>
            <p className="text-xs text-muted-foreground">
              Pick all that apply (at least one).
            </p>
            <BusinessTypePicker
              options={businessTypesQuery.data?.data ?? []}
              value={businessTypeIds}
              onChange={setBusinessTypeIds}
              loading={businessTypesQuery.isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newEmail">Email</Label>
            <Input
              id="newEmail"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">Password</Label>
            <Input
              id="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Must include uppercase, lowercase, number, and a special character.
            </p>
          </div>

          <div className="border-t pt-4">
            <ShopLocationsField
              value={shopLocations}
              onChange={setShopLocations}
            />
          </div>

          <div className="border-t pt-4">
            <DocumentsUploader
              staged={stagedFiles}
              onStagedChange={setStagedFiles}
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || businessTypeIds.length === 0}
            >
              {mutation.isPending ? 'Creating…' : 'Create partner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditPartnerDialogProps = {
  partner: Partner | null;
  onClose: () => void;
};

function EditPartnerDialog({ partner, onClose }: EditPartnerDialogProps) {
  const queryClient = useQueryClient();
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessTypeIds, setBusinessTypeIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [shopLocations, setShopLocations] = useState<
    PartnerShopLocationInput[]
  >([]);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const businessTypesQuery = useBusinessTypes(partner !== null);

  useEffect(() => {
    if (!partner) return;
    setBusinessName(partner.businessName);
    setPhone(partner.phone);
    setBusinessTypeIds(partner.businessTypes.map((pbt) => pbt.businessTypeId));
    setIsActive(partner.user.isActive);
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
  }, [partner]);

  const mutation = useMutation({
    mutationFn: () =>
      api.put(`/admin/partners/${partner!.id}`, {
        businessName,
        phone,
        businessTypeIds,
        isActive,
        shopLocations: sanitizeLocations(shopLocations),
        // TODO: supportingDocuments — frontend captures staged files for
        // future upload, but we don't include them in the PUT payload yet.
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
      onClose();
    },
  });

  const handleClose = () => {
    mutation.reset();
    setStagedFiles([]);
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <Dialog open={partner !== null} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Partner</DialogTitle>
          <DialogDescription>
            Update business info, locations, and documents. Email and password
            cannot be changed here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="editBusinessName">Business name</Label>
            <Input
              id="editBusinessName"
              required
              minLength={2}
              maxLength={120}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="editPhone">Phone</Label>
            <Input
              id="editPhone"
              required
              minLength={7}
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Business types</Label>
            <p className="text-xs text-muted-foreground">
              Pick all that apply (at least one).
            </p>
            <BusinessTypePicker
              options={businessTypesQuery.data?.data ?? []}
              value={businessTypeIds}
              onChange={setBusinessTypeIds}
              loading={businessTypesQuery.isPending}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Account active
          </label>

          <div className="border-t pt-4">
            <ShopLocationsField
              value={shopLocations}
              onChange={setShopLocations}
            />
          </div>

          <div className="border-t pt-4">
            <DocumentsUploader
              existing={partner?.documents}
              staged={stagedFiles}
              onStagedChange={setStagedFiles}
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || businessTypeIds.length === 0}
            >
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partner details</DialogTitle>
          <DialogDescription>
            {partner ? `Joined ${new Date(partner.createdAt).toLocaleDateString()}` : ''}
          </DialogDescription>
        </DialogHeader>
        {partner && (
          <div className="grid gap-4 text-sm">
            <Section label="Business">
              <p className="font-medium">{partner.businessName}</p>
              <p className="text-muted-foreground">
                {partner.user.email} · {partner.phone}
              </p>
            </Section>
            <Section label="Business types">
              {partner.businessTypes.length === 0 ? (
                <p className="text-muted-foreground italic">None</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {partner.businessTypes.map((pbt) => (
                    <Badge key={pbt.businessTypeId} variant="secondary">
                      {pbt.businessType.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Section>
            <Section label="Approval">
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[partner.approvalStatus]}>
                  {partner.approvalStatus}
                </Badge>
                {partner.approvedAt && (
                  <span className="text-muted-foreground text-xs">
                    on {new Date(partner.approvedAt).toLocaleString()}
                  </span>
                )}
              </div>
              {partner.approvalComment && (
                <p className="text-muted-foreground mt-1">
                  Comment: {partner.approvalComment}
                </p>
              )}
            </Section>
            <Section label={`Shop locations (${partner.shopLocations.length})`}>
              {partner.shopLocations.length === 0 ? (
                <p className="text-muted-foreground italic">None</p>
              ) : (
                <ul className="space-y-2">
                  {partner.shopLocations.map((loc) => (
                    <li
                      key={loc.id}
                      className="rounded-md border px-3 py-2 bg-muted/30"
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
                        <p className="text-muted-foreground text-xs mt-1">
                          📞 {loc.contactPhone}
                        </p>
                      )}
                      {loc.notes && (
                        <p className="text-muted-foreground text-xs mt-1">
                          {loc.notes}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section label={`Documents (${partner.documents.length})`}>
              {partner.documents.length === 0 ? (
                <p className="text-muted-foreground italic">None</p>
              ) : (
                <ul className="divide-y rounded-md border bg-background">
                  {partner.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <FileText className="size-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{doc.fileName}</p>
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
            </Section>
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

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

type DeletePartnerDialogProps = {
  partner: Partner | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  error: string | null;
};

function DeletePartnerDialog({
  partner,
  onClose,
  onConfirm,
  isPending,
  error,
}: DeletePartnerDialogProps) {
  return (
    <Dialog open={partner !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete partner</DialogTitle>
          <DialogDescription>
            This permanently removes <strong>{partner?.businessName}</strong>{' '}
            and their account. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
