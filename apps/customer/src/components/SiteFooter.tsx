type LinkItem = { label: string; href: string };
type LinkSection = { title: string; links: LinkItem[] };
type Social = { label: string; href: string; path: string };

const SECTIONS: LinkSection[] = [
  {
    title: 'Customers',
    links: [
      { label: 'How it works', href: '/how-it-works' },
      { label: 'All services', href: '#services-heading' },
      { label: 'Help center', href: '/help' },
      { label: 'Contact us', href: '/contact' },
      { label: 'Login / Signup', href: '/login' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { label: 'Become a partner', href: '/be-a-partner' },
      { label: 'Partner login', href: '/partner/login' },
      { label: 'Partner help', href: '/partner/help' },
      { label: 'Pricing & fees', href: '/be-a-partner#pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Tiglemp', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Sitemap', href: '/sitemap.xml' },
    ],
  },
];

const SOCIALS: Social[] = [
  {
    label: 'Facebook',
    href: 'https://facebook.com/tiglemp',
    path: 'M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.469H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/tiglemp',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'X (Twitter)',
    href: 'https://twitter.com/tiglemp',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/tiglemp',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z',
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground/[0.03] border-t border-border">
      <div className="mx-auto max-w-[1440px] px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-2">
            <a
              href="/"
              aria-label="Tiglemp home"
              className="inline-flex items-center font-display text-2xl font-bold tracking-tight"
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
            <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Cleaning services made simple. Book trusted local pros and
              support small businesses across the Philippines.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid place-items-center size-9 rounded-full ring-1 ring-border bg-background text-muted-foreground hover:text-primary hover:ring-primary transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="size-4"
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link sections */}
          {SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© {year} Tiglemp. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span aria-hidden="true">🇵🇭</span>
            <span>Philippines · English</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
