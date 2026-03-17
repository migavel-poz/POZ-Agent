"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/user-provider";
import { AuthRole } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: AuthRole[];
};

const navItems: NavItem[] = [
  // Super Admin & Reviewer overview
  { href: "/dashboard", label: "Dashboard", icon: "BarChart3", roles: ["admin", "superadmin"] },
  // Employee dashboard (my posts overview)
  { href: "/dashboard", label: "My Dashboard", icon: "BarChart3", roles: ["employee"] },
  // Designer dashboard
  { href: "/design", label: "Design Queue", icon: "Palette", roles: ["designer"] },
  // Posts (employees see their own; admins/superadmin see all)
  { href: "/posts", label: "My Posts", icon: "FileText", roles: ["employee"] },
  { href: "/posts", label: "All Posts", icon: "FileText", roles: ["admin", "superadmin"] },
  // Create post — employees & admins only (not designer, not reviewer-only)
  { href: "/posts/new", label: "Create Post", icon: "PlusCircle", roles: ["employee", "admin", "superadmin"] },
  // Review queue — reviewer/admin only
  { href: "/review", label: "Review Queue", icon: "ClipboardCheck", roles: ["admin", "superadmin"] },
  // Calendar
  { href: "/calendar", label: "Calendar", icon: "Calendar", roles: ["employee", "admin", "superadmin", "designer"] },
  // Templates
  { href: "/templates", label: "Templates", icon: "Layout", roles: ["employee", "admin", "superadmin"] },
  // Agents
  { href: "/catalog", label: "Agent Catalog", icon: "Layers", roles: ["superadmin"] },
  { href: "/agents", label: "Agents", icon: "Bot", roles: ["superadmin"] },
  // Team management
  { href: "/team", label: "Team", icon: "Users", roles: ["admin", "superadmin"] },
  // Settings
  { href: "/settings", label: "Settings", icon: "Settings", roles: ["superadmin"] },
];

const iconMap: Record<string, React.ReactNode> = {
  BarChart3: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
  ),
  FileText: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
  ),
  PlusCircle: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
  ),
  Calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
  ),
  Layout: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
  ),
  Users: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Bot: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
  ),
  Layers: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
  ),
  Settings: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  ClipboardCheck: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
  ),
  Palette: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
  ),
};

export function Sidebar() {
  const pathname = usePathname();
  const { authRole } = useUser();

  // Filter items for the current role, deduplicate hrefs that appear for multiple roles
  const visibleItems = navItems.filter(
    (item) => authRole && item.roles.includes(authRole)
  );

  return (
    <aside className="w-64 border-r bg-card min-h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight">POZ Social</h1>
        <p className="text-sm text-muted-foreground">AI Post Generator</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/design" && item.href !== "/review" && pathname.startsWith(item.href) && item.href !== "/posts/new" && item.href !== "/posts");
          const isExactActive = pathname === item.href;
          const active = item.href === "/posts" ? pathname === "/posts" : item.href === "/posts/new" ? pathname === "/posts/new" : isActive || isExactActive;

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {iconMap[item.icon]}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
