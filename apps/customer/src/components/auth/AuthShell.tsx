import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavbar />

      <main className="flex-1 bg-foreground/[0.02] flex items-start sm:items-center justify-center px-6 py-10 sm:py-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
