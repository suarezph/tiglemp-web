import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Archive,
  Building2,
  CalendarCheck,
  ChevronRight,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type LeafItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  superAdminOnly?: boolean;
};

type GroupItem = {
  label: string;
  icon: typeof LayoutDashboard;
  children: LeafItem[];
  superAdminOnly?: boolean;
  defaultOpen?: boolean;
};

type NavEntry = LeafItem | GroupItem;

const isGroup = (e: NavEntry): e is GroupItem => 'children' in e;

const NAV_GROUPS: { label: string; entries: NavEntry[] }[] = [
  {
    label: 'Platform',
    entries: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      {
        label: 'User Management',
        icon: UserCog,
        defaultOpen: true,
        children: [
          {
            to: '/admin-users',
            label: 'Administrator',
            icon: Shield,
            superAdminOnly: true,
          },
          { to: '/partners', label: 'Partners', icon: Building2 },
          { to: '/customers', label: 'Customers', icon: Users },
          {
            to: '/deleted-users',
            label: 'Deleted Users',
            icon: Archive,
            superAdminOnly: true,
          },
        ],
      },
      { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
    ],
  },
];

function flattenLeaves(): LeafItem[] {
  const out: LeafItem[] = [];
  for (const section of NAV_GROUPS) {
    for (const entry of section.entries) {
      if (isGroup(entry)) out.push(...entry.children);
      else out.push(entry);
    }
  }
  return out;
}

const titleFor = (pathname: string) =>
  flattenLeaves().find((item) => pathname.startsWith(item.to))?.label ??
  'Admin';

export function AppShell() {
  const location = useLocation();
  const pageTitle = titleFor(location.pathname);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 bg-background">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Tiglemp Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="p-4 md:p-6 flex-1">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  // Filter out items the current user can't see, and collapse groups whose
  // children all got filtered away.
  const visibleSections = NAV_GROUPS.map((section) => {
    const entries = section.entries
      .map((entry) => {
        if (!isGroup(entry)) {
          if (entry.superAdminOnly && !user?.isSuperAdmin) return null;
          return entry;
        }
        const visibleChildren = entry.children.filter(
          (c) => !c.superAdminOnly || user?.isSuperAdmin
        );
        if (visibleChildren.length === 0) return null;
        return { ...entry, children: visibleChildren };
      })
      .filter((e): e is NavEntry => e !== null);
    return { ...section, entries };
  }).filter((s) => s.entries.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary overflow-hidden">
                  <img
                    src="/logo-tiger.png"
                    alt=""
                    aria-hidden="true"
                    className="size-7 object-contain [filter:brightness(0)_invert(1)]"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Tiglemp</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin Console
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {visibleSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.entries.map((entry) =>
                  isGroup(entry) ? (
                    <NavGroupItem
                      key={entry.label}
                      group={entry}
                      pathname={location.pathname}
                    />
                  ) : (
                    <NavLeafItem
                      key={entry.to}
                      item={entry}
                      pathname={location.pathname}
                    />
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavLeafItem({
  item,
  pathname,
}: {
  item: LeafItem;
  pathname: string;
}) {
  const isActive = pathname.startsWith(item.to);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
        <NavLink to={item.to}>
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroupItem({
  group,
  pathname,
}: {
  group: GroupItem;
  pathname: string;
}) {
  const childIsActive = group.children.some((c) => pathname.startsWith(c.to));
  return (
    <Collapsible
      asChild
      defaultOpen={childIsActive || group.defaultOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={group.label}>
            <group.icon />
            <span>{group.label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.children.map((child) => {
              const isActive = pathname.startsWith(child.to);
              return (
                <SidebarMenuSubItem key={child.to}>
                  <SidebarMenuSubButton asChild isActive={isActive}>
                    <NavLink to={child.to}>
                      <child.icon />
                      <span>{child.label}</span>
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = (user?.email ?? 'A').slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Administrator</span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="end"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Administrator</span>
            <span className="text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
