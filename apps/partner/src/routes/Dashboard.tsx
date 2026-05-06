import { useAuthStore } from '@/stores/auth';

export function Dashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Partner Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as {user?.email}.
      </p>
      <p className="text-sm text-muted-foreground">
        Dashboard content coming next — bookings list, today's schedule,
        approval state, etc.
      </p>
    </div>
  );
}
