import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

type DateTimePickerProps = {
  label: string;
  placeholder?: string;
  value: Date | null;
  onChange: (value: Date) => void;
  /**
   * When this value changes to a truthy number, the popover opens. Lets a
   * parent chain pickers together (e.g. city → schedule auto-open).
   */
  openSignal?: number;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// 7:00 AM through 8:30 PM in 30-minute slots — typical service window for
// home / car / laundry visits.
function buildTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let h = 7; h <= 20; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const meridiem = h < 12 ? 'AM' : 'PM';
      const displayHour = h === 12 ? 12 : h % 12;
      slots.push({
        value: `${hh}:${mm}`,
        label: `${displayHour}:${mm} ${meridiem}`,
      });
    }
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isSameDay(a: Date | null, b: Date): boolean {
  if (!a) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDisplay(value: Date | null): string {
  if (!value) return '';
  const dateStr = value.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = value.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${dateStr} · ${timeStr}`;
}

export function DateTimePicker({
  label,
  placeholder = 'Pick a date & time',
  value,
  onChange,
  openSignal,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(wrapRef, () => setOpen(false));

  // External "please open" trigger from the parent.
  useEffect(() => {
    if (openSignal && openSignal > 0) setOpen(true);
  }, [openSignal]);

  // The calendar's currently-viewed month (independent of `value`, so the
  // user can browse months without losing their selection).
  const [viewMonth, setViewMonth] = useState<Date>(
    value ? new Date(value.getFullYear(), value.getMonth(), 1) : startOfDay(new Date())
  );

  // The day the user has tapped but not yet committed via a time slot. Falls
  // back to the committed date so the calendar always shows a highlight.
  const [pendingDate, setPendingDate] = useState<Date | null>(value);

  useEffect(() => {
    if (open) setPendingDate(value);
  }, [open, value]);

  const monthGrid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const today = startOfDay(new Date());

  const handlePickDay = (day: Date) => {
    setPendingDate(day);
  };

  const handlePickTime = (slot: string) => {
    const base = pendingDate ?? today;
    const [hh, mm] = slot.split(':').map(Number);
    const final = new Date(base);
    final.setHours(hh, mm, 0, 0);
    onChange(final);
    setOpen(false);
  };

  const goPrevMonth = () =>
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
    );
  const goNextMonth = () =>
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    );

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
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground shrink-0">
            <CalendarDays className="size-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              {label}
            </div>
            <div
              className={cn(
                'mt-0.5 text-base font-semibold truncate',
                value ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {value ? formatDisplay(value) : placeholder}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 sm:right-auto sm:w-[640px] top-[calc(100%+8px)] z-50 rounded-xl border border-border bg-white shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="Pick a date and time"
        >
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px]">
            {/* Calendar */}
            <div className="p-4 sm:border-r sm:border-border">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="p-2 rounded-lg hover:bg-foreground/[0.06]"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="text-sm font-semibold">
                  {MONTHS_FULL[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </div>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="p-2 rounded-lg hover:bg-foreground/[0.06]"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[11px] font-medium text-muted-foreground py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthGrid.map((day, i) => {
                  const inMonth = day.getMonth() === viewMonth.getMonth();
                  const isPast =
                    startOfDay(day).getTime() < today.getTime();
                  const isToday = isSameDay(today, day);
                  const isSelected = isSameDay(pendingDate, day);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isPast}
                      onClick={() => handlePickDay(day)}
                      className={cn(
                        'h-9 rounded-lg text-sm font-medium transition-colors',
                        'disabled:cursor-not-allowed disabled:opacity-30',
                        !inMonth && 'text-muted-foreground/60',
                        inMonth && !isSelected && 'hover:bg-foreground/[0.06]',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : isToday && inMonth
                          ? 'ring-1 ring-primary text-primary'
                          : ''
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            <div className="border-t sm:border-t-0 border-border">
              <div className="px-4 py-3 border-b border-border">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Time
                </div>
                <div className="text-sm font-medium text-foreground mt-0.5">
                  {pendingDate
                    ? pendingDate.toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Pick a date first'}
                </div>
              </div>
              <div className="max-h-[280px] overflow-y-auto p-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {TIME_SLOTS.map((slot) => {
                    const isCurrent =
                      value &&
                      pendingDate &&
                      isSameDay(value, pendingDate) &&
                      value
                        .toTimeString()
                        .slice(0, 5) === slot.value;
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        disabled={!pendingDate}
                        onClick={() => handlePickTime(slot.value)}
                        className={cn(
                          'h-9 rounded-lg text-xs font-medium border transition-colors',
                          'disabled:cursor-not-allowed disabled:opacity-30',
                          isCurrent
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:border-primary hover:text-primary'
                        )}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Build a 6-row × 7-column grid (always 42 cells) for the given month.
 * Includes leading days from the previous month and trailing days from the
 * next month to fill the grid.
 */
function buildMonthGrid(viewMonth: Date): Date[] {
  const firstOfMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    1
  );
  const startDayOfWeek = firstOfMonth.getDay(); // 0 = Sunday
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - startDayOfWeek);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}
