"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Clock } from "@/components/layout/Clock";
import { signOutAction } from "@/app/(protected)/actions";
import { clsx } from "@/lib/clsx";
import type { CurrentUser } from "@/lib/current-user";

export function Topbar({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="relative flex h-16 items-center justify-end border-b border-c24-border bg-c24-teal-light px-6 shadow-[0_4px_24px_-8px_rgba(0,60,91,0.15)]">
      <div className="flex items-center gap-4">
        <Clock />
        <span className="h-6 w-px bg-c24-border" />

        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-white"
          >
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <span className="text-sm font-medium text-c24-navy">{user.name}</span>
            <ChevronDown className="h-4 w-4 text-c24-text-muted" strokeWidth={1.75} />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-md border border-c24-border bg-white shadow-lg">
              <Link
                href="/ajustes"
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-2.5 px-4 py-2.5 text-sm text-c24-navy hover:bg-c24-teal-light",
                )}
              >
                <Settings className="h-4 w-4" strokeWidth={1.75} />
                Ajustes
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-c24-danger hover:bg-c24-danger-light"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                  Cerrar sesión
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
