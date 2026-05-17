import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, XCircle } from 'lucide-react';

import { api, ApiError } from '@/lib/api';
import { usePageTitle } from '@/lib/use-page-title';
import { cn } from '@/lib/utils';
import type { PartnerReview } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const REVIEWS_KEY = ['partner', 'reviews'] as const;

export function Reviews() {
  usePageTitle('Reviews');

  const reviewsQuery = useQuery({
    queryKey: REVIEWS_KEY,
    queryFn: () => api.get<PartnerReview[]>('/partner/reviews'),
    retry: false,
  });

  const reviews = useMemo(
    () => reviewsQuery.data?.data ?? [],
    [reviewsQuery.data]
  );

  const summary = useMemo(() => summarize(reviews), [reviews]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          What customers say after their completed bookings.
        </p>
      </div>

      {reviewsQuery.isError ? (
        <ErrorState error={reviewsQuery.error} />
      ) : (
        <>
          <SummaryCard
            average={summary.average}
            total={summary.total}
            breakdown={summary.breakdown}
            loading={reviewsQuery.isPending}
          />

          {reviewsQuery.isPending && reviews.length === 0 && (
            <p className="text-sm text-muted-foreground py-6">Loading…</p>
          )}

          {!reviewsQuery.isPending && reviews.length === 0 && (
            <EmptyState />
          )}

          <ul className="grid gap-3 mt-4">
            {reviews.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function SummaryCard({
  average,
  total,
  breakdown,
  loading,
}: {
  average: number;
  total: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border bg-background p-5 mb-4">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Overall rating
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {loading || total === 0 ? '—' : average.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              {total} {total === 1 ? 'review' : 'reviews'}
            </span>
          </div>
          {!loading && total > 0 && (
            <div className="mt-1">
              <Stars rating={Math.round(average)} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-[200px] grid gap-1">
          {([5, 4, 3, 2, 1] as const).map((n) => {
            const count = breakdown[n];
            const pct = total === 0 ? 0 : Math.round((count / total) * 100);
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{n}</span>
                <Star className="size-3 text-amber-500 fill-amber-500" />
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: PartnerReview }) {
  const customerName = review.customer?.fullName ?? 'Customer';
  const initial = customerName[0]?.toUpperCase() ?? '?';
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="grid place-items-center size-9 rounded-full bg-primary/10 text-primary font-bold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{customerName}</p>
            <Stars rating={review.rating} />
            <span className="text-xs text-muted-foreground">
              {formatDate(review.createdAt)}
            </span>
          </div>
          {review.booking?.bookingCode && (
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-mono">{review.booking.bookingCode}</span>
              {review.booking.serviceType?.name && (
                <>
                  {' · '}
                  <Badge variant="secondary" className="font-normal text-[10px]">
                    {review.booking.serviceType.name}
                  </Badge>
                </>
              )}
            </p>
          )}
          {review.title && (
            <p className="mt-2 font-semibold">{review.title}</p>
          )}
          {review.comment && (
            <p className="mt-1 text-sm whitespace-pre-wrap">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'size-3.5',
            n <= rating
              ? 'text-amber-500 fill-amber-500'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border bg-background p-10 text-center">
      <div className="size-12 mx-auto rounded-full bg-primary/10 text-primary grid place-items-center">
        <Star className="size-5" />
      </div>
      <p className="mt-3 font-medium">No reviews yet</p>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        Customers can leave a review after a booking is marked completed. They
        will show up here as they come in.
      </p>
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <XCircle className="size-5" />
          Could not load reviews
        </CardTitle>
        <CardDescription className="text-destructive/80">
          {error instanceof ApiError
            ? error.message
            : 'Something went wrong. Try refreshing the page.'}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function summarize(reviews: PartnerReview[]): {
  average: number;
  total: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
} {
  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let sum = 0;
  for (const r of reviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(r.rating))) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    breakdown[bucket] += 1;
    sum += r.rating;
  }
  return {
    average: reviews.length === 0 ? 0 : sum / reviews.length,
    total: reviews.length,
    breakdown,
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}
