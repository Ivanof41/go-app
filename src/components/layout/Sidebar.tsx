"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  ChevronDown,
  ChevronLeft,
  CircuitBoard,
  RadioTower,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "@/lib/clsx";

const STORAGE_KEY = "go:sidebar-collapsed";
const GROUPS_STORAGE_KEY = "go:sidebar-groups";

type NavLeaf = { type: "link"; href: string; label: string; icon: LucideIcon };
type NavGroup = { type: "group"; id: string; label: string; icon: LucideIcon; items: NavLeaf[] };
type NavEntry = NavLeaf | NavGroup;

const NAV_ITEMS: NavEntry[] = [
  { type: "link", href: "/dashboard", label: "Dashboard", icon: Gauge },
  {
    type: "group",
    id: "inventario",
    label: "Inventario",
    icon: CircuitBoard,
    items: [
      { type: "link", href: "/inventario/sensores", label: "Sensores", icon: RadioTower },
      { type: "link", href: "/inventario/zonas", label: "Stock", icon: Warehouse },
    ],
  },
  { type: "link", href: "/montajes", label: "Montajes", icon: Wrench },
];

function isChildActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useExpandedGroups(groups: NavGroup[], pathname: string) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GROUPS_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setExpanded((prev) => ({ ...JSON.parse(raw), ...prev }));
    } catch {
      // localStorage inaccesible o corrupto: se ignora, queda todo colapsado por defecto
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    const active = groups.find((g) => g.items.some((item) => isChildActive(pathname, item.href)));
    if (active && !expanded[active.id]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded((prev) => ({ ...prev, [active.id]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (mounted) window.localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(expanded));
  }, [expanded, mounted]);

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return { expanded, toggle };
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const groups = NAV_ITEMS.filter((e): e is NavGroup => e.type === "group");
  const { expanded, toggle } = useExpandedGroups(groups, pathname);

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
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-c24-teal/60 to-transparent" />

      <div className="flex h-16 items-center justify-center">
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
        {NAV_ITEMS.map((entry) =>
          entry.type === "link" ? (
            <SidebarNavItem
              key={entry.href}
              href={entry.href}
              label={entry.label}
              icon={entry.icon}
              active={isChildActive(pathname, entry.href)}
              collapsed={collapsed}
            />
          ) : (
            <SidebarNavGroup
              key={entry.id}
              group={entry}
              collapsed={collapsed}
              pathname={pathname}
              isExpanded={!!expanded[entry.id]}
              onToggle={() => toggle(entry.id)}
            />
          ),
        )}
      </nav>
    </aside>
  );
}

function SidebarNavGroup({
  group,
  collapsed,
  pathname,
  isExpanded,
  onToggle,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const groupActive = group.items.some((item) => isChildActive(pathname, item.href));

  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function handleEnter() {
    if (!collapsed) return;
    const box = triggerRef.current?.getBoundingClientRect();
    if (box) setTooltipPos({ top: box.top + box.height / 2, left: box.right + 12 });
    setHovered(true);
  }

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
        aria-label={group.label}
        className={clsx(
          "flex w-full items-center rounded-md py-2 text-sm transition-colors",
          collapsed ? "justify-center px-2.5" : "gap-3 px-2.5",
          groupActive
            ? "bg-c24-teal-light font-semibold text-c24-navy"
            : "font-medium text-c24-text-muted hover:text-c24-navy",
        )}
      >
        <group.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={groupActive ? 2 : 1.75} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{group.label}</span>
            <ChevronDown
              className={clsx("h-4 w-4 shrink-0 transition-transform", isExpanded && "rotate-180")}
            />
          </>
        )}
      </button>

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
            {group.label}
          </span>,
          document.body,
        )}

      <div
        className={clsx(
          "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="flex min-h-0 flex-col gap-1 overflow-hidden pt-1">
          {group.items.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isChildActive(pathname, item.href)}
              collapsed={collapsed}
              nested
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarNavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  nested,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  nested?: boolean;
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
          "flex items-center rounded-md px-2.5 py-2 text-sm transition-colors",
          collapsed ? "justify-center" : "gap-3",
          active
            ? "bg-c24-teal-light font-semibold text-c24-navy"
            : "font-medium text-c24-text-muted hover:text-c24-navy",
        )}
      >
        <Icon
          className={clsx("shrink-0", nested ? "h-4 w-4" : "h-[18px] w-[18px]")}
          strokeWidth={active ? 2 : 1.75}
        />
        <span
          className={clsx(
            "overflow-hidden whitespace-nowrap transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          {label}
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
