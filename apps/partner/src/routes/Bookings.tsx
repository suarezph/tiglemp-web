import { usePageTitle } from '@/lib/use-page-title';

export function Bookings() {
  usePageTitle('Bookings');
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Bookings</h1>
      <p className="text-sm text-muted-foreground">
        Booking list and schedule will live here.
      </p>
    </div>
  );
}
