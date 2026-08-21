"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ChevronLeft } from "lucide-react";
import { clsx } from "@/lib/clsx";

const STORAGE_KEY = "go:sidebar-collapsed";

const NAV_ITEMS = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Lee el estado persistido tras el montaje (localStorage no existe en el servidor,
    // por eso no se puede calcular en el render inicial sin causar un mismatch de hidratación).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed, mounted]);

  return (
    <aside
      className={clsx(
        "sticky top-0 flex h-screen flex-col border-r border-c24-border bg-white transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-48",
      )}
    >
      <div className="flex h-16 items-center justify-center border-b border-c24-border">
        <Image src="/LogoOnlyGo.png" alt="Go!" width={26} height={17} />
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        className="flex h-9 items-center justify-center border-b border-c24-border text-c24-text-muted transition hover:text-c24-navy"
      >
        <ChevronLeft className={clsx("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
      </button>

      <nav className="flex flex-1 flex-col gap-1 px-2.5 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-c24-teal-light text-c24-navy"
                  : "text-c24-text-muted hover:bg-c24-teal-light hover:text-c24-navy",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-c24-teal" />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span
                className={clsx(
                  "overflow-hidden whitespace-nowrap transition-all duration-300",
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
