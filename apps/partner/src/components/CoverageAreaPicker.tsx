import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CoverageCity, CoverageRegion } from '@/types/api';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const REGIONS_KEY = ['meta', 'coverage-regions'] as const;
const CITIES_KEY = ['meta', 'coverage-cities'] as const;

type CoverageAreaPickerProps = {
  regionIds: number[];
  cityIds: number[];
  onRegionsChange: (next: number[]) => void;
  onCitiesChange: (next: number[]) => void;
  disabled?: boolean;
};

export function CoverageAreaPicker({
  regionIds,
  cityIds,
  onRegionsChange,
  onCitiesChange,
  disabled,
}: CoverageAreaPickerProps) {
  const regionsQuery = useQuery({
    queryKey: REGIONS_KEY,
    queryFn: () => api.getRaw<CoverageRegion[]>('/json/regions.json'),
    staleTime: 5 * 60 * 1000,
  });
  const citiesQuery = useQuery({
    queryKey: CITIES_KEY,
    queryFn: () => api.getRaw<CoverageCity[]>('/json/cities.json'),
    staleTime: 5 * 60 * 1000,
  });

  const regions = regionsQuery.data ?? [];
  const allCities = citiesQuery.data ?? [];

  const availableCities = useMemo(
    () =>
      regionIds.length === 0
        ? []
        : allCities.filter((c) => regionIds.includes(c.coverageRegionId)),
    [allCities, regionIds]
  );

  // If a region is deselected, drop any cities that no longer belong to it.
  useEffect(() => {
    if (cityIds.length === 0) return;
    const allowed = new Set(availableCities.map((c) => c.id));
    const filtered = cityIds.filter((id) => allowed.has(id));
    if (filtered.length !== cityIds.length) {
      onCitiesChange(filtered);
    }
  }, [availableCities, cityIds, onCitiesChange]);

  const cityHelp = (() => {
    if (regionIds.length === 0) return 'Pick at least one region to choose cities.';
    if (availableCities.length === 0) return 'No cities yet in the selected regions.';
    return 'Leave empty to cover all cities in the selected regions.';
  })();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label>Coverage region</Label>
        <p className="text-xs text-muted-foreground">
          Pick the region this partner serves.
        </p>
        <MultiSelectPopover
          single
          placeholder="Select region…"
          loading={regionsQuery.isPending}
          loadingText="Loading regions…"
          emptyText="No regions available."
          disabled={disabled}
          options={regions.map((r) => ({
            id: r.id,
            label: r.name,
          }))}
          value={regionIds}
          onChange={onRegionsChange}
        />
      </div>

      <div className="grid gap-2">
        <Label>Coverage cities</Label>
        <p className="text-xs text-muted-foreground">{cityHelp}</p>
        <MultiSelectPopover
          placeholder="Select cities…"
          loading={citiesQuery.isPending}
          loadingText="Loading cities…"
          emptyText={
            regionIds.length === 0
              ? 'Choose a region first.'
              : 'No cities in the chosen regions.'
          }
          disabled={disabled || regionIds.length === 0}
          options={availableCities.map((c) => ({
            id: c.id,
            label: c.name,
          }))}
          value={cityIds}
          onChange={onCitiesChange}
        />
      </div>
    </div>
  );
}

type Option = { id: number; label: string; hint?: string };

type MultiSelectPopoverProps = {
  options: Option[];
  value: number[];
  onChange: (next: number[]) => void;
  placeholder: string;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  disabled?: boolean;
  single?: boolean;
};

function MultiSelectPopover({
  options,
  value,
  onChange,
  placeholder,
  loading,
  loadingText = 'Loading…',
  emptyText = 'No options.',
  disabled,
  single,
}: MultiSelectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = wrapRef.current;
      if (!el || el.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [open]);

  const selected = useMemo(
    () => options.filter((o) => value.includes(o.id)),
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint ?? '').toLowerCase().includes(q)
    );
  }, [options, query]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">{loadingText}</p>;
  }

  const toggle = (id: number) => {
    if (disabled) return;
    if (single) {
      onChange(value.includes(id) ? [] : [id]);
      setOpen(false);
      return;
    }
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  const removeOne = (id: number, e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  const clearAll = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          'w-full text-left rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors',
          'hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          open && 'ring-2 ring-ring'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-h-[24px]">
          <div className="flex-1 min-w-0">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selected.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium ring-1 ring-primary/20"
                  >
                    {s.label}
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => removeOne(s.id, e)}
                      className="grid place-items-center rounded-full hover:bg-primary/20 size-4 -mr-0.5"
                      aria-label={`Remove ${s.label}`}
                    >
                      <X className="size-3" />
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          {selected.length > 0 && !disabled && (
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
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-md border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden"
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
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-muted/50 outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                {query ? `No matches for "${query}".` : emptyText}
              </li>
            ) : (
              filtered.map((opt) => {
                const isSelected = value.includes(opt.id);
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => toggle(opt.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors',
                        isSelected ? 'bg-accent' : 'hover:bg-accent/60'
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
                        <div className="font-medium truncate">{opt.label}</div>
                        {opt.hint && (
                          <div className="text-xs text-muted-foreground truncate">
                            {opt.hint}
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
