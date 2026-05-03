import type { Address } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const emptyAddress: Address = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

type AddressFieldsProps = {
  value: Address;
  onChange: (next: Address) => void;
  idPrefix: string;
  required?: boolean;
};

export function AddressFields({
  value,
  onChange,
  idPrefix,
  required,
}: AddressFieldsProps) {
  const update = <K extends keyof Address>(key: K, v: Address[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="grid gap-2 col-span-2">
        <Label htmlFor={`${idPrefix}-label`}>Label</Label>
        <Input
          id={`${idPrefix}-label`}
          required={required}
          minLength={2}
          maxLength={80}
          placeholder="Home / Office"
          value={value.label}
          onChange={(e) => update('label', e.target.value)}
        />
      </div>
      <div className="grid gap-2 col-span-2">
        <Label htmlFor={`${idPrefix}-line1`}>Address line 1</Label>
        <Input
          id={`${idPrefix}-line1`}
          required={required}
          minLength={3}
          maxLength={150}
          value={value.line1}
          onChange={(e) => update('line1', e.target.value)}
        />
      </div>
      <div className="grid gap-2 col-span-2">
        <Label htmlFor={`${idPrefix}-line2`}>Address line 2</Label>
        <Input
          id={`${idPrefix}-line2`}
          maxLength={150}
          value={value.line2 ?? ''}
          onChange={(e) => update('line2', e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-city`}>City</Label>
        <Input
          id={`${idPrefix}-city`}
          required={required}
          minLength={2}
          maxLength={80}
          value={value.city}
          onChange={(e) => update('city', e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-state`}>State</Label>
        <Input
          id={`${idPrefix}-state`}
          required={required}
          minLength={2}
          maxLength={80}
          value={value.state}
          onChange={(e) => update('state', e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-postal`}>Postal code</Label>
        <Input
          id={`${idPrefix}-postal`}
          required={required}
          minLength={3}
          maxLength={20}
          value={value.postalCode}
          onChange={(e) => update('postalCode', e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-country`}>Country</Label>
        <Input
          id={`${idPrefix}-country`}
          required={required}
          minLength={2}
          maxLength={80}
          value={value.country}
          onChange={(e) => update('country', e.target.value)}
        />
      </div>
    </div>
  );
}
