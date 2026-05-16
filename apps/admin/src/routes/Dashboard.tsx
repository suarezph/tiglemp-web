import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

import { api } from '@/lib/api';
import type {
  Booking,
  Customer,
  Partner,
} from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/lib/use-page-title';

type PeriodOption = { value: number; label: string };
const periodOptions: PeriodOption[] = [
  { value: 9, label: 'Last 9 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const ALL_PARTNERS = 'all';

const chartConfig = {
  total: {
    label: 'Bookings',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function buildDailySeries(
  bookings: Booking[],
  days: number,
  partnerId: string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets: { date: string; label: string; total: number }[] = [];
  const indexByKey = new Map<string, number>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    indexByKey.set(key, buckets.length);
    buckets.push({
      date: key,
      label: d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      total: 0,
    });
  }

  for (const b of bookings) {
    if (partnerId !== ALL_PARTNERS) {
      if (b.partner?.id !== partnerId) continue;
    }
    const d = new Date(b.scheduledAt);
    d.setHours(0, 0, 0, 0);
    const key = dayKey(d);
    const idx = indexByKey.get(key);
    if (idx !== undefined) buckets[idx].total += 1;
  }

  return buckets;
}

export function Dashboard() {
  usePageTitle('Dashboard');
  const [days, setDays] = useState<number>(9);
  const [partnerId, setPartnerId] = useState<string>(ALL_PARTNERS);

  const partnersQuery = useQuery({
    queryKey: ['admin', 'partners'],
    queryFn: () => api.get<Partner[]>('/admin/partners'),
  });
  const customersQuery = useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: () => api.get<Customer[]>('/admin/customers'),
  });
  const bookingsQuery = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: () => api.get<Booking[]>('/admin/bookings'),
  });

  const partners = partnersQuery.data?.data ?? [];
  const customers = customersQuery.data?.data ?? [];
  const bookings = bookingsQuery.data?.data ?? [];

  const partnersPending = partners.filter(
    (p) => p.approvalStatus === 'PENDING'
  ).length;
  const bookingsUnassigned = bookings.filter(
    (b) =>
      b.status === 'PENDING_ASSIGNMENT' ||
      b.status === 'AWAITING_PARTNER_APPROVAL'
  ).length;

  const series = useMemo(
    () => buildDailySeries(bookings, days, partnerId),
    [bookings, days, partnerId]
  );
  const totalInWindow = useMemo(
    () => series.reduce((sum, b) => sum + b.total, 0),
    [series]
  );

  const approvedPartners = useMemo(
    () => partners.filter((p) => p.approvalStatus === 'APPROVED'),
    [partners]
  );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Quick overview of partner, customer, and booking activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Partners"
          value={partners.length}
          hint={`${partnersPending} pending approval`}
          to="/partners"
        />
        <StatCard
          label="Customers"
          value={customers.length}
          hint=" "
          to="/customers"
        />
        <StatCard
          label="Bookings"
          value={bookings.length}
          hint={`${bookingsUnassigned} need attention`}
          to="/bookings"
        />
        <StatCard
          label="Active partners"
          value={
            partners.filter((p) => p.approvalStatus === 'APPROVED').length
          }
          hint=" "
          to="/partners"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Bookings over time</CardTitle>
              <CardDescription>
                {totalInWindow} bookings scheduled in the selected window
                {partnerId !== ALL_PARTNERS && ' (single partner)'}.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PARTNERS}>All partners</SelectItem>
                  {approvedPartners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="inline-flex rounded-md border bg-background p-0.5">
                {periodOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDays(opt.value)}
                    className={cn(
                      'px-3 py-1 text-xs rounded-sm transition-colors',
                      days === opt.value
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <div className="px-2 pb-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[260px] w-full"
          >
            <BarChart data={series} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(label) => String(label)}
                  />
                }
              />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: number;
  hint: string;
  to: string;
}) {
  return (
    <Link to={to} className="block">
      <Card className="hover:bg-accent/50 transition-colors h-full">
        <CardHeader>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-3xl">{value}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{hint || ' '}</p>
        </CardHeader>
      </Card>
    </Link>
  );
}

// Suppress unused-import warning for Button if dashboard later needs it
void Button;
