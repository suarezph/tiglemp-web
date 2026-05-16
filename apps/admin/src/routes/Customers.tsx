import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { Address, Customer } from '@/types/api';
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
import { AddressFields, emptyAddress } from '@/components/AddressFields';
import { usePageTitle } from '@/lib/use-page-title';

const CUSTOMERS_KEY = ['admin', 'customers'] as const;

const isAddressFilled = (a: Address) =>
  Boolean(a.label || a.line1 || a.city || a.state || a.postalCode || a.country);

export function Customers() {
  usePageTitle('Customers');
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const customersQuery = useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: () => api.get<Customer[]>('/admin/customers'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
      setDeleteTarget(null);
    },
  });

  const customers = customersQuery.data?.data ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer accounts.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Add Customer
        </Button>
      </div>

      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Default address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[1%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customersQuery.isPending && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {customersQuery.isError && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-destructive py-6">
                  Failed to load customers: {customersQuery.error.message}
                </TableCell>
              </TableRow>
            )}
            {!customersQuery.isPending && customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No customers yet.
                </TableCell>
              </TableRow>
            )}
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  {customer.fullName}
                </TableCell>
                <TableCell>{customer.user.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.defaultAddress
                    ? `${customer.defaultAddress.label} · ${customer.defaultAddress.city}`
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={customer.user.isActive ? 'default' : 'secondary'}>
                    {customer.user.isActive ? 'Active' : 'Inactive'}
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
                        variant="destructive"
                        onClick={() => setDeleteTarget(customer)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateCustomerDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteCustomerDialog
        customer={deleteTarget}
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

type CreateCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CreateCustomerDialog({
  open,
  onOpenChange,
}: CreateCustomerDialogProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<Address>(emptyAddress);

  const reset = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setAddress(emptyAddress);
  };

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/admin/customers', {
        email,
        password,
        fullName,
        phone,
        defaultAddress: isAddressFilled(address) ? address : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>
            Creates an active customer account with verified email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                required
                minLength={2}
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cphone">Phone</Label>
              <Input
                id="cphone"
                required
                minLength={7}
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cemail">Email</Label>
            <Input
              id="cemail"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cpassword">Password</Label>
            <Input
              id="cpassword"
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

          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Default address (optional)</p>
            <p className="text-xs text-muted-foreground">
              Leave all fields blank to skip.
            </p>
            <AddressFields
              value={address}
              onChange={setAddress}
              idPrefix="ca"
              required={isAddressFilled(address)}
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DeleteCustomerDialogProps = {
  customer: Customer | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  error: string | null;
};

function DeleteCustomerDialog({
  customer,
  onClose,
  onConfirm,
  isPending,
  error,
}: DeleteCustomerDialogProps) {
  return (
    <Dialog open={customer !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete customer</DialogTitle>
          <DialogDescription>
            This permanently removes <strong>{customer?.fullName}</strong> and
            their account. This cannot be undone.
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
