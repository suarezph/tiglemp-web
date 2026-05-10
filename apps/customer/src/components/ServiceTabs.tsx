import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceItem } from '@/lib/services-catalog';

type ServiceTabsProps = {
  services: ServiceItem[];
  activeId: string;
  onChange: (id: string) => void;
};

export function ServiceTabs({ services, activeId, onChange }: ServiceTabsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      setShowLeft(el.scrollLeft > 4);
      setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [services.length]);

  const scrollBy = (delta: number) =>
    ref.current?.scrollBy({ left: delta, behavior: 'smooth' });

  return (
    <div className="relative h-20 border-b border-border rounded-t-2xl overflow-hidden">
      {showLeft && (
        <button
          type="button"
          aria-label="Scroll services left"
          onClick={() => scrollBy(-240)}
          className="absolute left-0 top-0 bottom-0 z-10 w-14 flex items-center justify-start pl-2 bg-gradient-to-r from-white via-white to-transparent"
        >
          <span className="grid place-items-center size-9 rounded-full bg-white shadow-md border border-border">
            <ChevronLeft className="size-4" />
          </span>
        </button>
      )}
      {showRight && (
        <button
          type="button"
          aria-label="Scroll services right"
          onClick={() => scrollBy(240)}
          className="absolute right-0 top-0 bottom-0 z-10 w-14 flex items-center justify-end pr-2 bg-gradient-to-l from-white via-white to-transparent"
        >
          <span className="grid place-items-center size-9 rounded-full bg-white shadow-md border border-border">
            <ChevronRight className="size-4" />
          </span>
        </button>
      )}

      <div
        ref={ref}
        className="flex h-full gap-1 overflow-x-auto scrollbar-hide px-2 snap-x"
        role="tablist"
        aria-label="Service categories"
      >
        {services.map((s) => {
          const Icon = s.icon;
          const active = s.id === activeId;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(s.id)}
              className={cn(
                'group flex items-center gap-2.5 px-5 h-full whitespace-nowrap border-b-2 -mb-px transition-colors snap-start',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'size-5 transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span className="text-base font-semibold">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
