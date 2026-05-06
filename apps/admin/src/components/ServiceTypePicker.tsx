import { Check } from 'lucide-react';
import type { ServiceType } from '@/types/api';
import { cn } from '@/lib/utils';

type ServiceTypePickerProps = {
  options: ServiceType[];
  value: string[];
  onChange: (next: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
};

export function ServiceTypePicker({
  options,
  value,
  onChange,
  loading,
  disabled,
}: ServiceTypePickerProps) {
  const toggle = (id: string) => {
    if (disabled) return;
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading service types…</p>
    );
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No service types available.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            disabled={disabled}
            aria-pressed={selected}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
              'disabled:pointer-events-none disabled:opacity-50',
              selected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent border-input'
            )}
          >
            {selected && <Check className="size-3.5" />}
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}
