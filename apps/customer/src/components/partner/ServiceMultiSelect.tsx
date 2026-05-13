import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

export type ServiceOption = {
  id: string;
  label: string;
  description?: string | null;
};

type ServiceMultiSelectProps = {
  value: string[];
  onChange: (next: string[]) => void;
  options: ServiceOption[];
  placeholder?: string;
  loading?: boolean;
  emptyText?: string;
};

export function ServiceMultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Select services you offer…',
  loading,
  emptyText = 'No services available yet.',
}: ServiceMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useOnClickOutside(wrapRef, () => setOpen(false));

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
    }
  }, [open]);

  const selectedServices = useMemo(
    () => options.filter((s) => value.includes(s.id)),
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q)
    );
  }, [options, query]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const removeOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => !loading && setOpen((o) => !o)}
        disabled={loading}
        className={cn(
          'w-full text-left rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors',
          'hover:bg-foreground/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          open && 'ring-2 ring-ring'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-h-[24px]">
          <div className="flex-1 min-w-0">
            {loading ? (
              <span className="text-muted-foreground">Loading services…</span>
            ) : selectedServices.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedServices.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] text-foreground px-2 py-0.5 text-xs font-medium ring-1 ring-foreground/15"
                  >
                    {s.label}
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => removeOne(s.id, e)}
                      className="grid place-items-center rounded-full hover:bg-foreground/15 size-4 -mr-0.5"
                      aria-label={`Remove ${s.label}`}
                    >
                      <X className="size-3" />
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          {selectedServices.length > 0 && (
            <span
              role="button"
              tabIndex={-1}
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Clear all"
            >
              Clear
            </span>
          )}
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground shrink-0 transition-transform',
              open && 'rotate-180'
            )}
          />
        </div>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-border bg-white shadow-2xl overflow-hidden"
          role="listbox"
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-foreground/[0.04] outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {options.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No services match "{query}".
              </li>
            ) : (
              filtered.map((s) => {
                const isSelected = value.includes(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors',
                        isSelected
                          ? 'bg-primary/10'
                          : 'hover:bg-foreground/[0.04]'
                      )}
                      aria-selected={isSelected}
                      role="option"
                    >
                      <span
                        className={cn(
                          'grid place-items-center size-4 rounded border shrink-0 transition-colors',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-input bg-background'
                        )}
                      >
                        {isSelected && <Check className="size-3" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">
                          {s.label}
                        </div>
                        {s.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {s.description}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              {value.length} selected · {options.length} total
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-semibold text-primary hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
