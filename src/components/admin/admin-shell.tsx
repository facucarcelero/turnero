"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ChevronRight } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { splitMobileNav, type NavItem } from "./nav-items";
import { signOutAction } from "@/lib/actions/session";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminShell({
  clinicName,
  userName,
  userRole,
  navItems,
  children,
}: {
  clinicName: string;
  userName: string;
  userRole: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { primary: MOBILE_PRIMARY, more: MOBILE_MORE } = splitMobileNav(navItems);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100">
          <div className="size-9 rounded-xl bg-[var(--brand)] flex items-center justify-center text-white font-bold shrink-0">
            {initials(clinicName || "TC")}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{clinicName}</p>
            <p className="text-xs text-slate-400">Panel administrativo</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <item.icon className="size-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="size-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
              {initials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-400 capitalize">{userRole.toLowerCase()}</p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                title="Cerrar sesión"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-lg bg-[var(--brand)] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials(clinicName || "TC")}
            </div>
            <span className="font-semibold text-slate-900 text-sm truncate">{clinicName}</span>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="text-slate-400 p-1.5" title="Cerrar sesión">
              <LogOut className="size-5" />
            </button>
          </form>
        </header>

        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
          <div
            className="grid h-16"
            style={{ gridTemplateColumns: `repeat(${MOBILE_PRIMARY.length + (MOBILE_MORE.length > 0 ? 1 : 0)}, minmax(0, 1fr))` }}
          >
            {MOBILE_PRIMARY.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
                    active ? "text-[var(--brand)]" : "text-slate-500"
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
            {MOBILE_MORE.length > 0 && (
              <button
                onClick={() => setMoreOpen(true)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium cursor-pointer",
                  moreOpen || MOBILE_MORE.some((i) => isActive(pathname, i.href))
                    ? "text-[var(--brand)]"
                    : "text-slate-500"
                )}
              >
                <Menu className="size-5" />
                Más
              </button>
            )}
          </div>
        </nav>

        {/* Drawer "Más" */}
        {moreOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex items-end">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMoreOpen(false)} />
            <div className="relative w-full bg-white rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Más opciones</h3>
                <button onClick={() => setMoreOpen(false)} className="p-1.5 text-slate-400 cursor-pointer">
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-1">
                {MOBILE_MORE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="size-[18px]" />
                      {item.label}
                    </span>
                    <ChevronRight className="size-4 text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
