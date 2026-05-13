import { Plus, Star, Trash2 } from 'lucide-react';
import type { PartnerShopLocationInput } from '@/types/api';
import {
  AddressFields,
  emptyAddress,
  type AddressFieldErrors,
} from '@/components/AddressFields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MAX_LOCATIONS = 20;

const emptyLocation = (): PartnerShopLocationInput => ({
  ...emptyAddress,
  contactPhone: '',
  notes: '',
  isDefault: false,
});

/**
 * Errors keyed by `<index>.<field>` (e.g. "0.label", "1.contactPhone").
 * The parent should slice from `ApiError.fieldErrors` by stripping the
 * `shopLocations.` prefix before passing in.
 */
export type ShopLocationFieldErrors = Record<string, string[] | undefined>;

type ShopLocationsFieldProps = {
  value: PartnerShopLocationInput[];
  onChange: (next: PartnerShopLocationInput[]) => void;
  errors?: ShopLocationFieldErrors | null;
};

function extractRowErrors(
  errors: ShopLocationFieldErrors | null | undefined,
  idx: number
): { address: AddressFieldErrors; contactPhone?: string[]; notes?: string[] } {
  if (!errors) return { address: {} };
  const prefix = `${idx}.`;
  const address: AddressFieldErrors = {};
  let contactPhone: string[] | undefined;
  let notes: string[] | undefined;
  for (const [key, msgs] of Object.entries(errors)) {
    if (!msgs?.length || !key.startsWith(prefix)) continue;
    const fieldName = key.slice(prefix.length);
    if (fieldName === 'contactPhone') {
      contactPhone = msgs;
    } else if (fieldName === 'notes') {
      notes = msgs;
    } else if (
      fieldName === 'label' ||
      fieldName === 'line1' ||
      fieldName === 'line2' ||
      fieldName === 'city' ||
      fieldName === 'state' ||
      fieldName === 'postalCode' ||
      fieldName === 'country'
    ) {
      address[fieldName] = msgs;
    }
  }
  return { address, contactPhone, notes };
}

export function ShopLocationsField({
  value,
  onChange,
  errors,
}: ShopLocationsFieldProps) {
  const add = () => {
    if (value.length >= MAX_LOCATIONS) return;
    const isFirst = value.length === 0;
    onChange([...value, { ...emptyLocation(), isDefault: isFirst }]);
  };

  const remove = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    if (
      next.length > 0 &&
      !next.some((loc) => loc.isDefault)
    ) {
      next[0] = { ...next[0], isDefault: true };
    }
    onChange(next);
  };

  const update = (idx: number, patch: Partial<PartnerShopLocationInput>) => {
    onChange(value.map((loc, i) => (i === idx ? { ...loc, ...patch } : loc)));
  };

  const setDefault = (idx: number) => {
    onChange(
      value.map((loc, i) => ({ ...loc, isDefault: i === idx }))
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Shop locations (optional)</p>
          <p className="text-xs text-muted-foreground">
            Add one or more service addresses. Mark one as default.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={value.length >= MAX_LOCATIONS}
        >
          <Plus />
          Add location
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground italic py-2">
          No locations added.
        </p>
      )}

      <div className="space-y-4">
        {value.map((loc, idx) => {
          const rowErrors = extractRowErrors(errors, idx);
          return (
          <div
            key={idx}
            className="rounded-lg border p-4 space-y-4 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Location {idx + 1}</span>
                {loc.isDefault && (
                  <Badge variant="default" className="gap-1">
                    <Star className="size-3" />
                    Default
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!loc.isDefault && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDefault(idx)}
                  >
                    <Star />
                    Make default
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(idx)}
                >
                  <Trash2 />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>

            <AddressFields
              value={loc}
              onChange={(addr) => update(idx, addr)}
              idPrefix={`loc-${idx}`}
              required
              errors={rowErrors.address}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor={`loc-${idx}-phone`}>Contact phone</Label>
                <Input
                  id={`loc-${idx}-phone`}
                  minLength={7}
                  maxLength={30}
                  value={loc.contactPhone ?? ''}
                  onChange={(e) =>
                    update(idx, { contactPhone: e.target.value })
                  }
                />
                {rowErrors.contactPhone?.map((m) => (
                  <p key={m} className="text-xs text-destructive">
                    {m}
                  </p>
                ))}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`loc-${idx}-notes`}>Notes</Label>
                <Textarea
                  id={`loc-${idx}-notes`}
                  maxLength={300}
                  rows={1}
                  value={loc.notes ?? ''}
                  onChange={(e) => update(idx, { notes: e.target.value })}
                />
                {rowErrors.notes?.map((m) => (
                  <p key={m} className="text-xs text-destructive">
                    {m}
                  </p>
                ))}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
