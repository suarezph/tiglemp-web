import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useBookingDraft } from '@/stores/booking-draft';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { PageMeta } from '@/components/PageMeta';
import { Button } from '@/components/ui/button';

export function ConfirmedPage() {
  const { bookingCode = '' } = useParams();
  const resetAll = useBookingDraft((s) => s.resetAll);
  const authed = useAuthStore((s) => !!s.token && s.user?.role === 'CUSTOMER');

  // Clear the draft once we land on confirmation so a refresh doesn't pull
  // the user back into the wizard.
  useEffect(() => {
    return () => {
      resetAll();
    };
  }, [resetAll]);

  return (
    <>
      <PageMeta title="Booking confirmed" noIndex />
      <SiteNavbar />
      <main className="bg-foreground/[0.02] min-h-[calc(100vh-60px)]">
        <div className="mx-auto max-w-2xl px-6 py-16 md:py-24 text-center">
          <div className="size-16 mx-auto rounded-full bg-primary/15 text-primary grid place-items-center">
            <CheckCircle2 className="size-9" />
          </div>
          <h1 className="mt-5 text-2xl md:text-3xl font-bold">
            Booking confirmed
          </h1>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            We've notified the business. You'll get an email and SMS the
            moment they accept — usually within a few minutes.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground/[0.05] px-4 py-2 text-sm">
            <span className="text-muted-foreground">Reference:</span>
            <span className="font-bold tracking-wider font-mono">
              {bookingCode}
            </span>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 gap-3">
            {authed ? (
              <Button asChild className="h-11">
                <Link to="/customer/dashboard">View my bookings</Link>
              </Button>
            ) : (
              <Button asChild className="h-11">
                <Link to="/login">Sign in to track this booking</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="h-11">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
