import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-svh grid lg:grid-cols-2">
      {/* Left: form column */}
      <div className="flex flex-col p-6 md:p-10">
        <Link
          to="/login"
          className="flex items-center gap-2 w-fit hover:opacity-80 transition-opacity"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary overflow-hidden">
            <img
              src="/logo-tiger.png"
              alt=""
              aria-hidden="true"
              className="size-7 object-contain [filter:brightness(0)_invert(1)]"
            />
          </div>
          <span className="font-semibold">Tiglemp Partner</span>
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* Right: cover */}
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1598258710957-db8614c2881e?auto=format&fit=crop&w=1600&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-black/40" />
        <div className="relative flex h-full flex-col items-center justify-center p-10 text-center text-white">
          <div className="max-w-md space-y-3">
            <h2 className="text-3xl font-semibold leading-tight">
              Grow your service business with Tiglemp
            </h2>
            <p className="text-white/80">
              More local bookings, less paperwork. Manage your team, locations
              and customers from one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
