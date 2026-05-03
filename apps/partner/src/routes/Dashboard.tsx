import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 640,
        margin: '4rem auto',
        padding: '0 1rem',
      }}
    >
      <p className="text-sm text-muted-foreground">partner.tiglemp.com</p>
      <h1 className="text-2xl font-semibold mt-1">Partner Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Signed in as {user?.email}.
      </p>
      <p className="text-sm text-muted-foreground mt-4">
        Dashboard content coming next — bookings list, today&apos;s schedule,
        approval state, etc.
      </p>
      <div className="mt-6">
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
