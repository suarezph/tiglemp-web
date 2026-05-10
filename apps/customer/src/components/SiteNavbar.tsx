import { useLocation } from 'react-router-dom';

const AUTH_PATHS = ['/login', '/signup', '/forgot-password'];

export function SiteNavbar() {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  return (
    <header className="w-full h-[60px] border-b border-border bg-background">
      <div className="mx-auto h-full max-w-[1440px] px-6 flex items-center justify-between">
        <a
          href="/"
          aria-label="Tiglemp home"
          className="flex items-center font-display text-2xl font-bold tracking-tight"
        >
          <img
            src="/logo-tiger.png"
            alt=""
            aria-hidden="true"
            className="h-9 w-auto mt-[5px]"
          />
          <span className="-ml-[5px]">
            <span className="text-foreground">Tig</span>
            <span className="text-primary">lemp</span>
          </span>
        </a>

        <nav aria-label="Primary" className="flex items-center gap-6">
          {!isAuthPage && (
            <a
              href="/login"
              className="text-foreground text-sm font-bold hover:opacity-80 transition-opacity"
            >
              Login / Signup
            </a>
          )}
          <a
            href="/be-a-partner"
            className="inline-flex items-center justify-center h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Be our partner
          </a>
        </nav>
      </div>
    </header>
  );
}
