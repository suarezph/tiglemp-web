import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Star, XCircle } from 'lucide-react';

import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CustomerBookingDetail, PartnerReview } from '@/types/api';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { PageMeta } from '@/components/PageMeta';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Pick a rating').max(5),
  title: z
    .string()
    .trim()
    .max(120, 'Title must be 120 characters or fewer')
    .optional()
    .or(z.literal('')),
  comment: z
    .string()
    .trim()
    .max(1000, 'Comment must be 1000 characters or fewer')
    .optional()
    .or(z.literal('')),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function CustomerReviewPage() {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();

  const bookingQuery = useQuery({
    queryKey: ['customer', 'booking', bookingId],
    queryFn: () =>
      api.get<CustomerBookingDetail>(
        `/customer/bookings/${encodeURIComponent(bookingId)}`
      ),
    enabled: !!bookingId,
    retry: false,
  });

  const booking = bookingQuery.data?.data;

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, title: '', comment: '' },
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      api.post<PartnerReview>(
        `/customer/bookings/${encodeURIComponent(bookingId)}/review`,
        {
          rating: values.rating,
          title: values.title?.trim() || null,
          comment: values.comment?.trim() || null,
        }
      ),
    onSuccess: () => {
      navigate(`/customer/bookings/${encodeURIComponent(bookingId)}`, {
        replace: true,
      });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return;
      const fieldErrors = error.fieldErrors;
      if (!fieldErrors) return;
      for (const name of ['rating', 'title', 'comment'] as const) {
        const msgs = collectFieldErrors(fieldErrors, name);
        if (msgs.length > 0) {
          form.setError(name, { type: 'server', message: msgs.join(' ') });
        }
      }
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  // If the booking has already been reviewed, send the user back.
  useEffect(() => {
    if (booking?.hasReview) {
      navigate(`/customer/bookings/${encodeURIComponent(bookingId)}`, {
        replace: true,
      });
    }
  }, [booking?.hasReview, bookingId, navigate]);

  return (
    <>
      <PageMeta title="Leave a review" noIndex />
      <SiteNavbar />
      <main className="bg-foreground/[0.02] min-h-[calc(100vh-60px)]">
        <div className="mx-auto max-w-2xl px-6 py-8 md:py-10 space-y-6">
          <Link
            to={`/customer/bookings/${encodeURIComponent(bookingId)}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to booking
          </Link>

          {bookingQuery.isPending ? (
            <div className="rounded-2xl bg-white ring-1 ring-border p-12 text-center">
              <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : bookingQuery.isError || !booking ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
              <p className="flex items-center gap-2 text-destructive font-semibold">
                <XCircle className="size-4" />
                Couldn't load this booking
              </p>
              <p className="mt-1 text-destructive/80">
                {bookingQuery.error instanceof ApiError
                  ? bookingQuery.error.message
                  : 'Try refreshing the page.'}
              </p>
            </div>
          ) : (
            <section className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6 space-y-6">
              <header>
                <h1 className="text-xl md:text-2xl font-bold">
                  How was your experience?
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reviewing{' '}
                  <strong className="text-foreground">
                    {booking.partner?.businessName ?? 'this business'}
                  </strong>
                  {' · '}
                  <span className="font-mono text-xs">{booking.bookingCode}</span>
                </p>
              </header>

              <Form {...form}>
                <form onSubmit={onSubmit} noValidate className="space-y-5">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <StarPicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (optional)</FormLabel>
                        <FormControl>
                          <Input
                            maxLength={120}
                            placeholder="Quick, professional, would book again"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Up to 120 characters.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comment (optional)</FormLabel>
                        <FormControl>
                          <textarea
                            rows={5}
                            maxLength={1000}
                            placeholder="What stood out? Anything other customers should know?"
                            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormDescription>Up to 1000 characters.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {generalApiErrorMessage(mutation.error) && (
                    <div
                      role="alert"
                      className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                    >
                      {generalApiErrorMessage(mutation.error)}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/customer/bookings/${encodeURIComponent(bookingId)}`
                        )
                      }
                      disabled={mutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? 'Submitting…' : 'Submit review'}
                    </Button>
                  </div>
                </form>
              </Form>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            aria-pressed={value === n}
            className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <Star
              className={cn(
                'size-7 transition-colors',
                filled
                  ? 'text-primary fill-primary'
                  : 'text-muted-foreground/50'
              )}
            />
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold text-foreground">
          {value} / 5
        </span>
      )}
    </div>
  );
}
