import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

export type SearchableSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

type SearchableSelectProps = {
  label: string;
  placeholder?: string;
  options: SearchableSelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  emptyText?: string;
  /**
   * When this value changes to a truthy number, the popover opens. Lets a
   * parent chain selects together (e.g. region → city auto-open).
   */
  openSignal?: number;
};

export function SearchableSelect({
  label,
  placeholder = 'Select…',
  options,
  value,
  onChange,
  icon,
  emptyText = 'No matches.',
  openSignal,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useOnClickOutside(wrapRef, () => setOpen(false));

  useEffect(() => {
    if (open) {
      // Auto-focus the search input on open for keyboard-friendly UX.
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
    }
  }, [open]);

  // External "please open" trigger from the parent.
  useEffect(() => {
    if (openSignal && openSignal > 0) setOpen(true);
  }, [openSignal]);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : options;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'group w-full text-left px-4 py-3 rounded-xl transition-colors',
          'hover:bg-foreground/[0.03]',
          open && 'bg-foreground/[0.03]'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-muted-foreground shrink-0">{icon}</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              {label}
            </div>
            <div
              className={cn(
                'mt-0.5 text-base font-semibold truncate',
                selected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {selected?.label ?? placeholder}
            </div>
          </div>
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          />
        </div>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-xl border border-border bg-white shadow-2xl overflow-hidden"
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
                placeholder={`Search ${label.toLowerCase()}…`}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-foreground/[0.04] outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </li>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-foreground'
                          : 'hover:bg-foreground/[0.04] text-foreground'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{opt.label}</div>
                        {opt.hint && (
                          <div className="text-xs text-muted-foreground truncate">
                            {opt.hint}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="size-4 text-primary shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
