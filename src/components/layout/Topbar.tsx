"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
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
    <header className="flex h-16 items-center justify-end border-b border-c24-border bg-white px-6">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-c24-teal-light"
        >
          <Avatar src={user.avatar} name={user.name} size="sm" />
          <span className="text-sm font-medium text-c24-navy">{user.name}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-md border border-c24-border bg-white shadow-lg">
            <Link
              href="/ajustes"
              onClick={() => setOpen(false)}
              className={clsx("block px-4 py-2.5 text-sm text-c24-navy hover:bg-c24-teal-light")}
            >
              Ajustes
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="block w-full px-4 py-2.5 text-left text-sm text-c24-danger hover:bg-c24-danger-light"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
