import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-svh grid lg:grid-cols-2">
      {/* Left: form column */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary overflow-hidden">
            <img
              src="/logo-tiger.png"
              alt=""
              aria-hidden="true"
              className="size-7 object-contain [filter:brightness(0)_invert(1)]"
            />
          </div>
          <span className="font-semibold">Tiglemp Partner</span>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* Right: cover */}
      <div className="relative hidden bg-muted lg:block overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-muted to-primary/5" />
        <div className="relative flex h-full flex-col items-center justify-center p-10 text-center">
          <div className="max-w-md space-y-3">
            <h2 className="text-3xl font-semibold leading-tight">
              Run your mobile car-wash business
            </h2>
            <p className="text-muted-foreground">
              Manage your bookings, customers and shop locations — all from
              one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
