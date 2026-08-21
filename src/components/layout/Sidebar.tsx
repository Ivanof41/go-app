"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, ChevronLeft, type LucideIcon } from "lucide-react";
import { clsx } from "@/lib/clsx";

const STORAGE_KEY = "go:sidebar-collapsed";

const NAV_ITEMS = [{ href: "/dashboard", label: "Dashboard", icon: Gauge }];

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
        "sticky top-0 flex h-screen flex-col bg-white shadow-[4px_0_24px_-8px_rgba(0,60,91,0.15)] transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-48",
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-c24-teal/40 to-transparent" />

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
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <SidebarNavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={active}
              collapsed={collapsed}
            />
          );
        })}
      </nav>
    </aside>
  );
}

function SidebarNavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  function handleEnter() {
    if (!collapsed) return;
    const box = linkRef.current?.getBoundingClientRect();
    if (box) setTooltipPos({ top: box.top + box.height / 2, left: box.right + 12 });
    setHovered(true);
  }

  return (
    <>
      <Link
        ref={linkRef}
        href={href}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
        className={clsx(
          "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
          active
            ? "font-semibold text-c24-navy"
            : "font-medium text-c24-text-muted hover:text-c24-navy",
        )}
      >
        <span
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
            active && "bg-c24-teal-light",
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.75} />
        </span>
        <span
          className={clsx(
            "overflow-hidden whitespace-nowrap transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          <span className="relative inline-block pb-1">
            {label}
            <span
              className={clsx(
                "absolute bottom-0 left-0 h-[1.5px] rounded-full bg-c24-teal transition-all duration-300",
                active ? "w-full" : "w-0 group-hover:w-full",
              )}
            />
          </span>
        </span>
      </Link>

      {collapsed &&
        tooltipPos &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
            className={clsx(
              "pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded-md bg-c24-navy px-2.5 py-1.5 text-xs font-medium text-white shadow-lg transition-all duration-150",
              hovered ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0",
            )}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}
