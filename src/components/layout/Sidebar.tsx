"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  ChevronLeft,
  ChevronDown,
  CircuitBoard,
  RadioTower,
  Tags,
  Warehouse,
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
      { type: "link", href: "/inventario/catalogo", label: "Catálogo", icon: Tags },
      { type: "link", href: "/inventario/zonas", label: "Zonas y stock", icon: Warehouse },
    ],
  },
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
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function handleEnter() {
    if (!collapsed) return;
    const box = triggerRef.current?.getBoundingClientRect();
    if (box) setFlyoutPos({ top: box.top, left: box.right + 12 });
    setHovered(true);
  }

  if (collapsed) {
    return (
      <div onMouseLeave={() => setHovered(false)}>
        <button
          ref={triggerRef}
          type="button"
          onMouseEnter={handleEnter}
          aria-label={group.label}
          className="flex w-full items-center justify-center rounded-md px-2.5 py-2"
        >
          <span
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
              groupActive && "bg-c24-teal-light",
            )}
          >
            <group.icon className="h-[18px] w-[18px]" strokeWidth={groupActive ? 2 : 1.75} />
          </span>
        </button>

        {flyoutPos &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              style={{ top: flyoutPos.top, left: flyoutPos.left }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className={clsx(
                "fixed z-50 min-w-40 rounded-md bg-c24-navy p-1.5 shadow-lg transition-all duration-150",
                hovered
                  ? "pointer-events-auto translate-x-0 opacity-100"
                  : "pointer-events-none -translate-x-1 opacity-0",
              )}
            >
              <p className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "block rounded-md px-2 py-1.5 text-sm transition-colors",
                    isChildActive(pathname, item.href)
                      ? "font-semibold text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>,
            document.body,
          )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-c24-text-muted transition-colors hover:text-c24-navy"
      >
        <span
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
            groupActive && "bg-c24-teal-light",
          )}
        >
          <group.icon className="h-[18px] w-[18px]" strokeWidth={groupActive ? 2 : 1.75} />
        </span>
        <span className={clsx("flex-1 text-left", groupActive && "font-semibold text-c24-navy")}>
          {group.label}
        </span>
        <ChevronDown
          className={clsx("h-4 w-4 shrink-0 transition-transform", isExpanded && "rotate-180")}
        />
      </button>

      <div
        className={clsx(
          "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="flex min-h-0 flex-col gap-1 overflow-hidden">
          {group.items.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isChildActive(pathname, item.href)}
              collapsed={false}
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
          "group flex items-center rounded-md py-2 text-sm transition-colors",
          nested ? "ml-2 border-l border-c24-border pl-3" : "px-2.5",
          collapsed ? "justify-center" : "gap-3",
          active
            ? "font-semibold text-c24-navy"
            : "font-medium text-c24-text-muted hover:text-c24-navy",
        )}
      >
        <span
          className={clsx(
            "flex shrink-0 items-center justify-center rounded-md transition-colors",
            nested ? "h-7 w-7" : "h-8 w-8",
            active && "bg-c24-teal-light",
          )}
        >
          <Icon className={nested ? "h-4 w-4" : "h-[18px] w-[18px]"} strokeWidth={active ? 2 : 1.75} />
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
